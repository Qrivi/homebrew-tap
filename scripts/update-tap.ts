import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

const CONFIG_PATH = "tap-packages.yml";
const ARCHES = ["arm64", "x86_64"] as const;

type Arch = (typeof ARCHES)[number];
type PackageType = "formula" | "cask";

type BasePackage = {
  type: PackageType;
  repo: string;
  path: string;
  desc?: string;
  homepage?: string;
  assets: Record<Arch, string>;
  template?: string;
};

type FormulaPackage = BasePackage & {
  type: "formula";
  class_name?: string;
  license?: string;
  install?: {
    binary?: string;
  };
  test: {
    command: string;
    args?: string[];
  };
};

type CaskPackage = BasePackage & {
  type: "cask";
  token?: string;
  name?: string;
  app: string;
  bundle_id: string;
  macos: string;
  postflight?: {
    remove_quarantine?: boolean;
  };
  caveats?: string[];
};

type TapPackage = FormulaPackage | CaskPackage;

type TapConfig = {
  packages: Record<string, TapPackage>;
};

type ReleaseAsset = {
  name: string;
  digest?: string | null;
  browser_download_url: string;
};

type GitHubRelease = {
  tag_name: string;
  assets: ReleaseAsset[];
};

type GitHubRepo = {
  name: string;
  description?: string | null;
  license?: {
    spdx_id?: string | null;
  } | null;
};

type ArchArtifact = {
  assetName: string;
  url: string;
  sha256: string;
};

