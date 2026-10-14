cask "codexmeter" do
  version "1.3.0"

  on_arm do
    sha256 "3f08cd43f32e5d9a1f7087045d8a314926165081b939ad3e3f4a131495d1ba43"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "d26093d2cf74b9f528e634d2d2cecf2fe7b9dc35ab531c951da06ca22ed8e5b3"

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
