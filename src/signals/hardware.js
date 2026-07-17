// src/signals/hardware.js

/**
 * Collect hardware-related signals for fingerprinting
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in ms for each signal
 * @returns {Promise<Object>} Hardware signals
 */
export async function getHardwareSignals(options = {}) {
  const timeout = options.timeout || 3000;

  const signals = {};

  try {
    // Screen information
    signals.screen = safeExecute(() => ({
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      orientation: window.screen.orientation?.type || 'unknown'
    }), {});

    // Navigator hardware info
    signals.navigator = safeExecute(() => ({
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent || 'unknown',
      language: navigator.language || 'unknown',
      languages: navigator.languages || []
    }), {});

    // Battery status (async with timeout)
    try {
      const battery = await Promise.race([
        navigator.getBattery(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Battery timeout')), timeout))
      ]);
      signals.battery = {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (e) {
      signals.battery = { error: 'unavailable' };
    }

    // Storage estimate (modern API)
    try {
      const storage = await Promise.race([
        navigator.storage?.estimate(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), timeout))
      ]);
      if (storage) {
        signals.storage = {
          quota: storage.quota,
          usage: storage.usage
        };
      }
    } catch (e) {
      signals.storage = { error: 'unavailable' };
    }

    // Touch support
    signals.touch = safeExecute(() => ({
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvent: 'ontouchstart' in window,
      touchPoints: navigator.touchPoints || 'unknown'
    }), {});

    // GPU info via WebGL
    signals.gpu = safeExecute(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { error: 'webgl not supported' };
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return { error: 'no debug info' };
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    }, {});

    // Timezone offset
    signals.timezone = safeExecute(() => ({
      offset: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }), {});

    return signals;

  } catch (error) {
    console.error('Hardware signals collection failed:', error);
    return signals; // Return whatever we collected
  }
}

/**
 * Safe execution wrapper to prevent crashes
 */
function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}