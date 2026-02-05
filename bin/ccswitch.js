#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the directory where this script is located and resolve symlinks
// This handles npm link scenarios where the script is symlinked
const entryPath = fs.realpathSync(process.argv[1]);
const scriptDir = path.dirname(entryPath);
const libDir = path.resolve(scriptDir, '..', 'lib');

// Load and run the main CLI module
require(path.join(libDir, 'cli.js'));
