/**
 * Execute a function safely with try-catch and return fallback on error
 * @param {Function} fn - Function to execute
 * @param {*} fallback - Value to return if function throws
 * @param {...any} args - Arguments to pass to the function
 * @returns {*} Result of function or fallback
 */
export function safeExecute(fn, fallback = null, ...args) {
  try {
    const result = fn(...args);
    // If result is a Promise, handle it properly
    if (result && typeof result.then === 'function') {
      return result.catch(() => fallback);
    }
    return result !== undefined && result !== null ? result : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Normalize a value for comparison (trim, lowercase, remove extra spaces)
 * @param {string} value - Value to normalize
 * @returns {string} Normalized value
 */
export function normalizeValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Deep merge two objects (non-destructive)
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  if (!target || typeof target !== 'object') return source;
  if (!source || typeof source !== 'object') return target;

  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Memoize a function with a simple cache (using Map)
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Optional function to generate cache key (default: JSON.stringify(args))
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyGenerator = null) {
  const cache = new Map();
  return function (...args) {
    const key = keyGenerator ? keyGenerator(args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Check if code is running in a browser environment
 * @returns {boolean}
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if code is running in Node.js environment
 * @returns {boolean}
 */
export function isNode() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}

/**
 * Throttle a function (limit execution rate)
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum time between executions (ms)
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 250) {
  let inThrottle = false;
  let lastResult = null;
  return function (...args) {
    if (!inThrottle) {
      lastResult = fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * Debounce a function (delay execution until after pause)
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 250) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        const result = fn(...args);
        timeoutId = null;
        resolve(result);
      }, delay);
    });
  };
}

/**
 * Generate a random ID (for debugging or tracking)
 * @param {number} length - Length of the ID (default: 8)
 * @returns {string} Random ID
 */
export function getRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sleep for a given duration (useful for async delays)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a value is a plain object (not null, array, or function)
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safely stringify an object (handles circular references)
 * @param {Object} obj - Object to stringify
 * @returns {string} JSON string
 */
export function safeStringify(obj) {
  const seen = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

// Default export with all functions for convenience
export default {
  safeExecute,
  normalizeValue,
  deepMerge,
  memoize,
  isBrowser,
  isNode,
  throttle,
  debounce,
  getRandomId,
  sleep,
  isPlainObject,
  safeStringify,
};
