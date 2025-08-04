#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const packageInfo = require('./package.json');

// Commands
const installCommand = require('./commands/install');
const configCommand = require('./commands/config');
const statusCommand = require('./commands/status');
const updateCommand = require('./commands/update');

// ASCII Banner
const banner = `
╔══════════════════════════════════════════════════════════╗
║       VPN Exit Controller Raycast Extension CLI           ║
╚══════════════════════════════════════════════════════════╝
`;

// Main program
program
  .name('vpn-raycast')
  .description('CLI tool for managing VPN Exit Controller Raycast Extension')
  .version(packageInfo.version)
  .addHelpText('before', chalk.blue(banner));

// Install command
program
  .command('install')
  .description('Install or reinstall the Raycast extension')
  .option('-f, --force', 'Force installation even if already installed')
  .option('-d, --dev', 'Install in development mode')
  .action(installCommand);

// Config command
program
  .command('config')
  .description('Configure the extension settings')
  .option('-s, --show', 'Show current configuration')
  .option('-r, --reset', 'Reset configuration to defaults')
  .action(configCommand);

// Status command
program
  .command('status')
  .description('Check extension status and health')
  .option('-v, --verbose', 'Show detailed information')
  .action(statusCommand);

// Update command
program
  .command('update')
  .description('Update the extension to the latest version')
  .option('--check', 'Only check for updates without installing')
  .action(updateCommand);

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}