type CliOptions = {
  package?: string;
  repo?: string;
  tag?: string;
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--package" && next) {
      options.package = next;
      index += 1;
    } else if (arg === "--repo" && next) {
      options.repo = next;
      index += 1;
    } else if (arg === "--tag" && next) {
      options.tag = next;
      index += 1;
    } else {
      fail(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

async function loadConfig(): Promise<TapConfig> {
  const raw = await readFile(CONFIG_PATH, "utf8");
  const parsed = parse(raw) as unknown;

  if (!isRecord(parsed) || !isRecord(parsed.packages)) {
    fail(`Invalid ${CONFIG_PATH}: missing packages`);
  }

  return parsed as TapConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePackage(packageKey: string, pkg: TapPackage): void {
  const missing = (field: string): never => fail(`${packageKey} is missing ${field}`);

  if (!pkg.type) missing("type");
  if (!pkg.repo) missing("repo");
  if (!pkg.path) missing("path");
  if (!pkg.assets) missing("assets");

  for (const arch of ARCHES) {
    if (!pkg.assets[arch]) missing(`assets.${arch}`);
  }

  if (pkg.type === "formula") {
    if (!pkg.test?.command) missing("test.command");
  } else if (pkg.type === "cask") {
    if (!pkg.app) missing("app");
    if (!pkg.bundle_id) missing("bundle_id");
    if (!pkg.macos) missing("macos");
  } else {
    fail(`${packageKey} has unsupported type: ${(pkg as { type?: unknown }).type}`);
  }
}

async function githubJson<T>(apiPath: string): Promise<T> {
  const response = await fetch(`https://api.github.com${apiPath}`, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    fail(`GitHub API request failed: ${response.status} ${response.statusText}\n${await response.text()}`);
  }

  return (await response.json()) as T;
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function downloadText(url: string): Promise<string> {
  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    fail(`Download failed: ${response.status} ${response.statusText} ${url}`);
  }

  return response.text();
}

async function downloadSha256(url: string): Promise<string> {
  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    fail(`Download failed: ${response.status} ${response.statusText} ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return createHash("sha256").update(buffer).digest("hex");
}

function findAsset(release: GitHubRelease, name: string): ReleaseAsset {
  const asset = release.assets.find((candidate) => candidate.name === name);
  if (!asset) {
    fail(`Release ${release.tag_name} is missing asset ${name}`);
  }

  return asset;
}

async function sha256ForAsset(asset: ReleaseAsset): Promise<string> {
  if (asset.digest?.startsWith("sha256:")) {
    return asset.digest.slice("sha256:".length);
  }

  return downloadSha256(asset.browser_download_url);
}

async function sha256FromSidecarOrAsset(release: GitHubRelease, assetName: string): Promise<string> {
  const sidecar = release.assets.find((asset) => asset.name === `${assetName}.sha256`);

  if (sidecar) {
    const text = (await downloadText(sidecar.browser_download_url)).trim();
    const checksum = text.split(/\s+/)[0];

    if (/^[0-9a-f]{64}$/i.test(checksum)) {
      return checksum;
    }

    fail(`Invalid checksum in ${sidecar.name}: ${JSON.stringify(text)}`);
  }

  return sha256ForAsset(findAsset(release, assetName));
}

function releaseVersion(tag: string): string {
  return tag.startsWith("v") ? tag.slice(1) : tag;
}

function repoName(repo: string): string {
  const name = repo.split("/").at(-1);
  if (!name) {
    fail(`Invalid repo: ${repo}`);
  }

  return name;
}

function defaultCaskToken(repo: string): string {
  return repoName(repo).toLowerCase();
}

function defaultCaskName(repo: string): string {
  return repoName(repo);
}

function defaultFormulaClassName(repo: string): string {
  return repoName(repo)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}

function defaultHomepage(repo: string): string {
  return `https://github.com/${repo}`;
}

function repoLicense(repo: GitHubRepo, packageKey: string): string {
  const license = repo.license?.spdx_id;

  if (!license || license === "NOASSERTION") {
    fail(`${packageKey} source repo is missing a GitHub-detected SPDX license`);
  }

  return license;
}

function repoDescription(repo: GitHubRepo, packageKey: string): string {
  const description = repo.description?.trim();

  if (!description) {
    fail(`${packageKey} source repo is missing a GitHub repo description`);
  }

  return description;
}

function expandAssetTemplate(template: string, tag: string, version: string): string {
  return template.replaceAll("{tag}", tag).replaceAll("{version}", version);
}

function assetNames(pkg: TapPackage, tag: string, version: string): Record<Arch, string> {
  return {
    arm64: expandAssetTemplate(pkg.assets.arm64, tag, version),
    x86_64: expandAssetTemplate(pkg.assets.x86_64, tag, version),
  };
}

function versionedCaskUrl(url: string, tag: string, version: string): string {
  if (tag !== version && url.includes(tag)) {
    return url.replaceAll(tag, tag.replace(version, "#{version}"));
  }

  if (url.includes(version)) {
    return url.replaceAll(version, "#{version}");
  }

  return url;
}

async function archArtifacts(
  pkg: TapPackage,
  release: GitHubRelease,
  checksumStrategy: "sidecar-or-asset" | "asset",
): Promise<Record<Arch, ArchArtifact>> {
  const tag = release.tag_name;
  const version = releaseVersion(tag);
  const names = assetNames(pkg, tag, version);

  const entries = await Promise.all(
    ARCHES.map(async (arch) => {
      const assetName = names[arch];
      const sha256 =
        checksumStrategy === "sidecar-or-asset"
          ? await sha256FromSidecarOrAsset(release, assetName)
          : await sha256ForAsset(findAsset(release, assetName));

      return [
        arch,
        {
          assetName,
          url: `https://github.com/${pkg.repo}/releases/download/${tag}/${assetName}`,
          sha256,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<Arch, ArchArtifact>;
}

function rubyString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function rubyStringContent(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function rubyMacosRequirement(value: string): string {
  const atLeastNamedRelease = value.match(/^>=\s+:(\w+)$/);
  if (atLeastNamedRelease) {
    return `:${atLeastNamedRelease[1]}`;
  }

  return rubyString(value);
}

function indent(text: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${padding}${line}`))
    .join("\n");
}

async function renderTemplate(templatePath: string, variables: Record<string, string>): Promise<string> {
  const template = await readFile(templatePath, "utf8");
  const rendered = template.replaceAll(/{{([a-zA-Z0-9_]+)}}/g, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined) {
      fail(`Template ${templatePath} references unknown variable: ${key}`);
    }

    return value;
  });

  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

async function renderFormula(packageKey: string, pkg: FormulaPackage, repo: GitHubRepo, release: GitHubRelease): Promise<string> {
  const tag = release.tag_name;
  const version = releaseVersion(tag);
  const artifacts = await archArtifacts(pkg, release, "sidecar-or-asset");
  const binary = pkg.install?.binary ?? pkg.test.command;
  const testArgs = pkg.test.args ?? [];
  const testInvocation = [`bin/${rubyString(pkg.test.command)}`, ...testArgs.map(rubyString)].join(", ");

  return renderTemplate(pkg.template ?? "templates/formula.rb.tmpl", {
    class_name: pkg.class_name ?? defaultFormulaClassName(pkg.repo),
    desc: rubyStringContent(pkg.desc ?? repoDescription(repo, packageKey)),
    homepage: rubyStringContent(pkg.homepage ?? defaultHomepage(pkg.repo)),
    version,
    license: rubyStringContent(pkg.license ?? repoLicense(repo, packageKey)),
    arm64_url: rubyStringContent(artifacts.arm64.url),
    arm64_sha256: artifacts.arm64.sha256,
    x86_64_url: rubyStringContent(artifacts.x86_64.url),
    x86_64_sha256: artifacts.x86_64.sha256,
    binary: rubyStringContent(binary),
    test_invocation: testInvocation,
  });
}

async function renderCask(packageKey: string, pkg: CaskPackage, repo: GitHubRepo, release: GitHubRelease): Promise<string> {
  const tag = release.tag_name;
  const version = releaseVersion(tag);
  const artifacts = await archArtifacts(pkg, release, "asset");
  const app = rubyStringContent(pkg.app);
  const postflightBlock = pkg.postflight?.remove_quarantine
    ? `\n${indent(`postflight do
  system_command "/usr/bin/xattr",
                 args:         ["-dr", "com.apple.quarantine", "\#{appdir}/${app}"],
                 must_succeed: false
end`, 2)}\n`
    : "\n";
  const caveatsBlock = pkg.caveats?.length
    ? `\n${indent(["caveats <<~EOS", ...pkg.caveats.map((line) => `  ${line}`), "EOS"].join("\n"), 2)}`
    : "\n";

  return renderTemplate(pkg.template ?? "templates/cask.rb.tmpl", {
    token: rubyStringContent(pkg.token ?? defaultCaskToken(pkg.repo)),
    version,
    arm64_url: rubyStringContent(versionedCaskUrl(artifacts.arm64.url, tag, version)),
    arm64_sha256: artifacts.arm64.sha256,
    x86_64_url: rubyStringContent(versionedCaskUrl(artifacts.x86_64.url, tag, version)),
    x86_64_sha256: artifacts.x86_64.sha256,
    name: rubyStringContent(pkg.name ?? defaultCaskName(pkg.repo)),
    desc: rubyStringContent(pkg.desc ?? repoDescription(repo, packageKey)),
    homepage: rubyStringContent(pkg.homepage ?? defaultHomepage(pkg.repo)),
    macos: rubyMacosRequirement(pkg.macos),
    app,
    bundle_id: rubyStringContent(pkg.bundle_id),
    postflight_block: postflightBlock,
    caveats_block: caveatsBlock,
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const packageKey = options.package?.toLowerCase();

  if (!packageKey) fail("Missing --package");
  if (!options.repo) fail("Missing --repo");
  if (!options.tag) fail("Missing --tag");

  const config = await loadConfig();
  const pkg = config.packages[packageKey];
  if (!pkg) fail(`Unsupported package: ${JSON.stringify(options.package)}`);

  validatePackage(packageKey, pkg);

  if (pkg.repo !== options.repo) {
    fail(`${packageKey} updates must come from ${pkg.repo}, got ${options.repo}`);
  }

  const [repo, release] = await Promise.all([
    githubJson<GitHubRepo>(`/repos/${options.repo}`),
    githubJson<GitHubRelease>(`/repos/${options.repo}/releases/tags/${options.tag}`),
  ]);
  const rendered = pkg.type === "formula" ? await renderFormula(packageKey, pkg, repo, release) : await renderCask(packageKey, pkg, repo, release);

  await mkdir(path.dirname(pkg.path), { recursive: true });

  let existing: string | undefined;
  try {
    existing = await readFile(pkg.path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (existing === rendered) {
    console.log(`${pkg.path} is already up to date.`);
    return;
  }

  await writeFile(pkg.path, rendered);
  console.log(`Updated ${pkg.path} to ${release.tag_name}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
