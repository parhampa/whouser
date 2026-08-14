import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fingerprint from '../src/fingerprint.js';

// Mock signal collectors to return predictable data
vi.mock('../src/signals/hardware.js', () => ({
  collect: vi.fn().mockResolvedValue({
    screenWidth: 1920,
    screenHeight: 1080,
    cpuCores: 8,
    deviceMemory: 8,
    timezone: 'Asia/Tehran',
  }),
}));

vi.mock('../src/signals/software.js', () => ({
  collect: vi.fn().mockResolvedValue({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'en-US',
    fonts: ['Arial', 'Helvetica', 'Times New Roman'],
    plugins: ['Chrome PDF Plugin', 'Chrome PDF Viewer'],
  }),
}));

vi.mock('../src/signals/visual.js', () => ({
  collect: vi.fn().mockResolvedValue({
    canvasHash: 'abc123',
    webglHash: 'def456',
    audioHash: 'ghi789',
    screenResolution: '1920x1080',
  }),
}));

describe('Fingerprint', () => {
  let fp;

  beforeEach(() => {
    fp = new Fingerprint({ threshold: 0.7 });
  });

  describe('generate()', () => {
    it('should generate a fingerprint with hash and raw signals', async () => {
      const result = await fp.generate();

      expect(result).toHaveProperty('hash1');
      expect(result).toHaveProperty('hash2');
      expect(result).toHaveProperty('hash3');
      expect(result).toHaveProperty('fullHash');
      expect(result).toHaveProperty('raw');
      expect(result).toHaveProperty('timestamp');
      expect(result.raw).toHaveProperty('hardware');
      expect(result.raw).toHaveProperty('software');
      expect(result.raw).toHaveProperty('visual');
    });

    it('should produce different hashes for different signals', async () => {
      const result1 = await fp.generate();
      // Change mock to return different data
      vi.mocked((await import('../src/signals/hardware.js')).collect).mockResolvedValueOnce({
        screenWidth: 1366,
        screenHeight: 768,
        cpuCores: 4,
        deviceMemory: 4,
        timezone: 'America/New_York',
      });
      const result2 = await fp.generate();

      expect(result1.fullHash).not.toBe(result2.fullHash);
      expect(result1.hash1).not.toBe(result2.hash1);
    });
  });

  describe('compare() with fuzzy matching', () => {
    it('should return match: true when fingerprints are identical', async () => {
      const fp1 = await fp.generate();
      const fp2 = { ...fp1 }; // shallow copy is fine because we only read raw

      const result = fp.compare(fp1, fp2);
      expect(result.match).toBe(true);
      expect(result.score).toBe(1);
      expect(result.details.method).toBe('fuzzy-weighted');
    });

    it('should return match: false when fingerprints are very different', async () => {
      const fp1 = await fp.generate();
      // Create a completely different fingerprint manually
      const fp2 = {
        ...fp1,
        raw: {
          hardware: { screenWidth: 800, screenHeight: 600, cpuCores: 2, deviceMemory: 2, timezone: 'UTC' },
          software: { userAgent: 'Different', language: 'fr', fonts: ['Arial'], plugins: [] },
          visual: { canvasHash: 'xyz', webglHash: 'uvw', audioHash: 'rst', screenResolution: '800x600' },
        },
      };

      const result = fp.compare(fp1, fp2);
      expect(result.match).toBe(false);
      expect(result.score).toBeLessThan(0.5);
    });

    it('should handle partial changes (small modifications) gracefully', async () => {
      const fp1 = await fp.generate();
      // Slight modification: change only one font
      const fp2 = {
        ...fp1,
        raw: {
          ...fp1.raw,
          software: {
            ...fp1.raw.software,
            fonts: ['Arial', 'Helvetica', 'Calibri'], // changed one font
          },
        },
      };

      const result = fp.compare(fp1, fp2);
      // Should still be a match because change is minor
      expect(result.match).toBe(true);
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('should fallback to exact hash matching if raw signals missing', () => {
      const fp1 = { fullHash: 'abc123' };
      const fp2 = { fullHash: 'abc123' };
      const result = fp.compare(fp1, fp2);
      expect(result.match).toBe(true);
      expect(result.score).toBe(1);
      expect(result.details.method).toBe('fallback-exact-hash');

      const fp3 = { fullHash: 'def456' };
      const result2 = fp.compare(fp1, fp3);
      expect(result2.match).toBe(false);
      expect(result2.score).toBe(0);
    });
  });

  describe('Similarity helper functions (internal)', () => {
    // We test them indirectly via compare, but also directly by importing
    // the file and testing exported functions if they were exported.
    // Since they are internal, we'll test through objectSimilarity.
    it('should correctly calculate object similarity with mixed types', async () => {
      const fp1 = await fp.generate();
      const fp2 = { ...fp1 }; // identical

      const result = fp.compare(fp1, fp2);
      expect(result.details.hardwareSimilarity).toBeCloseTo(1, 2);
      expect(result.details.softwareSimilarity).toBeCloseTo(1, 2);
      expect(result.details.visualSimilarity).toBeCloseTo(1, 2);
    });

    it('should handle missing fields gracefully', async () => {
      const fp1 = await fp.generate();
      const fp2 = {
        ...fp1,
        raw: {
          hardware: { screenWidth: 1920 }, // missing other fields
          software: {}, // empty
          visual: null, // null
        },
      };

      const result = fp.compare(fp1, fp2);
      // Should not throw, and give a reasonable score
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1);
    });
  });

  describe('accuracy levels', () => {
    it('should accept and store accuracy level', () => {
      const fpFast = new Fingerprint({ accuracy: 'fast' });
      expect(fpFast.accuracy).toBe('fast');

      fpFast.setAccuracy('high');
      expect(fpFast.accuracy).toBe('high');

      // Invalid should be ignored
      fpFast.setAccuracy('invalid');
      expect(fpFast.accuracy).toBe('high');
    });
  });
});
