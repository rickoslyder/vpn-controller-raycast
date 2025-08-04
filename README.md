# VPN Exit Controller for Raycast

Control your VPN Exit Controller directly from Raycast! This extension provides quick access to manage VPN nodes across multiple countries, view proxy information, and monitor node performance.

## Features

- **🌍 VPN Control Center**: Visual country grid with one-click VPN control
- **📊 Active Node Management**: Monitor running nodes with real-time metrics
- **⚡ Quick Toggle**: Start/stop VPN with a simple command (e.g., "Toggle US VPN")
- **🔗 Proxy Information**: View and copy proxy URLs with usage examples
- **📈 Performance Monitoring**: CPU, memory, and network statistics
- **🚀 Speed Testing**: Run speed tests on active nodes
- **🔄 Auto-refresh**: Real-time updates with configurable intervals

## Installation

### Prerequisites

1. **Raycast**: Version 1.26.0 or higher
2. **Node.js**: Version 22.14 or higher
3. **VPN Exit Controller**: Your VPN controller must be running and accessible

### Method 1: Homebrew (Recommended)

```bash
# Add the tap
brew tap rickoslyder/vpn-tools https://github.com/rickoslyder/homebrew-vpn-tools

# Install the extension
brew install vpn-controller-raycast

# Configure
vpn-raycast config
```

### Method 2: Git Clone

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rickoslyder/vpn-controller-raycast.git
   cd vpn-controller-raycast
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create the icon** (if not present):
   - Place a 512x512 PNG file named `icon.png` in the `assets` folder
   - Or convert the provided SVG: `convert assets/icon.svg -resize 512x512 assets/icon.png`

4. **Configure the extension**:
   - Open Raycast
   - Go to Extensions → VPN Exit Controller → Preferences
   - Configure:
     - **API URL**: Your VPN controller URL (e.g., `https://vpn.rbnk.uk`)
     - **API Username**: Default is `admin`
     - **API Password**: Your API password
     - **Favorite Countries**: Comma-separated list (e.g., `us,uk,de,jp`)
     - **Refresh Interval**: How often to update status (in seconds)

5. **Build and install**:
   ```bash
   npm run build
   ```

6. **Start using**:
   - Open Raycast
   - Search for "VPN" to see all available commands

## Commands

### 1. VPN Control Center
**Trigger**: "VPN Control Center" or just "VPN"

Main dashboard showing all countries with their VPN status. Features:
- Visual country grid with flags
- One-click start/stop/restart
- Favorites section for quick access
- Real-time status updates

**Keyboard Shortcuts**:
- `⌘ + S`: Start/Stop VPN
- `⌘ + R`: Restart VPN or Refresh list

### 2. Manage Active Nodes
**Trigger**: "Manage Active Nodes"

Detailed view of all running VPN nodes with:
- Performance metrics (CPU, RAM, Network)
- Uptime information
- Node logs viewer
- Speed test functionality

**Keyboard Shortcuts**:
- `⌘ + S`: Stop node
- `⌘ + R`: Restart node
- `⌘ + L`: View logs
- `⌘ + T`: Run speed test

### 3. Quick Toggle
**Trigger**: "Toggle VPN [country]"

Quick command to toggle VPN for a specific country.

**Examples**:
- "Toggle VPN us" - Toggle US VPN
- "Toggle VPN uk" - Toggle UK VPN
- "Toggle VPN de" - Toggle Germany VPN

### 4. Proxy URLs
**Trigger**: "Proxy URLs"

View and copy proxy endpoints with:
- HTTP/HTTPS proxy URLs
- SOCKS5 proxy URLs
- Usage examples for different programming languages
- One-click copy functionality
- Test commands

**Keyboard Shortcuts**:
- `⌘ + H`: Copy HTTP proxy URL
- `⌘ + ⇧ + H`: Copy HTTPS proxy URL
- `⌘ + S`: Copy SOCKS5 proxy URL

## Usage Examples

### Starting a VPN
1. Open Raycast (`⌘ + Space`)
2. Type "VPN"
3. Select country and press Enter
4. VPN starts automatically

### Quick Toggle
1. Open Raycast
2. Type "Toggle VPN us"
3. Press Enter
4. US VPN toggles on/off

### Copying Proxy URL
1. Open Raycast
2. Type "Proxy"
3. Find active proxy
4. Press `⌘ + C` to copy URL

## Troubleshooting

### Extension not loading
- Ensure Node.js 22.14+ is installed
- Check that all dependencies are installed: `npm install`
- Verify the icon.png file exists in assets folder

### API Connection Failed
- Verify API URL in preferences
- Check username and password
- Ensure VPN controller is running
- Test API access: `curl -u admin:password https://your-api-url/api/nodes`

### No countries showing
- Check API connectivity
- Verify the `/api/countries` endpoint is accessible
- Check browser console for errors (Raycast → Extensions → VPN Exit Controller → ⌘⌥I)

## Development

### Running in development mode
```bash
npm run dev
```

### Building for production
```bash
npm run build
```

### Linting
```bash
npm run lint
npm run fix-lint
```

### Publishing to Raycast Store
```bash
npm run publish
```

## Configuration

### Preferences Schema
- **apiUrl**: VPN Controller API URL (required)
- **apiUsername**: API authentication username (required)
- **apiPassword**: API authentication password (required)
- **favoriteCountries**: Comma-separated country codes for quick access
- **refreshInterval**: Status refresh interval in seconds

### Supported Countries
The extension supports all countries configured in your VPN Exit Controller, including:
- 🇺🇸 United States (us)
- 🇬🇧 United Kingdom (uk)
- 🇩🇪 Germany (de)
- 🇯🇵 Japan (jp)
- 🇨🇦 Canada (ca)
- 🇦🇺 Australia (au)
- And many more...

## Security

- API credentials are stored securely in Raycast's preferences
- All API calls use HTTPS
- Basic authentication is used for API access
- No credentials are logged or exposed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Create an issue in the repository
- Check the VPN Exit Controller documentation
- Review Raycast extension development docs

---

Made with ❤️ for the VPN Exit Controller system