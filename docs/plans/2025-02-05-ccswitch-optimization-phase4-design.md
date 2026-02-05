# ccswitch 优化计划 - Phase 4: 安全性增强设计

**日期:** 2025-02-05
**状态:** 设计阶段

---

## 概述

Phase 4 专注于安全性增强，保护用户的敏感信息（如 API Token），并提升配置文件的安全性。

## 设计目标

1. **敏感信息加密** - 可选的 Token 加密存储
2. **配置文件权限检查** - 确保配置文件权限正确
3. **Token 验证** - 验证 Token 格式和有效性
4. **安全提示** - 警告用户潜在的安全问题

## 1. 敏感信息加密

### 设计

使用 AES-256-GCM 加密算法，用户可选择是否加密存储 Token。

**实现方式:**
- 使用 Node.js 内置 `crypto` 模块
- 密钥从用户密码或系统密钥派生
- 加密后的 Token 存储在配置文件中

### 配置格式变化

```json
{
  "profiles": {
    "kimi": {
      "ANTHROPIC_BASE_URL": "https://api.kimi.com/coding/",
      "ANTHROPIC_MODEL": "kimi-for-coding",
      "ANTHROPIC_AUTH_TOKEN": "encrypted:v1:aes256:gcm:base64data"
    }
  },
  "default": "kimi",
  "encryption": {
    "enabled": true,
    "algorithm": "aes-256-gcm"
  }
}
```

### 新增命令

```bash
# 启用加密
ccswitch encrypt
# 提示输入密码，然后加密所有现有 token

# 解密
ccswitch decrypt
# 提示输入密码，解密所有 token

# 更改密码
ccswitch change-password
```

### 加密模块设计

```javascript
// lib/encryption.js
const crypto = require('crypto');

class EncryptionManager {
  constructor(password) {
    this.password = password;
    this.algorithm = 'aes-256-gcm';
  }

  encrypt(text) {
    // 加密逻辑
  }

  decrypt(encryptedText) {
    // 解密逻辑
  }

  static deriveKey(password, salt) {
    // 密钥派生
  }
}

module.exports = { EncryptionManager };
```

## 2. 配置文件权限检查

### 检查规则

- Unix: 配置文件权限应为 `600` (仅所有者读写)
- Windows: 配置文件应继承适当的权限

### 实现位置

在 `lib/config.js` 的 `loadConfig` 函数中添加权限检查:

```javascript
function checkConfigPermissions(configPath) {
  const stats = fs.statSync(configPath);
  const mode = stats.mode & 0o777;

  if (process.platform !== 'win32' && mode !== 0o600) {
    console.warn(`⚠ Config file has insecure permissions: ${mode.toString(8)}`);
    console.warn(`  Run: chmod 600 ${configPath}`);
  }
}
```

## 3. Token 验证

### 格式验证

检查 Token 格式是否符合预期:

```javascript
function validateToken(token, baseUrl) {
  // Anthropic 官方: sk-ant-...
  // 其他提供商: 可能不同格式

  if (baseUrl.includes('anthropic.com')) {
    if (!token.startsWith('sk-ant-')) {
      return { valid: false, message: 'Invalid Anthropic token format' };
    }
  }

  return { valid: true };
}
```

### 可选: 在线验证

提供 `--verify` 选项验证 Token 有效性:

```bash
ccswitch verify kimi
# 发送测试请求到 API 验证 token
```

## 4. 安全提示

### 场景和提示

| 场景 | 提示 |
|------|------|
| Token 以明文存储 | ⚠ 警告: Token 未加密，建议使用 ccswitch encrypt |
| 配置文件权限不安全 | ⚠ 警告: 配置文件权限过于开放 |
| 检测到 .git 目录中的配置 | ⚠ 错误: 配置文件不应在 Git 仓库中 |
| Token 即将过期 | ℹ 信息: Token 将在 X 天后过期 |

### .gitignore 更新

确保 `.gitignore` 包含:

```
# ccswitch config
.ccswitch/
```

## 5. 依赖更新

```json
{
  "dependencies": {
    "crypto": "^1.0.1"  // Node.js 内置，但可能需要 polyfill
  }
}
```

## 实施优先级

1. **高优先级**
   - 配置文件权限检查
   - .gitignore 更新
   - Token 格式验证

2. **中优先级**
   - 加密/解密命令
   - 安全提示

3. **低优先级**
   - 在线 Token 验证
   - 过期提醒

## 安全考虑

- 加密密钥不应存储在配置文件中
- 密码应通过安全方式输入（隐藏输入）
- 加密不应显著影响启动性能

## 向后兼容性

- 加密是可选功能
- 明文 Token 仍可正常使用
- 迁移工具帮助用户从明文迁移到加密
