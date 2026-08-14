import { safeExecute, normalizeValue } from '../utils/helpers.js';

// Cache for expensive signals within the same session
const _cache = new Map();

/**
 * Clear visual signal cache (useful for testing)
 */
export function clearCache() {
  _cache.clear();
}

/**
 * Generate Canvas fingerprint with multiple layers for better accuracy
 * @param {string} accuracy - 'fast' | 'balanced' | 'high'
 * @returns {string} Hash or empty string on error
 */
function getCanvasFingerprint(accuracy = 'balanced') {
  const cacheKey = `canvas_${accuracy}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  try {
    if (typeof document === 'undefined' || !document.createElement) {
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Text rendering (always)
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18pt Times New Roman';
    ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 4, 45);

    // Gradients (only in balanced and high)
    if (accuracy !== 'fast') {
      const gradient = ctx.createLinearGradient(0, 50, 200, 100);
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(0.5, '#00ff00');
      gradient.addColorStop(1, '#0000ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 60, 200, 30);
    }

    // Shapes (only in high)
    if (accuracy === 'high') {
      // Circle
      ctx.beginPath();
      ctx.arc(50, 100, 20, 0, Math.PI * 2, true);
      ctx.fillStyle = '#ff9900';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotated rectangle
      ctx.save();
      ctx.translate(120, 100);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#66ccff';
      ctx.fillRect(-15, -15, 30, 30);
      ctx.restore();

      // Bezier curve
      ctx.beginPath();
      ctx.moveTo(180, 80);
      ctx.bezierCurveTo(190, 70, 200, 90, 210, 80);
      ctx.strokeStyle = '#ff0066';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Anti-aliasing detection (using a small text)
    ctx.font = '9pt Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('iiii', 5, 110);

    // Get image data and hash it
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Simple hash (we'll use MurmurHash3 later, but for now return a string)
    // We'll hash in the main fingerprint generation
    const dataUrl = canvas.toDataURL();
    _cache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (e) {
    return '';
  }
}

/**
 * Get WebGL fingerprint with vendor, renderer, and extensions
 * @param {string} accuracy - 'fast' | 'balanced' | 'high'
 * @returns {Object} WebGL info or empty object on error
 */
function getWebGLInfo(accuracy = 'balanced') {
  const cacheKey = `webgl_${accuracy}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  try {
    if (typeof document === 'undefined' || !document.createElement) {
      return {};
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;

    // Try WebGL2 first, fallback to WebGL1
    let gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return {};

    const info = {
      vendor: gl.getParameter(gl.VENDOR) || '',
      renderer: gl.getParameter(gl.RENDERER) || '',
      version: gl.getParameter(gl.VERSION) || '',
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '',
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0],
      extensions: [],
      isWebGL2: !!gl.getParameter(gl.VERSION).includes('WebGL 2.0'),
    };

    // Get supported extensions (only in high mode, or limited in balanced)
    const extensionList = gl.getSupportedExtensions() || [];
    if (accuracy === 'high') {
      info.extensions = extensionList;
    } else if (accuracy === 'balanced') {
      // Only get a subset (first 10) to save time
      info.extensions = extensionList.slice(0, 10);
    } else {
      // Fast: only get a few key extensions
      const keyExts = ['WEBGL_debug_renderer_info', 'WEBGL_compressed_texture_s3tc', 'OES_texture_float'];
      info.extensions = extensionList.filter(ext => keyExts.includes(ext));
    }

    // Also capture a small rendering to detect differences
    // (useful for GPU/driver variations)
    if (accuracy !== 'fast') {
      const gl2 = gl;
      // Clear with a specific color
      gl2.clearColor(0.2, 0.3, 0.4, 1.0);
      gl2.clear(gl2.COLOR_BUFFER_BIT);
      const pixels = new Uint8Array(4);
      gl2.readPixels(0, 0, 1, 1, gl2.RGBA, gl2.UNSIGNED_BYTE, pixels);
      info.pixel = Array.from(pixels);
    }

    _cache.set(cacheKey, info);
    return info;
  } catch (e) {
    return {};
  }
}

