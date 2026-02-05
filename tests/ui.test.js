const ui = require('../lib/ui');

describe('ui module', () => {
  describe('success', () => {
    test('should print success message with checkmark', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      ui.success('Operation completed successfully');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓'),
        'Operation completed successfully'
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });
  });

  describe('error', () => {
    test('should print error message with cross mark', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      ui.error('An error occurred');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗'),
        'An error occurred'
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('warning', () => {
    test('should print warning message with warning symbol', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      ui.warning('This is a warning');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠'),
        'This is a warning'
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });
  });

  describe('info', () => {
    test('should print info message with info symbol', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      ui.info('Here is some information');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ'),
        'Here is some information'
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });
  });

  describe('dim', () => {
    test('should print dimmed text', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      ui.dim('This text is dimmed');

      expect(consoleLogSpy).toHaveBeenCalledWith('This text is dimmed');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });
  });

  describe('highlight', () => {
    test('should print highlighted text', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      ui.highlight('This text is highlighted');

      expect(consoleLogSpy).toHaveBeenCalledWith('This text is highlighted');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });
  });

  describe('formatProfileName', () => {
    test('should return formatted name with (default) suffix when matches default', () => {
      const result = ui.formatProfileName('kimi', 'kimi');
      expect(result).toContain('kimi');
      expect(result).toContain('(default)');
    });

    test('should return plain name when does not match default', () => {
      const result = ui.formatProfileName('anthropic', 'kimi');
      expect(result).toBe('anthropic');
    });

    test('should return plain name when defaultName is null', () => {
      const result = ui.formatProfileName('kimi', null);
      expect(result).toBe('kimi');
    });

    test('should return plain name when defaultName is undefined', () => {
      const result = ui.formatProfileName('kimi', undefined);
      expect(result).toBe('kimi');
    });
  });
});
