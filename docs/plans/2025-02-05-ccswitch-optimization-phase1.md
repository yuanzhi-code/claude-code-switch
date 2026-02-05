# ccswitch 优化计划 - Phase 1: 跨平台支持与配置管理增强

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 ccswitch 添加 Windows 支持和配置管理命令（list/add/delete/set-default）

**Architecture:**
- Windows 支持：添加 `.cmd` 批处理文件作为入口点
- 配置管理：扩展 CLI 支持子命令（list/add/delete/set-default）
- 向后兼容：保持原有 `ccswitch <profile>` 用法不变

**Tech Stack:** Node.js (CommonJS), batch scripting (Windows), existing codebase

---

## Task 1: 添加 Windows 支持

**Files:**
- Create: `bin/ccswitch.cmd`
- Modify: `package.json`

**Step 1: 创建 Windows 批处理入口点**

创建 `bin/ccswitch.cmd`:

```batch
@echo off
REM ccswitch - Claude Code configuration switcher (Windows)

setlocal

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "LIB_DIR=%SCRIPT_DIR%lib"

REM Parse arguments
set "PROFILE_NAME="
set "EXTRA_ARGS="

:parse_args
if "%~1"=="" goto done_parsing
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
if "%~1"=="--version" goto show_version
if "%~1"=="-V" goto show_version
if "%~1"=="--list" goto set_list_cmd
if "%~1"=="-l" goto set_list_cmd
if "%~1"=="list" goto set_list_cmd

REM Check if it's a flag (starts with -)
if "%~1"=~-* (
   REM It's a flag, add to extra args
    set "EXTRA_ARGS=%EXTRA_ARGS% %~1"
    shift
    goto parse_args
)

REM First non-flag argument is the profile name
if "%PROFILE_NAME%"=="" (
    set "PROFILE_NAME=%~1"
) else (
    set "EXTRA_ARGS=%EXTRA_ARGS% %~1"
)
shift
goto parse_args

:set_list_cmd
set "EXTRA_ARGS=%EXTRA_ARGS% --list"
shift
goto parse_args

:show_help
echo Usage: ccswitch [profile] [options]
echo.
echo Arguments:
echo   profile    Name of profile to use (default: uses 'default' from config)
echo.
echo Options:
echo   --help, -h       Show this help message
echo   --version, -V    Show version information
echo   --list, -l       List all available profiles
echo.
echo Examples:
echo   ccswitch kimi
echo   ccswitch
echo   ccswitch --list
exit /b 0

:show_version
echo ccswitch v1.0.0
exit /b 0

:done_parsing
REM Set environment variable for Node.js
set "CC_SWITCH_PROFILE=%PROFILE_NAME%"

REM Call Node.js entry point
node "%LIB_DIR%\cli.js" %EXTRA_ARGS%
```

**Step 2: 验证语法**

在 Windows 环境下测试（或在 macOS 上创建文件）:
```bash
# 创建文件
cat > bin/ccswitch.cmd << 'EOF'
[上面的内容]
EOF
```

**Step 3: Commit**

```bash
git add bin/ccswitch.cmd
git commit -m "feat: add Windows support via .cmd batch file"
```

---

## Task 2: 扩展 CLI 支持配置管理命令

**Files:**
- Modify: `lib/cli.js`
- Modify: `bin/ccswitch`
- Modify: `bin/ccswitch.cmd`

**Step 1: 更新 shell 脚本支持 list 命令**

修改 `bin/ccswitch`:

