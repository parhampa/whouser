import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  collect,
  getScreenInfo,
  getCpuCores,
  getDeviceMemory,
  getTimezone,
  getBatteryStatus,
  getStorageEstimate,
  getCpuBenchmark,
  getTouchSupport,
  getPlatformInfo,
} from '../../src/signals/hardware.js';
import { resetMocks } from '../setup.js';

describe('Hardware Signals', () => {
  beforeEach(() => {
    resetMocks();
    // Reset performance.now mock for each test
    vi.spyOn(performance, 'now').mockImplementation(() => {
      // Return increasing values to simulate time passing
      let time = 0;
      return () => {
        time += 1;
        return time;
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getScreenInfo', () => {
    it('should return screen dimensions and color depth', () => {
      const info = getScreenInfo();
      expect(info).toEqual({
        width: 1920,
        height: 1080,
        colorDepth: 24,
        pixelDepth: 24,
        availWidth: 1920,
        availHeight: 1040,
      });
    });

    it('should return zeros if screen is undefined', () => {
      const originalScreen = global.screen;
      delete global.screen;
      const info = getScreenInfo();
      expect(info).toEqual({
        width: 0,
        height: 0,
        colorDepth: 0,
        pixelDepth: 0,
        availWidth: 0,
        availHeight: 0,
      });
      global.screen = originalScreen;
    });
  });

  describe('getCpuCores', () => {
    it('should return hardware concurrency', () => {
      navigator.hardwareConcurrency = 8;
      expect(getCpuCores()).toBe(8);
    });

    it('should return 0 if navigator is undefined', () => {
      const originalNavigator = global.navigator;
      delete global.navigator;
      expect(getCpuCores()).toBe(0);
      global.navigator = originalNavigator;
    });
  });

  describe('getDeviceMemory', () => {
    it('should return device memory in GB', () => {
      navigator.deviceMemory = 8;
      expect(getDeviceMemory()).toBe(8);
    });

    it('should return 0 if navigator.deviceMemory is not available', () => {
      delete navigator.deviceMemory;
      expect(getDeviceMemory()).toBe(0);
    });
  });

  describe('getTimezone', () => {
    it('should return timezone offset and name', () => {
      const tz = getTimezone();
      expect(tz).toHaveProperty('offset');
      expect(typeof tz.offset).toBe('number');
      expect(tz).toHaveProperty('timezone');
      expect(typeof tz.timezone).toBe('string');
    });

    it('should handle errors gracefully', () => {
      // Force error by making Date throw
      const originalDate = global.Date;
      global.Date = function () {
        throw new Error('Date error');
      };
      const tz = getTimezone();
      expect(tz).toEqual({ offset: 0, timezone: 'unknown' });
      global.Date = originalDate;
    });
  });

  describe('getBatteryStatus', () => {
    it('should return battery information when API is available', async () => {
      const mockBattery = {
        level: 0.75,
        charging: true,
        chargingTime: 0,
        dischargingTime: 3600,
      };
      navigator.getBattery = vi.fn().mockResolvedValue(mockBattery);

      const status = await getBatteryStatus();
      expect(status).toEqual({
        level: 0.75,
        charging: true,
        chargingTime: 0,
        dischargingTime: 3600,
      });
      expect(navigator.getBattery).toHaveBeenCalled();
    });

    it('should return default values if getBattery is not available', async () => {
      delete navigator.getBattery;
      const status = await getBatteryStatus();
      expect(status).toEqual({
        level: 0,
        charging: false,
        chargingTime: 0,
        dischargingTime: 0,
      });
    });

    it('should handle errors from getBattery', async () => {
      navigator.getBattery = vi.fn().mockRejectedValue(new Error('Battery error'));
      const status = await getBatteryStatus();
      expect(status).toEqual({
        level: 0,
        charging: false,
        chargingTime: 0,
        dischargingTime: 0,
      });
    });
  });

  describe('getStorageEstimate', () => {
    it('should return storage estimate when API is available', async () => {
      const mockEstimate = {
        quota: 10000000000,
        usage: 5000000000,
      };
      navigator.storage = {
        estimate: vi.fn().mockResolvedValue(mockEstimate),
      };

      const estimate = await getStorageEstimate();
      expect(estimate).toEqual({
        quota: 10000000000,
        usage: 5000000000,
      });
      expect(navigator.storage.estimate).toHaveBeenCalled();
    });

    it('should return default values if storage API is not available', async () => {
      delete navigator.storage;
      const estimate = await getStorageEstimate();
      expect(estimate).toEqual({ quota: 0, usage: 0 });
    });

    it('should handle errors from storage.estimate', async () => {
      navigator.storage = {
        estimate: vi.fn().mockRejectedValue(new Error('Storage error')),
      };
      const estimate = await getStorageEstimate();
      expect(estimate).toEqual({ quota: 0, usage: 0 });
    });
  });

  describe('getCpuBenchmark', () => {
    it('should return a benchmark score', () => {
      // Mock performance.now to simulate elapsed time
      const timeMock = vi.fn()
        .mockReturnValueOnce(0)  // start
        .mockReturnValueOnce(5); // end (5ms elapsed)
      performance.now = timeMock;

      const score = getCpuBenchmark(1000);
      // Score = (1000 / 5) * 10 = 2000
      expect(score).toBeCloseTo(2000, 1);
    });

    it('should return 0 if performance.now is not available', () => {
      const originalPerformance = global.performance;
      delete global.performance;

      const score = getCpuBenchmark(1000);
      expect(score).toBe(0);

      global.performance = originalPerformance;
    });

    it('should handle errors gracefully', () => {
      // Force error by making Math operations throw
      const originalSqrt = Math.sqrt;
      Math.sqrt = () => { throw new Error('Math error'); };

      const score = getCpuBenchmark(1000);
      expect(score).toBe(0);

      Math.sqrt = originalSqrt;
    });

    it('should use more iterations for high accuracy', () => {
      // We can test by spy on the loop count indirectly
      const spy = vi.spyOn(Math, 'sqrt');
      performance.now = vi.fn()
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(10);

      getCpuBenchmark(5000);
      // sqrt should be called 5000 times
      expect(spy).toHaveBeenCalledTimes(5000);
      spy.mockRestore();
    });
  });

  describe('getTouchSupport', () => {
    it('should detect touch support from ontouchstart', () => {
      window.ontouchstart = () => {};
      const support = getTouchSupport();
      expect(support.supported).toBe(true);
    });

    it('should detect touch support from maxTouchPoints', () => {
      delete window.ontouchstart;
      navigator.maxTouchPoints = 5;
      const support = getTouchSupport();
      expect(support.supported).toBe(true);
      expect(support.maxTouchPoints).toBe(5);
    });

    it('should return false when touch is not supported', () => {
      delete window.ontouchstart;
      navigator.maxTouchPoints = 0;
      const support = getTouchSupport();
      expect(support.supported).toBe(false);
      expect(support.maxTouchPoints).toBe(0);
    });
  });

  describe('getPlatformInfo', () => {
    it('should detect Windows OS from userAgent', () => {
      navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const info = getPlatformInfo();
      expect(info.os).toBe('Windows');
    });

    it('should detect macOS from userAgent', () => {
      navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      const info = getPlatformInfo();
      expect(info.os).toBe('macOS');
    });

    it('should detect Linux from userAgent', () => {
      navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64)';
      const info = getPlatformInfo();
      expect(info.os).toBe('Linux');
    });

    it('should detect Android from userAgent', () => {
      navigator.userAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G998B)';
      const info = getPlatformInfo();
      expect(info.os).toBe('Android');
    });

    it('should detect iOS from userAgent', () => {
      navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const info = getPlatformInfo();
      expect(info.os).toBe('iOS');
    });

    it('should return unknown for unrecognized userAgent', () => {
      navigator.userAgent = 'Some weird browser';
      const info = getPlatformInfo();
      expect(info.os).toBe('unknown');
    });
  });

  describe('collect()', () => {
    it('should collect hardware signals in balanced mode (default)', async () => {
      // Mock async functions to avoid real API calls
      const mockBattery = { level: 0.8, charging: true, chargingTime: 0, dischargingTime: 3600 };
      const mockStorage = { quota: 10000000000, usage: 5000000000 };
      navigator.getBattery = vi.fn().mockResolvedValue(mockBattery);
      navigator.storage = { estimate: vi.fn().mockResolvedValue(mockStorage) };

      const signals = await collect('balanced');

      expect(signals).toHaveProperty('screen');
      expect(signals.screen).toHaveProperty('width', 1920);
      expect(signals).toHaveProperty('cpuCores', 8);
      expect(signals).toHaveProperty('deviceMemory', 8);
      expect(signals).toHaveProperty('timezone');
      expect(signals).toHaveProperty('touchSupport');
      expect(signals).toHaveProperty('platform');
      expect(signals).toHaveProperty('battery');
      expect(signals.battery).toHaveProperty('level', 0.8);
      expect(signals).toHaveProperty('storage');
      expect(signals.storage).toHaveProperty('quota', 10000000000);
      expect(signals).toHaveProperty('cpuBenchmark');
      expect(signals).toHaveProperty('isPrivate');
      expect(signals).toHaveProperty('orientation');
    });

    it('should skip battery, storage, and benchmark in fast mode', async () => {
      const signals = await collect('fast');

      expect(signals).toHaveProperty('battery');
      expect(signals.battery).toEqual({ level: 0, charging: false, chargingTime: 0, dischargingTime: 0 });
      expect(signals).toHaveProperty('storage');
      expect(signals.storage).toEqual({ quota: 0, usage: 0 });
      expect(signals).toHaveProperty('cpuBenchmark', 0);
    });

    it('should collect battery, storage, and benchmark in balanced mode', async () => {
      const mockBattery = { level: 0.8, charging: true, chargingTime: 0, dischargingTime: 3600 };
      const mockStorage = { quota: 10000000000, usage: 5000000000 };
      navigator.getBattery = vi.fn().mockResolvedValue(mockBattery);
      navigator.storage = { estimate: vi.fn().mockResolvedValue(mockStorage) };

      const signals = await collect('balanced');

      expect(signals.battery).toHaveProperty('level', 0.8);
      expect(signals.storage).toHaveProperty('quota', 10000000000);
      expect(signals.cpuBenchmark).toBeGreaterThan(0);
    });

    it('should use more iterations for CPU benchmark in high mode', async () => {
      const spy = vi.spyOn(Math, 'sqrt');
      performance.now = vi.fn()
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);

      navigator.getBattery = vi.fn().mockResolvedValue({});
      navigator.storage = { estimate: vi.fn().mockResolvedValue({}) };

      await collect('high');

      // In high mode, benchmark should use 5000 iterations
      expect(spy).toHaveBeenCalledTimes(5000);
      spy.mockRestore();
    });

    it('should handle errors in async functions gracefully', async () => {
      // Force getBattery to fail
      navigator.getBattery = vi.fn().mockRejectedValue(new Error('Battery error'));
      navigator.storage = { estimate: vi.fn().mockRejectedValue(new Error('Storage error')) };

      const signals = await collect('balanced');
      expect(signals.battery).toEqual({ level: 0, charging: false, chargingTime: 0, dischargingTime: 0 });
      expect(signals.storage).toEqual({ quota: 0, usage: 0 });
    });

    it('should detect private browsing heuristic', async () => {
      // Simulate private browsing in Safari (heuristic)
      window.webkitRequestFileSystem = true;
      const signals = await collect('balanced');
      expect(signals.isPrivate).toBe(true);

      // Reset
      delete window.webkitRequestFileSystem;
      const signals2 = await collect('balanced');
      expect(signals2.isPrivate).toBe(false);
    });

    it('should detect orientation on mobile', async () => {
      window.screen.orientation = { type: 'portrait-primary' };
      const signals = await collect('balanced');
      expect(signals.orientation).toBe('portrait-primary');

      delete window.screen.orientation;
      const signals2 = await collect('balanced');
      expect(signals2.orientation).toBe('unknown');
    });
  });
});
