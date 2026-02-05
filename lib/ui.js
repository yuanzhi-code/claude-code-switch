const chalk = require('chalk');

/**
 * Print a success message with a green checkmark
 * @param {string} msg - The message to display
 */
function success(msg) {
  console.log(chalk.green('✓'), msg);
}

/**
 * Print an error message with a red cross mark
 * @param {string} msg - The message to display
 */
function error(msg) {
  console.error(chalk.red('✗'), msg);
}

/**
 * Print a warning message with a yellow warning symbol
 * @param {string} msg - The message to display
 */
function warning(msg) {
  console.log(chalk.yellow('⚠'), msg);
}

/**
 * Print an info message with a blue info symbol
 * @param {string} msg - The message to display
 */
function info(msg) {
  console.log(chalk.blue('ℹ'), msg);
}

/**
 * Print dimmed (faded) text
 * @param {string} msg - The message to display
 */
function dim(msg) {
  console.log(chalk.dim(msg));
}

/**
 * Print highlighted (cyan) text
 * @param {string} msg - The message to display
 */
function highlight(msg) {
  console.log(chalk.cyan(msg));
}

/**
 * Format a profile name with (default) suffix if it's the default profile
 * @param {string} name - The profile name
 * @param {string|null|undefined} defaultName - The default profile name
 * @returns {string} Formatted profile name
 */
function formatProfileName(name, defaultName) {
  if (name === defaultName) {
    return `${name} ${chalk.cyan('(default)')}`;
  }
  return name;
}

module.exports = {
  success,
  error,
  warning,
  info,
  dim,
  highlight,
  formatProfileName
};
