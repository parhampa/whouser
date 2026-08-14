import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  collect,
  detectInstalledFonts,
  getPlugins,
  getMimeTypes,
  getBrowserFeatures,
  FONT_LIST,
  CRITICAL_FONTS,
} from '../../src/signals/software.js';
import { resetMocks } from '../setup.js';

describe('Software Signals', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectInstalledFonts', () => {
    it('should return installed fonts using canvas measureText', () => {
      // Mock measureText to simulate different fonts
      const mockMeasureText = vi.fn();
      mockMeasureText
        .mockReturnValueOnce({ width: 100 }) // base font (monospace)
        .mockReturnValueOnce({ width: 120 }) // Arial (different width => installed)
        .mockReturnValueOnce({ width: 100 }) // FakeFont (same width => not installed)
        .mockReturnValueOnce({ width: 115 }); // Helvetica (installed)

      const mockCtx = {
        font: '',
        measureText: mockMeasureText,
      };

      document.createElement.mockImplementation((tag) => {
        if (tag === 'canvas') {
          return {
            getContext: vi.fn(() => mockCtx),
          };
        }
        return {};
      });

      const fonts = ['Arial', 'FakeFont', 'Helvetica'];
      const installed = detectInstalledFonts(fonts);

      expect(installed).toContain('Arial');
      expect(installed).toContain('Helvetica');
      expect(installed).not.toContain('FakeFont');
      expect(mockMeasureText).toHaveBeenCalledTimes(4); // base + 3 fonts
    });

    it('should return empty array if canvas is not available', () => {
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => null);

      const result = detectInstalledFonts(['Arial', 'Helvetica']);
      expect(result).toEqual([]);

      document.createElement = originalCreateElement;
    });

    it('should handle errors gracefully', () => {
      // Force an error by making measureText throw
      const mockCtx = {
        font: '',
        measureText: vi.fn(() => {
          throw new Error('Canvas error');
        }),
      };

      document.createElement.mockImplementation((tag) => {
        if (tag === 'canvas') {
          return {
            getContext: vi.fn(() => mockCtx),
          };
        }
        return {};
      });

      const result = detectInstalledFonts(['Arial']);
      expect(result).toEqual([]);
    });
  });

  describe('getPlugins', () => {
    it('should return deduplicated plugin names', () => {
      // Setup duplicate plugins
      navigator.plugins = [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Chrome PDF Plugin' }, // duplicate
        { name: 'Native Client' },
      ];

      const plugins = getPlugins();
      expect(plugins).toHaveLength(3);
      expect(plugins).toContain('Chrome PDF Plugin');
      expect(plugins).toContain('Chrome PDF Viewer');
      expect(plugins).toContain('Native Client');
    });

    it('should return empty array if navigator.plugins is not available', () => {
      const originalPlugins = navigator.plugins;
      delete navigator.plugins;

      const result = getPlugins();
      expect(result).toEqual([]);

      navigator.plugins = originalPlugins;
    });

    it('should filter out empty names', () => {
      navigator.plugins = [
        { name: 'Plugin 1' },
        { name: '' },
        { name: 'Plugin 2' },
        { name: null },
        { name: undefined },
      ];

      const plugins = getPlugins();
      expect(plugins).toEqual(['Plugin 1', 'Plugin 2']);
    });
  });

  describe('getMimeTypes', () => {
    it('should return deduplicated MIME types', () => {
      navigator.mimeTypes = [
        { type: 'application/pdf' },
        { type: 'text/plain' },
        { type: 'application/pdf' }, // duplicate
        { type: 'text/html' },
      ];

      const mimes = getMimeTypes();
      expect(mimes).toHaveLength(3);
      expect(mimes).toContain('application/pdf');
      expect(mimes).toContain('text/plain');
      expect(mimes).toContain('text/html');
    });

    it('should return empty array if navigator.mimeTypes is not available', () => {
      const originalMimeTypes = navigator.mimeTypes;
      delete navigator.mimeTypes;

      const result = getMimeTypes();
      expect(result).toEqual([]);

      navigator.mimeTypes = originalMimeTypes;
    });
  });

  describe('getBrowserFeatures', () => {
    it('should detect browser features correctly', () => {
      const features = getBrowserFeatures();

      expect(features).toHaveProperty('cookieEnabled', true);
      expect(features).toHaveProperty('doNotTrack', '1');
      expect(features).toHaveProperty('language', 'en-US');
      expect(features).toHaveProperty('languages', ['en-US', 'en']);
      expect(features).toHaveProperty('userAgent', expect.stringContaining('Mozilla'));
      expect(features).toHaveProperty('platform', 'Win32');
      expect(features).toHaveProperty('webAssembly', true);
      expect(features).toHaveProperty('sharedArrayBuffer', true);
      expect(features).toHaveProperty('performance', true);
      expect(features).toHaveProperty('performanceMemory', true);
      expect(features).toHaveProperty('connection', false);
      expect(features).toHaveProperty('webgl2', false);
      expect(features).toHaveProperty('touchSupport', false);
      expect(features).toHaveProperty('pointerEvents', false);
    });

    it('should handle missing navigator gracefully', () => {
      const originalNavigator = global.navigator;
      delete global.navigator;

      const features = getBrowserFeatures();
      expect(features.cookieEnabled).toBe(false);
      expect(features.userAgent).toBe(null);

      global.navigator = originalNavigator;
    });
  });

  describe('collect()', () => {
    it('should collect software signals in balanced mode (default)', async () => {
      const signals = await collect('balanced');

      expect(signals).toHaveProperty('fonts');
      expect(Array.isArray(signals.fonts)).toBe(true);
      expect(signals).toHaveProperty('plugins');
      expect(signals).toHaveProperty('mimeTypes');
      expect(signals).toHaveProperty('features');
      expect(signals.features).toHaveProperty('userAgent');
      expect(signals).toHaveProperty('language', 'en-US');
      expect(signals).toHaveProperty('languages', ['en-US', 'en']);
      expect(signals).toHaveProperty('doNotTrack', '1');
      expect(signals).toHaveProperty('canvasBlocking');
    });

    it('should use fewer fonts in fast mode', async () => {
      const signalsFast = await collect('fast');
      const signalsBalanced = await collect('balanced');

      // Fast mode should have fewer or equal fonts
      expect(signalsFast.fonts.length).toBeLessThanOrEqual(signalsBalanced.fonts.length);
    });

    it('should use more fonts in high mode', async () => {
      const signalsBalanced = await collect('balanced');
      const signalsHigh = await collect('high');

      // High mode should have more or equal fonts
      expect(signalsHigh.fonts.length).toBeGreaterThanOrEqual(signalsBalanced.fonts.length);
    });

    it('should handle errors gracefully in collect', async () => {
      // Force an error by making document.createElement return null
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => null);

      const signals = await collect('balanced');
      expect(signals).toHaveProperty('fonts', []);
      expect(signals).toHaveProperty('plugins', []);

      document.createElement = originalCreateElement;
    });
  });
});
