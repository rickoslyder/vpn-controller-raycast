# Installation Guide - VPN Exit Controller Raycast Extension

This guide provides detailed instructions for installing the VPN Exit Controller Raycast extension using various methods.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Homebrew (Recommended for macOS)](#method-1-homebrew-recommended-for-macos)
  - [Method 2: Direct Download](#method-2-direct-download)
  - [Method 3: Git Clone](#method-3-git-clone)
  - [Method 4: Manual Installation](#method-4-manual-installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Updating](#updating)
- [Uninstallation](#uninstallation)

## Prerequisites

### System Requirements
- **macOS**: 11.0 or higher (for Raycast)
- **Node.js**: 22.14.0 or higher
- **npm**: 7.0 or higher
- **Raycast**: Latest version from [raycast.com](https://www.raycast.com)

### Verify Prerequisites
```bash
# Check Node.js version
node --version  # Should show v22.14.0 or higher

# Check npm version
npm --version   # Should show 7.0.0 or higher

# Check if Raycast is installed (macOS only)
mdfind "kMDItemCFBundleIdentifier == 'com.raycast.macos'"
```

## Installation Methods

### Method 1: Homebrew (Recommended for macOS)

The easiest way to install on macOS using Homebrew:

```bash
# Add the custom tap
brew tap rbnk/vpn-tools https://gitea.rbnk.uk/admin/homebrew-vpn-tools.git

# Install the extension
brew install vpn-controller-raycast

# Configure the extension
vpn-raycast config
```

#### Advantages:
- Automatic dependency management
- Easy updates with `brew upgrade`
- Clean uninstallation
- CLI tool included

### Method 2: Direct Download

Download and run the installer script:

```bash
# Download the latest release
curl -L https://zipline.rbnk.uk/[RELEASE_URL]/install.sh -o install.sh

# Make it executable
chmod +x install.sh

# Run the installer
./install.sh
```

Or as a one-liner:
```bash
curl -fsSL https://zipline.rbnk.uk/[RELEASE_URL]/install.sh | bash
```

### Method 3: Git Clone

Clone the repository and install:

```bash
# Clone the repository
git clone https://gitea.rbnk.uk/admin/vpn-controller-raycast.git
cd vpn-controller-raycast

# Run the installer
./install.sh
```

#### For development:
```bash
# Clone with SSH (if you have access)
git clone git@gitea.rbnk.uk:admin/vpn-controller-raycast.git
cd vpn-controller-raycast

# Install in development mode
./install.sh -d
```

### Method 4: Manual Installation

For complete control over the installation process:

1. **Download the extension**:
   ```bash
   wget https://zipline.rbnk.uk/[RELEASE_URL]/vpn-controller-raycast-v1.0.0.tar.gz
   tar -xzf vpn-controller-raycast-v1.0.0.tar.gz
   cd vpn-controller-raycast-v1.0.0
   ```

2. **Install dependencies**:
   ```bash
   npm ci --production
   ```

3. **Build the extension**:
   ```bash
   # Create icon if needed
   python3 create-placeholder-icon.py
   
   # Build
   npm run build
   ```

4. **Install CLI tool** (optional):
   ```bash
   cd cli
   npm install
   sudo ln -s $(pwd)/index.js /usr/local/bin/vpn-raycast
   ```

## Configuration

### Step 1: Configure API Credentials

Run the configuration wizard:
```bash
vpn-raycast config
```

Or configure manually by creating `~/.vpn-raycast-config`:
```bash
cat > ~/.vpn-raycast-config << EOF
API_URL="https://vpn.rbnk.uk"
API_USERNAME="admin"
API_PASSWORD="your_password_here"
FAVORITE_COUNTRIES="us,uk,de,jp"
EOF

chmod 600 ~/.vpn-raycast-config
```

### Step 2: Configure in Raycast

1. Open Raycast Preferences (⌘,)
2. Navigate to Extensions → VPN Exit Controller
3. Enter the same credentials:
   - API URL: `https://vpn.rbnk.uk`
   - API Username: `admin`
   - API Password: Your password
   - Favorite Countries: `us,uk,de,jp`

### Step 3: Test the Configuration

```bash
# Test CLI configuration
vpn-raycast status

# Test API connection
curl -u admin:password https://vpn.rbnk.uk/api/nodes
```

## Verification

### Check Installation Status

```bash
# Full status check
vpn-raycast status

# Verbose status with details
vpn-raycast status -v
```

Expected output:
```
✓ Extension Version    1.0.0
✓ Dependencies         Installed
✓ Build                Last built: [date]
✓ Icon                 Present
✓ Configuration        Complete
✓ Node.js             v22.14.0
✓ Raycast             Installed

Summary:
✓ Extension is ready to use!
```

### Test in Raycast

1. Open Raycast (⌘ Space)
2. Type "VPN" - you should see:
   - VPN Control Center
   - Manage Active Nodes
   - Proxy URLs
3. Try "Toggle VPN us" for quick toggle

## Troubleshooting

### Common Issues

#### Extension not appearing in Raycast
1. Restart Raycast: `killall Raycast && open -a Raycast`
2. Check build: `cd /path/to/extension && npm run build`
3. Verify no errors in: `npm run lint`

#### API Connection Failed
1. Verify credentials: `vpn-raycast config --show`
2. Test API directly: `curl -u admin:password https://vpn.rbnk.uk/api/nodes`
3. Check network connectivity

#### Node.js Version Issues
```bash
# Install Node.js 22 with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Permission Denied Errors
```bash
# Fix CLI permissions
chmod +x /usr/local/bin/vpn-raycast

# Fix config permissions
chmod 600 ~/.vpn-raycast-config
```

### Debug Mode

Enable debug logging:
```bash
# Set debug environment variable
export DEBUG=vpn-raycast:*

# Run commands with debug output
vpn-raycast status
```

### Getting Help

1. Check status: `vpn-raycast status -v`
2. View logs: Check Raycast logs in Console.app
3. Report issues: https://gitea.rbnk.uk/admin/vpn-controller-raycast/issues

## Updating

### Via Homebrew
```bash
brew update
brew upgrade vpn-controller-raycast
```

### Via CLI Tool
```bash
# Check for updates
vpn-raycast update --check

# Install updates
vpn-raycast update
```

### Manual Update
```bash
cd /path/to/vpn-controller-raycast
git pull
./install.sh
```

## Uninstallation

### Via Homebrew
```bash
brew uninstall vpn-controller-raycast
```

### Via Uninstall Script
```bash
cd /path/to/vpn-controller-raycast
./uninstall.sh
```

### Manual Uninstallation
```bash
# Remove CLI tool
rm -f /usr/local/bin/vpn-raycast

# Remove configuration
rm -f ~/.vpn-raycast-config

# Remove from Raycast
# Open Raycast → Extensions → Remove VPN Exit Controller
```

## Additional Resources

- [README](README.md) - General information
- [TROUBLESHOOTING](TROUBLESHOOTING.md) - Detailed troubleshooting
- [DEVELOPMENT](DEVELOPMENT.md) - Development guide
- [API Documentation](https://vpn.rbnk.uk/docs)

---

For support, please visit: https://gitea.rbnk.uk/admin/vpn-controller-raycast/issues