#!/bin/bash

# VPN Exit Controller Raycast Extension Release Script
# This script creates a new release and uploads it to Zipline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
ZIPLINE_TOKEN="${ZIPLINE_TOKEN:-}"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if in git repository
    if ! git -C "$PROJECT_ROOT" rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git -C "$PROJECT_ROOT" diff --quiet || ! git -C "$PROJECT_ROOT" diff --cached --quiet; then
        print_error "Uncommitted changes found. Please commit or stash them first."
        exit 1
    fi
    
    # Check for jq (JSON processor)
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install jq for JSON processing."
        exit 1
    fi
    
    # Check Zipline token
    if [ -z "$ZIPLINE_TOKEN" ]; then
        print_error "ZIPLINE_TOKEN environment variable not set"
        echo "Export your Zipline token:"
        echo "export ZIPLINE_TOKEN='your_token_here'"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Get version from package.json
get_version() {
    VERSION=$(jq -r '.version' "$PROJECT_ROOT/package.json")
    if [ -z "$VERSION" ]; then
        print_error "Could not read version from package.json"
        exit 1
    fi
    echo "$VERSION"
}

# Create release archive
create_archive() {
    local version=$1
    local archive_name="vpn-controller-raycast-v${version}"
    local archive_path="$PROJECT_ROOT/${archive_name}.tar.gz"
    
    print_info "Creating release archive..."
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    local release_dir="$temp_dir/$archive_name"
    
    # Copy files
    mkdir -p "$release_dir"
    cp -r "$PROJECT_ROOT/src" "$release_dir/"
    cp -r "$PROJECT_ROOT/assets" "$release_dir/"
    cp "$PROJECT_ROOT/package.json" "$release_dir/"
    cp "$PROJECT_ROOT/package-lock.json" "$release_dir/"
    cp "$PROJECT_ROOT/tsconfig.json" "$release_dir/"
    cp "$PROJECT_ROOT/README.md" "$release_dir/"
    cp "$PROJECT_ROOT/LICENSE" "$release_dir/"
    cp "$PROJECT_ROOT/install.sh" "$release_dir/"
    cp "$PROJECT_ROOT/install.ps1" "$release_dir/"
    cp "$PROJECT_ROOT/uninstall.sh" "$release_dir/"
    
    # Copy CLI tool if exists
    if [ -d "$PROJECT_ROOT/cli" ]; then
        cp -r "$PROJECT_ROOT/cli" "$release_dir/"
    fi
    
    # Create archive
    cd "$temp_dir"
    tar -czf "$archive_path" "$archive_name"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    print_success "Archive created: $archive_path"
    echo "$archive_path"
}

# Upload to Zipline
upload_to_zipline() {
    local file_path=$1
    local version=$2
    
    print_info "Uploading to Zipline..."
    
    # Run the upload script
    local upload_response=$(node "$SCRIPT_DIR/upload-to-zipline.js" "$file_path" 2>&1)
    local upload_status=$?
    
    if [ $upload_status -eq 0 ]; then
        print_success "Upload successful"
        echo "$upload_response"
    else
        print_error "Upload failed"
        echo "$upload_response"
        return 1
    fi
}

# Update version in package.json
update_version() {
    local new_version=$1
    
    print_info "Updating version to $new_version..."
    
    # Update package.json
    jq ".version = \"$new_version\"" "$PROJECT_ROOT/package.json" > "$PROJECT_ROOT/package.json.tmp"
    mv "$PROJECT_ROOT/package.json.tmp" "$PROJECT_ROOT/package.json"
    
    # Update CLI package.json if exists
    if [ -f "$PROJECT_ROOT/cli/package.json" ]; then
        jq ".version = \"$new_version\"" "$PROJECT_ROOT/cli/package.json" > "$PROJECT_ROOT/cli/package.json.tmp"
        mv "$PROJECT_ROOT/cli/package.json.tmp" "$PROJECT_ROOT/cli/package.json"
    fi
    
    print_success "Version updated to $new_version"
}

# Create git tag
create_git_tag() {
    local version=$1
    local tag="v$version"
    
    print_info "Creating git tag $tag..."
    
    git -C "$PROJECT_ROOT" add -A
    git -C "$PROJECT_ROOT" commit -m "Release version $version"
    git -C "$PROJECT_ROOT" tag -a "$tag" -m "Release version $version"
    
    print_success "Git tag created: $tag"
}

# Main release process
main() {
    echo -e "${BLUE}VPN Exit Controller Raycast Extension Release Tool${NC}\n"
    
    check_prerequisites
    
    # Get current version
    current_version=$(get_version)
    print_info "Current version: $current_version"
    
    # Ask for new version
    read -p "Enter new version (or press Enter to use $current_version): " new_version
    new_version=${new_version:-$current_version}
    
    # Validate version format
    if ! [[ "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use semantic versioning (e.g., 1.2.3)"
        exit 1
    fi
    
    # Update version if different
    if [ "$new_version" != "$current_version" ]; then
        update_version "$new_version"
    fi
    
    # Build the extension
    print_info "Building extension..."
    cd "$PROJECT_ROOT"
    npm run build
    print_success "Build completed"
    
    # Create release archive
    archive_path=$(create_archive "$new_version")
    
    # Generate checksum
    print_info "Generating checksum..."
    checksum=$(sha256sum "$archive_path" | cut -d' ' -f1)
    echo "$checksum" > "${archive_path}.sha256"
    print_success "Checksum: $checksum"
    
    # Upload to Zipline
    upload_url=$(upload_to_zipline "$archive_path" "$new_version")
    
    if [ $? -eq 0 ]; then
        # Create git tag
        create_git_tag "$new_version"
        
        # Update Homebrew formula if script exists
        if [ -f "$SCRIPT_DIR/update-homebrew.sh" ]; then
            print_info "Updating Homebrew formula..."
            "$SCRIPT_DIR/update-homebrew.sh" "$new_version" "$upload_url" "$checksum"
        fi
        
        # Cleanup
        rm -f "$archive_path" "${archive_path}.sha256"
        
        print_success "Release completed!"
        echo ""
        echo "Release Summary:"
        echo "  Version:      $new_version"
        echo "  Download URL: $upload_url"
        echo "  Checksum:     $checksum"
        echo ""
        echo "Next steps:"
        echo "1. Push tags: git push origin main --tags"
        echo "2. Create release notes"
        echo "3. Update documentation"
    else
        print_error "Release failed during upload"
        exit 1
    fi
}

# Run main function
main "$@"