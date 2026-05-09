cask "codexmeter" do
  version "0.9.4"

  on_arm do
    sha256 "db30b0114c28109d11f65ede55e379839f6d4a66d4a973fc2b8f89663a466ca8"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v0.9.4/CodexMeter-v0.9.4-arm64.dmg"
  end
  on_intel do
    sha256 "be6f015cd3f027b604292f503057a0af14e29d75384fcc59c0fec068202e5aa1"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v0.9.4/CodexMeter-v0.9.4-x86_64.dmg"
  end

  name "CodexMeter"
  desc "Small menu bar app for monitoring Codex usage limits"
  homepage "https://github.com/Qrivi/CodexMeter"

  depends_on macos: ">= :sequoia"

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