/**
 * Generate Audio fingerprint using OfflineAudioContext
 * @param {string} accuracy - 'fast' | 'balanced' | 'high'
 * @returns {string} Hash or empty string on error
 */
function getAudioFingerprint(accuracy = 'balanced') {
  const cacheKey = `audio_${accuracy}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  try {
    if (typeof AudioContext === 'undefined' && typeof webkitOfflineAudioContext === 'undefined') {
      return '';
    }

    // Use OfflineAudioContext
    const AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioCtx) return '';

    const context = new AudioCtx(1, 44100, 44100);
    const bufferSize = accuracy === 'high' ? 44100 : (accuracy === 'balanced' ? 22050 : 11025);

    // Create oscillator
    const oscillator = context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 440;

    // Create gain node
    const gain = context.createGain();
    gain.gain.value = 0.1;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(0);
    oscillator.stop(context.currentTime + 0.1);

    // Render audio
    return new Promise((resolve) => {
      context.oncomplete = (event) => {
        const renderedBuffer = event.renderedBuffer;
        const channelData = renderedBuffer.getChannelData(0);
        // Take a subset of samples (first 1000)
        const samples = Array.from(channelData.slice(0, 1000));
        // Create a string representation and hash it
        const fingerprint = samples.map(v => Math.round(v * 1000)).join(',');
        _cache.set(cacheKey, fingerprint);
        resolve(fingerprint);
      };
      context.startRendering();
    });
  } catch (e) {
    // Safari may throw, fallback to empty
    return '';
  }
}

/**
 * Get screen resolution and color gamut
 */
function getScreenVisualInfo() {
  if (typeof screen === 'undefined') {
    return { width: 0, height: 0, availWidth: 0, availHeight: 0 };
  }
  return {
    width: screen.width || 0,
    height: screen.height || 0,
    availWidth: screen.availWidth || 0,
    availHeight: screen.availHeight || 0,
    colorDepth: screen.colorDepth || 0,
    pixelDepth: screen.pixelDepth || 0,
    // Color gamut (newer API)
    colorGamut: (typeof screen !== 'undefined' && screen.colorGamut) ? screen.colorGamut : 'unknown',
  };
}

/**
 * Get window inner dimensions (viewport)
 */
function getViewportInfo() {
  if (typeof window === 'undefined') {
    return { innerWidth: 0, innerHeight: 0, outerWidth: 0, outerHeight: 0 };
  }
  return {
    innerWidth: window.innerWidth || 0,
    innerHeight: window.innerHeight || 0,
    outerWidth: window.outerWidth || 0,
    outerHeight: window.outerHeight || 0,
  };
}

/**
 * Collect visual signals (the most expensive part)
 * @param {string} accuracy - 'fast' | 'balanced' | 'high'
 * @returns {Promise<Object>} Visual signals
 */
export async function collect(accuracy = 'balanced') {
  const signals = {};

  // Always collect these (cheap)
  signals.screen = safeExecute(getScreenVisualInfo, { width: 0, height: 0, availWidth: 0, availHeight: 0 });
  signals.viewport = safeExecute(getViewportInfo, { innerWidth: 0, innerHeight: 0, outerWidth: 0, outerHeight: 0 });

  // Canvas fingerprint: depends on accuracy
  signals.canvas = safeExecute(() => getCanvasFingerprint(accuracy), '');

  // WebGL: skip in fast mode
  if (accuracy === 'fast') {
    signals.webgl = {};
  } else {
    signals.webgl = safeExecute(() => getWebGLInfo(accuracy), {});
  }

  // Audio: skip in fast mode, run async in others
  if (accuracy === 'fast') {
    signals.audio = '';
  } else {
    // Audio is async, we need to await it properly
    try {
      signals.audio = await getAudioFingerprint(accuracy);
    } catch (e) {
      signals.audio = '';
    }
  }

  // Additional visual signals (cheap)
  signals.devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  signals.colorDepth = typeof screen !== 'undefined' ? screen.colorDepth || 0 : 0;

  return signals;
}

// Export individual functions for testing
export {
  getCanvasFingerprint,
  getWebGLInfo,
  getAudioFingerprint,
  getScreenVisualInfo,
  getViewportInfo,
  clearCache,
};