```bash
#!/bin/bash

# ccswitch - Claude Code configuration switcher

# Get the directory where this script is located and resolve symlinks
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
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
      echo "  --help, -h       Show this help message"
      echo "  --version, -V    Show version information"
      echo "  --list, -l       List all available profiles"
      echo ""
      echo "Examples:"
      echo "  ccswitch kimi"
      echo "  ccswitch"
      echo "  ccswitch --list"
      exit 0
      ;;
    --version|-V)
      echo "ccswitch v1.0.0"
      exit 0
      ;;
    --list|-l)
      EXTRA_ARGS+=("--list")
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

**Step 2: 扩展 Node.js CLI 支持 list 命令**

修改 `lib/cli.js`，在 main 函数开头添加 list 命令处理:

```javascript
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

  // Check for list command
  if (args.includes('--list') || args.includes('-l')) {
    const CONFIG_DIR = path.join(os.homedir(), '.ccswitch');
    const CONFIG_FILE = path.join(CONFIG_DIR, 'profiles.json');

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
    return;
  }

  // ... rest of existing code
}
```

**Step 3: 测试 list 命令**

```bash
npm link
ccswitch --list
```

**Step 4: Commit**

```bash
git add lib/cli.js bin/ccswitch
git commit -m "feat: add --list command to show all profiles"
```

---

## Task 3: 添加 add 命令用于交互式添加配置

**Files:**
- Modify: `lib/config.js`
- Modify: `lib/cli.js`
- Create: `lib/add.js`
- Modify: `bin/ccswitch`
- Modify: `bin/ccswitch.cmd`
- Create: `tests/add.test.js`

**Step 1: 在 config.js 中添加 addProfile 函数**

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

module.exports = {
  loadConfig,
  getProfile,
  listProfiles,
  initializeConfig,
  addProfile
};
```

**Step 2: 创建 add.js 模块处理交互式输入**

创建 `lib/add.js`:

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

修改 `lib/cli.js`:

```javascript
const { loadConfig, getProfile, listProfiles, initializeConfig } = require('./config');
const { launch, validateProfile } = require('./launcher');
const { addProfileInteractive } = require('./add');

async function main() {
  const args = process.argv.slice(2);

  // ... existing help/version/list handling ...

  // Check for add command: ccswitch add <name>
  if (args[0] === 'add' && args[1]) {
    const profileName = args[1];
    await addProfileInteractive(CONFIG_DIR, profileName);
    return;
  }

  // ... rest of existing code ...
}
```

**Step 4: 更新 shell 脚本支持 add**

在 `bin/ccswitch` 的参数解析中添加:

```bash
    --list|-l)
      EXTRA_ARGS+=("--list")
      ;;
    add)
      # Pass through to Node.js
      EXTRA_ARGS+=("add")
      ;;
    *)
```

**Step 5: 测试 add 命令**

```bash
ccswitch add test-profile
# 按提示输入信息
ccswitch --list
```

**Step 6: Commit**

```bash
git add lib/config.js lib/add.js lib/cli.js bin/ccswitch tests/add.test.js
git commit -m "feat: add interactive 'add' command for creating profiles"
```

---

## Task 4: 添加 delete 和 set-default 命令

**Files:**
- Modify: `lib/config.js`
- Modify: `lib/cli.js`
- Modify: `bin/ccswitch`
- Modify: `bin/ccswitch.cmd`

**Step 1: 在 config.js 中添加 deleteProfile 和 setDefault 函数**

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

修改 `lib/cli.js`:

```javascript
async function main() {
  const args = process.argv.slice(2);

  // ... existing flags ...

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
}
```

**Step 3: 更新 shell 脚本**

在 `bin/ccswitch` 中添加:

```bash
    --list|-l)
      EXTRA_ARGS+=("--list")
      ;;
    add|delete|set-default)
      EXTRA_ARGS+=("$1")
      ;;
    *)
```

**Step 4: 测试命令**

```bash
ccswitch add temp-test
ccswitch set-default temp-test
ccswitch --list
ccswitch delete temp-test
ccswitch --list
```

**Step 5: Commit**

```bash
git add lib/config.js lib/cli.js bin/ccswitch
git commit -m "feat: add delete and set-default commands"
```

---

## Task 5: 更新 README 文档

**Files:**
- Modify: `README.md`

**Step 1: 更新 README 添加新命令说明**

在 README.md 中添加新的用法说明:

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

## Task 6: 更新 package.json 版本

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

## Task 7: 最终验证

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

# Set as default
ccswitch set-default test-profile

# List again to verify
ccswitch --list

# Delete
ccswitch delete test-profile

# Launch with profile
ccswitch kimi
```

**Step 3: 更新 .cmd 文件支持新命令**

确保 `bin/ccswitch.cmd` 支持所有新命令（add/delete/set-default）。

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: phase 1 optimization complete"
```

---

## 完成检查清单

- [ ] Windows 支持（.cmd 文件）已添加
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
