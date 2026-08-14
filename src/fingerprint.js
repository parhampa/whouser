import { MurmurHash3 } from './utils/hash.js'; // مسیر اصلاح شد
import { safeExecute, normalizeValue } from './utils/helpers.js';
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
 * Object similarity with circular reference protection
 */
function objectSimilarity(objA, objB, fieldWeights = null, visited = new Set()) {
  if (!objA || !objB) return 0;
  
  // Prevent circular references
  if (visited.has(objA) || visited.has(objB)) return 0;
  visited.add(objA);
  visited.add(objB);

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
      sim = objectSimilarity(valA, valB, null, visited);
    } else {
      sim = valA === valB ? 1 : 0;
    }

    // Weighted fields - give higher weight to more important signals
    let weight = 1;
    if (fieldWeights && fieldWeights[key]) {
      weight = fieldWeights[key];
    } else {
      // Default weights for known important fields
      const defaultWeights = {
        // Hardware
        cpuCores: 2,
        deviceMemory: 2,
        screen: 1.5,
        timezone: 1.5,
        // Software
        fonts: 1.5,
        plugins: 1.2,
        language: 1.5,
        features: 1.2,
        // Visual
        canvas: 2,
        webgl: 2,
        audio: 1.5,
        viewport: 1.5,
      };
      if (defaultWeights[key]) weight = defaultWeights[key];
    }

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
   * @param {boolean} options.respectDoNotTrack - If true, block when DNT=1
   */
  constructor(options = {}) {
    this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.weights = {
      ...DEFAULT_WEIGHTS,
      ...(options.weights || {}),
    };
    this.accuracy = options.accuracy || 'balanced';
    this.respectDoNotTrack = options.respectDoNotTrack ?? false;
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
    // Check Do Not Track
    if (this.respectDoNotTrack && typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
      throw new Error('Fingerprinting blocked due to Do Not Track preference');
    }

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
      raw: signals,
      timestamp: Date.now(),
    };
  }

  /**
   * Compare two fingerprints with fuzzy logic
   */
  compare(fp1, fp2, options = {}) {
    const threshold = options.threshold ?? this.threshold;
    const weights = { ...this.weights, ...(options.weights || {}) };

    if (!fp1.raw || !fp2.raw) {
      const match = fp1.fullHash === fp2.fullHash;
      return {
        score: match ? 1 : 0,
        match,
        details: { method: 'fallback-exact-hash' },
      };
    }

    // Define field weights for important signals
    const fieldWeights = {
      // Hardware: CPU and memory are very stable
      cpuCores: 2,
      deviceMemory: 2,
      screen: 1.5,
      timezone: 1.5,
      platform: 1.2,
      // Software: fonts and language are fairly stable
      fonts: 1.5,
      plugins: 1.2,
      language: 1.5,
      features: 1.2,
      // Visual: canvas and webgl are highly stable
      canvas: 2,
      webgl: 2,
      audio: 1.5,
      viewport: 1.2,
    };

    const hwSim = objectSimilarity(fp1.raw.hardware, fp2.raw.hardware, fieldWeights);
    const swSim = objectSimilarity(fp1.raw.software, fp2.raw.software, fieldWeights);
    const visSim = objectSimilarity(fp1.raw.visual, fp2.raw.visual, fieldWeights);

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

  setAccuracy(level) {
    if (['fast', 'balanced', 'high'].includes(level)) {
      this.accuracy = level;
    }
    return this;
  }
}

export default Fingerprint;
