cask "codexmeter" do
  version "0.10.0"

  on_arm do
    sha256 "53bb915cc43b1c0cbfd955eb6c825fbaac217f8967e38b1b2a6462dff4f544ab"

    url "https://github.com/Qrivi/CodexMeter/releases/download/v#{version}/CodexMeter-v#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "0d4ebf62a8972cd3a3ca193edb1fdaaf7f236faab248021fb8f2c318da045c2d"

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
