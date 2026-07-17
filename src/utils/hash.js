// src/utils/hash.js

/**
 * Hash signals into a consistent string using a simple but effective algorithm
 * @param {any} signals - Signals to hash (object, array, string, or primitive)
 * @param {Object} options - Hash options
 * @param {string} options.salt - Optional salt for hash
 * @param {number} options.maxLength - Maximum length of hash string (default: 16)
 * @returns {string} Hex hash string
 */
export function hashSignals(signals, options = {}) {
  const salt = options.salt || '';
  const maxLength = options.maxLength || 16;

  // Convert signals to a normalized string
  const normalized = normalizeSignals(signals);
  
  // Add salt
  const data = normalized + salt;
  
  // Generate hash using a simple but effective algorithm
  const hash = murmurHash3(data);
  
  // Return as hex string with fixed length
  return hash.toString(16).padStart(8, '0').slice(0, maxLength);
}

/**
 * Normalize signals to a consistent string representation
 * @param {any} signals - Signals to normalize
 * @returns {string} Normalized string
 */
function normalizeSignals(signals) {
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
 * Simple but effective hash function (MurmurHash3-inspired)
 * @param {string} str - Input string
 * @param {number} seed - Seed value (default: 0)
 * @returns {number} 32-bit unsigned integer
 */
function murmurHash3(str, seed = 0) {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const len = str.length;
  const blocks = Math.floor(len / 4);

  // Process 4-byte blocks
  for (let i = 0; i < blocks; i++) {
    let k1 = 0;
    for (let j = 0; j < 4; j++) {
      const charCode = str.charCodeAt(i * 4 + j);
      k1 |= (charCode & 0xff) << (j * 8);
    }

    k1 = mul32(k1, c1);
    k1 = rotl32(k1, 15);
    k1 = mul32(k1, c2);

    h1 ^= k1;
    h1 = rotl32(h1, 13);
    h1 = mul32(h1, 5) + 0xe6546b64;
  }

  // Process remaining bytes
  let k1 = 0;
  const tail = len % 4;
  for (let i = 0; i < tail; i++) {
    const charCode = str.charCodeAt(blocks * 4 + i);
    k1 ^= (charCode & 0xff) << (i * 8);
  }
  if (tail > 0) {
    k1 = mul32(k1, c1);
    k1 = rotl32(k1, 15);
    k1 = mul32(k1, c2);
    h1 ^= k1;
  }

  // Finalization
  h1 ^= len;
  h1 = fmix32(h1);

  return h1 >>> 0; // Convert to unsigned 32-bit
}

/**
 * 32-bit multiplication with proper overflow handling
 */
function mul32(a, b) {
  return (a * b) >>> 0;
}

/**
 * 32-bit left rotation
 */
function rotl32(x, r) {
  return ((x << r) | (x >>> (32 - r))) >>> 0;
}

/**
 * Finalization mix function
 */
function fmix32(h) {
  h ^= h >>> 16;
  h = mul32(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = mul32(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Alternative: simple hash for quick use (less collision-resistant)
 * @param {any} data - Data to hash
 * @returns {string} Simple hex hash
 */
export function simpleHash(data) {
  let str = data;
  if (typeof data !== 'string') {
    try {
      str = JSON.stringify(data);
    } catch (e) {
      str = String(data);
    }
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}