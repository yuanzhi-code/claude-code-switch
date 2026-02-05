const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Required environment variables for Claude Code
const REQUIRED_VARS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL'
];

/**
 * Validate that profile has required fields
 * @param {object} profile - Profile object
 * @returns {object} { valid: boolean, missing: string[] }
 */
function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return { valid: false, missing: REQUIRED_VARS };
  }

  const missing = REQUIRED_VARS.filter(key => !profile[key]);

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Build environment object from profile
 * @param {object} profile - Profile object
 * @returns {object} Environment variables object
 */
function buildEnv(profile) {
  const env = { ...process.env };

  // Add all profile values to environment
  for (const [key, value] of Object.entries(profile)) {
    env[key] = String(value);
  }

  return env;
}

/**
 * Launch Claude Code with the given profile
 * @param {object} profile - Profile object
 * @param {string[]} args - Additional arguments to pass to claude
 * @returns {Promise<number>} Exit code
 */
function launch(profile, args = []) {
  return new Promise((resolve, reject) => {
    const validation = validateProfile(profile);

    if (!validation.valid) {
      return reject(new Error(
        `Missing required environment variables: ${validation.missing.join(', ')}`
      ));
    }

    const env = buildEnv(profile);

    // Windows requires shell for .cmd files, Unix doesn't need it
    const isWindows = os.platform() === 'win32';
    const command = isWindows ? 'claude' : 'claude';

    // Use spawn with stdio: 'inherit' for interactive session
    // This connects stdin/stdout/stderr directly to the parent process
    const child = spawn(command, args, {
      env,
      stdio: 'inherit',
      shell: isWindows  // Required on Windows for .cmd files
    });

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        return reject(new Error(
          'claude command not found. Please install Claude Code first.'
        ));
      }
      reject(error);
    });

    child.on('exit', (code) => {
      resolve(code || 0);
    });
  });
}

module.exports = {
  validateProfile,
  buildEnv,
  launch
};
