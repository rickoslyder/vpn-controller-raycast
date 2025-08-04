# VPN Exit Controller Raycast Extension Installer for Windows
# This script installs the VPN Exit Controller extension for Raycast

# Requires PowerShell to be run as Administrator for some operations
param(
    [switch]$Force,
    [switch]$SkipPrerequisites
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Banner
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║       VPN Exit Controller Raycast Extension Installer     ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check prerequisites
function Test-Prerequisites {
    if ($SkipPrerequisites) {
        Write-Warning "Skipping prerequisite checks"
        return
    }

    Write-Info "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js $nodeVersion found"
            
            # Check version
            $version = [version]($nodeVersion -replace 'v', '')
            $requiredVersion = [version]"22.14.0"
            
            if ($version -lt $requiredVersion) {
                Write-Warning "Node.js version $nodeVersion found. Recommended: v22.14.0 or higher."
            }
        }
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 22.14 or higher."
        Write-Host "Download from: https://nodejs.org/"
        if (-not $Force) {
            exit 1
        }
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm $npmVersion found"
        }
    }
    catch {
        Write-Error "npm is not installed. Please install npm."
        if (-not $Force) {
            exit 1
        }
    }
    
    # Note about Raycast
    Write-Warning "Raycast is macOS only. This installer prepares the extension for development/testing on Windows."
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    Push-Location $ScriptDir
    try {
        if (Test-Path "package-lock.json") {
            npm ci --production
        }
        else {
            npm install --production
        }
        Write-Success "Dependencies installed"
    }
    catch {
        Write-Error "Failed to install dependencies: $_"
        if (-not $Force) {
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# Build extension
function Build-Extension {
    Write-Info "Building extension..."
    
    Push-Location $ScriptDir
    try {
        # Create icon if it doesn't exist
        if (-not (Test-Path "assets\icon.png")) {
            if (Test-Path "create-placeholder-icon.py") {
                Write-Info "Creating placeholder icon..."
                python create-placeholder-icon.py
            }
            else {
                Write-Warning "No icon.png found. Extension may not display correctly."
            }
        }
        
        # Build the extension
        npm run build
        Write-Success "Extension built successfully"
    }
    catch {
        Write-Error "Failed to build extension: $_"
        if (-not $Force) {
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# Configure extension
function Set-ExtensionConfig {
    Write-Info "Configuration required for the extension to work properly."
    Write-Host ""
    Write-Host "You'll need to configure the following:"
    Write-Host "1. API URL (default: https://vpn.rbnk.uk)"
    Write-Host "2. API Username (default: admin)"
    Write-Host "3. API Password"
    Write-Host "4. Favorite Countries (optional, e.g., us,uk,de,jp)"
    Write-Host ""
    
    $configure = Read-Host "Would you like to configure these settings now? (y/N)"
    if ($configure -eq 'y' -or $configure -eq 'Y') {
        Write-Host ""
        
        $apiUrl = Read-Host "API URL [https://vpn.rbnk.uk]"
        if ([string]::IsNullOrWhiteSpace($apiUrl)) {
            $apiUrl = "https://vpn.rbnk.uk"
        }
        
        $apiUsername = Read-Host "API Username [admin]"
        if ([string]::IsNullOrWhiteSpace($apiUsername)) {
            $apiUsername = "admin"
        }
        
        $apiPassword = Read-Host "API Password" -AsSecureString
        $apiPasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiPassword)
        )
        
        $favCountries = Read-Host "Favorite Countries (comma-separated) [us,uk,de,jp]"
        if ([string]::IsNullOrWhiteSpace($favCountries)) {
            $favCountries = "us,uk,de,jp"
        }
        
        # Create configuration file
        $configPath = Join-Path $env:USERPROFILE ".vpn-raycast-config"
        @"
# VPN Exit Controller Raycast Extension Configuration
# This file is used by the CLI helper tool
API_URL="$apiUrl"
API_USERNAME="$apiUsername"
API_PASSWORD="$apiPasswordText"
FAVORITE_COUNTRIES="$favCountries"
"@ | Out-File -FilePath $configPath -Encoding UTF8
        
        Write-Success "Configuration saved to $configPath"
    }
}

# Install CLI tool
function Install-CLITool {
    $cliPath = Join-Path $ScriptDir "cli"
    if (Test-Path $cliPath) {
        Write-Info "Installing CLI helper tool..."
        
        Push-Location $cliPath
        try {
            npm install
            
            # Create batch file for Windows
            $batchPath = Join-Path $env:USERPROFILE "vpn-raycast.bat"
            @"
@echo off
node "$cliPath\index.js" %*
"@ | Out-File -FilePath $batchPath -Encoding ASCII
            
            Write-Success "CLI tool installed. You can run it using: $batchPath"
            Write-Info "Consider adding $env:USERPROFILE to your PATH for easier access"
        }
        catch {
            Write-Warning "Failed to install CLI tool: $_"
        }
        finally {
            Pop-Location
        }
    }
}

# Main installation
function Start-Installation {
    Test-Prerequisites
    Install-Dependencies
    Build-Extension
    Install-CLITool
    Set-ExtensionConfig
    
    Write-Host ""
    Write-Success "Installation complete!"
    Write-Host ""
    Write-Host "Since Raycast is macOS-only, you can:"
    Write-Host "1. Transfer the built extension to a Mac"
    Write-Host "2. Use this for development and testing"
    Write-Host "3. Package the extension for distribution"
    Write-Host ""
    Write-Host "The extension is built and ready in: $ScriptDir"
    Write-Host ""
    
    $batchPath = Join-Path $env:USERPROFILE "vpn-raycast.bat"
    if (Test-Path $batchPath) {
        Write-Host "CLI tool available at: $batchPath"
    }
}

# Run installation
try {
    Start-Installation
}
catch {
    Write-Error "Installation failed: $_"
    exit 1
}

exit 0