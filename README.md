# Homebrew Tap

A Homebrew tap for my binaries.

```shell
brew tap qrivi/tap
```

## Binaries

### [`macicon`](https://github.com/Qrivi/macicon)

> Fast macOS-styled app icon generator

```shell
brew install qrivi/tap/macicon
```

### [`CodexMeter`](https://github.com/Qrivi/CodexMeter)

> Menu bar app for monitoring Codex usage limits

```shell
brew install --cask qrivi/tap/codexmeter
```

CodexMeter is currently distributed as an unsigned app. The cask removes the quarantine attribute after install so the app can launch normally.

## Automation

This tap accepts release notifications through the `bump-tap` repository dispatch event. Source repositories should create a fine-grained PAT secret named `TAP_DISPATCH_TOKEN` with `Contents: write` access to `Qrivi/homebrew-tap`, then call:

```shell
curl -fsSL -X POST https://api.github.com/repos/Qrivi/homebrew-tap/dispatches \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${TAP_DISPATCH_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  --data '{"event_type":"bump-tap","client_payload":{"package":"macicon","repo":"Qrivi/macicon","tag":"1.0.1"}}'
```

Use `package: "codexmeter"`, `repo: "Qrivi/CodexMeter"`, and a `v<version>` tag for CodexMeter releases.

Package metadata lives in [`tap-packages.yml`](tap-packages.yml). To add another app or CLI that follows the same release pattern, add one package entry with `assets.arm64` and `assets.x86_64`; the TypeScript updater renders the matching formula or cask from the templates in [`templates`](templates). Formula class names, cask tokens, cask names, and formula licenses are derived from GitHub repo metadata unless explicitly overridden.

```shell
npm run update-tap -- --package codexmeter --repo Qrivi/CodexMeter --tag v0.9.4
```
