const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(os.homedir(), '.vpn-raycast-config');

module.exports = async function status(options) {
  console.log(chalk.blue('VPN Exit Controller Raycast Extension Status\n'));

  const extensionPath = path.resolve(__dirname, '..', '..');
  const checks = [];

  // Check extension installation
  const spinner = ora('Checking extension installation...').start();
  
  try {
    // Check if package.json exists
    if (fs.existsSync(path.join(extensionPath, 'package.json'))) {
      const packageInfo = require(path.join(extensionPath, 'package.json'));
      checks.push({
        name: 'Extension Version',
        status: 'success',
        value: packageInfo.version
      });
    } else {
      checks.push({
        name: 'Extension',
        status: 'error',
        value: 'Not found'
      });
    }

    // Check dependencies
    if (fs.existsSync(path.join(extensionPath, 'node_modules'))) {
      checks.push({
        name: 'Dependencies',
        status: 'success',
        value: 'Installed'
      });
    } else {
      checks.push({
        name: 'Dependencies',
        status: 'warning',
        value: 'Not installed'
      });
    }

    // Check build
    if (fs.existsSync(path.join(extensionPath, 'dist'))) {
      const stats = fs.statSync(path.join(extensionPath, 'dist'));
      checks.push({
        name: 'Build',
        status: 'success',
        value: `Last built: ${stats.mtime.toLocaleString()}`
      });
    } else {
      checks.push({
        name: 'Build',
        status: 'warning',
        value: 'Not built'
      });
    }

    // Check icon
    if (fs.existsSync(path.join(extensionPath, 'assets', 'icon.png'))) {
      checks.push({
        name: 'Icon',
        status: 'success',
        value: 'Present'
      });
    } else {
      checks.push({
        name: 'Icon',
        status: 'warning',
        value: 'Missing (will affect display)'
      });
    }

    // Check configuration
    if (fs.existsSync(CONFIG_FILE)) {
      const config = {};
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      content.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const match = line.match(/^([^=]+)="?([^"]+)"?$/);
          if (match) {
            config[match[1]] = match[2];
          }
        }
      });

      checks.push({
        name: 'Configuration',
        status: config.API_PASSWORD ? 'success' : 'warning',
        value: config.API_PASSWORD ? 'Complete' : 'Missing API password'
      });
    } else {
      checks.push({
        name: 'Configuration',
        status: 'warning',
        value: 'Not configured'
      });
    }

    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const version = nodeVersion.replace('v', '').split('.');
      const major = parseInt(version[0]);
      
      checks.push({
        name: 'Node.js',
        status: major >= 22 ? 'success' : 'warning',
        value: nodeVersion
      });
    } catch {
      checks.push({
        name: 'Node.js',
        status: 'error',
        value: 'Not found'
      });
    }

    // Check Raycast (macOS only)
    if (os.platform() === 'darwin') {
      try {
        const raycastCheck = execSync('mdfind "kMDItemCFBundleIdentifier == \'com.raycast.macos\'"', { encoding: 'utf8' });
        if (raycastCheck.includes('Raycast.app')) {
          checks.push({
            name: 'Raycast',
            status: 'success',
            value: 'Installed'
          });
        } else {
          checks.push({
            name: 'Raycast',
            status: 'warning',
            value: 'Not found'
          });
        }
      } catch {
        checks.push({
          name: 'Raycast',
          status: 'warning',
          value: 'Unable to check'
        });
      }
    } else {
      checks.push({
        name: 'Platform',
        status: 'info',
        value: `${os.platform()} (Raycast requires macOS)`
      });
    }

    spinner.stop();

    // Display results
    console.log(chalk.bold('Status Checks:\n'));

    checks.forEach(check => {
      const icon = {
        success: chalk.green('✓'),
        warning: chalk.yellow('⚠'),
        error: chalk.red('✗'),
        info: chalk.blue('ℹ')
      }[check.status] || '•';

      const name = check.name.padEnd(20, ' ');
      console.log(`${icon} ${name} ${chalk.gray(check.value)}`);
    });

    // Verbose output
    if (options.verbose) {
      console.log(chalk.bold('\nDetailed Information:\n'));
      console.log('Extension Path:  ', chalk.cyan(extensionPath));
      console.log('Config File:     ', chalk.cyan(CONFIG_FILE));
      console.log('Platform:        ', chalk.cyan(os.platform()));
      console.log('Architecture:    ', chalk.cyan(os.arch()));
      console.log('Node Path:       ', chalk.cyan(process.execPath));
      
      // List available commands
      const commands = [
        'index', 'manage-nodes', 'quick-toggle', 'proxy-info'
      ];
      
      console.log('\nAvailable Commands:');
      commands.forEach(cmd => {
        const cmdPath = path.join(extensionPath, 'src', `${cmd}.tsx`);
        if (fs.existsSync(cmdPath)) {
          console.log(`  - ${chalk.green('✓')} ${cmd}`);
        } else {
          console.log(`  - ${chalk.red('✗')} ${cmd}`);
        }
      });
    }

    // Summary
    const hasErrors = checks.some(c => c.status === 'error');
    const hasWarnings = checks.some(c => c.status === 'warning');

    console.log('\n' + chalk.bold('Summary:'));
    if (hasErrors) {
      console.log(chalk.red('✗ Extension has errors. Run "vpn-raycast install" to fix.'));
    } else if (hasWarnings) {
      console.log(chalk.yellow('⚠ Extension has warnings but should work.'));
      if (!fs.existsSync(CONFIG_FILE)) {
        console.log('  Run "vpn-raycast config" to configure the extension.');
      }
    } else {
      console.log(chalk.green('✓ Extension is ready to use!'));
    }

  } catch (error) {
    spinner.fail('Status check failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};