const readline = require('readline');

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
 * Interactively add a new profile
 * @param {string} configDir - Config directory
 * @param {string} name - Profile name
 */
async function addProfileInteractive(configDir, name) {
  const { addProfile } = require('./config');

  console.log(`\nAdding profile: ${name}`);
  console.log('Press Enter to use default values or skip optional fields.\n');

  const ANTHROPIC_AUTH_TOKEN = await prompt('API Token (sk-...)');
  const ANTHROPIC_BASE_URL = await prompt('Base URL', 'https://api.anthropic.com');
  const ANTHROPIC_MODEL = await prompt('Model', 'claude-sonnet-4-5-20250514');
  const API_TIMEOUT_MS = await prompt('Timeout (ms)', '300000');
  const DISABLE_TRAFFIC = await prompt('Disable non-essential traffic (1/0)', '0');

  const profile = {
    ANTHROPIC_AUTH_TOKEN,
    ANTHROPIC_BASE_URL,
    ANTHROPIC_MODEL
  };

  if (API_TIMEOUT_MS) {
    profile.API_TIMEOUT_MS = API_TIMEOUT_MS;
  }

  if (DISABLE_TRAFFIC === '1') {
    profile.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
  }

  addProfile(configDir, name, profile);

  console.log(`\n✓ Profile "${name}" added successfully.`);
  console.log(`\nYou can now use it with: ccswitch ${name}\n`);
}

module.exports = { addProfileInteractive };
