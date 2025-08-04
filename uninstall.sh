#!/bin/bash

# VPN Exit Controller Raycast Extension Uninstaller
# This script removes the VPN Exit Controller extension

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo -e "${RED}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║      VPN Exit Controller Raycast Extension Uninstaller    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Confirm uninstallation
read -p "Are you sure you want to uninstall the VPN Exit Controller Raycast extension? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Uninstallation cancelled."
    exit 0
fi

# Remove CLI tool
remove_cli_tool() {
    print_info "Removing CLI tool..."
    
    if [ -L "/usr/local/bin/vpn-raycast" ]; then
        rm -f /usr/local/bin/vpn-raycast
        print_success "CLI tool removed"
    elif [ -f "/usr/local/bin/vpn-raycast" ]; then
        rm -f /usr/local/bin/vpn-raycast
        print_success "CLI tool removed"
    else
        print_info "CLI tool not found in /usr/local/bin"
    fi
}

# Remove configuration
remove_configuration() {
    if [ -f "$HOME/.vpn-raycast-config" ]; then
        read -p "Remove configuration file? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$HOME/.vpn-raycast-config"
            print_success "Configuration file removed"
        else
            print_info "Configuration file kept at ~/.vpn-raycast-config"
        fi
    fi
}

# Remove Raycast extension data
remove_raycast_data() {
    print_info "Checking for Raycast extension data..."
    
    # Raycast stores extension data in various locations
    RAYCAST_SUPPORT="$HOME/Library/Application Support/com.raycast.macos"
    
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "$RAYCAST_SUPPORT" ]; then
        print_warning "Raycast extension data found."
        echo "To completely remove the extension from Raycast:"
        echo "1. Open Raycast"
        echo "2. Go to Extensions"
        echo "3. Find VPN Exit Controller"
        echo "4. Remove the extension"
    fi
}

# Clean build artifacts
clean_build_artifacts() {
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    print_info "Cleaning build artifacts..."
    
    if [ -d "$SCRIPT_DIR/dist" ]; then
        rm -rf "$SCRIPT_DIR/dist"
        print_success "Removed dist directory"
    fi
    
    if [ -d "$SCRIPT_DIR/build" ]; then
        rm -rf "$SCRIPT_DIR/build"
        print_success "Removed build directory"
    fi
    
    if [ -d "$SCRIPT_DIR/node_modules" ]; then
        read -p "Remove node_modules? This will require reinstallation if you want to use the extension again. (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$SCRIPT_DIR/node_modules"
            rm -rf "$SCRIPT_DIR/cli/node_modules" 2>/dev/null || true
            print_success "Removed node_modules"
        fi
    fi
}

# Main uninstallation
main() {
    remove_cli_tool
    remove_configuration
    clean_build_artifacts
    remove_raycast_data
    
    echo ""
    print_success "Uninstallation complete!"
    echo ""
    echo "The extension source code remains in: $(pwd)"
    echo "To completely remove it, delete this directory."
    echo ""
    echo "To reinstall, run: ./install.sh"
}

# Run main uninstallation
main

exit 0