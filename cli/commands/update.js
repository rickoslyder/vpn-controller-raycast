const chalk = require('chalk');
const ora = require('ora');
const fetch = require('node-fetch');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

module.exports = async function update(options) {
  console.log(chalk.blue('Checking for VPN Exit Controller Raycast Extension updates...\n'));

  const spinner = ora();
  const extensionPath = path.resolve(__dirname, '..', '..');

  try {
    // Get current version
    const packagePath = path.join(extensionPath, 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.error(chalk.red('Extension not found. Run "vpn-raycast install" first.'));
      process.exit(1);
    }

    const currentPackage = require(packagePath);
    const currentVersion = currentPackage.version;

    spinner.start('Checking for updates...');

    // Check for updates (placeholder - in real implementation, check GitHub/Gitea releases)
    // For now, we'll simulate checking against a remote source
    const updateInfo = await checkForUpdates(currentVersion);

    if (!updateInfo.hasUpdate) {
      spinner.succeed(`Already up to date (v${currentVersion})`);
      return;
    }

    spinner.succeed(`Update available: v${currentVersion} → v${updateInfo.latestVersion}`);

    if (options.check) {
      console.log(chalk.yellow('\nUpdate available!'));
      console.log('Run', chalk.cyan('vpn-raycast update'), 'to install');
      return;
    }

    // Confirm update
    console.log(chalk.yellow('\nUpdate details:'));
    console.log(`Current version: ${currentVersion}`);
    console.log(`Latest version:  ${updateInfo.latestVersion}`);
    if (updateInfo.releaseNotes) {
      console.log('\nRelease notes:');
      console.log(updateInfo.releaseNotes);
    }

    const prompts = require('prompts');
    const response = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to update?',
      initial: true
    });

    if (!response.confirm) {
      console.log(chalk.yellow('Update cancelled'));
      return;
    }

    // Perform update
    spinner.start('Downloading update...');

    // In a real implementation, download from Zipline/GitHub
    // For now, we'll use git pull if in a git repository
    try {
      const isGitRepo = fs.existsSync(path.join(extensionPath, '.git'));
      
      if (isGitRepo) {
        spinner.text = 'Updating from git repository...';
        execSync('git pull', {
          cwd: extensionPath,
          stdio: 'pipe'
        });
      } else {
        // Download and extract update
        spinner.text = 'Downloading release...';
        // Placeholder for actual download logic
        throw new Error('Automatic updates not yet implemented for non-git installations');
      }

      spinner.succeed('Update downloaded');

      // Reinstall dependencies
      spinner.start('Installing dependencies...');
      execSync('npm ci --production', {
        cwd: extensionPath,
        stdio: 'pipe'
      });
      spinner.succeed('Dependencies updated');

      // Rebuild extension
      spinner.start('Building extension...');
      execSync('npm run build', {
        cwd: extensionPath,
        stdio: 'pipe'
      });
      spinner.succeed('Extension rebuilt');

      console.log(chalk.green(`\n✓ Successfully updated to v${updateInfo.latestVersion}!`));
      console.log('\nRestart Raycast to use the updated extension.');

    } catch (error) {
      spinner.fail('Update failed');
      console.error(chalk.red('Error:'), error.message);
      console.log(chalk.yellow('\nTry updating manually:'));
      console.log('1. Download the latest release');
      console.log('2. Extract to:', extensionPath);
      console.log('3. Run: vpn-raycast install');
      process.exit(1);
    }

  } catch (error) {
    spinner.fail('Update check failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};

// Check for updates (placeholder implementation)
async function checkForUpdates(currentVersion) {
  // In a real implementation, this would:
  // 1. Check GitHub/Gitea API for latest release
  // 2. Compare versions
  // 3. Return update information

  // For now, return mock data
  return {
    hasUpdate: false,
    currentVersion: currentVersion,
    latestVersion: currentVersion,
    downloadUrl: null,
    releaseNotes: null
  };

  // Example of what real implementation might look like:
  /*
  try {
    const response = await fetch('https://gitea.rbnk.uk/api/v1/repos/admin/vpn-controller-raycast/releases/latest');
    const release = await response.json();
    
    const latestVersion = release.tag_name.replace('v', '');
    const hasUpdate = compareVersions(currentVersion, latestVersion) < 0;
    
    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl: release.assets[0]?.browser_download_url,
      releaseNotes: release.body
    };
  } catch (error) {
    console.warn(chalk.yellow('Could not check for updates'));
    return { hasUpdate: false, currentVersion, latestVersion: currentVersion };
  }
  */
}

// Simple version comparison
function compareVersions(current, latest) {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (currentPart < latestPart) return -1;
    if (currentPart > latestPart) return 1;
  }
  
  return 0;
}