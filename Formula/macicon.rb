class Macicon < Formula
    desc "Fast macOS-styled app icon generator"
    homepage "https://github.com/Qrivi/macicon"
    license "MIT"
    version "1.0.0"

    if Hardware::CPU.intel?
        url "https://github.com/Qrivi/macicon/releases/download/1.0.0/macicon-x86_64.tar.gz"
        sha256 "2de926a7b16c7187964bdc6b4cd8e53ea676c8f3deff259fcefa57e2302035ba"
    else
        url "https://github.com/Qrivi/macicon/releases/download/1.0.0/macicon-arm64.tar.gz"
        sha256 "018e1a3d11327c2453e55050a6a56eca68f0946bf4e359d74ccae7d81a305fee"
    end

    depends_on :macos
  
    def install
        bin.install "macicon"
    end

    test do
        system "#{bin}/macicon", "--version"
    end
end