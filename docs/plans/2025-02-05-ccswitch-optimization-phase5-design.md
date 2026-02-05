# ccswitch 优化计划 - Phase 5: 开发者体验与发布设计

**日期:** 2025-02-05
**状态:** 设计阶段

---

## 概述

Phase 5 专注于开发者体验，完善 CI/CD 流程、自动化发布和文档，使项目更易于维护和贡献。

## 设计目标

1. **完善的 CI/CD** - 自动化测试、发布流程
2. **自动化发布** - semantic versioning 和 changelog
3. **完善的文档** - API 文档、贡献指南
4. **Issue/PR 模板** - 标准化协作流程

## 1. CI/CD 流程完善

### GitHub Actions 工作流

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ master, main, develop ]
  pull_request:
    branches: [ master, main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [14.x, 16.x, 18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=moderate
```

### Release 工作流

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

## 2. 语义化版本和 Changelog

### Commit 规范

使用 Conventional Commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi colons, etc
refactor: refactoring production code
test: adding tests
chore: updating build tasks, package manager configs, etc
```

### 自动化工具

```json
{
  "devDependencies": {
    "standard-version": "^9.5.0"
  },
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:patch": "standard-version --release-as patch",
    "release:major": "standard-version --release-as major"
  }
}
```

### Changelog 格式

```markdown
# Changelog

## [1.1.0] - 2025-02-05

### Added
- Interactive `add` command for creating profiles
- `delete` command for removing profiles
- `set-default` command for changing default profile
- `--list` command to show all profiles

### Changed
- Improved error messages with helpful suggestions

### Fixed
- Windows compatibility issues
```

## 3. 文档完善

### 文档结构

```
docs/
├── api.md              # API 文档
├── contributing.md     # 贡献指南
├── security.md         # 安全策略
├── migration.md        # 迁移指南
└── plans/              # 设计和计划文档
```

### contributing.md

```markdown
# Contributing to ccswitch

## Development Setup

\`\`\`bash
git clone https://github.com/yuanzhi-code/claude-code-switch.git
cd claude-code-switch
npm install
npm link
\`\`\`

## Running Tests

\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Code Style

We use ESLint and Prettier for code formatting:

\`\`\`bash
npm run lint
npm run format
\`\`\`

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
```

### api.md

```markdown
# API Reference

## config module

### loadConfig(configDir)

Load configuration from directory.

**Parameters:**
- `configDir` (string): Path to config directory

**Returns:** object | null

**Example:**
\`\`\`javascript
const { loadConfig } = require('./lib/config');
const config = loadConfig('/path/to/config');
\`\`\`
```

## 4. Issue 和 PR 模板

### Issue 模板

```markdown
# .github/ISSUE_TEMPLATE/bug_report.md
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the bug
A clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Run '....'
3. See error

## Expected behavior
What should happen.

## Environment
- OS: [e.g. macOS 14]
- Node version: [e.g. 20.0.0]
- ccswitch version: [e.g. 1.0.0]
```

### PR 模板

```markdown
# .github/PULL_REQUEST_TEMPLATE.md
## Description
Brief description of changes

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 5. 自动化工具

### pre-commit hooks

```json
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "*.{js,json}": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

## 6. Badges 和 README 增强

### 添加到 README

```markdown
# ccswitch

[![npm version](https://badge.fury.io/js/claude-code-switch.svg)](https://www.npmjs.com/package/claude-code-switch)
[![CI/CD](https://github.com/yuanzhi-code/claude-code-switch/workflows/CI/badge.svg)](https://github.com/yuanzhi-code/claude-code-switch/actions)
[![Coverage](https://codecov.io/gh/yuanzhi-code/claude-code-switch/branch/master/graph/badge.svg)](https://codecov.io/gh/yuanzhi-code/claude-code-switch)
[![License](https://img.shields.io/npm/l/claude-code-switch)](LICENSE)
```

## 实施优先级

1. **高优先级**
   - CI/CD 基础流程
   - Issue/PR 模板
   - 基础文档

2. **中优先级**
   - 自动化发布
   - Changelog 自动生成

3. **低优先级**
   - 安全策略文档
   - 高级文档

## 验收标准

- [ ] CI/CD 流程正常运行
- [ ] 所有 PR 通过检查后才能合并
- [ ] 自动发布到 npm
- [ ] 完整的贡献文档
