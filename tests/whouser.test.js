// tests/whouser.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Whouser from '../src/index.js';

describe('Whouser', () => {
  let whouser;

  beforeEach(() => {
    whouser = new Whouser();
    // Mock browser APIs for testing
    setupMocks();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(whouser).toBeInstanceOf(Whouser);
      expect(whouser.options).toHaveProperty('timeout', 3000);
      expect(whouser.options).toHaveProperty('includeTiming', true);
    });

    it('should accept custom options', () => {
      const custom = new Whouser({ timeout: 5000, includeTiming: false });
      expect(custom.options.timeout).toBe(5000);
      expect(custom.options.includeTiming).toBe(false);
    });
  });

  describe('getFingerprint', () => {
    it('should return a fingerprint object with hash1, hash2, hash3', async () => {
      const fp = await whouser.getFingerprint();
      
      expect(fp).toHaveProperty('hash1');
      expect(fp).toHaveProperty('hash2');
      expect(fp).toHaveProperty('hash3');
      expect(fp).toHaveProperty('raw');
      expect(fp).toHaveProperty('timestamp');
      
      expect(typeof fp.hash1).toBe('string');
      expect(typeof fp.hash2).toBe('string');
      expect(typeof fp.hash3).toBe('string');
      expect(fp.hash1.length).toBeGreaterThan(0);
    });

    it('should cache the fingerprint', async () => {
      const fp1 = await whouser.getFingerprint();
      const fp2 = await whouser.getFingerprint();
      
      expect(fp1).toBe(fp2); // Same reference due to caching
    });

    it('should clear cache when clearCache is called', async () => {
      await whouser.getFingerprint();
      expect(whouser._cachedFingerprint).not.toBeNull();
      
      whouser.clearCache();
      expect(whouser._cachedFingerprint).toBeNull();
      expect(whouser._cachedRaw).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      // Force an error by breaking a dependency
      const broken = new Whouser();
      broken.getRawSignals = vi.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(broken.getFingerprint()).rejects.toThrow('Fingerprint generation failed');
    });
  });

  describe('getRawSignals', () => {
    it('should return raw signals without hashing', async () => {
      const raw = await whouser.getRawSignals();
      
      expect(raw).toHaveProperty('hardware');
      expect(raw).toHaveProperty('software');
      expect(raw).toHaveProperty('visual');
      
      // Check that raw signals contain expected properties
      expect(raw.hardware).toHaveProperty('screen');
      expect(raw.software).toHaveProperty('language');
      expect(raw.visual).toHaveProperty('canvas');
    });

    it('should cache raw signals', async () => {
      const raw1 = await whouser.getRawSignals();
      const raw2 = await whouser.getRawSignals();
      
      expect(raw1).toBe(raw2);
    });
  });

  describe('compare', () => {
    it('should compare two fingerprints and return score', async () => {
      const fp1 = await whouser.getFingerprint();
      
      // Create a slightly different fingerprint by modifying raw data
      const fp2 = { ...fp1 };
      fp2.hash1 = fp1.hash1.slice(0, -1) + '0'; // Change last character
      
      const result = whouser.compare(fp1, fp2);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('match');
      expect(result).toHaveProperty('details');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should use custom weights', async () => {
      const fp1 = await whouser.getFingerprint();
      const fp2 = { ...fp1 };
      fp2.hash2 = 'different_hash';
      
      const weights = [0.5, 0.3, 0.2];
      const result = whouser.compare(fp1, fp2, { weights });
      
      expect(result.details.parts.hardware.weight).toBe(0.5);
      expect(result.details.parts.software.weight).toBe(0.3);
      expect(result.details.parts.visual.weight).toBe(0.2);
    });

    it('should throw error if fingerprints are missing', () => {
      const fp = { hash1: 'abc', hash2: 'def', hash3: 'ghi' };
      
      expect(() => whouser.compare(null, fp)).toThrow('Both fingerprints are required');
      expect(() => whouser.compare(fp, null)).toThrow('Both fingerprints are required');
      expect(() => whouser.compare({}, {})).toThrow('Fingerprints must contain hash1, hash2, and hash3');
    });

    it('should match identical fingerprints', async () => {
      const fp1 = await whouser.getFingerprint();
      const fp2 = await whouser.getFingerprint(); // Same cached version
      
      const result = whouser.compare(fp1, fp2);
      expect(result.score).toBe(1);
      expect(result.match).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete fingerprint collection within reasonable time', async () => {
      const start = performance.now();
      await whouser.getFingerprint();
      const duration = performance.now() - start;
      
      // Should complete within 3 seconds (default timeout)
      expect(duration).toBeLessThan(3000);
    });
  });
});

/**
 * Setup mock browser APIs for testing environment
 */
