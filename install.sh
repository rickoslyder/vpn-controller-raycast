#!/bin/bash

# VPN Exit Controller Raycast Extension Installer
# This script installs the VPN Exit Controller extension for Raycast

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       VPN Exit Controller Raycast Extension Installer     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 22.14 or higher."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_NODE="22.14.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
        print_warning "Node.js version $NODE_VERSION found. Recommended: 22.14.0 or higher."
    else
        print_success "Node.js $(node -v) found"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    print_success "npm $(npm -v) found"
    
    # Check if Raycast is installed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! mdfind "kMDItemCFBundleIdentifier == 'com.raycast.macos'" | grep -q "Raycast.app"; then
            print_warning "Raycast does not appear to be installed."
            echo "Install Raycast from: https://www.raycast.com"
            echo ""
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            print_success "Raycast is installed"
        fi
    else
        print_warning "Not running on macOS. Cannot verify Raycast installation."
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    cd "$SCRIPT_DIR"
    
    if [ -f "package-lock.json" ]; then
        npm ci --production
    else
        npm install --production
    fi
    
    print_success "Dependencies installed"
}

# Build extension
build_extension() {
    print_info "Building extension..."
    cd "$SCRIPT_DIR"
    
    # Create icon if it doesn't exist
    if [ ! -f "assets/icon.png" ]; then
        if [ -f "create-placeholder-icon.py" ]; then
            print_info "Creating placeholder icon..."
            python3 create-placeholder-icon.py
        else
            print_warning "No icon.png found. Extension may not display correctly."
        fi
    fi
    
    # Build the extension
    npm run build
    
    print_success "Extension built successfully"
}

# Configure extension
configure_extension() {
    print_info "Configuration required for the extension to work properly."
    echo ""
    echo "You'll need to configure the following in Raycast preferences:"
    echo "1. API URL (default: https://vpn.rbnk.uk)"
    echo "2. API Username (default: admin)"
    echo "3. API Password"
    echo "4. Favorite Countries (optional, e.g., us,uk,de,jp)"
    echo ""
    
    # Optionally store configuration
    read -p "Would you like to configure these settings now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "API URL [https://vpn.rbnk.uk]: " API_URL
        API_URL=${API_URL:-https://vpn.rbnk.uk}
        
        read -p "API Username [admin]: " API_USERNAME
        API_USERNAME=${API_USERNAME:-admin}
        
        read -s -p "API Password: " API_PASSWORD
        echo
        
        read -p "Favorite Countries (comma-separated) [us,uk,de,jp]: " FAV_COUNTRIES
        FAV_COUNTRIES=${FAV_COUNTRIES:-us,uk,de,jp}
        
        # Create configuration file
        cat > "$HOME/.vpn-raycast-config" << EOF
# VPN Exit Controller Raycast Extension Configuration
# This file is used by the CLI helper tool
API_URL="$API_URL"
API_USERNAME="$API_USERNAME"
API_PASSWORD="$API_PASSWORD"
FAVORITE_COUNTRIES="$FAV_COUNTRIES"
EOF
        chmod 600 "$HOME/.vpn-raycast-config"
        print_success "Configuration saved to ~/.vpn-raycast-config"
    fi
}

# Install CLI tool
install_cli_tool() {
    if [ -d "$SCRIPT_DIR/cli" ]; then
        print_info "Installing CLI helper tool..."
        cd "$SCRIPT_DIR/cli"
        npm install
        
        # Create symlink
        if [ -w "/usr/local/bin" ]; then
            ln -sf "$SCRIPT_DIR/cli/index.js" /usr/local/bin/vpn-raycast
            chmod +x /usr/local/bin/vpn-raycast
            print_success "CLI tool installed as 'vpn-raycast'"
        else
            print_warning "Cannot write to /usr/local/bin. CLI tool not installed globally."
            echo "You can run it directly: $SCRIPT_DIR/cli/index.js"
        fi
    fi
}

# Main installation
main() {
    check_prerequisites
    install_dependencies
    build_extension
    install_cli_tool
    configure_extension
    
    echo ""
    print_success "Installation complete!"
    echo ""
    echo "Next steps:"
    echo "1. Open Raycast"
    echo "2. Search for 'VPN' to use the extension"
    echo "3. Configure API credentials in Raycast preferences if not done"
    echo ""
    echo "Available commands:"
    echo "  - VPN Control Center: Main dashboard"
    echo "  - Manage Active Nodes: Monitor running nodes"
    echo "  - Toggle VPN [country]: Quick toggle (e.g., 'Toggle VPN us')"
    echo "  - Proxy URLs: View proxy endpoints"
    echo ""
    
    if command -v vpn-raycast &> /dev/null; then
        echo "CLI tool available: vpn-raycast --help"
    fi
}

# Run main installation
main

exit 0