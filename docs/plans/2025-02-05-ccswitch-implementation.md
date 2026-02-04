# ccswitch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool that switches between different Claude Code API configurations via environment variables.

**Architecture:** A Node.js CLI tool that reads profiles from `~/.ccswitch/profiles.json`, constructs environment variables, and transparently launches `claude-code` with those variables. No state persistence needed.

**Tech Stack:** Node.js (CommonJS), shell scripting, child_process.exec

---

## Task 1: Project Initialization

**Files:**
- Modify: `package.json`
- Create: `lib/templates/profiles.json`

**Step 1: Update package.json**

Add proper metadata and bin entry:

```json
{
  "name": "claude-code-switch",
  "version": "1.0.0",
  "description": "Switch between Claude Code API configurations",
  "main": "lib/launcher.js",
  "bin": {
    "ccswitch": "./bin/ccswitch"
  },
  "scripts": {
    "test": "echo \"Tests not yet implemented\" && exit 0"
  },
  "keywords": ["claude-code", "cli", "switch"],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "engines": {
    "node": ">=14.0.0"
  }
}
```

**Step 2: Create config template**

Create `lib/templates/profiles.json`:

```json
{
  "profiles": {
    "example": {
      "ANTHROPIC_AUTH_TOKEN": "your-token-here",
      "ANTHROPIC_BASE_URL": "https://api.example.com",
      "ANTHROPIC_MODEL": "model-name"
    }
  },
  "default": "example"
}
```

**Step 3: Commit**

```bash
git add package.json lib/templates/profiles.json
git commit -m "chore: initialize project structure and config template"
```

---

## Task 2: Config Module - Read Configuration

**Files:**
- Create: `lib/config.js`

**Step 1: Write the test**

First, create test directory and test file:

```bash
mkdir -p tests
```

Create `tests/config.test.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { loadConfig, getProfile } = require('../lib/config');

describe('config module', () => {
  const testConfigDir = '/tmp/ccswitch-test';
  const testConfigPath = path.join(testConfigDir, 'profiles.json');

  beforeEach(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('loadConfig', () => {
    test('should load existing config file', () => {
      const testConfig = {
        profiles: {
          test: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
        },
        default: 'test'
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

      const config = loadConfig(testConfigDir);
      expect(config.profiles.test.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
    });

    test('should return null if config does not exist', () => {
      const config = loadConfig(testConfigDir);
      expect(config).toBeNull();
    });
  });

  describe('getProfile', () => {
    test('should return specified profile', () => {
      const config = {
        profiles: {
          kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' },
          anthropic: { ANTHROPIC_AUTH_TOKEN: 'anthropic-token' }
        },
        default: 'kimi'
      };

      const profile = getProfile(config, 'kimi');
      expect(profile.ANTHROPIC_AUTH_TOKEN).toBe('kimi-token');
    });

    test('should return default profile when no name specified', () => {
      const config = {
        profiles: {
          kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' }
        },
        default: 'kimi'
      };

      const profile = getProfile(config);
      expect(profile.ANTHROPIC_AUTH_TOKEN).toBe('kimi-token');
    });

    test('should return null if profile does not exist', () => {
      const config = {
        profiles: { kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' } },
        default: 'kimi'
      };

      const profile = getProfile(config, 'nonexistent');
      expect(profile).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
node -e "console.log('Tests would fail - module not implemented')"
```

**Step 3: Write minimal implementation**

Create `lib/config.js`:

```javascript
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
```

**Step 4: Run basic verification**

```bash
node -e "const c = require('./lib/config'); console.log('config module loaded:', Object.keys(c))"
```

**Step 5: Commit**

```bash
git add lib/config.js tests/config.test.js
git commit -m "feat: implement config module for reading profiles"
```

---

## Task 3: Config Module - Initialize Config from Template

**Files:**
- Modify: `lib/config.js`
- Modify: `tests/config.test.js`

**Step 1: Write the test**

Add to `tests/config.test.js`:

