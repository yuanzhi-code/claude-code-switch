# ccswitch Phase 2: 用户体验提升实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 ccswitch 添加彩色输出和更友好的错误提示，提升用户体验

**Architecture:**
- 创建统一的 UI 模块 (`lib/ui.js`) 管理所有输出
- 使用 chalk 库实现彩色输出
- 替换所有 console.log/console.error 为 UI 模块调用
- 增强错误消息的可读性和实用性

**Tech Stack:** Node.js (CommonJS), chalk@^5.3.0, existing codebase

---

## Task 1: 添加 chalk 依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 chalk**

```bash
npm install chalk@^5.3.0 --save
```

**Step 2: 验证安装**

```bash
cat package.json | grep chalk
```

Expected: `"chalk": "^5.3.0"` in dependencies

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add chalk for colored output"
```

---

## Task 2: 创建 UI 模块

**Files:**
- Create: `lib/ui.js`
- Create: `tests/ui.test.js`

**Step 1: 编写 UI 模块测试**

创建 `tests/ui.test.js`:

```javascript
const ui = require('../lib/ui');

describe('ui module', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('success', () => {
    test('should print success message with checkmark', () => {
      ui.success('Operation completed');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Operation completed'));
    });
  });

  describe('error', () => {
    test('should print error message with cross mark', () => {
      ui.error('Operation failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Operation failed'));
    });
  });

  describe('warning', () => {
    test('should print warning message with warning symbol', () => {
      ui.warning('Warning message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });
  });

  describe('info', () => {
    test('should print info message with info symbol', () => {
      ui.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });
  });

  describe('dim', () => {
    test('should print dimmed text', () => {
      ui.dim('Dimmed text');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('highlight', () => {
    test('should print highlighted text', () => {
      ui.highlight('Highlighted text');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm test tests/ui.test.js
```

Expected: FAIL with "Cannot find module '../lib/ui'"

**Step 3: 实现 UI 模块**

创建 `lib/ui.js`:

```javascript
const chalk = require('chalk');

/**
 * Print success message with green checkmark
 * @param {string} msg - Message to print
 */
function success(msg) {
  console.log(chalk.green('✓'), msg);
}

/**
 * Print error message with red cross mark
 * @param {string} msg - Message to print
 */
function error(msg) {
  console.error(chalk.red('✗'), msg);
}

/**
 * Print warning message with yellow warning symbol
 * @param {string} msg - Message to print
 */
function warning(msg) {
  console.log(chalk.yellow('⚠'), msg);
}

/**
 * Print info message with blue info symbol
 * @param {string} msg - Message to print
 */
function info(msg) {
  console.log(chalk.blue('ℹ'), msg);
}

/**
 * Print dimmed (gray) text
 * @param {string} msg - Message to print
 */
function dim(msg) {
  console.log(chalk.dim(msg));
}

/**
 * Print highlighted (cyan) text
 * @param {string} msg - Message to print
 */
function highlight(msg) {
  console.log(chalk.cyan(msg));
}

/**
 * Print profile name with default marker if applicable
 * @param {string} name - Profile name
 * @param {string} defaultName - Default profile name
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
```

**Step 4: 运行测试验证通过**

```bash
npm test tests/ui.test.js
```

Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add lib/ui.js tests/ui.test.js
git commit -m "feat: add UI module for colored output"
```

---

## Task 3: 更新 CLI 使用 UI 模块（成功/失败消息）

**Files:**
- Modify: `lib/cli.js`

**Step 1: 导入 UI 模块**

在 `lib/cli.js` 顶部添加导入（约第 8 行后）:

```javascript
const path = require('path');
const os = require('os');
const { loadConfig, getProfile, listProfiles, initializeConfig } = require('./config');
const { launch, validateProfile } = require('./launcher');
const { addProfileInteractive } = require('./add');
const ui = require('./ui');  // 新增
```

**Step 2: 更新 delete 命令成功消息**

找到 delete 命令的成功消息（约第 136 行）:

原代码:
```javascript
console.log(`✓ Profile "${profileName}" deleted.`);
```

改为:
```javascript
ui.success(`Profile "${profileName}" deleted.`);
```

**Step 3: 更新 delete 命令默认变更消息**

找到 delete 命令的默认变更消息（约第 138 行）:

原代码:
```javascript
console.log(`  Default is now: ${config.default}`);
```

改为:
```javascript
ui.dim(`  Default is now: ${config.default}`);
```

**Step 4: 更新 delete 命令错误消息**

找到 delete 命令的错误消息（约第 142 行）:

原代码:
```javascript
console.error(`✗ Profile "${profileName}" not found.`);
```

改为:
```javascript
ui.error(`Profile "${profileName}" not found.`);
```

**Step 5: 更新 set-default 命令成功消息**

找到 set-default 命令成功消息（约第 153 行）:

原代码:
```javascript
console.log(`✓ Default profile set to "${profileName}".`);
```

改为:
```javascript
ui.success(`Default profile set to "${profileName}".`);
```

**Step 6: 更新 set-default 命令错误消息**

找到 set-default 命令错误消息（约第 157 行）:

原代码:
```javascript
console.error(`✗ Profile "${profileName}" not found.`);
```

改为:
```javascript
ui.error(`Profile "${profileName}" not found.`);
```

**Step 7: 测试更改**

```bash
npm test
ccswitch --list  # 验证 list 命令仍正常工作
```

**Step 8: Commit**

```bash
git add lib/cli.js
git commit -m "refactor: use UI module for delete/set-default commands"
```

---

## Task 4: 更新 add.js 使用 UI 模块

**Files:**
- Modify: `lib/add.js`

**Step 1: 导入 UI 模块**

在 `lib/add.js` 顶部添加导入（约第 1 行后）:

```javascript
const readline = require('readline');
const ui = require('./ui');  // 新增
```

**Step 2: 更新成功消息**

找到成功消息（约第 60 行）:

原代码:
```javascript
console.log(`\n✓ Profile "${name}" added successfully.`);
```

改为:
```javascript
ui.success(`Profile "${name}" added successfully.`);
```

**Step 3: 移除多余的换行符**

删除成功消息前的 `\n`（因为 ui.success 会处理格式）。

**Step 4: 更新 usage 提示**

找到 usage 提示（约第 63 行）:

原代码:
```javascript
console.log(`\nYou can now use it with: ccswitch ${name}\n`);
```

改为:
```javascript
console.log('');  // 空行分隔
ui.info(`You can now use it with: ccswitch ${name}`);
```

**Step 5: 测试更改**

```bash
npm test
```

**Step 6: Commit**

```bash
git add lib/add.js
git commit -m "refactor: use UI module in add command"
```

---

## Task 5: 增强 list 命令输出（添加颜色）

**Files:**
- Modify: `lib/cli.js`

**Step 1: 更新 list 命令标题**

找到 list 命令的标题输出（约第 83 行）:

原代码:
```javascript
console.log('Available profiles:');
console.log('');
```

改为:
```javascript
ui.highlight('Available profiles:');
console.log('');
```

**Step 2: 更新空配置消息**

找到空配置消息（约第 86 行）:

原代码:
```javascript
console.log('  (no profiles configured)');
```

改为:
```javascript
ui.dim('  (no profiles configured)');
```

**Step 3: 更新 profile 列表显示**

找到 profile 循环（约第 87-91 行）:

原代码:
```javascript
for (const name of profiles) {
  const isDefault = name === defaultName ? ' (default)' : '';
  console.log(`  ${name}${isDefault}`);
}
```

改为:
```javascript
for (const name of profiles) {
  console.log(`  ${ui.formatProfileName(name, defaultName)}`);
}
```

**Step 4: 更新配置文件路径显示**

找到配置文件路径输出（约第 93 行）:

原代码:
```javascript
console.log(`Config file: ${CONFIG_FILE}`);
```

改为:
```javascript
ui.dim(`Config file: ${CONFIG_FILE}`);
```

**Step 5: 测试更改**

```bash
npm test
ccswitch --list
```

**Step 6: Commit**

```bash
git add lib/cli.js
git commit -m "feat: enhance list command with colored output"
```

---

## Task 6: 增强错误提示（配置文件不存在）

**Files:**
- Modify: `lib/cli.js`

**Step 1: 更新配置文件不存在提示**

找到配置文件不存在的处理（约第 116-122 行）:

原代码:
```javascript
if (!config) {
  console.error(`Config file not found: ${CONFIG_FILE}`);
  console.error('');
  console.error('Please edit the config file to add your API configurations:');
  console.error('');
  console.error('  ' + CONFIG_FILE);
  console.error('');
  fatalError('Edit the config file and try again.', 1);
}
```

改为:
```javascript
if (!config) {
  ui.error(`Config file not found: ${CONFIG_FILE}`);
  console.log('');
  ui.info('Initializing default config...');
  const initialized = initializeConfig(CONFIG_DIR);

  if (initialized) {
    ui.success(`Created default config at: ${CONFIG_FILE}`);
    console.log('');
    ui.dim('Please edit the config file to add your API configurations.');
    console.log('');
    ui.highlight(`  ${CONFIG_FILE}`);
    console.log('');
    ui.warning('Edit the config file and try again.');
    process.exit(1);
  }

  fatalError('Failed to create config file.', 1);
}
```

**Step 2: 测试更改**

```bash
# 备份现有配置
mv ~/.ccswitch/profiles.json ~/.ccswitch/profiles.json.backup 2>/dev/null || true

# 测试
ccswitch --list

# 恢复配置
mv ~/.ccswitch/profiles.json.backup ~/.ccswitch/profiles.json 2>/dev/null || true
```

**Step 3: Commit**

```bash
git add lib/cli.js
git commit -m "feat: improve config not found error message"
```

---

## Task 7: 增强错误提示（Profile 不存在）

**Files:**
- Modify: `lib/cli.js`

**Step 1: 更新 profile 不存在提示**

找到 profile 不存在的处理（约第 131-145 行）:

原代码:
```javascript
if (!profile) {
  const available = listProfiles(config);
  const defaultName = config.default || '(no default set)';

  if (available.length === 0) {
    fatalError('No profiles found in config file.', 1);
  }

  console.error(`Profile not found: ${profileName || defaultName}`);
  console.error('');
  console.error('Available profiles:');
  for (const name of available) {
    const isDefault = config.default && name === config.default ? ' (default)' : '';
    console.error(`  - ${name}${isDefault}`);
  }
  console.error('');

  fatalError(`Please specify a valid profile.`, 1);
}
```

改为:
```javascript
if (!profile) {
  const available = listProfiles(config);
  const requestedName = profileName || config.default || '(no default set)';

  if (available.length === 0) {
    ui.warning('No profiles found in config file.');
    ui.info('Use "ccswitch add <name>" to create a profile.');
    process.exit(1);
  }

  ui.error(`Profile not found: ${requestedName}`);
  console.log('');
  ui.info('Available profiles:');
  for (const name of available) {
    console.log(`  ${ui.formatProfileName(name, config.default || '')}`);
  }
  console.log('');

  // 检查相似名称
  const similarity = available.find(name =>
    name.toLowerCase() === requestedName.toLowerCase() ||
    name.includes(requestedName) ||
    requestedName.includes(name)
  );

  if (similarity) {
    ui.warning(`Did you mean: ${similarity}?`);
  }

  process.exit(1);
}
```

**Step 2: 测试更改**

```bash
npm test
ccswitch nonexistent-profile
```

**Step 3: Commit**

```bash
git add lib/cli.js
git commit -m "feat: improve profile not found error message"
```

---

## Task 8: 增强错误提示（缺少必需字段）

**Files:**
- Modify: `lib/cli.js`

**Step 1: 更新缺少字段提示**

找到缺少字段的处理（约第 149-154 行）:

原代码:
```javascript
if (!validation.valid) {
  fatalError(
    `Profile "${profileName || config.default}" is missing required fields: ${validation.missing.join(', ')}`,
    1
  );
}
```

改为:
```javascript
if (!validation.valid) {
  ui.error(`Profile "${profileName || config.default}" is missing required fields:`);
  console.log('');
  for (const field of validation.missing) {
    ui.dim(`  - ${field}`);
  }
  console.log('');
  ui.info(`Required fields: ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL`);
  console.log('');
  ui.warning(`Please update the profile or use "ccswitch add <name>" to create a new one.`);
  process.exit(1);
}
```

**Step 2: 测试更改**

```bash
# 创建一个缺少字段的测试配置
# 然后运行 ccswitch 使用它
npm test
```

**Step 3: Commit**

```bash
git add lib/cli.js
git commit -m "feat: improve missing fields error message"
```

---

## Task 9: 更新 config.js 中的错误处理使用 UI 模块

**Files:**
- Modify: `lib/config.js`

**Step 1: 导入 UI 模块**

在 `lib/config.js` 顶部添加导入（约第 2 行后）:

```javascript
const fs = require('fs');
const path = require('path');
const ui = require('./ui');  // 新增
```

**Step 2: 更新 JSON 解析错误**

找到 JSON 解析错误的处理（约第 43-47 行）:

原代码:
```javascript
} catch (error) {
  throw new Error(`Failed to parse config file: ${error.message}`);
}
```

改为:
```javascript
} catch (error) {
  ui.error(`Failed to parse config file: ${error.message}`);
  ui.info('Check that the file is valid JSON format.');
  throw error;  // 重新抛出以便调用者处理
}
```

**注意:** 由于 config.js 是底层模块，这里需要谨慎使用 ui。JSON 解析错误应该保持抛出异常，但添加友好的消息。

**Step 3: 测试更改**

```bash
npm test
```

**Step 4: Commit**

```bash
git add lib/config.js
git commit -m "feat: improve JSON parse error message"
```

---

## Task 10: 更新 launcher.js 中的错误消息

**Files:**
- Modify: `lib/launcher.js`

**Step 1: 导入 UI 模块**

在 `lib/launcher.js` 顶部添加导入（约第 4 行后）:

```javascript
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const ui = require('./ui');  // 新增
```

**Step 2: 更新验证失败错误消息**

找到验证失败的处理（约第 56-60 行）:

原代码:
```javascript
if (!validation.valid) {
  return reject(new Error(
    `Missing required environment variables: ${validation.missing.join(', ')}`
  ));
}
```

改为:
```javascript
if (!validation.valid) {
  ui.error('Missing required environment variables:');
  for (const field of validation.missing) {
    ui.dim(`  - ${field}`);
  }
  return reject(new Error(
    `Missing required environment variables: ${validation.missing.join(', ')}`
  ));
}
```

**Step 3: 更新命令未找到错误消息**

找到命令未找到的处理（约第 77-81 行）:

原代码:
```javascript
if (error.code === 'ENOENT') {
  return reject(new Error(
    'claude command not found. Please install Claude Code first.'
  ));
}
```

改为:
```javascript
if (error.code === 'ENOENT') {
  ui.error('claude command not found.');
  ui.info('Please install Claude Code first:');
  ui.dim('  npm install -g @anthropic-ai/claude-code');
  ui.dim('  or visit: https://claude.ai/download');
  return reject(new Error(
    'claude command not found. Please install Claude Code first.'
  ));
}
```

**Step 4: 测试更改**

```bash
npm test
```

**Step 5: Commit**

```bash
git add lib/launcher.js
git commit -m "feat: improve launcher error messages"
```

---

## Task 11: 更新 add.js 中的错误提示

**Files:**
- Modify: `lib/add.js`

**Step 1: 更新 profile 名称验证错误消息**

找到 profile 名称验证（约第 59-62 行）:

原代码:
```javascript
if (!profileName || profileName.trim() === '') {
  console.error('✗ Profile name cannot be empty.');
  process.exit(1);
}
```

改为:
```javascript
if (!profileName || profileName.trim() === '') {
  ui.error('Profile name cannot be empty.');
  ui.info('Usage: ccswitch add <profile-name>');
  process.exit(1);
}
```

**Step 2: 更新无效 token 错误消息**

找到无效 token 处理（约第 77-81 行）:

原代码:
```javascript
ui.error('Invalid API token format.');
ui.info('API tokens must start with "sk-ant-"');
console.log('');  // 保持空行
continue;
```

这部分已经使用了 ui 模块，保持不变。

**Step 3: 更新 addProfile 错误处理**

找到 addProfile 错误处理（约第 115-121 行）:

原代码:
```javascript
} catch (error) {
  console.error('✗ Failed to add profile:');
  console.error(`  ${error.message}`);
  process.exit(1);
}
```

改为:
```javascript
} catch (error) {
  ui.error('Failed to add profile:');
  ui.dim(`  ${error.message}`);
  process.exit(1);
}
```

**Step 4: 测试更改**

```bash
npm test
```

**Step 5: Commit**

```bash
git add lib/add.js
git commit -m "refactor: improve add error messages with UI module"
```

---

## Task 12: 更新 README 文档

**Files:**
- Modify: `README.md`

**Step 1: 添加彩色输出说明**

在 README.md 的适当位置添加说明:

```markdown
## Features

- **Colored output** - Clear visual feedback for success (✓), errors (✗), warnings (⚠), and info (ℹ)
- **Smart error messages** - Helpful suggestions when something goes wrong
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with UX improvements"
```

---

## Task 13: 更新 package.json 版本

**Files:**
- Modify: `package.json`

**Step 1: 更新版本号**

```json
{
  "name": "claude-code-switch",
  "version": "1.2.0",
  ...
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 1.2.0"
```

---

## Task 14: 最终验证

**Files:**
- (All files)

**Step 1: 运行所有测试**

```bash
npm test
```

Expected: All tests pass

**Step 2: 手动测试所有命令**

```bash
# 测试 list 命令（彩色输出）
ccswitch --list

# 测试 add 命令（彩色提示）
ccswitch add test-ux-profile
# 按 Ctrl+C 退出

# 测试 delete 命令（如果你有测试 profile）
# ccswitch delete test-ux-profile

# 测试错误消息
ccswitch nonexistent-profile

# 测试 help 命令
ccswitch --help
```

**Step 3: 验证彩色输出**

确保以下输出有颜色:
- ✓ 成功消息（绿色）
- ✗ 错误消息（红色）
- ⚠ 警告消息（黄色）
- ℹ 信息消息（蓝色）
- (default) 标记（青色）
- 文件路径（灰色）

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: phase 2 optimization complete - UX enhancements"
```

---

## 完成检查清单

- [ ] chalk 依赖已添加
- [ ] ui.js 模块已创建
- [ ] 所有 console.log/console.error 已替换为 UI 模块
- [ ] 错误提示已增强
- [ ] list 命令有彩色输出
- [ ] 所有测试通过
- [ ] README 已更新
- [ ] 版本号已更新到 1.2.0

---

**Phase 2 完成后可能的 Phase 3 优化方向：**
- 优化 list 命令显示更多详情（URL, Model）
- 添加 --verbose 模式
- 添加 --dry-run 模式

**End of Plan**
