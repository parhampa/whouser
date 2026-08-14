/**
 * MurmurHash3 implementation (x86 32-bit)
 * Fast non-cryptographic hash with good distribution
 * Based on original MurmurHash3 by Austin Appleby
 */

export function murmurHash3(key, seed = 0) {
  if (typeof key === 'string') {
    // Convert string to bytes (UTF-8)
    const bytes = [];
    for (let i = 0; i < key.length; i++) {
      const charCode = key.charCodeAt(i);
      if (charCode < 0x80) {
        bytes.push(charCode);
      } else if (charCode < 0x800) {
        bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
      } else if (charCode < 0xd800 || charCode >= 0xe000) {
        bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
      } else {
        // UTF-16 surrogate pair
        const nextChar = key.charCodeAt(i + 1);
        if (nextChar >= 0xdc00 && nextChar <= 0xdfff) {
          const codePoint = ((charCode & 0x3ff) << 10) + (nextChar & 0x3ff) + 0x10000;
          bytes.push(
            0xf0 | (codePoint >> 18),
            0x80 | ((codePoint >> 12) & 0x3f),
            0x80 | ((codePoint >> 6) & 0x3f),
            0x80 | (codePoint & 0x3f)
          );
          i++; // Skip surrogate pair
        } else {
          bytes.push(0xef, 0xbf, 0xbd); // Replacement character
        }
      }
    }
    key = bytes;
  }

  // Ensure key is Uint8Array for consistent processing
  const data = key instanceof Uint8Array ? key : new Uint8Array(key);
  const len = data.length;
  const nblocks = Math.floor(len / 4);

  let h1 = seed;

  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  // Body
  for (let i = 0; i < nblocks; i++) {
    const offset = i * 4;
    let k1 = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);

    k1 = Math.imul(k1, c1);
    k1 = ((k1 << 15) | (k1 >>> 17)) & 0xffffffff;
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = ((h1 << 13) | (h1 >>> 19)) & 0xffffffff;
    h1 = Math.imul(h1, 5) + 0xe6546b64;
    h1 &= 0xffffffff;
  }

  // Tail
  const tailOffset = nblocks * 4;
  let k1 = 0;
  const remaining = len - tailOffset;

  if (remaining > 0) {
    if (remaining >= 3) k1 ^= data[tailOffset + 2] << 16;
    if (remaining >= 2) k1 ^= data[tailOffset + 1] << 8;
    if (remaining >= 1) k1 ^= data[tailOffset];
    k1 = Math.imul(k1, c1);
    k1 = ((k1 << 15) | (k1 >>> 17)) & 0xffffffff;
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }

  // Finalization
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35) & 0xffffffff;
  h1 ^= h1 >>> 16;

  // Convert to hex string (8 characters)
  const hex = (h1 >>> 0).toString(16).padStart(8, '0');
  return hex;
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use murmurHash3 directly
 */
export const MurmurHash3 = murmurHash3;

/**
 * Hash a signals object with optional seed
 * Useful for generating a fingerprint from multiple signals
 */
export function hashSignals(signals, seed = 0) {
  const json = JSON.stringify(signals);
  return murmurHash3(json, seed);
}

// Default export for convenience
export default {
  murmurHash3,
  MurmurHash3,
  hashSignals,
};
