cask "codexmeter" do
  version "1.3.1"

  on_arm do
    sha256 "61f3eeb51fd958695f563c9034b4c73188e1cd94a81270d2aac1e9c6761afa3c"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "43f5863f17039debf54adf7e03af8443e386a7c68a94a0d6ca91348678badc53"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-x86_64.dmg"
  end

  name "CodexMeter"
  desc "Small menu bar app for monitoring Codex usage limits"
  homepage "https://github.com/Qrivi/CodexMeter"

  auto_updates true
  depends_on macos: :sequoia

  app "CodexMeter.app"

  uninstall quit: "dev.qrivi.CodexMeter"

  caveats <<~EOS
    CodexMeter requires macOS 15.7 or newer.
  EOS
end
