cask "codexmeter" do
  version "1.2.0"

  on_arm do
    sha256 "bf096b7f9c43675c2ab2ef335997a3335e35beba6eb8f349da6c432ba558c290"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "1316d621f28728c2e6f30af1310e089928fa184314143b9725fbfd0068da82c1"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-x86_64.dmg"
  end

  name "CodexMeter"
  desc "Small menu bar app for monitoring Codex usage limits"
  homepage "https://github.com/Qrivi/CodexMeter"

  depends_on macos: :sequoia

  app "CodexMeter.app"

  postflight_steps do
    run "/usr/bin/xattr",
        args:         ["-dr", "com.apple.quarantine", "{{appdir}}/CodexMeter.app"],
        must_succeed: false
  end

  uninstall quit: "dev.qrivi.CodexMeter"

  caveats <<~EOS
    CodexMeter requires macOS 15.7 or newer.
    This cask removes quarantine from the unsigned app bundle after install so it can launch normally.
  EOS
end
