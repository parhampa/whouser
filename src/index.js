import Fingerprint from './fingerprint.js';

/**
 * Main Whouser class - Browser fingerprinting with fuzzy matching
 * 
 * @example
 * const whouser = new Whouser({ accuracy: 'balanced', threshold: 0.7 });
 * const fp = await whouser.getFingerprint();
 * const isSame = whouser.compare(fp1, fp2).match;
 */
class Whouser {
  /**
   * @param {Object} options
   * @param {string} options.accuracy - 'fast' | 'balanced' | 'high' (default: 'balanced')
   * @param {number} options.threshold - Matching threshold 0-1 (default: 0.7)
   * @param {Object} options.weights - Custom weights for hardware/software/visual
   */
  constructor(options = {}) {
    // Forward all options to Fingerprint instance
    this._fp = new Fingerprint({
      accuracy: options.accuracy || 'balanced',
      threshold: options.threshold ?? 0.7,
      weights: options.weights || { hardware: 0.4, software: 0.3, visual: 0.3 },
    });
  }

  /**
   * Generate a complete fingerprint (hash + raw signals)
   * @returns {Promise<Object>} Fingerprint object
   */
  async getFingerprint() {
    return this._fp.generate();
  }

  /**
   * Compare two fingerprints with fuzzy logic
   * @param {Object} fp1 - First fingerprint
   * @param {Object} fp2 - Second fingerprint
   * @param {Object} options - Optional overrides for threshold/weights
   * @returns {Object} { score, match, details }
   */
  compare(fp1, fp2, options = {}) {
    return this._fp.compare(fp1, fp2, options);
  }

  /**
   * Change accuracy level after instantiation
   * @param {string} level - 'fast' | 'balanced' | 'high'
   * @returns {this} For chaining
   */
  setAccuracy(level) {
    this._fp.setAccuracy(level);
    return this;
  }

  /**
   * Get current configuration
   * @returns {Object} { accuracy, threshold, weights }
   */
  getConfig() {
    return {
      accuracy: this._fp.accuracy,
      threshold: this._fp.threshold,
      weights: this._fp.weights,
    };
  }
}

// Export both default and named for flexibility
export default Whouser;
export { Fingerprint, Whouser };
