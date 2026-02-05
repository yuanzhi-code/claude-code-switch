# ccswitch 优化计划 - Phase 1: 配置管理增强（更新版）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 ccswitch 添加配置管理命令（list/add/delete/set-default），增强用户体验

**Architecture:**
- 纯 Node.js 实现（已使用 bin/ccswitch.js 作为入口点）
- 配置管理：扩展 CLI 支持子命令（list/add/delete/set-default）
- 向后兼容：保持原有 `ccswitch <profile>` 用法不变

**Tech Stack:** Node.js (CommonJS), existing codebase

---

## Task 1: 添加 --list 命令

**Files:**
- Modify: `lib/cli.js:50-63`

**Step 1: 在 main 函数开头添加 list 命令处理**

修改 `lib/cli.js`，在 main 函数中 version 检查之后添加 list 处理：

```javascript
async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Check for version flag
  if (args.includes('--version') || args.includes('-V')) {
    showVersion();
    process.exit(0);
  }

  // Check for list command
  if (args.includes('--list') || args.includes('-l')) {
    let config = loadConfig(CONFIG_DIR);

    if (!config) {
      console.log('No configuration file found.');
      console.log(`Run ccswitch once to create: ${CONFIG_FILE}`);
      return;
    }

    const profiles = listProfiles(config);
    const defaultName = config.default || '';

    console.log('Available profiles:');
    console.log('');

    if (profiles.length === 0) {
      console.log('  (no profiles configured)');
    } else {
      for (const name of profiles) {
        const isDefault = name === defaultName ? ' (default)' : '';
        console.log(`  ${name}${isDefault}`);
      }
    }
    console.log('');
    console.log(`Config file: ${CONFIG_FILE}`);
    process.exit(0);
  }

  // ... rest of existing code
}
```

**Step 2: 更新 showHelp 函数**

修改 `lib/cli.js:25-38` 的 showHelp 函数：

```javascript
function showHelp() {
  console.log('Usage: ccswitch [profile] [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  profile    Name of profile to use (default: uses \'default\' from config)');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h       Show this help message');
  console.log('  --version, -V    Show version information');
  console.log('  --list, -l       List all available profiles');
  console.log('');
  console.log('Examples:');
  console.log('  ccswitch kimi');
  console.log('  ccswitch');
  console.log('  ccswitch --list');
}
```

**Step 3: 测试 list 命令**

```bash
npm link
ccswitch --list
```

**Step 4: Commit**

```bash
git add lib/cli.js
git commit -m "feat: add --list command to show all profiles"
```

---

## Task 2: 添加 add 命令（交互式添加配置）

**Files:**
- Modify: `lib/config.js`
- Modify: `lib/cli.js`
- Create: `lib/add.js`
- Create: `tests/add.test.js`

**Step 1: 在 config.js 中添加 addProfile 函数**

在 `lib/config.js:88` 之前添加函数：

```javascript
/**
 * Add a new profile to config
 * @param {string} configDir - Path to config directory
 * @param {string} name - Profile name
 * @param {object} profile - Profile object
 * @returns {boolean} True if added successfully
 */
function addProfile(configDir, name, profile) {
  const configPath = path.join(configDir, 'profiles.json');

  // Load existing config or create new
  let config = loadConfig(configDir);
  if (!config) {
    // Create new config
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    config = { profiles: {}, default: '' };
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
}
```

更新 `lib/config.js:83-88` 的 module.exports：

```javascript
module.exports = {
  loadConfig,
  getProfile,
  listProfiles,
  initializeConfig,
  addProfile
};
```

**Step 2: 创建 add.js 模块**

创建 `lib/add.js`：

```javascript
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
```

**Step 3: 在 CLI 中集成 add 命令**

在 `lib/cli.js:5` 添加导入：

```javascript
const { loadConfig, getProfile, listProfiles, initializeConfig } = require('./config');
const { launch, validateProfile } = require('./launcher');
const { addProfileInteractive } = require('./add');
```

在 `lib/cli.js` 的 main 函数中，list 处理之后添加：

```javascript
  // Check for list command
  if (args.includes('--list') || args.includes('-l')) {
    // ... existing list code ...
  }

  // Check for add command: ccswitch add <name>
  if (args[0] === 'add' && args[1]) {
    const profileName = args[1];
    await addProfileInteractive(CONFIG_DIR, profileName);
    return;
  }

  // ... rest of existing code ...
```

**Step 4: 创建测试文件**

