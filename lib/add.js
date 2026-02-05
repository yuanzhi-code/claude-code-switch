const readline = require('readline');
const ui = require('./ui');

/**
 * Prompt user for input
 * @param {string} question - The question to ask
 * @param {string} defaultValue - Default value
 * @returns {Promise<string>} User input
 */
function prompt(question, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    const promptText = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Validate API token format
 * @param {string} token - API token to validate
 * @returns {boolean} True if valid
 */
function isValidApiToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  const trimmed = token.trim();
  return trimmed.length > 0 && trimmed.startsWith('sk-ant-');
}

/**
 * Validate timeout is numeric
 * @param {string} timeout - Timeout value to validate
 * @returns {boolean} True if valid
 */
function isValidTimeout(timeout) {
  if (!timeout || timeout.trim() === '') {
    return true; // Optional field
  }
  const num = Number(timeout);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
}

/**
 * Interactively add a new profile
 * @param {string} configDir - Config directory
 * @param {string} name - Profile name
 */
async function addProfileInteractive(configDir, name) {
  const { addProfile } = require('./config');

  // Validate profile name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.error('Error: Profile name is required.');
    process.exit(1);
  }

  console.log(`\nAdding profile: ${name}`);
  console.log('Press Enter to use default values or skip optional fields.\n');

  let ANTHROPIC_AUTH_TOKEN;
  let validToken = false;

  // Loop until valid API token is provided
  while (!validToken) {
    ANTHROPIC_AUTH_TOKEN = await prompt('API Token (sk-ant-...)');

    if (!ANTHROPIC_AUTH_TOKEN || ANTHROPIC_AUTH_TOKEN.trim() === '') {
      console.error('Error: API Token is required.');
    } else if (!isValidApiToken(ANTHROPIC_AUTH_TOKEN)) {
      console.error('Error: API Token must start with "sk-ant-"');
    } else {
      validToken = true;
    }
  }

  const ANTHROPIC_BASE_URL = await prompt('Base URL', 'https://api.anthropic.com');
  const ANTHROPIC_MODEL = await prompt('Model', 'claude-sonnet-4-5-20250514');

  let API_TIMEOUT_MS;
  let validTimeout = false;
  while (!validTimeout) {
    API_TIMEOUT_MS = await prompt('Timeout (ms)', '300000');

    if (!isValidTimeout(API_TIMEOUT_MS)) {
      console.error('Error: Timeout must be a positive integer (milliseconds).');
    } else {
      validTimeout = true;
    }
  }

  const DISABLE_TRAFFIC = await prompt('Disable non-essential traffic? (yes/no)', 'no');

  const profile = {
    ANTHROPIC_AUTH_TOKEN: ANTHROPIC_AUTH_TOKEN.trim(),
    ANTHROPIC_BASE_URL: ANTHROPIC_BASE_URL.trim() || 'https://api.anthropic.com',
    ANTHROPIC_MODEL: ANTHROPIC_MODEL.trim() || 'claude-sonnet-4-5-20250514'
  };

  if (API_TIMEOUT_MS && API_TIMEOUT_MS.trim() !== '') {
    profile.API_TIMEOUT_MS = API_TIMEOUT_MS.trim();
  }

  if (DISABLE_TRAFFIC.toLowerCase() === 'yes' || DISABLE_TRAFFIC === '1') {
    profile.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
  }

  try {
    addProfile(configDir, name, profile);
    console.log('');
    ui.success(`Profile "${name}" added successfully.`);
    console.log('');
    ui.info(`You can now use it with: ccswitch ${name}`);
    console.log('');
  } catch (error) {
    console.error(`\nError: Failed to add profile: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { addProfileInteractive, isValidApiToken, isValidTimeout };
