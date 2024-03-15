class Macicon < Formula
    desc "Fast macOS-styled app icon generator"
    homepage "https://github.com/Qrivi/macicon"
    license "MIT"
    version "1.0.1"

    if Hardware::CPU.intel?
        url "https://github.com/Qrivi/macicon/releases/download/1.0.1/macicon-x86_64.tar.gz"
        sha256 "b85c3ed74a27c78c981a730fa5e4575a5b22aa68e198fc72bbc859e5a00c6d11"
    else
        url "https://github.com/Qrivi/macicon/releases/download/1.0.1/macicon-arm64.tar.gz"
        sha256 "71bbfa4640c2b4bdf775b875726e7d9802563aae6dca3c854f368b66c612e491"
    end

    depends_on :macos
  
    def install
        bin.install "macicon"
    end

    test do
        system "#{bin}/macicon", "--version"
    end
end