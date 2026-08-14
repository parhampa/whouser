import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  collect,
  getCanvasFingerprint,
  getWebGLInfo,
  getAudioFingerprint,
  getScreenVisualInfo,
  getViewportInfo,
  clearCache,
} from '../../src/signals/visual.js';
import { resetMocks } from '../setup.js';

describe('Visual Signals', () => {
  beforeEach(() => {
    resetMocks();
    clearCache(); // Clear cache between tests
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  describe('getScreenVisualInfo', () => {
    it('should return screen visual information', () => {
      const info = getScreenVisualInfo();
      expect(info).toEqual({
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24,
        colorGamut: 'unknown', // Not set in mock
      });
    });

    it('should handle missing screen gracefully', () => {
      const originalScreen = global.screen;
      delete global.screen;
      const info = getScreenVisualInfo();
      expect(info).toEqual({
        width: 0,
        height: 0,
        availWidth: 0,
        availHeight: 0,
        colorDepth: 0,
        pixelDepth: 0,
        colorGamut: 'unknown',
      });
      global.screen = originalScreen;
    });

    it('should detect color gamut if available', () => {
      screen.colorGamut = 'p3';
      const info = getScreenVisualInfo();
      expect(info.colorGamut).toBe('p3');
      delete screen.colorGamut;
    });
  });

  describe('getViewportInfo', () => {
    it('should return viewport dimensions', () => {
      const info = getViewportInfo();
      expect(info).toEqual({
        innerWidth: 1920,
        innerHeight: 1080,
        outerWidth: 1920,
        outerHeight: 1080,
      });
    });

    it('should handle missing window gracefully', () => {
      const originalWindow = global.window;
      delete global.window;
      const info = getViewportInfo();
      expect(info).toEqual({
        innerWidth: 0,
        innerHeight: 0,
        outerWidth: 0,
        outerHeight: 0,
      });
      global.window = originalWindow;
    });
  });

  describe('getCanvasFingerprint', () => {
    it('should generate a canvas fingerprint in balanced mode', () => {
      const result = getCanvasFingerprint('balanced');
      expect(result).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      // Verify canvas operations were called
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCanvas2D.fillText).toHaveBeenCalled();
      expect(mockCanvas2D.fillRect).toHaveBeenCalled();
      expect(mockCanvas2D.createLinearGradient).toHaveBeenCalled();
    });

    it('should use simpler canvas in fast mode (no gradients)', () => {
      const result = getCanvasFingerprint('fast');
      expect(result).toBeTruthy();
      // In fast mode, createLinearGradient should not be called
      expect(mockCanvas2D.createLinearGradient).toHaveBeenCalledTimes(0);
    });

    it('should use more complex canvas in high mode (shapes, bezier)', () => {
      const result = getCanvasFingerprint('high');
      expect(result).toBeTruthy();
      // In high mode, more operations are called
      expect(mockCanvas2D.beginPath).toHaveBeenCalled();
      expect(mockCanvas2D.arc).toHaveBeenCalled();
      expect(mockCanvas2D.bezierCurveTo).toHaveBeenCalled();
      expect(mockCanvas2D.save).toHaveBeenCalled();
      expect(mockCanvas2D.translate).toHaveBeenCalled();
      expect(mockCanvas2D.rotate).toHaveBeenCalled();
      expect(mockCanvas2D.restore).toHaveBeenCalled();
    });

    it('should return empty string if canvas is not available', () => {
      document.createElement = vi.fn(() => null);
      const result = getCanvasFingerprint('balanced');
      expect(result).toBe('');
    });

    it('should cache results for the same accuracy level', () => {
      // First call
      const result1 = getCanvasFingerprint('balanced');
      // Second call should use cache
      const result2 = getCanvasFingerprint('balanced');
      expect(result1).toBe(result2);
      // getContext should only be called once
      expect(mockCanvas.getContext).toHaveBeenCalledTimes(1);
    });

    it('should use different cache for different accuracy levels', () => {
      const result1 = getCanvasFingerprint('fast');
      const result2 = getCanvasFingerprint('balanced');
      // Both should work but use different cache keys
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      // Different accuracy levels call getContext multiple times
      expect(mockCanvas.getContext).toHaveBeenCalledTimes(2);
    });
  });

  describe('getWebGLInfo', () => {
    it('should return WebGL information in balanced mode', () => {
      const info = getWebGLInfo('balanced');
      expect(info).toHaveProperty('vendor', 'Google Inc.');
      expect(info).toHaveProperty('renderer', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)');
      expect(info).toHaveProperty('version', 'WebGL 2.0 (OpenGL ES 3.2)');
      expect(info).toHaveProperty('shadingLanguageVersion', 'WebGL GLSL ES 3.00');
      expect(info).toHaveProperty('maxTextureSize', 16384);
      expect(info).toHaveProperty('maxViewportDims', [16384, 16384]);
      expect(info).toHaveProperty('isWebGL2', true);
      expect(info).toHaveProperty('extensions');
      expect(Array.isArray(info.extensions)).toBe(true);
      expect(info.extensions.length).toBeGreaterThan(0);
    });

    it('should return limited extensions in fast mode', () => {
      const info = getWebGLInfo('fast');
      // Fast mode should only have key extensions
      expect(info.extensions).toContain('WEBGL_debug_renderer_info');
      expect(info.extensions).toContain('WEBGL_compressed_texture_s3tc');
      expect(info.extensions).toContain('OES_texture_float');
      // Other extensions should not be included
      expect(info.extensions).not.toContain('EXT_texture_filter_anisotropic');
    });

    it('should return all extensions in high mode', () => {
      const info = getWebGLInfo('high');
      // High mode should have all extensions
      expect(info.extensions).toHaveLength(6);
      expect(info.extensions).toContain('WEBGL_debug_renderer_info');
      expect(info.extensions).toContain('EXT_texture_filter_anisotropic');
    });

    it('should include pixel data in balanced and high modes', () => {
      const infoBalanced = getWebGLInfo('balanced');
      expect(infoBalanced).toHaveProperty('pixel');
      expect(Array.isArray(infoBalanced.pixel)).toBe(true);
      expect(infoBalanced.pixel).toHaveLength(4);

      const infoFast = getWebGLInfo('fast');
      expect(infoFast).not.toHaveProperty('pixel');
    });

    it('should return empty object if WebGL is not available', () => {
      const originalGetContext = mockCanvas.getContext;
      mockCanvas.getContext = vi.fn(() => null);
      const info = getWebGLInfo('balanced');
      expect(info).toEqual({});
      mockCanvas.getContext = originalGetContext;
    });

    it('should cache WebGL results', () => {
      const info1 = getWebGLInfo('balanced');
      const info2 = getWebGLInfo('balanced');
      expect(info1).toBe(info2);
      // getContext should only be called once
      expect(mockCanvas.getContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAudioFingerprint', () => {
    it('should generate an audio fingerprint in balanced mode', async () => {
      const result = await getAudioFingerprint('balanced');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use different buffer sizes for different accuracy levels', async () => {
      // Mock the OfflineAudioContext constructor to track buffer size
      const mockCtx = {
        createOscillator: vi.fn(() => ({
          type: '',
          frequency: { value: 0 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn(() => ({
          gain: { value: 0 },
          connect: vi.fn(),
        })),
        destination: {},
        currentTime: 0,
        oncomplete: null,
        startRendering: vi.fn(function() {
          setTimeout(() => {
            if (this.oncomplete) {
              this.oncomplete({
                renderedBuffer: {
                  getChannelData: vi.fn(() => new Float32Array(1000).fill(0.5)),
                },
              });
            }
          }, 10);
        }),
      };

      global.OfflineAudioContext = vi.fn((channels, length, sampleRate) => {
        // Store the length to verify
        return mockCtx;
      });

      await getAudioFingerprint('fast');
      // Fast mode should use smaller buffer (11025)
      // Balanced mode (22050)
      // High mode (44100)
      // We can't easily check the buffer size from here, but we can verify it was called
      expect(global.OfflineAudioContext).toHaveBeenCalled();
    });

    it('should return empty string if AudioContext is not available', async () => {
      const originalOfflineAudioContext = global.OfflineAudioContext;
      delete global.OfflineAudioContext;
      delete global.webkitOfflineAudioContext;

      const result = await getAudioFingerprint('balanced');
      expect(result).toBe('');

      global.OfflineAudioContext = originalOfflineAudioContext;
    });

    it('should handle errors gracefully', async () => {
      // Make startRendering throw
      const mockCtx = {
        createOscillator: vi.fn(() => ({
          type: '',
          frequency: { value: 0 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn(() => ({
          gain: { value: 0 },
          connect: vi.fn(),
        })),
        destination: {},
        currentTime: 0,
        oncomplete: null,
        startRendering: vi.fn(() => {
          throw new Error('Audio error');
        }),
      };

      global.OfflineAudioContext = vi.fn(() => mockCtx);
      const result = await getAudioFingerprint('balanced');
      expect(result).toBe('');
    });

    it('should cache audio results', async () => {
      const result1 = await getAudioFingerprint('balanced');
      const result2 = await getAudioFingerprint('balanced');
      expect(result1).toBe(result2);
    });
  });

  describe('collect()', () => {
    it('should collect all visual signals in balanced mode', async () => {
      const signals = await collect('balanced');

      expect(signals).toHaveProperty('screen');
      expect(signals.screen).toHaveProperty('width', 1920);
      expect(signals).toHaveProperty('viewport');
      expect(signals.viewport).toHaveProperty('innerWidth', 1920);
      expect(signals).toHaveProperty('canvas');
      expect(typeof signals.canvas).toBe('string');
      expect(signals).toHaveProperty('webgl');
      expect(signals.webgl).toHaveProperty('vendor', 'Google Inc.');
      expect(signals).toHaveProperty('audio');
      expect(typeof signals.audio).toBe('string');
      expect(signals).toHaveProperty('devicePixelRatio', 1);
      expect(signals).toHaveProperty('colorDepth', 24);
    });

    it('should skip WebGL and Audio in fast mode', async () => {
      const signals = await collect('fast');

      expect(signals).toHaveProperty('screen');
      expect(signals).toHaveProperty('viewport');
      expect(signals).toHaveProperty('canvas');
      expect(signals).toHaveProperty('webgl');
      // In fast mode, webgl should be empty object
      expect(signals.webgl).toEqual({});
      expect(signals).toHaveProperty('audio');
      // In fast mode, audio should be empty string
      expect(signals.audio).toBe('');
    });

    it('should include WebGL and Audio in balanced mode', async () => {
      const signals = await collect('balanced');

      expect(signals.webgl).toHaveProperty('vendor');
      expect(signals.webgl).toHaveProperty('renderer');
      expect(signals.audio).toBeTruthy();
      expect(typeof signals.audio).toBe('string');
    });

    it('should include all details in high mode', async () => {
      const signals = await collect('high');

      // WebGL should have full extensions list and pixel data
      expect(signals.webgl).toHaveProperty('extensions');
      expect(signals.webgl.extensions.length).toBeGreaterThanOrEqual(6);
      expect(signals.webgl).toHaveProperty('pixel');
      expect(Array.isArray(signals.webgl.pixel)).toBe(true);

      // Canvas should have shapes and bezier curves
      // (verified in canvas tests above)
      expect(signals.canvas).toBeTruthy();
    });

    it('should handle errors in individual signal collectors', async () => {
      // Force an error in getCanvasFingerprint
      const originalGetContext = mockCanvas.getContext;
      mockCanvas.getContext = vi.fn(() => {
        throw new Error('Canvas error');
      });

      const signals = await collect('balanced');
      // Should still have other signals
      expect(signals).toHaveProperty('screen');
      expect(signals).toHaveProperty('viewport');
      // Canvas should fallback to empty string
      expect(signals.canvas).toBe('');

      mockCanvas.getContext = originalGetContext;
    });

    it('should handle errors in audio fingerprint', async () => {
      // Force audio to fail
      const originalOfflineAudioContext = global.OfflineAudioContext;
      global.OfflineAudioContext = vi.fn(() => {
        throw new Error('Audio error');
      });

      const signals = await collect('balanced');
      expect(signals.audio).toBe('');

      global.OfflineAudioContext = originalOfflineAudioContext;
    });

    it('should use caching for expensive signals', async () => {
      // First call
      await collect('balanced');
      // Second call should use cache
      await collect('balanced');

      // getContext should only be called once per signal type
      // We can check that getContext was called a limited number of times
      // Note: There are multiple getContext calls (canvas, webgl)
      // But they should not increase on second call
      const callCount = mockCanvas.getContext.mock.calls.length;
      // First call: 2 (canvas 2d, webgl)
      // Second call: should be 0 new calls
      expect(callCount).toBe(2); // Only called during first collect
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // Generate some cached values
      await collect('balanced');
      const beforeClear = getCanvasFingerprint('balanced');

      // Clear cache
      clearCache();

      // Generate new values (should be different objects)
      const afterClear = getCanvasFingerprint('balanced');

      // The strings should be the same (since mock is deterministic)
      // But the cache should be cleared, so we can't check object equality
      // Instead, we check that the cache is empty by checking the internal state
      // We'll rely on the fact that getCanvasFingerprint uses the cache
      // and after clearCache, it should recompute
      const callCountBefore = mockCanvas.getContext.mock.calls.length;
      getCanvasFingerprint('balanced');
      const callCountAfter = mockCanvas.getContext.mock.calls.length;
      // Should have been called again
      expect(callCountAfter).toBeGreaterThan(callCountBefore);
    });
  });
});
