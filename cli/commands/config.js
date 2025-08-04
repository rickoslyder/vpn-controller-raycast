const chalk = require('chalk');
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.vpn-raycast-config');

// Load existing configuration
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = {};
      
      // Parse shell-style config file
      content.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const match = line.match(/^([^=]+)="?([^"]+)"?$/);
          if (match) {
            config[match[1]] = match[2];
          }
        }
      });
      
      return config;
    } catch (error) {
      console.error(chalk.red('Error reading config file:'), error.message);
      return {};
    }
  }
  return {};
}

// Save configuration
function saveConfig(config) {
  const content = `# VPN Exit Controller Raycast Extension Configuration
# This file is used by the CLI helper tool
API_URL="${config.API_URL || 'https://vpn.rbnk.uk'}"
API_USERNAME="${config.API_USERNAME || 'admin'}"
API_PASSWORD="${config.API_PASSWORD || ''}"
FAVORITE_COUNTRIES="${config.FAVORITE_COUNTRIES || 'us,uk,de,jp'}"
`;

  try {
    fs.writeFileSync(CONFIG_FILE, content, { mode: 0o600 });
    console.log(chalk.green('✓ Configuration saved to'), CONFIG_FILE);
  } catch (error) {
    console.error(chalk.red('Error saving config:'), error.message);
    process.exit(1);
  }
}

module.exports = async function config(options) {
  // Show current configuration
  if (options.show) {
    const config = loadConfig();
    
    if (Object.keys(config).length === 0) {
      console.log(chalk.yellow('No configuration found.'));
      console.log('Run', chalk.cyan('vpn-raycast config'), 'to create one.');
      return;
    }

    console.log(chalk.blue('\nCurrent Configuration:\n'));
    console.log('API URL:            ', chalk.cyan(config.API_URL || 'Not set'));
    console.log('API Username:       ', chalk.cyan(config.API_USERNAME || 'Not set'));
    console.log('API Password:       ', chalk.cyan(config.API_PASSWORD ? '********' : 'Not set'));
    console.log('Favorite Countries: ', chalk.cyan(config.FAVORITE_COUNTRIES || 'Not set'));
    console.log('\nConfig file:', chalk.gray(CONFIG_FILE));
    return;
  }

  // Reset configuration
  if (options.reset) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset the configuration?',
      initial: false
    });

    if (response.confirm) {
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE);
        }
        console.log(chalk.green('✓ Configuration reset'));
      } catch (error) {
        console.error(chalk.red('Error resetting config:'), error.message);
        process.exit(1);
      }
    }
    return;
  }

  // Interactive configuration
  console.log(chalk.blue('Configure VPN Exit Controller Raycast Extension\n'));

  const currentConfig = loadConfig();
  
  const questions = [
    {
      type: 'text',
      name: 'API_URL',
      message: 'API URL:',
      initial: currentConfig.API_URL || 'https://vpn.rbnk.uk',
      validate: value => {
        try {
          new URL(value);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'text',
      name: 'API_USERNAME',
      message: 'API Username:',
      initial: currentConfig.API_USERNAME || 'admin'
    },
    {
      type: 'password',
      name: 'API_PASSWORD',
      message: 'API Password:',
      initial: currentConfig.API_PASSWORD || ''
    },
    {
      type: 'text',
      name: 'FAVORITE_COUNTRIES',
      message: 'Favorite Countries (comma-separated):',
      initial: currentConfig.FAVORITE_COUNTRIES || 'us,uk,de,jp',
      validate: value => {
        const countries = value.split(',').map(c => c.trim());
        if (countries.length === 0) {
          return 'Please enter at least one country code';
        }
        // Basic validation for country codes
        const valid = countries.every(c => /^[a-z]{2}$/i.test(c));
        return valid || 'Please enter valid 2-letter country codes';
      }
    }
  ];

  try {
    const response = await prompts(questions);
    
    if (Object.keys(response).length === 0) {
      console.log(chalk.yellow('\nConfiguration cancelled'));
      return;
    }

    saveConfig(response);

    console.log(chalk.green('\n✓ Configuration complete!'));
    console.log('\nTo use these settings in Raycast:');
    console.log('1. Open Raycast preferences');
    console.log('2. Navigate to Extensions → VPN Exit Controller');
    console.log('3. Enter the same credentials');

  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};