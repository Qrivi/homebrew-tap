cask "codexmeter" do
  version "1.2.1"

  on_arm do
    sha256 "e5921830a73dc5458f2cdc9a43b64c6cb9761f2b2ffd87948cc59824aed5a19b"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "425bbddaf3d16f2366720b92cd1c76c955d067e10b9ad5a1a9df5d732b22b803"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-x86_64.dmg"
  end

  name "CodexMeter"
  desc "Small menu bar app for monitoring Codex usage limits"
  homepage "https://github.com/Qrivi/CodexMeter"

  depends_on macos: :sequoia

  app "CodexMeter.app"

  uninstall quit: "dev.qrivi.CodexMeter"

  caveats <<~EOS
    CodexMeter requires macOS 15.7 or newer.
  EOS
end
