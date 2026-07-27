class Audioctl < Formula
  desc "Dependency-free CLI for inspecting and configuring macOS CoreAudio devices"
  homepage "https://github.com/Qrivi/audioctl"
  version "1.0.0"
  license "MIT"

  if Hardware::CPU.intel?
    url "https://github.com/Qrivi/audioctl/releases/download/v1.0.0/audioctl-v1.0.0-x86_64.tar.gz"
    sha256 "0bfa6478074e2599a20ab2e4bbab9db00fe4baded292a6d0dfb7b3277d9b2f03"
  else
    url "https://github.com/Qrivi/audioctl/releases/download/v1.0.0/audioctl-v1.0.0-arm64.tar.gz"
    sha256 "13c303a540ca5c60c4c0b26747a7460b0e0fc9e8423e304462f3d21f893564c5"
  end

  depends_on macos: :sequoia

  def install
    bin.install "audioctl"
  end

  def caveats
    "audioctl requires macOS 15.7 or newer."
  end

  test do
    system bin/"audioctl", "--version"
  end
end
