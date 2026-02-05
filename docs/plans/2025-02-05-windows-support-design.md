# Windows Support Design

## 概述

将 `ccswitch` 改造为跨平台 CLI 工具，通过纯 Node.js 入口替代 Bash 脚本，确保在 Windows 和 Unix-like 系统上都能正常工作，特别是支持 `npm link` 本地开发场景。

## 背景

当前 `bin/ccswitch` 是 Bash 脚本，仅能在 Unix-like 系统上运行。核心逻辑已由 Node.js 实现，但入口点限制了跨平台支持。

## 设计目标

1. ✅ 支持 Windows 系统
2. ✅ 支持 `npm link` 本地开发场景（symlink 解析）
3. ✅ 保持向后兼容（配置、命令行接口）
4. ✅ 改进错误处理和用户提示

## 入口点重构

### bin/ccswitch.js (新建)

使用 Node.js shebang 替代 Bash 脚本：

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 解析 symlink 获取真实路径
const entryPath = fs.realpathSync(process.argv[1]);
const libDir = path.resolve(path.dirname(entryPath), '..', 'lib');

// 动态加载主模块
require(path.join(libDir, 'cli.js'));
```

**关键点：**
- `#!/usr/bin/env node` shebang - npm 自动生成 Windows .cmd wrapper
- `fs.realpathSync()` - 追溯 symlink 到真实文件位置
- 动态计算 lib 路径 - 支持任意安装方式

### package.json 更新

```json
{
  "bin": {
    "ccswitch": "./bin/ccswitch.js"
  }
}
```

## Symlink 路径解析机制

npm link 创建符号链接后，需要找到真实的项目根目录：

```
npm link 后:
~/.nvm/versions/node/v20/bin/ccswitch  ->  {project}/bin/ccswitch.js  ->  lib/
                                             ↑ symlink
```

**解析流程：**
1. `process.argv[1]` - 获取执行脚本路径（可能是 symlink）
2. `fs.realpathSync()` - 追溯到真实文件系统位置
3. `path.resolve(path.dirname(...), '..', 'lib')` - 计算真实 lib 目录
4. 动态 require - 加载真实位置的模块

## CLI 参数解析整合

将 Bash 脚本中的参数解析逻辑迁移到 `lib/cli.js`：

```javascript
// 解析 flags 和位置参数
const args = process.argv.slice(2);
const profileName = args.find(arg => !arg.startsWith('-')) || '';
const extraArgs = args.filter(arg => arg.startsWith('-') && !['--help', '-h', '--version', '-V'].includes(arg));

// 处理 --help / --version
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}
```

**变更：**
- ❌ 移除 `CC_SWITCH_PROFILE` 环境变量传递
- ✅ 直接解析 `process.argv`
- ✅ 保留额外参数传递给 claude-code

## Claude Code 命令查找

当前 `launcher.js` 已是跨平台实现：

```javascript
const cmd = 'claude-code' + (args.length ? ' ' + args.join(' ') : '');
const child = exec(cmd, { env }, ...);
```

**跨平台原理：**
1. 依赖系统 PATH 查找命令（非硬编码路径）
2. npm 自动处理平台差异：
   - macOS/Linux: `{prefix}/bin/claude-code`
   - Windows: `claude-code.cmd` wrapper
3. `child_process.exec` 自动处理扩展名

无需修改现有 launcher 逻辑。

## 错误处理改进

增强用户友好的错误提示：

1. **JSON 解析错误** - 明确指出配置文件位置和格式问题
2. **命令未找到** - 提示安装 Claude Code 的命令
3. **配置文件缺失** - 显示完整路径和初始化步骤

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | bin/ccswitch.js | Node.js 入口脚本 |
| 修改 | lib/cli.js | 整合参数解析逻辑 |
| 修改 | package.json | 更新 bin 字段 |
| 删除 | bin/ccswitch | 原 Bash 脚本 |
| 不变 | lib/launcher.js | 已跨平台 |
| 不变 | lib/config.js | 已跨平台 |
| 不变 | tests/ | 保持有效 |

## 向后兼容性

- ✅ 配置文件格式不变 (`~/.ccswitch/profiles.json`)
- ✅ 命令行接口不变 (`ccswitch [profile]`)
- ✅ 环境变量传递机制不变
- ✅ 用户使用体验一致

## 测试验证

1. macOS: `npm link` + `ccswitch kimi`
2. Windows: `npm link` + `ccswitch kimi`
3. 验证 symlink 路径正确解析
4. 验证 claude-code 正常启动
