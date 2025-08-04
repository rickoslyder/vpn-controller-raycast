#!/bin/bash

echo "🚀 VPN Exit Controller Raycast Extension Setup"
echo "============================================="

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js is not installed. Please install Node.js 22.14 or higher."
    exit 1
else
    echo "✅ Node.js installed: $NODE_VERSION"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
else
    echo "✅ Dependencies installed successfully"
fi

# Check for icon
echo ""
if [ ! -f "assets/icon.png" ]; then
    echo "⚠️  Icon not found. Please add a 512x512 PNG icon to assets/icon.png"
    echo "   You can convert the SVG using:"
    echo "   convert assets/icon.svg -resize 512x512 assets/icon.png"
else
    echo "✅ Icon found"
fi

# Build extension
echo ""
echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
else
    echo "✅ Extension built successfully"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Raycast"
echo "2. Go to Extensions → VPN Exit Controller → Preferences"
echo "3. Configure your API credentials:"
echo "   - API URL: https://vpn.rbnk.uk (or your URL)"
echo "   - Username: admin"
echo "   - Password: [your password]"
echo ""
echo "To start development mode: npm run dev"
echo "To run the extension: Search 'VPN' in Raycast"