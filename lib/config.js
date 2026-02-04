const fs = require('fs');
const path = require('path');

/**
 * Load configuration from the config directory
 * @param {string} configDir - Path to config directory
 * @returns {object|null} Configuration object or null if not exists
 */
function loadConfig(configDir) {
  const configPath = path.join(configDir, 'profiles.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse config file: ${error.message}`);
  }
}

/**
 * Get a specific profile from config
 * @param {object} config - Configuration object
 * @param {string} profileName - Name of profile (optional, uses default)
 * @returns {object|null} Profile object or null if not found
 */
function getProfile(config, profileName) {
  if (!config || !config.profiles) {
    return null;
  }

  const name = profileName || config.default;

  if (!name) {
    return null;
  }

  return config.profiles[name] || null;
}

/**
 * Get list of available profile names
 * @param {object} config - Configuration object
 * @returns {string[]} Array of profile names
 */
function listProfiles(config) {
  if (!config || !config.profiles) {
    return [];
  }

  return Object.keys(config.profiles);
}

module.exports = {
  loadConfig,
  getProfile,
  listProfiles
};
