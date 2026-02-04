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
 * Print usage hint
 */
function printUsage() {
  console.error('');
  console.error('Usage: ccswitch [profile]');
  console.error('');
  console.error('Available commands:');
  console.error('  ccswitch <name>    Launch Claude Code with specified profile');
  console.error('  ccswitch           Launch Claude Code with default profile');
  console.error('  ccswitch --help    Show this help message');
  console.error('');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    // Handled by shell script
    return;
  }

  // Check for version flag
  if (args.includes('--version') || args.includes('-V')) {
    // Handled by shell script
    return;
  }

  // Get profile name from environment (set by shell script) or use default
  let profileName = process.env.CC_SWITCH_PROFILE || '';

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

      if (available.length === 0) {
        fatalError('No profiles found in config file.', 1);
      }

      console.error(`Profile not found: ${profileName || '(default)'}`);
      console.error('');
      console.error('Available profiles:');
      for (const name of available) {
        const isDefault = name === config.default ? ' (default)' : '';
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

    // Launch Claude Code
    await launch(profile, []);

  } catch (error) {
    fatalError(error.message, error.code || 1);
  }
}

// Run
main();
