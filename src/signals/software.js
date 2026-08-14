import { safeExecute, normalizeValue } from '../utils/helpers.js';

// Comprehensive font list (100+ common fonts across platforms)
const FONT_LIST = [
  // Windows fonts
  'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math',
  'Candara', 'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New',
  'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
  'Palatino Linotype', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol',
  'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Webdings', 'Wingdings',
  // macOS fonts
  'American Typewriter', 'Apple Chancery', 'Apple Color Emoji', 'Apple SD Gothic Neo',
  'Apple Symbols', 'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
  'Avenir', 'Avenir Next', 'Avenir Next Condensed', 'Baskerville', 'Big Caslon',
  'Bodoni 72', 'Bodoni 72 Oldstyle', 'Bodoni 72 Smallcaps', 'Brush Script MT',
  'Chalkboard SE', 'Chalkduster', 'Charter', 'Cochin', 'Comic Sans MS', 'Copperplate',
  'Corsiva Hebrew', 'Courier New', 'Didot', 'DIN Alternate', 'DIN Condensed',
  'Euphemia UCAS', 'Futura', 'Geneva', 'Georgia', 'Gill Sans', 'Grande',
  'Helvetica', 'Helvetica Neue', 'Herculanum', 'Hoefler Text', 'Impact',
  'Inconsolata', 'Iowan Old Style', 'Kailasa', 'Kannada Sangam MN', 'Khmer Sangam MN',
  'Kohinoor Bangla', 'Kohinoor Devanagari', 'Kohinoor Gujarati', 'Kohinoor Telugu',
  'Lao Sangam MN', 'Lucida Grande', 'Luminari', 'Malayalam Sangam MN', 'Marion',
  'Menlo', 'Messina Sans', 'Microsoft Sans Serif', 'Monaco', 'Mshtakan',
  'Mukta Mahee', 'Muna', 'Myanmar Sangam MN', 'Nanum Brush Script', 'Nanum Gothic',
  'Nanum Myeongjo', 'New York', 'Noteworthy', 'Optima', 'Palatino', 'Papyrus',
  'Party LET', 'Phosphate', 'PingFang HK', 'PingFang SC', 'PingFang TC',
  'Plain', 'Raanana', 'Rockwell', 'Savoye LET', 'Sefarad', 'Shree Devanagari 714',
  'SignPainter', 'Sinhala Sangam MN', 'Skia', 'Snell Roundhand', 'Stencil',
  'Tamil Sangam MN', 'Telugu Sangam MN', 'Thonburi', 'Times', 'Times New Roman',
  'Trebuchet MS', 'Trattatello', 'Verdana', 'Waseem', 'Zapf Dingbats', 'Zapfino',
  // Linux fonts
  'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif', 'FreeSans', 'FreeSerif', 'FreeMono',
  'Noto Sans', 'Noto Serif', 'Open Sans', 'Ubuntu', 'Ubuntu Mono', 'Droid Sans',
  'Droid Serif', 'Roboto', 'Roboto Mono', 'Arimo', 'Cousine', 'Tinos',
  // Android fonts
  'Roboto', 'Roboto Condensed', 'Droid Sans', 'Droid Serif', 'Noto Sans', 'Noto Serif',
  // Common web fonts (fallbacks)
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
];

// Fonts considered "critical" for fast mode (most common across platforms)
const CRITICAL_FONTS = [
  'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas',
  'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
  'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
  'Helvetica', 'Helvetica Neue', 'Geneva', 'Menlo', 'Monaco', 'Lucida Grande',
  'DejaVu Sans', 'Ubuntu', 'Roboto', 'Open Sans',
];

/**
 * Detect installed fonts using canvas measureText
 * @param {Array<string>} fonts - List of fonts to test
 * @returns {Array<string>} Installed fonts
 */
