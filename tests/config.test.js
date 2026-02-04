const fs = require('fs');
const path = require('path');
const { loadConfig, getProfile, listProfiles } = require('../lib/config');

describe('config module', () => {
  const testConfigDir = '/tmp/ccswitch-test';
  const testConfigPath = path.join(testConfigDir, 'profiles.json');

  beforeEach(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('loadConfig', () => {
    test('should load existing config file', () => {
      const testConfig = {
        profiles: {
          test: { ANTHROPIC_AUTH_TOKEN: 'test-token' }
        },
        default: 'test'
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

      const config = loadConfig(testConfigDir);
      expect(config.profiles.test.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
    });

    test('should return null if config does not exist', () => {
      const config = loadConfig(testConfigDir);
      expect(config).toBeNull();
    });
  });

  describe('getProfile', () => {
    test('should return specified profile', () => {
      const config = {
        profiles: {
          kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' },
          anthropic: { ANTHROPIC_AUTH_TOKEN: 'anthropic-token' }
        },
        default: 'kimi'
      };

      const profile = getProfile(config, 'kimi');
      expect(profile.ANTHROPIC_AUTH_TOKEN).toBe('kimi-token');
    });

    test('should return default profile when no name specified', () => {
      const config = {
        profiles: {
          kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' }
        },
        default: 'kimi'
      };

      const profile = getProfile(config);
      expect(profile.ANTHROPIC_AUTH_TOKEN).toBe('kimi-token');
    });

    test('should return null if profile does not exist', () => {
      const config = {
        profiles: { kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' } },
        default: 'kimi'
      };

      const profile = getProfile(config, 'nonexistent');
      expect(profile).toBeNull();
    });
  });

  describe('listProfiles', () => {
    test('should return array of profile names', () => {
      const config = {
        profiles: {
          kimi: { ANTHROPIC_AUTH_TOKEN: 'kimi-token' },
          anthropic: { ANTHROPIC_AUTH_TOKEN: 'anthropic-token' }
        },
        default: 'kimi'
      };

      const profiles = listProfiles(config);
      expect(profiles).toEqual(['kimi', 'anthropic']);
    });

    test('should return empty array for null config', () => {
      const profiles = listProfiles(null);
      expect(profiles).toEqual([]);
    });

    test('should return empty array for config without profiles', () => {
      const profiles = listProfiles({});
      expect(profiles).toEqual([]);
    });
  });
});
