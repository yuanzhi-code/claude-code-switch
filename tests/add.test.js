const fs = require('fs');
const path = require('path');
const { addProfile } = require('../lib/config');

describe('addProfile', () => {
  const testConfigDir = '/tmp/ccswitch-add-test';
  const testConfigPath = path.join(testConfigDir, 'profiles.json');

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  test('should add profile to new config', () => {
    const profile = {
      ANTHROPIC_AUTH_TOKEN: 'sk-test',
      ANTHROPIC_BASE_URL: 'https://api.test.com',
      ANTHROPIC_MODEL: 'test-model'
    };

    const result = addProfile(testConfigDir, 'test', profile);

    expect(result).toBe(true);
    expect(fs.existsSync(testConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(config.profiles.test).toEqual(profile);
    expect(config.default).toBe('test');
  });

  test('should set first profile as default', () => {
    const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };

    addProfile(testConfigDir, 'first', profile);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(config.default).toBe('first');
  });

  test('should not change default when adding second profile', () => {
    const profile = { ANTHROPIC_AUTH_TOKEN: 'sk', ANTHROPIC_BASE_URL: 'https://api.test.com', ANTHROPIC_MODEL: 'm' };

    addProfile(testConfigDir, 'first', profile);
    addProfile(testConfigDir, 'second', profile);

    const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    expect(config.default).toBe('first');
    expect(config.profiles.second).toBeDefined();
  });
});
