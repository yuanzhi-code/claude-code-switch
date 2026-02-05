# ccswitch 优化计划 - Phase 2: 用户体验提升设计

**日期:** 2025-02-05
**状态:** 设计阶段

---

## 概述

Phase 2 专注于提升用户体验，通过彩色输出、更友好的错误提示和状态反馈，使 ccswitch 更加易用和美观。

## 设计目标

1. **彩色输出** - 使用 chalk 库添加颜色，增强可读性
2. **友好的错误提示** - 更清晰的错误信息和解决建议
3. **状态反馈** - 操作成功/失败的视觉反馈
4. **统一的输出风格** - 一致的消息格式

## 功能设计

### 1. 彩色输出系统

**使用库:** chalk

**颜色方案:**
- 成功消息: 绿色 ✓
- 错误消息: 红色 ✗
- 警告消息: 黄色 ⚠
- 信息消息: 蓝色 ℹ
- 默认标记: 青色
- 文件路径: 灰色/dim

**实现位置:**
- 新建 `lib/ui.js` 模块统一管理 UI 输出
- 在 `lib/cli.js` 中使用 UI 模块替换 console.log/console.error

### 2. 错误提示增强

**改进点:**
| 错误场景 | 当前提示 | 改进后提示 |
|---------|---------|-----------|
| 配置文件不存在 | "Config file not found" | 显示路径 + 创建提示 + 快速命令 |
| Profile 不存在 | "Profile not found" | 相似名称建议 + 列出可用 profiles |
| 缺少必需字段 | "Missing required fields" | 具体缺少哪些 + 示例值 |
| Claude Code 未安装 | "claude command not found" | 安装命令 + npm install 提示 |
| JSON 格式错误 | "Failed to parse config" | 具体错误位置 + 格式建议 |

### 3. 命令输出优化

**list 命令:**
```
Available profiles:

  kimi (default)
    URL: https://api.kimi.com/coding/
    Model: kimi-for-coding

  anthropic
    URL: https://api.anthropic.com
    Model: claude-opus-4-5-20250514

Config file: ~/.ccswitch/profiles.json
```

**add 命令:**
- 带颜色的输入提示
- 实时验证（如 token 格式）
- 完成后的摘要展示

**delete 命令:**
- 确认提示（可选）
- 显示删除内容
- 默认变更通知

### 4. 新增功能建议

**--verbose/-v 模式:**
- 显示详细的环境变量
- 显示启动的命令

**--dry-run 模式:**
- 显示将要执行的操作
- 不实际启动 Claude Code

## 文件结构

```
lib/
├── ui.js          # 新建：UI 输出模块
├── cli.js         # 修改：使用 ui 模块
├── add.js         # 修改：使用 ui 模块
└── ...
```

## UI 模块设计

```javascript
// lib/ui.js
const chalk = require('chalk');

module.exports = {
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.error(chalk.red('✗'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  dim: (msg) => console.log(chalk.dim(msg)),
  highlight: (msg) => console.log(chalk.cyan(msg)),
  // ... 更多辅助函数
};
```

## 依赖更新

```json
{
  "dependencies": {
    "chalk": "^5.3.0"
  }
}
```

## 实现优先级

1. **高优先级**
   - 创建 ui.js 模块
   - 更新错误提示
   - 添加颜色到成功/失败消息

2. **中优先级**
   - 优化 list 命令输出
   - 添加 verbose 模式

3. **低优先级**
   - dry-run 模式
   - 进度条（如果适用）

## 向后兼容性

- 所有命令行参数保持不变
- 输出内容保持相同含义
- 仅增强视觉效果和可读性

## 测试考虑

- 使用 chalk 的 mock 版本进行测试
- 验证输出包含预期的文本内容
- 测试不同场景下的错误提示
