# ccswitch 优化计划 - Phase 3: 代码质量提升设计

**日期:** 2025-02-05
**状态:** 设计阶段

---

## 概述

Phase 3 专注于提升代码质量，通过测试覆盖率、代码规范和重构优化，确保项目的可维护性和稳定性。

## 设计目标

1. **提升测试覆盖率** - 达到 80%+ 的代码覆盖率
2. **代码规范** - 使用 ESLint + Prettier 统一代码风格
3. **代码重构** - 优化现有代码结构
4. **CI/CD 基础** - 添加 GitHub Actions 自动化测试

## 1. 测试覆盖率提升

### 当前测试状态

已有测试文件:
- `tests/config.test.js`
- `tests/launcher.test.js`
- `tests/add.test.js` (Phase 1 新增)
- `tests/config-management.test.js` (Phase 1 新增)

### 缺失的测试

**lib/cli.js:**
- 主函数流程测试
- 错误处理路径测试
- 各命令分支测试

**lib/add.js:**
- prompt 函数的单元测试
- addProfileInteractive 流程测试

### 测试工具配置

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/templates/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 2. 代码规范配置

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Prettier 配置

```json
// .prettierignore
node_modules/
coverage/
*.lock

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## 3. 代码重构优化

### 重构点

**a) 统一错误处理**

创建 `lib/errors.js` 模块:

```javascript
class CcswitchError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.name = 'CcswitchError';
    this.code = code;
  }
}

class ConfigNotFoundError extends CcswitchError {}
class ProfileNotFoundError extends CcswitchError {}
class ValidationError extends CcswitchError {}

module.exports = {
  CcswitchError,
  ConfigNotFoundError,
  ProfileNotFoundError,
  ValidationError
};
```

**b) 配置常量提取**

创建 `lib/constants.js`:

```javascript
const path = require('path');
const os = require('os');

const REQUIRED_VARS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL'
];

const DEFAULTS = {
  CONFIG_DIR: path.join(os.homedir(), '.ccswitch'),
  CONFIG_FILE: 'profiles.json',
  BASE_URL: 'https://api.anthropic.com',
  MODEL: 'claude-sonnet-4-5-20250514',
  TIMEOUT: '300000'
};

module.exports = {
  REQUIRED_VARS,
  DEFAULTS
};
```

## 4. CI/CD 配置

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [14.x, 16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: npm test
    - run: npm run lint
```

## 5. package.json 更新

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint lib tests",
    "lint:fix": "eslint lib tests --fix",
    "format": "prettier --write \"lib/**/*.js\" \"tests/**/*.js\"",
    "format:check": "prettier --check \"lib/**/*.js\" \"tests/**/*.js\"",
    "validate": "npm run lint && npm run test:coverage"
  },
  "devDependencies": {
    "jest": "^30.2.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5"
  }
}
```

## 实施步骤

1. 配置 ESLint 和 Prettier
2. 添加缺失的测试
3. 配置覆盖率阈值
4. 设置 GitHub Actions
5. 代码重构

## 验收标准

- [ ] 测试覆盖率 >= 80%
- [ ] ESLint 无错误
- [ ] Prettier 格式检查通过
- [ ] CI/CD 通过所有平台测试
