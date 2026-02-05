const fs = require('fs');
const path = require('path');
const {
  loadConfig,
  addProfile,
  deleteProfile,
  setDefault,
  initializeConfig
} = require('../lib/config');

describe('config management - delete and set-default', () => {
  const testConfigDir = '/tmp/ccswitch-mgmt-test';
  const testConfigPath = path.join(testConfigDir, 'profiles.json');

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('deleteProfile', () => {
    test('should delete existing profile', () => {
      // Setup: add a profile first
      const profile = { ANTHROPIC_AUTH_TOKEN: 'test-token' };
      addProfile(testConfigDir, 'test-profile', profile);

      // Delete the profile
      const result = deleteProfile(testConfigDir, 'test-profile');

      // Verify
      expect(result).toBe(true);
      const config = loadConfig(testConfigDir);
      expect(config.profiles['test-profile']).toBeUndefined();
    });

    test('should return false when deleting non-existent profile', () => {
      // Setup: add a different profile
      const profile = { ANTHROPIC_AUTH_TOKEN: 'test-token' };
      addProfile(testConfigDir, 'existing', profile);

      // Try to delete non-existent profile
      const result = deleteProfile(testConfigDir, 'nonexistent');

      // Verify
      expect(result).toBe(false);
      const config = loadConfig(testConfigDir);
      expect(config.profiles['existing']).toBeDefined();
    });

    test('should update default when deleting default profile', () => {
      // Setup: add two profiles, set one as default
      const profile1 = { ANTHROPIC_AUTH_TOKEN: 'token1' };
      const profile2 = { ANTHROPIC_AUTH_TOKEN: 'token2' };
      addProfile(testConfigDir, 'profile1', profile1);
      addProfile(testConfigDir, 'profile2', profile2);

      // Set profile1 as default
      setDefault(testConfigDir, 'profile1');

      // Delete the default profile
      const result = deleteProfile(testConfigDir, 'profile1');

      // Verify: default should be updated to profile2 or cleared
      expect(result).toBe(true);
      const config = loadConfig(testConfigDir);
      expect(config.profiles['profile1']).toBeUndefined();
      // Default should either be profile2 or empty string
      expect(config.default === 'profile2' || config.default === '').toBe(true);
    });

    test('should clear default when deleting last profile', () => {
      // Setup: add single profile
      const profile = { ANTHROPIC_AUTH_TOKEN: 'test-token' };
      addProfile(testConfigDir, 'only-profile', profile);

      // Delete the last profile
      const result = deleteProfile(testConfigDir, 'only-profile');

      // Verify
      expect(result).toBe(true);
      const config = loadConfig(testConfigDir);
      expect(config.profiles['only-profile']).toBeUndefined();
      expect(config.default).toBe('');
    });
  });

  describe('setDefault', () => {
    test('should set existing profile as default', () => {
      // Setup: add a profile
      const profile = { ANTHROPIC_AUTH_TOKEN: 'test-token' };
      addProfile(testConfigDir, 'kimi', profile);

      // Set as default
      const result = setDefault(testConfigDir, 'kimi');

      // Verify
      expect(result).toBe(true);
      const config = loadConfig(testConfigDir);
      expect(config.default).toBe('kimi');
    });

    test('should return false when setting non-existent profile as default', () => {
      // Setup: add a different profile
      const profile = { ANTHROPIC_AUTH_TOKEN: 'test-token' };
      addProfile(testConfigDir, 'existing', profile);

      // Try to set non-existent profile as default
      const result = setDefault(testConfigDir, 'nonexistent');

      // Verify
      expect(result).toBe(false);
      const config = loadConfig(testConfigDir);
      expect(config.default).not.toBe('nonexistent');
    });

    test('should change default from one profile to another', () => {
      // Setup: add two profiles
      const profile1 = { ANTHROPIC_AUTH_TOKEN: 'token1' };
      const profile2 = { ANTHROPIC_AUTH_TOKEN: 'token2' };
      addProfile(testConfigDir, 'profile1', profile1);
      addProfile(testConfigDir, 'profile2', profile2);
      setDefault(testConfigDir, 'profile1');

      // Change default
      const result = setDefault(testConfigDir, 'profile2');

      // Verify
      expect(result).toBe(true);
      const config = loadConfig(testConfigDir);
      expect(config.default).toBe('profile2');
    });
  });
});
