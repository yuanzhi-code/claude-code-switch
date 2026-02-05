const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'profiles.json');

/**
 * Initialize config from template if not exists
 * @param {string} configDir - Path to config directory
 * @returns {boolean} True if created, false if already exists
 */
function initializeConfig(configDir) {
  const configPath = path.join(configDir, 'profiles.json');

  if (fs.existsSync(configPath)) {
    return false;
  }

  // Create directory if not exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Copy template
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  fs.writeFileSync(configPath, template, 'utf8');

  return true;
}

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

/**
 * Add a new profile to config
 * @param {string} configDir - Path to config directory
 * @param {string} name - Profile name
 * @param {object} profile - Profile object
 * @returns {boolean} True if added successfully
 * @throws {Error} If validation fails or write fails
 */
function addProfile(configDir, name, profile) {
  // Validate parameters
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Profile name is required and must be a non-empty string');
  }

  if (!profile || typeof profile !== 'object') {
    throw new Error('Profile must be a valid object');
  }

  const configPath = path.join(configDir, 'profiles.json');

  try {
    // Load existing config or create new
    let config = loadConfig(configDir);
    if (!config) {
      // Create new config
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      config = { profiles: {}, default: '' };
    }

    // Check for duplicate profile names
    if (config.profiles && config.profiles[name]) {
      console.warn(`Warning: Profile "${name}" already exists. It will be overwritten.`);
    }

    // Add profile
    config.profiles[name] = profile;

    // Set as default if it's the first profile
    if (!config.default || Object.keys(config.profiles).length === 1) {
      config.default = name;
    }

    // Write back
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied writing to ${configPath}`);
    } else if (error.code === 'ENOENT') {
      throw new Error(`Config directory does not exist: ${configDir}`);
    } else {
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  }
}

module.exports = {
  loadConfig,
  getProfile,
  listProfiles,
  initializeConfig,
  addProfile
};