function setupMocks() {
  // Mock window.screen
  if (!global.window) {
    global.window = {};
  }
  global.window.screen = {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24,
    availWidth: 1920,
    availHeight: 1040,
    orientation: { type: 'landscape-primary' }
  };

  // Mock navigator
  global.navigator = {
    hardwareConcurrency: 8,
    deviceMemory: 8,
    platform: 'MacIntel',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'en-US',
    languages: ['en-US', 'en'],
    cookieEnabled: true,
    doNotTrack: '1',
    vendor: 'Google Inc.',
    plugins: [],
    mimeTypes: [],
    getBattery: vi.fn().mockResolvedValue({
      level: 0.8,
      charging: true,
      chargingTime: 100,
      dischargingTime: 600
    }),
    storage: {
      estimate: vi.fn().mockResolvedValue({
        quota: 1000000000,
        usage: 50000000
      })
    },
    maxTouchPoints: 0,
    touchPoints: 0
  };

  // Mock document
  if (!global.document) {
    global.document = {};
  }
  global.document.createElement = vi.fn((tag) => {
    if (tag === 'canvas') {
      return {
        getContext: vi.fn((type) => {
          if (type === 'webgl' || type === 'experimental-webgl') {
            return {
              getExtension: vi.fn(() => ({
                UNMASKED_VENDOR_WEBGL: 'WebGLVendor',
                UNMASKED_RENDERER_WEBGL: 'WebGLRenderer'
              })),
              getParameter: vi.fn(() => 'Test'),
              getSupportedExtensions: vi.fn(() => ['EXT_texture_filter_anisotropic']),
              MAX_TEXTURE_SIZE: 16384,
              MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
              MAX_RENDERBUFFER_SIZE: 16384,
              MAX_VIEWPORT_DIMS: [16384, 16384],
              MAX_VERTEX_ATTRIBS: 16,
              MAX_VERTEX_UNIFORM_VECTORS: 4096,
              MAX_FRAGMENT_UNIFORM_VECTORS: 4096,
              MAX_VARYING_VECTORS: 30,
              MAX_COMBINED_TEXTURE_IMAGE_UNITS: 80,
              ALIASED_LINE_WIDTH_RANGE: [1, 10],
              ALIASED_POINT_SIZE_RANGE: [1, 1024],
              clearColor: vi.fn(),
              clear: vi.fn(),
              createShader: vi.fn(() => ({})),
              shaderSource: vi.fn(),
              compileShader: vi.fn(),
              createProgram: vi.fn(() => ({})),
              attachShader: vi.fn(),
              linkProgram: vi.fn(),
              useProgram: vi.fn(),
              getAttribLocation: vi.fn(() => 0),
              enableVertexAttribArray: vi.fn(),
              vertexAttribPointer: vi.fn(),
              drawArrays: vi.fn(),
              createBuffer: vi.fn(() => ({})),
              bindBuffer: vi.fn(),
              bufferData: vi.fn()
            };
          }
          if (type === '2d') {
            return {
              fillStyle: '',
              fillRect: vi.fn(),
              fillText: vi.fn(),
              beginPath: vi.fn(),
              arc: vi.fn(),
              rect: vi.fn(),
              stroke: vi.fn(),
              strokeStyle: '',
              lineWidth: 0,
              moveTo: vi.fn(),
              quadraticCurveTo: vi.fn(),
              getImageData: vi.fn(() => ({
                data: new Uint8ClampedArray(256 * 128 * 4)
              })),
              textBaseline: '',
              font: ''
            };
          }
          return null;
        })
      };
    }
    if (tag === 'div') {
      return {
        style: {},
        offsetWidth: 100,
        offsetHeight: 50
      };
    }
    return {};
  });

  // Mock matchMedia
  global.window.matchMedia = vi.fn(() => ({
    matches: false
  }));

  // Mock AudioContext
  global.AudioContext = vi.fn(() => ({
    createOscillator: vi.fn(() => ({
      type: '',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn()
    })),
    createAnalyser: vi.fn(() => ({
      fftSize: 2048,
      frequencyBinCount: 1024,
      getFloatFrequencyData: vi.fn((data) => {
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 100 - 50;
        }
      }),
      connect: vi.fn()
    })),
    createGain: vi.fn(() => ({
      gain: { value: 0 },
      connect: vi.fn()
    })),
    destination: {},
    close: vi.fn().mockResolvedValue()
  }));

  // Mock performance
  global.performance = {
    now: vi.fn(() => Date.now())
  };

  // Mock Intl
  global.Intl = {
    DateTimeFormat: vi.fn(() => ({
      resolvedOptions: vi.fn(() => ({
        timeZone: 'America/New_York'
      }))
    }))
  };
}