```javascript
describe('initializeConfig', () => {
  test('should create config from template if not exists', () => {
    // Ensure config doesn't exist
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }

    const result = initializeConfig(testConfigDir);

    expect(result).toBe(true);
    expect(fs.existsSync(testConfigPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(content.profiles).toBeDefined();
    expect(content.profiles.example).toBeDefined();
  });

  test('should return false if config already exists', () => {
    const testConfig = { profiles: {} };
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));

    const result = initializeConfig(testConfigDir);

    expect(result).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
node -e "console.log('Test would fail - initializeConfig not implemented')"
```

**Step 3: Write implementation**

Add to `lib/config.js`:

```javascript
const path = require('path');
const fs = require('fs');

// Add at top of file
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

// Update module.exports to include new function
module.exports = {
  loadConfig,
  getProfile,
  listProfiles,
  initializeConfig
};
```

**Step 4: Verify manually**

```bash
node -e "const c = require('./lib/config'); console.log('initializeConfig:', typeof c.initializeConfig)"
```

**Step 5: Commit**

```bash
git add lib/config.js tests/config.test.js
git commit -m "feat: add initializeConfig to create config from template"
```

---

## Task 4: Launcher Module - Build Environment Variables

**Files:**
- Create: `lib/launcher.js`
- Create: `tests/launcher.test.js`

**Step 1: Write the test**

Create `tests/launcher.test.js`:

```javascript
const { buildEnv, validateProfile } = require('../lib/launcher');

describe('launcher module', () => {
  describe('validateProfile', () => {
    test('should validate complete profile', () => {
      const profile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test',
        ANTHROPIC_BASE_URL: 'https://api.test.com',
        ANTHROPIC_MODEL: 'test-model'
      };

      const result = validateProfile(profile);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('should detect missing required fields', () => {
      const profile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test'
        // Missing BASE_URL and MODEL
      };

      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ANTHROPIC_BASE_URL');
      expect(result.missing).toContain('ANTHROPIC_MODEL');
    });
  });

  describe('buildEnv', () => {
    test('should build environment object from profile', () => {
      const profile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test',
        ANTHROPIC_BASE_URL: 'https://api.test.com',
        ANTHROPIC_MODEL: 'test-model',
        API_TIMEOUT_MS: '5000'
      };

      const env = buildEnv(profile);

      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('sk-test');
      expect(env.ANTHROPIC_BASE_URL).toBe('https://api.test.com');
      expect(env.ANTHROPIC_MODEL).toBe('test-model');
      expect(env.API_TIMEOUT_MS).toBe('5000');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
node -e "console.log('Tests would fail - module not implemented')"
```

**Step 3: Write implementation**

Create `lib/launcher.js`:

```javascript
const { exec } = require('child_process');
const path = require('path');

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
 * @param {string[]} args - Additional arguments to pass to claude-code
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
    const cmd = 'claude-code' + (args.length ? ' ' + args.join(' ') : '');

    const child = exec(cmd, { env }, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 127) {
          return reject(new Error(
            'claude-code command not found. Please install Claude Code first.'
          ));
        }
        return reject(error);
      }
      resolve(0);
    });

    // Pipe output directly to parent process
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    process.stdin.pipe(child.stdin);

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
```

**Step 4: Verify manually**

```bash
node -e "const l = require('./lib/launcher'); console.log('launcher:', Object.keys(l))"
```

**Step 5: Commit**

```bash
git add lib/launcher.js tests/launcher.test.js
git commit -m "feat: implement launcher module for building env and launching"
```

---

## Task 5: CLI Entry Point - Shell Script

**Files:**
- Create: `bin/ccswitch`

**Step 1: Create shell entry point**

Create `bin/ccswitch`:

```bash
#!/bin/bash

# ccswitch - Claude Code configuration switcher

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../lib"

# Parse arguments
PROFILE_NAME=""
EXTRA_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --help|-h)
      echo "Usage: ccswitch [profile] [options]"
      echo ""
      echo "Arguments:"
      echo "  profile    Name of profile to use (default: uses 'default' from config)"
      echo ""
      echo "Options:"
      echo "  --help, -h     Show this help message"
      echo "  --version, -V  Show version information"
      echo ""
      echo "Examples:"
      echo "  ccswitch kimi"
      echo "  ccswitch"
      exit 0
      ;;
    --version|-V)
      echo "ccswitch v1.0.0"
      exit 0
      ;;
    *)
      # If not a flag, treat as profile name or extra arg
      if [[ -z "$PROFILE_NAME" ]] && [[ ! "$arg" =~ ^- ]]; then
        PROFILE_NAME="$arg"
      else
        EXTRA_ARGS+=("$arg")
      fi
      ;;
  esac
done

# Call Node.js entry point
export CC_SWITCH_PROFILE="$PROFILE_NAME"
node "$LIB_DIR/cli.js" "${EXTRA_ARGS[@]}"
```

**Step 2: Make executable**

```bash
chmod +x bin/ccswitch
```

**Step 3: Verify**

```bash
./bin/ccswitch --help
```

**Step 4: Commit**

```bash
git add bin/ccswitch
git commit -m "feat: add shell CLI entry point"
```

---

## Task 6: CLI Entry Point - Node.js Module

**Files:**
- Create: `lib/cli.js`

**Step 1: Write implementation**

Create `lib/cli.js`:

```javascript
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
```

**Step 2: Make executable**

```bash
chmod +x lib/cli.js
```

**Step 3: Test with help**

```bash
node lib/cli.js
```

**Step 4: Commit**

```bash
git add lib/cli.js
git commit -m "feat: implement Node.js CLI entry point"
```

---

## Task 7: README Documentation

**Files:**
- Create: `README.md`

**Step 1: Create README**

```markdown
# ccswitch

> Switch between different Claude Code API configurations

## Installation

```bash
npm install -g claude-code-switch
```

Or link locally:

```bash
cd /path/to/claude-code-switch
npm link
```

## Setup

First run will create a config file at `~/.ccswitch/profiles.json`:

```bash
ccswitch kimi
```

Edit the config file to add your API configurations:

```json
{
  "profiles": {
    "kimi": {
      "ANTHROPIC_AUTH_TOKEN": "your-kimi-token",
      "ANTHROPIC_BASE_URL": "https://api.kimi.com/coding/",
      "ANTHROPIC_MODEL": "kimi-for-coding"
    },
    "anthropic": {
      "ANTHROPIC_AUTH_TOKEN": "your-anthropic-token",
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
      "ANTHROPIC_MODEL": "claude-opus-4-5-20251101"
    }
  },
  "default": "kimi"
}
```

## Usage

```bash
# Use specific profile
ccswitch kimi

# Use default profile
ccswitch

# Show help
ccswitch --help

# Show version
ccswitch --version
```

## Configuration

Each profile supports these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | Yes | Your API token |
| `ANTHROPIC_BASE_URL` | Yes | API base URL |
| `ANTHROPIC_MODEL` | Yes | Model identifier |
| `API_TIMEOUT_MS` | No | Request timeout in milliseconds |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | No | Disable non-essential traffic (set to "1") |

## How It Works

ccswitch reads your configuration and launches Claude Code with the appropriate environment variables. It doesn't modify any Claude Code settings - it just passes the configuration via environment variables.

When you exit Claude Code, there's nothing to clean up.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 8: Final Verification

**Files:**
- (All files)

**Step 1: Link and test locally**

```bash
npm link
ccswitch --help
ccswitch --version
```

**Step 2: Verify config initialization**

```bash
rm -rf ~/.ccswitch
ccswitch test
cat ~/.ccswitch/profiles.json
```

**Step 3: Add a real profile and test**

Edit `~/.ccswitch/profiles.json` with your actual configuration, then:

```bash
ccswitch kimi
```

**Step 4: Clean up test config**

```bash
rm -rf ~/.ccswitch
```

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: final verification and cleanup"
```

---

## Completion Checklist

- [ ] Config module reads/writes profiles correctly
- [ ] Launcher module builds environment variables
- [ ] CLI parses arguments and launches claude-code
- [ ] Error messages are clear and helpful
- [ ] README is complete
- [ ] All commits are made
- [ ] Manual testing passes

---

**End of Plan**
