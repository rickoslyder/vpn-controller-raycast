const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async function install(options) {
  console.log(chalk.blue('Installing VPN Exit Controller Raycast Extension...\n'));

  const spinner = ora();
  const extensionPath = path.resolve(__dirname, '..', '..');

  try {
    // Check if already installed
    if (!options.force) {
      spinner.start('Checking existing installation...');
      
      // Check if node_modules exists
      if (fs.existsSync(path.join(extensionPath, 'node_modules'))) {
        spinner.warn('Extension appears to be already installed. Use --force to reinstall.');
        return;
      }
      spinner.succeed('No existing installation found');
    }

    // Check prerequisites
    spinner.start('Checking prerequisites...');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      spinner.succeed(`Node.js ${nodeVersion} found`);
    } catch (error) {
      spinner.fail('Node.js not found. Please install Node.js 22.14 or higher.');
      process.exit(1);
    }

    // Install dependencies
    spinner.start('Installing dependencies...');
    try {
      const npmCommand = options.dev ? 'npm install' : 'npm ci --production';
      execSync(npmCommand, {
        cwd: extensionPath,
        stdio: 'pipe'
      });
      spinner.succeed('Dependencies installed');
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      console.error(chalk.red(error.message));
      process.exit(1);
    }

    // Build extension
    spinner.start('Building extension...');
    try {
      // Check for icon
      const iconPath = path.join(extensionPath, 'assets', 'icon.png');
      if (!fs.existsSync(iconPath)) {
        spinner.info('Icon not found, creating placeholder...');
        const iconScript = path.join(extensionPath, 'create-placeholder-icon.py');
        if (fs.existsSync(iconScript)) {
          try {
            execSync(`python3 ${iconScript}`, {
              cwd: extensionPath,
              stdio: 'pipe'
            });
          } catch (e) {
            spinner.warn('Could not create placeholder icon');
          }
        }
      }

      execSync('npm run build', {
        cwd: extensionPath,
        stdio: 'pipe'
      });
      spinner.succeed('Extension built successfully');
    } catch (error) {
      spinner.fail('Failed to build extension');
      console.error(chalk.red(error.message));
      process.exit(1);
    }

    // Platform-specific instructions
    console.log(chalk.green('\n✓ Installation complete!\n'));

    if (os.platform() === 'darwin') {
      console.log(chalk.yellow('Next steps:'));
      console.log('1. Open Raycast');
      console.log('2. Search for "VPN" to use the extension');
      console.log('3. Configure API credentials in Raycast preferences\n');
      console.log('Run', chalk.cyan('vpn-raycast config'), 'to configure settings');
    } else {
      console.log(chalk.yellow('Note: Raycast is macOS only.'));
      console.log('The extension has been built and is ready for:');
      console.log('- Development and testing');
      console.log('- Transfer to a Mac system');
      console.log('- Packaging for distribution\n');
    }

  } catch (error) {
    spinner.fail('Installation failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};