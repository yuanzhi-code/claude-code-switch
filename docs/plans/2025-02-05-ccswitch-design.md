# ccswitch 设计文档

**日期:** 2025-02-05
**用途:** Claude Code API 配置切换工具

---

## 1. 整体架构

ccswitch 是一个轻量级的 Node.js CLI 工具，核心流程：

```
用户运行: ccswitch kimi
    ↓
1. 读取 ~/.ccswitch/profiles.json 中的 "kimi" 配置
    ↓
2. 用环境变量启动 claude-code
    ↓
3. 用户正常使用，退出后无需清理
```

**设计要点：**
- 配置文件位置：`~/.ccswitch/profiles.json`
- 通过环境变量传递配置给 Claude Code
- 不修改任何 Claude Code 自身配置
- 退出后不残留任何状态

---

## 2. 配置文件格式

`~/.ccswitch/profiles.json` 格式：

```json
{
  "profiles": {
    "kimi": {
      "ANTHROPIC_AUTH_TOKEN": "sk-kimi-xxx...",
      "ANTHROPIC_BASE_URL": "https://api.kimi.com/coding/",
      "ANTHROPIC_MODEL": "kimi-for-coding",
      "API_TIMEOUT_MS": "3000000",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "anthropic": {
      "ANTHROPIC_AUTH_TOKEN": "sk-ant-xxx...",
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
      "ANTHROPIC_MODEL": "claude-opus-4-5-20251101"
    }
  },
  "default": "kimi"
}
```

**特点：**
- `profiles` 存储多个配置
- `default` 指定默认配置（不指定 profile 时使用）
- 每个 profile 直接对应环境变量映射

---

## 3. 命令行接口

```bash
# 使用指定配置启动
ccswitch kimi

# 使用默认配置启动（不指定 profile 名）
ccswitch

# 帮助信息
ccswitch --help
ccswitch -h

# 版本信息
ccswitch --version
ccswitch -V
```

**核心行为：**
- `ccswitch <profile>` - 用指定配置启动 Claude Code
- `ccswitch` - 用 default 配置启动
- 直接透传所有参数给 `claude-code` 命令

---

## 4. 实现结构

```
claude-code-switch/
├── package.json
├── bin/
│   └── ccswitch          # CLI 入口（shell 脚本）
├── lib/
│   ├── config.js         # 配置读取/验证
│   ├── launcher.js       # 启动 Claude Code
│   └── templates/
│       └── profiles.json # 配置文件模板
└── README.md
```

**核心逻辑：**

1. **bin/ccswitch** - Shell 入口
   - 解析参数（profile 名 + 其他透传参数）
   - 调用 Node.js 逻辑

2. **lib/config.js** - 配置处理
   - 读取 `~/.ccswitch/profiles.json`
   - 如果不存在，从模板复制
   - 验证 profile 存在性

3. **lib/launcher.js** - 启动器
   - 构建环境变量
   - 用 `exec` 启动 `claude-code`，透传 stdin/stdout/stderr

---

## 5. 错误处理与初始化

**首次使用流程：**

```bash
$ ccswitch kimi
# 配置文件不存在时
→ 创建 ~/.ccswitch/profiles.json（从模板）
→ 显示提示：请编辑配置文件后重试
→ 退出（code 1）
```

**错误场景：**

| 场景 | 处理方式 |
|------|----------|
| 配置文件不存在 | 从模板创建，提示用户编辑 |
| 指定的 profile 不存在 | 列出可用 profiles，退出（code 1） |
| 缺少必需环境变量 | 提示缺少的字段，退出（code 1） |
| claude-code 命令不存在 | 提示安装 Claude Code，退出（code 1） |

**模板内容：**
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

---

## 6. 环境变量映射

Claude Code 支持的环境变量：

| 环境变量 | 说明 | 必需 |
|---------|------|------|
| `ANTHROPIC_AUTH_TOKEN` | API Token | 是 |
| `ANTHROPIC_BASE_URL` | API 地址 | 是 |
| `ANTHROPIC_MODEL` | 模型 ID | 是 |
| `API_TIMEOUT_MS` | 超时时间（毫秒） | 否 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | 禁用非必要流量 | 否 |

---

## 7. 使用场景

- **个人开发者**：在不同 API 提供商之间切换（如 Kimi、Anthropic 官方等）
- **配置管理**：通过编辑 JSON 文件管理所有配置
- **透明启动**：像平时一样使用 Claude Code，无需额外操作
