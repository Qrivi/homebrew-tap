cask "codexmeter" do
  version "1.1.0"

  on_arm do
    sha256 "181ba1cfc7f70649db6b5a3572be17284024f2fbc8ce39b26bcfeb4f7e8b70d1"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "cf38df85227cf76fa30f2f3db6e46e97b62d091491f3e1653fa1491c6d09e867"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-x86_64.dmg"
  end

  name "CodexMeter"
  desc "Small menu bar app for monitoring Codex usage limits"
  homepage "https://github.com/Qrivi/CodexMeter"

  depends_on macos: :sequoia

  app "CodexMeter.app"

  postflight do
    system_command "/usr/bin/xattr",
                   args:         ["-dr", "com.apple.quarantine", "#{appdir}/CodexMeter.app"],
                   must_succeed: false
  end

  uninstall quit: "dev.qrivi.CodexMeter"

  caveats <<~EOS
    CodexMeter requires macOS 15.7 or newer.
    This cask removes quarantine from the unsigned app bundle after install so it can launch normally.
  EOS
end
