// src/index.js
import { getHardwareSignals } from './signals/hardware.js';
import { getSoftwareSignals } from './signals/software.js';
import { getVisualSignals } from './signals/visual.js';
import { hashSignals } from './utils/hash.js';
import { fuzzyMatch } from './utils/matching.js';

class Whouser {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 3000,
      includeTiming: options.includeTiming !== undefined ? options.includeTiming : true,
      ...options
    };
    this._cachedFingerprint = null;
    this._cachedRaw = null;
  }

  /**
   * Main method to get the full fingerprint (3-part hash)
   * @returns {Promise<Object>} { hash1, hash2, hash3, raw, timestamp }
   */
  async getFingerprint() {
    try {
      // Collect all signals in parallel
      const [hw, sw, vis] = await Promise.all([
        getHardwareSignals(this.options),
        getSoftwareSignals(this.options),
        getVisualSignals(this.options)
      ]);

      const raw = { hardware: hw, software: sw, visual: vis };
      
      // Generate 3-part hash
      const hash1 = hashSignals(hw);
      const hash2 = hashSignals(sw);
      const hash3 = hashSignals(vis);

      const result = {
        hash1,
        hash2,
        hash3,
        raw,
        timestamp: Date.now()
      };

      // Cache for later use
      this._cachedFingerprint = result;
      this._cachedRaw = raw;
      
      return result;
    } catch (error) {
      console.error('Whouser: Error generating fingerprint', error);
      throw new Error('Fingerprint generation failed');
    }
  }

  /**
   * Get raw signals without hashing (useful for debugging or custom processing)
   * @returns {Promise<Object>} raw signals object
   */
  async getRawSignals() {
    if (this._cachedRaw) {
      return this._cachedRaw;
    }
    try {
      const [hw, sw, vis] = await Promise.all([
        getHardwareSignals(this.options),
        getSoftwareSignals(this.options),
        getVisualSignals(this.options)
      ]);
      const raw = { hardware: hw, software: sw, visual: vis };
      this._cachedRaw = raw;
      return raw;
    } catch (error) {
      console.error('Whouser: Error collecting raw signals', error);
      throw new Error('Raw signal collection failed');
    }
  }

  /**
   * Compare two fingerprints using fuzzy matching
   * @param {Object} fp1 - First fingerprint object (with hash1, hash2, hash3)
   * @param {Object} fp2 - Second fingerprint object
   * @param {Object} options - weights for each part
   * @returns {Object} { score, match, details }
   */
  compare(fp1, fp2, options = { weights: [0.4, 0.3, 0.3] }) {
    if (!fp1 || !fp2) {
      throw new Error('Both fingerprints are required for comparison');
    }
    return fuzzyMatch(fp1, fp2, options);
  }

  /**
   * Clear cached fingerprint to force re-collection
   */
  clearCache() {
    this._cachedFingerprint = null;
    this._cachedRaw = null;
  }
}

export default Whouser;
export { Whouser };