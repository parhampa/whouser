// src/utils/matching.js

/**
 * Fuzzy matching between two fingerprints using Jaccard similarity and weighted scoring
 * @param {Object} fp1 - First fingerprint with hash1, hash2, hash3 and optionally raw signals
 * @param {Object} fp2 - Second fingerprint with hash1, hash2, hash3 and optionally raw signals
 * @param {Object} options - Matching options
 * @param {Array<number>} options.weights - Weights for each part [hw, sw, vis] (default: [0.4, 0.3, 0.3])
 * @param {number} options.threshold - Minimum score to consider a match (default: 0.7)
 * @param {boolean} options.useRaw - Use raw signals for deeper comparison if available (default: true)
 * @returns {Object} { score, match, details }
 */
export function fuzzyMatch(fp1, fp2, options = {}) {
  const weights = options.weights || [0.4, 0.3, 0.3];
  const threshold = options.threshold || 0.7;
  const useRaw = options.useRaw !== undefined ? options.useRaw : true;

  // Validate inputs
  if (!fp1 || !fp2) {
    throw new Error('Both fingerprints are required for comparison');
  }

  // Validate that we have at least hash1, hash2, hash3
  if (!fp1.hash1 || !fp1.hash2 || !fp1.hash3 || !fp2.hash1 || !fp2.hash2 || !fp2.hash3) {
    throw new Error('Fingerprints must contain hash1, hash2, and hash3');
  }

  const details = {
    parts: {
      hardware: { score: 0, weight: weights[0] },
      software: { score: 0, weight: weights[1] },
      visual: { score: 0, weight: weights[2] }
    }
  };

  // Calculate similarity for each part
  let totalWeight = 0;
  let weightedScore = 0;

  // Hardware part (hash1)
  const hwScore = calculateSimilarity(fp1.hash1, fp2.hash1, 
    useRaw && fp1.raw?.hardware && fp2.raw?.hardware ? [fp1.raw.hardware, fp2.raw.hardware] : null
  );
  details.parts.hardware.score = hwScore;
  weightedScore += hwScore * weights[0];
  totalWeight += weights[0];

  // Software part (hash2)
  const swScore = calculateSimilarity(fp1.hash2, fp2.hash2,
    useRaw && fp1.raw?.software && fp2.raw?.software ? [fp1.raw.software, fp2.raw.software] : null
  );
  details.parts.software.score = swScore;
  weightedScore += swScore * weights[1];
  totalWeight += weights[1];

  // Visual part (hash3)
  const visScore = calculateSimilarity(fp1.hash3, fp2.hash3,
    useRaw && fp1.raw?.visual && fp2.raw?.visual ? [fp1.raw.visual, fp2.raw.visual] : null
  );
  details.parts.visual.score = visScore;
  weightedScore += visScore * weights[2];
  totalWeight += weights[2];

  // Normalize final score
  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  details.totalScore = finalScore;
  details.match = finalScore >= threshold;

  return {
    score: finalScore,
    match: finalScore >= threshold,
    details
  };
}

/**
 * Calculate similarity between two values (strings, objects, or arrays)
 * @param {string|Object|Array} value1 - First value
 * @param {string|Object|Array} value2 - Second value
 * @param {Array<Object>} rawSignals - Optional raw signals for deeper comparison
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(value1, value2, rawSignals = null) {
  // If both are strings, use string similarity
  if (typeof value1 === 'string' && typeof value2 === 'string') {
    return stringSimilarity(value1, value2);
  }

  // If both are objects or arrays, use structural similarity
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    // If raw signals are provided, use them for deeper comparison
    if (rawSignals && rawSignals.length === 2) {
      const raw1 = rawSignals[0];
      const raw2 = rawSignals[1];
      
      // Compare raw signals using Jaccard similarity on their keys
      if (raw1 && raw2 && typeof raw1 === 'object' && typeof raw2 === 'object') {
        const keys1 = Object.keys(raw1).filter(k => typeof raw1[k] !== 'function');
        const keys2 = Object.keys(raw2).filter(k => typeof raw2[k] !== 'function');
        
        if (keys1.length > 0 || keys2.length > 0) {
          return jaccardSimilarity(keys1, keys2);
        }
      }
    }
    
    // Fallback to JSON string comparison
    return stringSimilarity(
      JSON.stringify(value1),
      JSON.stringify(value2)
    );
  }

  // If types don't match, return 0
  if (typeof value1 !== typeof value2) {
    return 0;
  }

  // Fallback: exact equality
  return value1 === value2 ? 1 : 0;
}

/**
 * Jaccard similarity between two sets (arrays)
 * @param {Array} set1 - First set
 * @param {Array} set2 - Second set
 * @returns {number} Similarity score between 0 and 1
 */
function jaccardSimilarity(set1, set2) {
  if (!set1 || !set2 || set1.length === 0 || set2.length === 0) {
    return 0;
  }

  const set1Set = new Set(set1);
  const set2Set = new Set(set2);
  
  const intersection = new Set([...set1Set].filter(x => set2Set.has(x)));
  const union = new Set([...set1Set, ...set2Set]);
  
  return intersection.size / union.size;
}

/**
 * String similarity using Levenshtein distance (normalized)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function stringSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  // If strings are different types, convert to strings
  const s1 = String(str1);
  const s2 = String(str2);

  // Calculate Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  // Use shorter length for max distance
  const maxLen = Math.max(len1, len2);
  const distance = levenshteinDistance(s1, s2);
  
  // Normalize to similarity score (1 - normalized distance)
  return 1 - (distance / maxLen);
}

/**
 * Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}