function detectInstalledFonts(fonts) {
  if (typeof document === 'undefined' || !document.createElement) {
    return [];
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const baseFont = 'monospace';
    const baseSize = 48;

    // Measure baseline with monospace
    ctx.font = `${baseSize}px ${baseFont}`;
    const baselineMetrics = ctx.measureText(text);
    const baselineWidth = baselineMetrics.width;

    const installed = [];
    const testString = 'mmmmmmmmmmmmmmmmmmmmmm'; // Wide characters for better detection

    for (const font of fonts) {
      ctx.font = `${baseSize}px "${font}", ${baseFont}`;
      const metrics = ctx.measureText(testString);
      const width = metrics.width;

      // If width differs from baseline, font is installed
      // Using a threshold to account for rendering differences
      if (Math.abs(width - baselineWidth) > 0.5) {
        installed.push(font);
      }
    }

    return installed;
  } catch (e) {
    // Fallback: return empty array on error
    return [];
  }
}

/**
 * Get installed plugins (with deduplication)
 */
function getPlugins() {
  if (typeof navigator === 'undefined' || !navigator.plugins) {
    return [];
  }

  try {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      if (plugin && plugin.name) {
        plugins.push(plugin.name.trim());
      }
    }
    // Deduplicate and filter out empty
    return [...new Set(plugins)].filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Get MIME types supported by the browser
 */
function getMimeTypes() {
  if (typeof navigator === 'undefined' || !navigator.mimeTypes) {
    return [];
  }

  try {
    const mimes = [];
    for (let i = 0; i < navigator.mimeTypes.length; i++) {
      const mime = navigator.mimeTypes[i];
      if (mime && mime.type) {
        mimes.push(mime.type);
      }
    }
    return [...new Set(mimes)].filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Get browser features (modern APIs)
 */
function getBrowserFeatures() {
  const features = {};

  // Basic features
  features.cookieEnabled = typeof navigator !== 'undefined' ? navigator.cookieEnabled : false;
  features.doNotTrack = typeof navigator !== 'undefined' ? navigator.doNotTrack : null;
  features.language = typeof navigator !== 'undefined' ? navigator.language : null;
  features.languages = typeof navigator !== 'undefined' ? navigator.languages : [];
  features.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
  features.platform = typeof navigator !== 'undefined' ? navigator.platform : null;

  // Modern APIs
  features.webAssembly = typeof WebAssembly !== 'undefined';
  features.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  features.performance = typeof performance !== 'undefined';
  features.performanceMemory = typeof performance !== 'undefined' && typeof performance.memory !== 'undefined';
  features.connection = typeof navigator !== 'undefined' && typeof navigator.connection !== 'undefined';

  // WebGL2
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    features.webgl2 = !!gl;
  } else {
    features.webgl2 = false;
  }

  // Touch support
  features.touchSupport = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Pointer events
  features.pointerEvents = 'onpointerdown' in window;

  return features;
}

/**
 * Collect software signals
 * @param {string} accuracy - 'fast' | 'balanced' | 'high'
 * @returns {Object} Software signals
 */
export async function collect(accuracy = 'balanced') {
  const signals = {};

  // Font detection (accuracy dependent)
  let fontList = FONT_LIST;
  if (accuracy === 'fast') {
    fontList = CRITICAL_FONTS;
  } else if (accuracy === 'balanced') {
    // Use first 50 fonts (a good middle ground)
    fontList = FONT_LIST.slice(0, 50);
  }
  // 'high' uses full list

  signals.fonts = safeExecute(() => detectInstalledFonts(fontList), []);

  // Plugins and MIME types (always collected, cheap)
  signals.plugins = safeExecute(getPlugins, []);
  signals.mimeTypes = safeExecute(getMimeTypes, []);

  // Browser features (always collected, cheap)
  signals.features = safeExecute(getBrowserFeatures, {});

  // Language and timezone (from hardware? but we keep here for software context)
  signals.language = typeof navigator !== 'undefined' ? navigator.language : null;
  signals.languages = typeof navigator !== 'undefined' ? navigator.languages : [];

  // Do Not Track
  signals.doNotTrack = typeof navigator !== 'undefined' ? navigator.doNotTrack : null;

  // Canvas blocking? (some browsers support)
  signals.canvasBlocking = typeof document !== 'undefined' && document.createElement ?
    safeExecute(() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL ? 'available' : 'blocked';
    }, 'unknown') : 'unknown';

  return signals;
}

// Also export individual functions for testing
export {
  detectInstalledFonts,
  getPlugins,
  getMimeTypes,
  getBrowserFeatures,
  FONT_LIST,
  CRITICAL_FONTS,
};
