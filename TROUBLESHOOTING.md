# Troubleshooting Guide - VPN Exit Controller Raycast Extension

This guide helps you resolve common issues with the VPN Exit Controller Raycast extension.

## Table of Contents
- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Installation Problems](#installation-problems)
- [Runtime Errors](#runtime-errors)
- [API Connection Issues](#api-connection-issues)
- [Raycast Integration Problems](#raycast-integration-problems)
- [Performance Issues](#performance-issues)
- [Advanced Debugging](#advanced-debugging)

## Quick Diagnostics

Run these commands to quickly diagnose issues:

```bash
# Check overall status
vpn-raycast status -v

# Test API connection
curl -u admin:password https://vpn.rbnk.uk/api/health

# Check Node.js and npm
node --version && npm --version

# Verify Raycast installation (macOS)
mdfind "kMDItemCFBundleIdentifier == 'com.raycast.macos'"
```

## Common Issues

### Extension Not Appearing in Raycast

**Symptoms:**
- Can't find VPN commands in Raycast
- Extension doesn't show up after installation

**Solutions:**

1. **Restart Raycast**:
   ```bash
   killall Raycast
   open -a Raycast
   ```

2. **Rebuild the extension**:
   ```bash
   cd /path/to/vpn-controller-raycast
   npm run build
   ```

3. **Check for build errors**:
   ```bash
   npm run lint
   ```

4. **Verify extension location**:
   - Extensions should be in a directory Raycast can access
   - Try moving to `~/Documents/Raycast Extensions/`

### API Authentication Failed

**Symptoms:**
- "401 Unauthorized" errors
- "Authentication required" messages

**Solutions:**

1. **Verify credentials**:
   ```bash
   vpn-raycast config --show
   ```

2. **Test API directly**:
   ```bash
   curl -v -u admin:password https://vpn.rbnk.uk/api/nodes
   ```

3. **Update configuration**:
   ```bash
   vpn-raycast config
   ```

4. **Check Raycast preferences**:
   - Open Raycast Preferences (⌘,)
   - Extensions → VPN Exit Controller
   - Verify all fields are filled correctly

### Node.js Version Mismatch

**Symptoms:**
- "Node version X required" errors
- Module compatibility issues

**Solutions:**

1. **Check current version**:
   ```bash
   node --version
   ```

2. **Install correct version with nvm**:
   ```bash
   # Install nvm if needed
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install and use Node.js 22
   nvm install 22
   nvm use 22
   nvm alias default 22
   ```

3. **Update PATH**:
   ```bash
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

## Installation Problems

### npm Install Fails

**Error**: `npm ERR! code EACCES`

**Solution**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use a different prefix
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Missing Dependencies

**Error**: `Cannot find module 'X'`

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# For production only
npm ci --production
```

### Icon Missing

**Error**: "Icon not found" warning

**Solution**:
```bash
# Create placeholder icon
python3 create-placeholder-icon.py

# Or download a proper icon
curl -o assets/icon.png https://example.com/icon-512x512.png
```

## Runtime Errors

### Extension Crashes

**Symptoms:**
- Extension stops responding
- Raycast shows error messages

**Debugging steps:**

1. **Check Console logs** (macOS):
   - Open Console.app
   - Filter by "Raycast"
   - Look for error messages

2. **Run in development mode**:
   ```bash
   cd /path/to/extension
   npm run dev
   ```

3. **Check for TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

### Slow Performance

**Symptoms:**
- Commands take long to load
- UI feels sluggish

**Solutions:**

1. **Clear cache**:
   ```bash
   # Clear Raycast cache
   rm -rf ~/Library/Caches/com.raycast.macos
   ```

2. **Reduce API calls**:
   - Increase refresh interval in preferences
   - Check network latency to API

3. **Optimize build**:
   ```bash
   npm run build -- --production
   ```

## API Connection Issues

### Network Timeout

**Error**: "Request timeout"

**Solutions:**

1. **Check connectivity**:
   ```bash
   # Ping the server
   ping vpn.rbnk.uk
   
   # Test HTTPS
   curl -I https://vpn.rbnk.uk
   ```

2. **Check firewall**:
   - Ensure port 443 is open
   - Check corporate proxy settings

3. **Use different DNS**:
   ```bash
   # Test with Google DNS
   nslookup vpn.rbnk.uk 8.8.8.8
   ```

### SSL Certificate Issues

**Error**: "Certificate verify failed"

**Solutions:**

1. **Update certificates**:
   ```bash
   # macOS
   brew install ca-certificates
   ```

2. **Test SSL**:
   ```bash
   openssl s_client -connect vpn.rbnk.uk:443
   ```

3. **Temporarily disable verification** (NOT for production):
   ```bash
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

## Raycast Integration Problems

### Keyboard Shortcuts Not Working

**Solutions:**

1. Check Raycast hotkey settings
2. Verify no conflicts with system shortcuts
3. Reset Raycast preferences

### Extension Updates Not Reflected

**Solutions:**

1. **Force reload**:
   ```bash
   # Remove build cache
   rm -rf dist/ .cache/
   
   # Rebuild
   npm run build
   
   # Restart Raycast
   killall Raycast && open -a Raycast
   ```

2. **Clear Raycast extension cache**:
   ```bash
   rm -rf ~/Library/Application\ Support/com.raycast.macos/extensions/
   ```

## Performance Issues

### High Memory Usage

**Monitor memory**:
```bash
# Check Node.js processes
ps aux | grep node

# Monitor in real-time
top -o mem
```

**Solutions:**
- Reduce polling frequency
- Limit concurrent API requests
- Clear unused cache

### Slow API Responses

**Diagnose**:
```bash
# Time API requests
time curl -u admin:password https://vpn.rbnk.uk/api/nodes

# Check server status
curl https://vpn.rbnk.uk/api/health
```

**Solutions:**
- Check server load
- Use caching for repeated requests
- Implement request debouncing

## Advanced Debugging

### Enable Debug Logging

1. **Set environment variable**:
   ```bash
   export DEBUG=vpn-raycast:*
   export NODE_ENV=development
   ```

2. **Run with verbose output**:
   ```bash
   vpn-raycast --verbose status
   ```

### Inspect Network Requests

1. **Use proxy for debugging**:
   ```bash
   export HTTP_PROXY=http://localhost:8888
   export HTTPS_PROXY=http://localhost:8888
   ```

2. **Monitor with Charles Proxy or similar**

### Check Process Details

```bash
# List all Node processes
ps aux | grep -E "node|raycast"

# Check open files
lsof -p [PID]

# Monitor system calls
sudo dtruss -p [PID]  # macOS
```

### Generate Debug Report

Create a debug report for support:

```bash
#!/bin/bash
# Save as debug-report.sh

echo "VPN Raycast Extension Debug Report" > debug-report.txt
echo "=================================" >> debug-report.txt
echo "" >> debug-report.txt

echo "Date: $(date)" >> debug-report.txt
echo "System: $(uname -a)" >> debug-report.txt
echo "" >> debug-report.txt

echo "Node Version:" >> debug-report.txt
node --version >> debug-report.txt
echo "" >> debug-report.txt

echo "NPM Version:" >> debug-report.txt
npm --version >> debug-report.txt
echo "" >> debug-report.txt

echo "Extension Status:" >> debug-report.txt
vpn-raycast status -v >> debug-report.txt 2>&1
echo "" >> debug-report.txt

echo "API Test:" >> debug-report.txt
curl -s -u admin:password https://vpn.rbnk.uk/api/health >> debug-report.txt 2>&1
echo "" >> debug-report.txt

echo "Recent Errors:" >> debug-report.txt
grep -i error ~/.npm/_logs/*.log | tail -20 >> debug-report.txt 2>&1

echo "Debug report saved to: debug-report.txt"
```

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: https://gitea.rbnk.uk/admin/vpn-controller-raycast/issues
2. **Create detailed bug report** with:
   - Error messages
   - Steps to reproduce
   - System information
   - Debug report
3. **Community support**: Check Raycast community forums

---

Remember to remove any sensitive information (passwords, tokens) before sharing debug logs!