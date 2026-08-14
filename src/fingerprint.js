import { MurmurHash3 } from '../utils/hash.js';
import { safeExecute, normalizeValue } from '../utils/helpers.js';
import * as hardware from './signals/hardware.js';
import * as software from './signals/software.js';
import * as visual from './signals/visual.js';

const DEFAULT_WEIGHTS = {
  hardware: 0.4,
  software: 0.3,
  visual: 0.3,
};

const DEFAULT_THRESHOLD = 0.7;

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * String similarity (0 to 1) using Levenshtein
 */
function stringSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen;
}

/**
 * Jaccard similarity for arrays/sets
 */
function jaccardSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Numeric similarity with tolerance (relative difference)
 */
function numericSimilarity(a, b, tolerance = 0.1) {
  if (a === undefined || b === undefined) return 0;
  if (a === b) return 1;
  const diff = Math.abs(a - b);
  const maxVal = Math.max(Math.abs(a), Math.abs(b), 1);
  const relDiff = diff / maxVal;
  return Math.max(0, 1 - relDiff / tolerance);
}

/**
 * Object similarity: weighted average of field similarities
 */
function objectSimilarity(objA, objB, fieldWeights = null) {
  if (!objA || !objB) return 0;
  const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
  let totalWeight = 0;
  let weightedSum = 0;
  for (const key of keys) {
    const valA = objA[key];
    const valB = objB[key];
    let sim = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      sim = stringSimilarity(valA, valB);
    } else if (Array.isArray(valA) && Array.isArray(valB)) {
      sim = jaccardSimilarity(valA, valB);
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      sim = numericSimilarity(valA, valB);
    } else if (typeof valA === 'object' && typeof valB === 'object') {
      sim = objectSimilarity(valA, valB);
    } else {
      sim = valA === valB ? 1 : 0;
    }
    const weight = (fieldWeights && fieldWeights[key]) || 1;
    totalWeight += weight;
    weightedSum += sim * weight;
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

class Fingerprint {
  /**
   * @param {Object} options
   * @param {number} options.threshold - Matching threshold (0-1)
   * @param {Object} options.weights - Weights for hardware/software/visual
   * @param {string} options.accuracy - 'fast' | 'balanced' | 'high'
   */
  constructor(options = {}) {
    this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.weights = {
      ...DEFAULT_WEIGHTS,
      ...(options.weights || {}),
    };
    this.accuracy = options.accuracy || 'balanced';
    this._signalCollectors = {
      hardware: hardware.collect,
      software: software.collect,
      visual: visual.collect,
    };
  }

  /**
   * Generate a fingerprint (hash + raw signals)
   */
  async generate() {
    const signals = {
      hardware: await safeExecute(() => this._signalCollectors.hardware(this.accuracy), {}),
      software: await safeExecute(() => this._signalCollectors.software(this.accuracy), {}),
      visual: await safeExecute(() => this._signalCollectors.visual(this.accuracy), {}),
    };

    // Generate separate hashes for each section
    const hash1 = MurmurHash3(JSON.stringify(signals.hardware));
    const hash2 = MurmurHash3(JSON.stringify(signals.software));
    const hash3 = MurmurHash3(JSON.stringify(signals.visual));

    // Combined hash with weights
    const combined = JSON.stringify({
      h: signals.hardware,
      s: signals.software,
      v: signals.visual,
    });
    const fullHash = MurmurHash3(combined);

    return {
      hash1,
      hash2,
      hash3,
      fullHash,
      raw: signals, // <-- ذخیره‌ی سیگنال‌های خام برای fuzzy matching
      timestamp: Date.now(),
    };
  }

  /**
   * Compare two fingerprints with fuzzy logic
   * @param {Object} fp1 - First fingerprint (with raw signals)
   * @param {Object} fp2 - Second fingerprint (with raw signals)
   * @param {Object} options - Override threshold/weights
   * @returns {Object} { score, match, details }
   */
  compare(fp1, fp2, options = {}) {
    const threshold = options.threshold ?? this.threshold;
    const weights = { ...this.weights, ...(options.weights || {}) };

    // If raw signals missing, fallback to exact hash matching
    if (!fp1.raw || !fp2.raw) {
      const match = fp1.fullHash === fp2.fullHash;
      return {
        score: match ? 1 : 0,
        match,
        details: { method: 'fallback-exact-hash' },
      };
    }

    // Calculate similarity for each section
    const hwSim = objectSimilarity(fp1.raw.hardware, fp2.raw.hardware);
    const swSim = objectSimilarity(fp1.raw.software, fp2.raw.software);
    const visSim = objectSimilarity(fp1.raw.visual, fp2.raw.visual);

    // Weighted average
    const weightedScore =
      hwSim * weights.hardware +
      swSim * weights.software +
      visSim * weights.visual;

    const totalWeight = weights.hardware + weights.software + weights.visual;
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      score: finalScore,
      match: finalScore >= threshold,
      details: {
        hardwareSimilarity: hwSim,
        softwareSimilarity: swSim,
        visualSimilarity: visSim,
        threshold,
        weights,
        method: 'fuzzy-weighted',
      },
    };
  }

  /**
   * Set accuracy level (affects which signals are collected)
   */
  setAccuracy(level) {
    if (['fast', 'balanced', 'high'].includes(level)) {
      this.accuracy = level;
    }
    return this;
  }
}

export default Fingerprint;
