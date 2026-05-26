cask "codexmeter" do
  version "1.0.0"

  on_arm do
    sha256 "950ff007fb9976be70f5cee1c9832b46e77770f3a346157648f0b1787d0e81de"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "95aac36c17b77f9c1b5c29c4c4886bb12d52141107eba2f31348868af1c04ac1"

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
