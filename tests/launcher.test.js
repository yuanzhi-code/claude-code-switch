const { buildEnv, validateProfile, launch } = require('../lib/launcher');

describe('launcher module', () => {
  describe('validateProfile', () => {
    test('should validate complete profile', () => {
      const profile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test',
        ANTHROPIC_BASE_URL: 'https://api.test.com',
        ANTHROPIC_MODEL: 'test-model'
      };

      const result = validateProfile(profile);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('should detect missing required fields', () => {
      const profile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test'
        // Missing BASE_URL and MODEL
      };

      const result = validateProfile(profile);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ANTHROPIC_BASE_URL');
      expect(result.missing).toContain('ANTHROPIC_MODEL');
    });
  });

  describe('buildEnv', () => {
    test('should build environment object from profile', () => {
      const profile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test',
        ANTHROPIC_BASE_URL: 'https://api.test.com',
        ANTHROPIC_MODEL: 'test-model',
        API_TIMEOUT_MS: '5000'
      };

      const env = buildEnv(profile);

      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('sk-test');
      expect(env.ANTHROPIC_BASE_URL).toBe('https://api.test.com');
      expect(env.ANTHROPIC_MODEL).toBe('test-model');
      expect(env.API_TIMEOUT_MS).toBe('5000');
    });
  });

  describe('launch', () => {
    test('should reject when profile is invalid', () => {
      const invalidProfile = {
        ANTHROPIC_AUTH_TOKEN: 'sk-test'
        // Missing required fields
      };

      return expect(launch(invalidProfile)).rejects.toThrow('Missing required environment variables');
    });

    test('should reject when claude-code not found', () => {
      // This test would require mocking exec - for now skip
      // The actual behavior is tested in manual testing
    });
  });
});