创建 `tests/add.test.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { addProfile } = require('../lib/config');

describe('addProfile', () => {
  const testConfigDir = '/tmp/ccswitch-add-test';
  const testConfigPath = path.join(testConfigDir, 'profiles.json');

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  test('should add profile to new config', () => {
    const profile = {
      ANTHROPIC_AUTH_TOKEN: 'sk-test',
      ANTHROPIC_BASE_URL: 'https://api.test.com',
      ANTHROPIC_MODEL: 'test-model'
    };

    const result = addProfile(testConfigDir, 'test', profile);

    expect(result).toBe(true);
    expect(fs.existsSync(testConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(config.profiles.test).toEqual(profile);
    expect(config.default).toBe('test');
  });

  test('should set first profile as default', () => {
    const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };

    addProfile(testConfigDir, 'first', profile);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(config.default).toBe('first');
  });

  test('should not change default when adding second profile', () => {
    const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };

    addProfile(testConfigDir, 'first', profile);
    addProfile(testConfigDir, 'second', profile);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(config.default).toBe('first');
    expect(config.profiles.second).toBeDefined();
  });
});
```

**Step 5: 运行测试**

```bash
npm test
```

**Step 6: Commit**

```bash
git add lib/config.js lib/add.js lib/cli.js tests/add.test.js
git commit -m "feat: add interactive 'add' command for creating profiles"
```

---

## Task 3: 添加 delete 和 set-default 命令

**Files:**
- Modify: `lib/config.js`
- Modify: `lib/cli.js`
- Create: `tests/config-management.test.js`

**Step 1: 在 config.js 中添加 deleteProfile 和 setDefault 函数**

在 `lib/config.js` 中 addProfile 函数后添加：

```javascript
/**
 * Delete a profile from config
 * @param {string} configDir - Path to config directory
 * @param {string} name - Profile name to delete
 * @returns {boolean} True if deleted, false if not found
 */
function deleteProfile(configDir, name) {
  const configPath = path.join(configDir, 'profiles.json');
  const config = loadConfig(configDir);

  if (!config || !config.profiles[name]) {
    return false;
  }

  delete config.profiles[name];

  // If deleted profile was default, clear default or pick another
  if (config.default === name) {
    const remaining = Object.keys(config.profiles);
    config.default = remaining.length > 0 ? remaining[0] : '';
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}

/**
 * Set default profile
 * @param {string} configDir - Path to config directory
 * @param {string} name - Profile name to set as default
 * @returns {boolean} True if set, false if not found
 */
function setDefault(configDir, name) {
  const configPath = path.join(configDir, 'profiles.json');
  const config = loadConfig(configDir);

  if (!config || !config.profiles[name]) {
    return false;
  }

  config.default = name;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
}
```

更新 module.exports：

```javascript
module.exports = {
  loadConfig,
  getProfile,
  listProfiles,
  initializeConfig,
  addProfile,
  deleteProfile,
  setDefault
};
```

**Step 2: 在 CLI 中添加命令处理**

在 `lib/cli.js` 的 main 函数中，add 处理之后添加：

```javascript
  // Check for add command: ccswitch add <name>
  if (args[0] === 'add' && args[1]) {
    const profileName = args[1];
    await addProfileInteractive(CONFIG_DIR, profileName);
    return;
  }

  // Check for delete command: ccswitch delete <name>
  if (args[0] === 'delete' && args[1]) {
    const profileName = args[1];
    const { deleteProfile } = require('./config');

    if (deleteProfile(CONFIG_DIR, profileName)) {
      console.log(`✓ Profile "${profileName}" deleted.`);
      const config = loadConfig(CONFIG_DIR);
      if (config.default) {
        console.log(`  Default is now: ${config.default}`);
      }
    } else {
      console.error(`✗ Profile "${profileName}" not found.`);
      process.exit(1);
    }
    return;
  }

  // Check for set-default command: ccswitch set-default <name>
  if (args[0] === 'set-default' && args[1]) {
    const profileName = args[1];
    const { setDefault } = require('./config');

    if (setDefault(CONFIG_DIR, profileName)) {
      console.log(`✓ Default profile set to "${profileName}".`);
    } else {
      console.error(`✗ Profile "${profileName}" not found.`);
      process.exit(1);
    }
    return;
  }

  // ... rest of existing code ...
```

**Step 3: 更新 showHelp 函数**

更新 `lib/cli.js:25-38` 的 showHelp 函数：

