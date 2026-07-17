// src/utils/helpers.js

/**
 * Safely execute a function and return fallback if it fails
 * @param {Function} fn - Function to execute
 * @param {any} fallback - Value to return if function throws
 * @returns {any} Result of fn or fallback
 */
export function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

/**
 * Safely execute an async function with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {any} fallback - Value to return on timeout or error
 * @returns {Promise<any>} Result of fn or fallback
 */
export async function safeAsyncExecute(fn, timeout = 3000, fallback = null) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
  } catch (e) {
    return fallback;
  }
}

/**
 * Normalize signals to a consistent string representation
 * @param {any} signals - Signals to normalize
 * @returns {string} Normalized string
 */
export function normalizeSignals(signals) {
  if (signals === null || signals === undefined) {
    return 'null';
  }

  if (typeof signals === 'string') {
    return signals;
  }

  if (typeof signals === 'number' || typeof signals === 'boolean') {
    return String(signals);
  }

  if (Array.isArray(signals)) {
    return signals.map(item => normalizeSignals(item)).join('|');
  }

  if (typeof signals === 'object') {
    // Sort keys to ensure consistent order
    const keys = Object.keys(signals).sort();
    const parts = keys.map(key => {
      const value = normalizeSignals(signals[key]);
      return `${key}:${value}`;
    });
    return `{${parts.join(',')}}`;
  }

  return String(signals);
}

/**
 * Check if a value is a plain object (not array, null, etc.)
 * @param {any} value - Value to check
 * @returns {boolean} True if plain object
 */
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep merge two objects (non-destructive)
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isPlainObject(source[key]) && isPlainObject(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Generate a random salt string
 * @param {number} length - Length of salt (default: 8)
 * @returns {string} Random salt
 */
export function generateSalt(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Truncate a string to maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export function truncateString(str, maxLength = 100, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Get a nested property from an object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @param {any} fallback - Fallback value if path not found
 * @returns {any} Property value or fallback
 */
export function getNestedProperty(obj, path, fallback = null) {
  try {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return fallback;
      current = current[part];
    }
    return current !== undefined ? current : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Check if running in a browser environment
 * @returns {boolean} True if in browser
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if running in Node.js environment
 * @returns {boolean} True if in Node.js
 */
export function isNode() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}

/**
 * Generate a random UUID (v4) - only for internal use
 * @returns {string} UUID string
 */
export function generateUUID() {
  if (isBrowser() && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Debounce a function call
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function call
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}