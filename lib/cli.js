#!/usr/bin/env node

const path = require('path');
const os = require('os');
const { loadConfig, getProfile, listProfiles, initializeConfig, deleteProfile, setDefault } = require('./config');
const { launch, validateProfile } = require('./launcher');
const { addProfileInteractive } = require('./add');
const ui = require('./ui');

// Read version from package.json
const PACKAGE_JSON = require('../package.json');
const VERSION = PACKAGE_JSON.version;

// Config directory
const CONFIG_DIR = path.join(os.homedir(), '.ccswitch');
const CONFIG_FILE = path.join(CONFIG_DIR, 'profiles.json');

/**
 * Print error message and exit
 * @param {string} message - Error message
 * @param {number} code - Exit code
 */
function fatalError(message, code = 1) {
  console.error(`ccswitch: ${message}`);
  process.exit(code);
}

/**
 * Show help message
 */
function showHelp() {
  console.log('Usage: ccswitch [profile] [options]');
  console.log('       ccswitch add <name>');
  console.log('       ccswitch delete <name>');
  console.log('       ccswitch set-default <name>');
  console.log('');
  console.log('Arguments:');
  console.log('  profile    Name of profile to use (default: uses \'default\' from config)');
  console.log('');
  console.log('Commands:');
  console.log('  add <name>         Interactively add a new profile');
  console.log('  delete <name>      Delete a profile');
  console.log('  set-default <name> Set a profile as the default');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --version, -V  Show version information');
  console.log('  --list, -l     List all available profiles');
  console.log('');
  console.log('Examples:');
  console.log('  ccswitch kimi');
  console.log('  ccswitch');
  console.log('  ccswitch add myprofile');
  console.log('  ccswitch delete myprofile');
  console.log('  ccswitch set-default kimi');
}

/**
 * Show version information
 */
function showVersion() {
  console.log(`ccswitch v${VERSION}`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Check for version flag
  if (args.includes('--version') || args.includes('-V')) {
    showVersion();
    process.exit(0);
  }

  // Check for list flag
  if (args.includes('--list') || args.includes('-l')) {
    const config = loadConfig(CONFIG_DIR);

    if (!config) {
      console.log('No config file found.');
      console.log('');
      console.log(`Config file: ${CONFIG_FILE}`);
      process.exit(0);
    }

    const profiles = listProfiles(config);

    console.log('Available profiles:');
    console.log('');

    if (profiles.length === 0) {
      console.log('  (no profiles configured)');
    } else {
      for (const name of profiles) {
        const isDefault = config.default && name === config.default ? ' (default)' : '';
        console.log(`  ${name}${isDefault}`);
      }
    }

    console.log('');
    console.log(`Config file: ${CONFIG_FILE}`);
    process.exit(0);
  }

  // Check for add command: ccswitch add <name>
  if (args[0] === 'add') {
    if (!args[1]) {
      console.error('Error: Profile name is required.');
      console.error('');
      console.error('Usage: ccswitch add <name>');
      console.error('');
      console.error('Example: ccswitch add myprofile');
      process.exit(1);
    }
    const profileName = args[1];
    await addProfileInteractive(CONFIG_DIR, profileName);
    return;
  }

  // Check for delete command: ccswitch delete <name>
  if (args[0] === 'delete') {
    if (!args[1]) {
      console.error('Error: Profile name is required.');
      console.error('');
      console.error('Usage: ccswitch delete <name>');
      console.error('');
      console.error('Example: ccswitch delete myprofile');
      process.exit(1);
    }
    const profileName = args[1];
    const deleted = deleteProfile(CONFIG_DIR, profileName);
    if (deleted) {
      ui.success(`Profile "${profileName}" deleted.`);
      const config = loadConfig(CONFIG_DIR);
      if (config && config.default) {
        ui.dim(`  Default is now: ${config.default}`);
      }
    } else {
      ui.error(`Profile "${profileName}" not found.`);
      process.exit(1);
    }
    return;
  }

  // Check for set-default command: ccswitch set-default <name>
  if (args[0] === 'set-default') {
    if (!args[1]) {
      console.error('Error: Profile name is required.');
      console.error('');
      console.error('Usage: ccswitch set-default <name>');
      console.error('');
      console.error('Example: ccswitch set-default kimi');
      process.exit(1);
    }
    const profileName = args[1];
    const updated = setDefault(CONFIG_DIR, profileName);
    if (updated) {
      ui.success(`Default profile set to "${profileName}".`);
    } else {
      ui.error(`Profile "${profileName}" not found.`);
      process.exit(1);
    }
    return;
  }

  // Parse arguments: first non-flag argument is the profile name
  let profileName = '';
  const extraArgs = [];

  for (const arg of args) {
    if (!arg.startsWith('-') && profileName === '') {
      // First non-flag argument is the profile name
      profileName = arg;
    } else {
      // Everything else (including flags and subsequent args) goes to claude-code
      extraArgs.push(arg);
    }
  }

  try {
    // Load or initialize config
    let config = loadConfig(CONFIG_DIR);

    if (!config) {
      console.error(`Config file not found: ${CONFIG_FILE}`);
      console.error('');

      const initialized = initializeConfig(CONFIG_DIR);

      if (initialized) {
        console.error(`Created default config at: ${CONFIG_FILE}`);
        console.error('');
        console.error('Please edit the config file to add your API configurations:');
        console.error('');
        console.error('  ' + CONFIG_FILE);
        console.error('');
        fatalError('Edit the config file and try again.', 1);
      } else {
        fatalError('Failed to create config file.', 1);
      }
    }

    // Get profile
    const profile = getProfile(config, profileName);

    if (!profile) {
      const available = listProfiles(config);
      const defaultName = config.default || '(no default set)';

      if (available.length === 0) {
        fatalError('No profiles found in config file.', 1);
      }

      console.error(`Profile not found: ${profileName || defaultName}`);
      console.error('');
      console.error('Available profiles:');
      for (const name of available) {
        const isDefault = config.default && name === config.default ? ' (default)' : '';
        console.error(`  - ${name}${isDefault}`);
      }
      console.error('');

      fatalError(`Please specify a valid profile.`, 1);
    }

    // Validate profile
    const validation = validateProfile(profile);

    if (!validation.valid) {
      fatalError(
        `Profile "${profileName || config.default}" is missing required fields: ${validation.missing.join(', ')}`,
        1
      );
    }

    // Launch Claude Code with parsed extra arguments
    await launch(profile, extraArgs);

  } catch (error) {
    // Ensure exit code is a number
    let exitCode = error.exitCode || error.code || 1;
    if (typeof exitCode !== 'number') {
      exitCode = 1;
    }
    fatalError(error.message, exitCode);
  }
}

// Run
main();