```javascript
function showHelp() {
  console.log('Usage: ccswitch [profile] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  ccswitch <name>        Launch Claude Code with specified profile');
  console.log('  ccswitch               Launch Claude Code with default profile');
  console.log('  ccswitch add <name>    Interactively add a new profile');
  console.log('  ccswitch delete <name> Delete a profile');
  console.log('  ccswitch set-default <name>  Set the default profile');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h       Show this help message');
  console.log('  --version, -V    Show version information');
  console.log('  --list, -l       List all available profiles');
  console.log('');
  console.log('Examples:');
  console.log('  ccswitch kimi');
  console.log('  ccswitch --list');
  console.log('  ccswitch add my-profile');
}
```

**Step 4: 创建测试**

创建 `tests/config-management.test.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { deleteProfile, setDefault, addProfile } = require('../lib/config');

describe('config management', () => {
  const testConfigDir = '/tmp/ccswitch-mgmt-test';
  const testConfigPath = path.join(testConfigDir, 'profiles.json');

  beforeEach(() => {
    // Clean up
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('deleteProfile', () => {
    test('should delete existing profile', () => {
      const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };
      addProfile(testConfigDir, 'test', profile);

      const result = deleteProfile(testConfigDir, 'test');

      expect(result).toBe(true);
      const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      expect(config.profiles.test).toBeUndefined();
    });

    test('should return false for non-existent profile', () => {
      const result = deleteProfile(testConfigDir, 'nonexistent');
      expect(result).toBe(false);
    });

    test('should update default when deleting default profile', () => {
      const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };
      addProfile(testConfigDir, 'first', profile);
      addProfile(testConfigDir, 'second', profile);

      deleteProfile(testConfigDir, 'first');

      const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      expect(config.default).toBe('second');
    });
  });

  describe('setDefault', () => {
    test('should set existing profile as default', () => {
      const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };
      addProfile(testConfigDir, 'test', profile);

      const result = setDefault(testConfigDir, 'test');

      expect(result).toBe(true);
      const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      expect(config.default).toBe('test');
    });

    test('should return false for non-existent profile', () => {
      const result = setDefault(testConfigDir, 'nonexistent');
      expect(result).toBe(false);
    });
  });
});
```

**Step 5: 运行测试**

```bash
npm test
```

**Step 6: 手动测试命令**

```bash
ccswitch add temp-test
# 按提示输入信息
ccswitch set-default temp-test
ccswitch --list
ccswitch delete temp-test
ccswitch --list
```

**Step 7: Commit**

```bash
git add lib/config.js lib/cli.js tests/config-management.test.js
git commit -m "feat: add delete and set-default commands"
```

---

## Task 4: 更新 README 文档

**Files:**
- Modify: `README.md`

**Step 1: 更新 README 添加新命令说明**

在 README.md 中添加新的用法说明：

```markdown
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

# List all profiles
ccswitch --list
ccswitch -l

# Add a new profile (interactive)
ccswitch add my-profile

# Delete a profile
ccswitch delete my-profile

# Set default profile
ccswitch set-default my-profile
```

## Commands

| Command | Description |
|---------|-------------|
| `ccswitch <name>` | Launch Claude Code with specified profile |
| `ccswitch` | Launch Claude Code with default profile |
| `ccswitch --list` | List all configured profiles |
| `ccswitch add <name>` | Interactively add a new profile |
| `ccswitch delete <name>` | Delete a profile |
| `ccswitch set-default <name>` | Set the default profile |
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with new commands"
```

---

## Task 5: 更新 package.json 版本

**Files:**
- Modify: `package.json`

**Step 1: 更新版本号**

```json
{
  "name": "claude-code-switch",
  "version": "1.1.0",
  ...
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 1.1.0"
```

---

## Task 6: 最终验证

**Files:**
- (All files)

**Step 1: 运行所有测试**

```bash
npm test
```

**Step 2: 手动测试所有命令**

```bash
# List profiles
ccswitch --list

# Add a profile
ccswitch add test-profile
# 输入: sk-test-token, https://api.test.com, test-model

# Set as default
ccswitch set-default test-profile

# List again to verify
ccswitch --list

# Delete
ccswitch delete test-profile

# Launch with profile (if you have real config)
ccswitch kimi
```

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: phase 1 optimization complete"
```

---

## 完成检查清单

- [ ] `--list` 命令可用
- [ ] `add` 命令支持交互式添加配置
- [ ] `delete` 命令可用
- [ ] `set-default` 命令可用
- [ ] README 已更新
- [ ] 所有测试通过
- [ ] 版本号已更新

---

**Phase 1 完成后可能的 Phase 2 优化方向：**
- 彩色输出（使用 chalk）
- 更好的错误处理和提示
- 配置文件迁移/版本管理
- 配置文件加密支持
- TypeScript 迁移

**End of Plan**
