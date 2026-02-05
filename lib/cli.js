#!/usr/bin/env node

const path = require('path');
const os = require('os');
const { loadConfig, getProfile, listProfiles, initializeConfig } = require('./config');
const { launch, validateProfile } = require('./launcher');

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
  console.log('');
  console.log('Arguments:');
  console.log('  profile    Name of profile to use (default: uses \'default\' from config)');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --version, -V  Show version information');
  console.log('');
  console.log('Examples:');
  console.log('  ccswitch kimi');
  console.log('  ccswitch');
}

/**
 * Show version information
 */
function showVersion() {
  console.log('ccswitch v1.0.0');
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
    const exitCode = error.code || error.exitCode || 1;
    fatalError(error.message, exitCode);
  }
}

// Run
main();
