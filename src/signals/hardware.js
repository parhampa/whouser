import { safeExecute, normalizeValue } from '../utils/helpers.js';

/**
 * Get screen dimensions and color depth
 */
function getScreenInfo() {
  if (typeof screen === 'undefined') {
    return { width: 0, height: 0, colorDepth: 0, pixelDepth: 0 };
  }
  return {
    width: screen.width || 0,
    height: screen.height || 0,
    colorDepth: screen.colorDepth || 0,
    pixelDepth: screen.pixelDepth || 0,
    availWidth: screen.availWidth || 0,
    availHeight: screen.availHeight || 0,
  };
}

/**
 * Get CPU cores (with fallback)
 */
function getCpuCores() {
  if (typeof navigator === 'undefined') return 0;
  return navigator.hardwareConcurrency || 0;
}

/**
 * Get device memory (in GB)
 */
function getDeviceMemory() {
  if (typeof navigator === 'undefined') return 0;
  // @ts-ignore - deviceMemory is not standard but supported in Chrome
  return navigator.deviceMemory || 0;
}

/**
 * Get timezone offset (minutes)
 */
function getTimezone() {
  try {
    return {
      offset: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    };
  } catch (e) {
    return { offset: 0, timezone: 'unknown' };
  }
}

/**
 * Get battery status (if available)
 * Note: This API is being deprecated, but we keep it for now
 */
async function getBatteryStatus() {
  if (typeof navigator === 'undefined' || !navigator.getBattery) {
    return { level: 0, charging: false, chargingTime: 0, dischargingTime: 0 };
  }
  try {
    const battery = await navigator.getBattery();
    return {
      level: battery.level || 0,
      charging: battery.charging || false,
      chargingTime: battery.chargingTime || 0,
      dischargingTime: battery.dischargingTime || 0,
    };
  } catch (e) {
    return { level: 0, charging: false, chargingTime: 0, dischargingTime: 0 };
  }
}

/**
 * Get storage estimate (if available)
 */
async function getStorageEstimate() {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return { quota: 0, usage: 0 };
  }
  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota || 0,
      usage: estimate.usage || 0,
    };
  } catch (e) {
    return { quota: 0, usage: 0 };
  }
}

/**
 * Simple CPU benchmark using performance.now()
 * @param {number} iterations - Number of iterations (accuracy dependent)
 */
function getCpuBenchmark(iterations = 1000) {
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
    return 0;
  }

  try {
    const start = performance.now();
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    const duration = performance.now() - start;
    // Normalize to a score (higher is faster)
    // Using a baseline of 1ms for 1000 iterations on a fast machine
    const score = Math.max(0, (iterations / duration) * 10);
    return Math.round(score * 100) / 100;
  } catch (e) {
    return 0;
  }
}

/**
 * Get touch support details
 */
function getTouchSupport() {
  if (typeof window === 'undefined') {
    return { supported: false, maxTouchPoints: 0 };
  }
  return {
    supported: 'ontouchstart' in window || (navigator.maxTouchPoints > 0),
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };
}

/**
 * Get platform and OS details
 */
function getPlatformInfo() {
  if (typeof navigator === 'undefined') {
    return { platform: 'unknown', os: 'unknown' };
  }

  const platform = navigator.platform || 'unknown';
  let os = 'unknown';

  const ua = navigator.userAgent || '';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Chrome OS')) os = 'Chrome OS';

  return { platform, os };
}

/**
 * Collect hardware signals
 * @param {string} accuracy - 'fast' | 'balanced' | 'high'
 * @returns {Promise<Object>} Hardware signals
 */
export async function collect(accuracy = 'balanced') {
  const signals = {};

  // Always collect these (cheap and stable)
  signals.screen = safeExecute(getScreenInfo, { width: 0, height: 0, colorDepth: 0, pixelDepth: 0 });
  signals.cpuCores = safeExecute(getCpuCores, 0);
  signals.deviceMemory = safeExecute(getDeviceMemory, 0);
  signals.timezone = safeExecute(getTimezone, { offset: 0, timezone: 'unknown' });
  signals.touchSupport = safeExecute(getTouchSupport, { supported: false, maxTouchPoints: 0 });
  signals.platform = safeExecute(getPlatformInfo, { platform: 'unknown', os: 'unknown' });

  // Battery and storage are async and may be slow
  if (accuracy === 'fast') {
    // Skip battery and storage in fast mode, use defaults
    signals.battery = { level: 0, charging: false, chargingTime: 0, dischargingTime: 0 };
    signals.storage = { quota: 0, usage: 0 };
    signals.cpuBenchmark = 0; // Skip benchmark in fast mode
  } else if (accuracy === 'balanced') {
    // Collect but with timeout protection (already handled by safeExecute)
    signals.battery = await safeExecute(getBatteryStatus, { level: 0, charging: false, chargingTime: 0, dischargingTime: 0 });
    signals.storage = await safeExecute(getStorageEstimate, { quota: 0, usage: 0 });
    signals.cpuBenchmark = safeExecute(() => getCpuBenchmark(1000), 0);
  } else { // 'high'
    signals.battery = await safeExecute(getBatteryStatus, { level: 0, charging: false, chargingTime: 0, dischargingTime: 0 });
    signals.storage = await safeExecute(getStorageEstimate, { quota: 0, usage: 0 });
    signals.cpuBenchmark = safeExecute(() => getCpuBenchmark(5000), 0); // More iterations for accuracy
  }

  // Additional signal: whether browser is in private/incognito mode (if possible)
  // This is a heuristic, not guaranteed
  signals.isPrivate = safeExecute(() => {
    // @ts-ignore - check for private browsing (varies by browser)
    return !!window.webkitRequestFileSystem || 
           // @ts-ignore
           (typeof window.safari !== 'undefined' && window.safari.self === window && !window.safari.pushNotification);
  }, false);

  // Device orientation (for mobile)
  signals.orientation = safeExecute(() => {
    if (typeof window === 'undefined' || typeof window.screen === 'undefined') return 'unknown';
    return window.screen.orientation ? window.screen.orientation.type : 'unknown';
  }, 'unknown');

  return signals;
}

// Export individual functions for testing
export {
  getScreenInfo,
  getCpuCores,
  getDeviceMemory,
  getTimezone,
  getBatteryStatus,
  getStorageEstimate,
  getCpuBenchmark,
  getTouchSupport,
  getPlatformInfo,
};
