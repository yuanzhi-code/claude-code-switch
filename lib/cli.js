#!/usr/bin/env node

const { getConfig } = require('./config');
const { launch } = require('./launcher');

/**
 * Main CLI entry point
 */
async function main() {
  const profileName = process.env.CC_SWITCH_PROFILE;

  try {
    const config = getConfig();

    // Determine which profile to use
    const profile = profileName
      ? config.profiles[profileName]
      : config.profiles[config.defaultProfile];

    if (!profile) {
      console.error(`Error: Profile '${profileName || config.defaultProfile}' not found`);
      process.exit(1);
    }

    // Get extra args from command line (skip first two: node and script path)
    const args = process.argv.slice(2);

    // Launch Claude Code with the profile
    await launch(profile, args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
