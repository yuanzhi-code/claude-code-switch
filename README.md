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

## Features

- **Colored output** - Clear visual feedback for success (✓), errors (✗), warnings (⚠), and info (ℹ)
- **Smart error messages** - Helpful suggestions and similarity matching when something goes wrong
- **Interactive profile management** - Add, delete, and switch between API configurations easily

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

# List all configured profiles
ccswitch --list
# or
ccswitch -l

# Interactively add a new profile
ccswitch add my-profile

# Delete a profile
ccswitch delete my-profile

# Set the default profile
ccswitch set-default my-profile

# Show help
ccswitch --help

# Show version
ccswitch --version
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
