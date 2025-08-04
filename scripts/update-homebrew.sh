#!/bin/bash

# Update Homebrew Formula Script
# Updates the Homebrew formula with new version and download URL

set -e

# Arguments
VERSION=$1
DOWNLOAD_URL=$2
SHA256=$3

if [ -z "$VERSION" ] || [ -z "$DOWNLOAD_URL" ] || [ -z "$SHA256" ]; then
    echo "Usage: update-homebrew.sh <version> <download-url> <sha256>"
    exit 1
fi

# Configuration
HOMEBREW_TAP_DIR="/root/homebrew-vpn-tools"
FORMULA_FILE="$HOMEBREW_TAP_DIR/Formula/vpn-controller-raycast.rb"

# Check if tap directory exists
if [ ! -d "$HOMEBREW_TAP_DIR" ]; then
    echo "Homebrew tap directory not found: $HOMEBREW_TAP_DIR"
    echo "Run: mkdir -p $HOMEBREW_TAP_DIR/Formula"
    exit 1
fi

# Create or update formula
cat > "$FORMULA_FILE" << EOF
class VpnControllerRaycast < Formula
  desc "Raycast extension for controlling VPN Exit Controller"
  homepage "https://gitea.rbnk.uk/admin/vpn-controller-raycast"
  url "$DOWNLOAD_URL"
  sha256 "$SHA256"
  version "$VERSION"
  license "MIT"

  depends_on "node"

  def install
    # Install extension files
    libexec.install Dir["*"]
    
    # Install dependencies
    system "npm", "ci", "--production", "--prefix", libexec
    
    # Create wrapper script
    (bin/"vpn-raycast").write <<~EOS
      #!/bin/bash
      export NODE_PATH="#{libexec}/node_modules"
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/cli/index.js" "\$@"
    EOS
    
    chmod 0755, bin/"vpn-raycast"
  end

  def post_install
    ohai "VPN Exit Controller Raycast Extension installed!"
    ohai "Run 'vpn-raycast config' to configure the extension"
    ohai "Open Raycast and search for 'VPN' to use the extension"
  end

  def caveats
    <<~EOS
      The VPN Exit Controller Raycast extension has been installed.
      
      To configure:
        vpn-raycast config
      
      To check status:
        vpn-raycast status
      
      Note: Raycast must be installed separately on macOS.
    EOS
  end

  test do
    system "#{bin}/vpn-raycast", "--version"
  end
end
EOF

echo "Homebrew formula updated: $FORMULA_FILE"
echo "Version: $VERSION"
echo "URL: $DOWNLOAD_URL"
echo "SHA256: $SHA256"

# If in git repository, commit the change
if [ -d "$HOMEBREW_TAP_DIR/.git" ]; then
    cd "$HOMEBREW_TAP_DIR"
    git add Formula/vpn-controller-raycast.rb
    git commit -m "Update vpn-controller-raycast to version $VERSION" || true
    echo "Formula committed to git"
fi