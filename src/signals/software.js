// src/signals/software.js

/**
 * Collect software-related signals for fingerprinting
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Software signals
 */
export async function getSoftwareSignals(options = {}) {
  const signals = {};

  try {
    // Font detection
    signals.fonts = safeExecute(() => getInstalledFonts(), []);

    // Plugins list
    signals.plugins = safeExecute(() => {
      const plugins = [];
      if (navigator.plugins) {
        for (let i = 0; i < navigator.plugins.length; i++) {
          const plugin = navigator.plugins[i];
          plugins.push({
            name: plugin.name,
            filename: plugin.filename,
            description: plugin.description,
            mimeTypes: Array.from(plugin).map(mime => mime.type)
          });
        }
      }
      return plugins;
    }, []);

    // MIME types
    signals.mimeTypes = safeExecute(() => {
      if (!navigator.mimeTypes) return [];
      return Array.from(navigator.mimeTypes).map(mime => ({
        type: mime.type,
        description: mime.description,
        suffixes: mime.suffixes
      }));
    }, []);

    // Cookie enabled
    signals.cookieEnabled = safeExecute(() => navigator.cookieEnabled, false);

    // Do Not Track
    signals.doNotTrack = safeExecute(() => navigator.doNotTrack || 'unknown', 'unknown');

    // Language settings
    signals.language = safeExecute(() => ({
      language: navigator.language || 'unknown',
      languages: navigator.languages || [],
      acceptLanguage: safeExecute(() => {
        const lang = navigator.language || 'en-US';
        return `${lang},${lang.split('-')[0]};q=0.9`;
      }, 'unknown')
    }), {});

    // Browser vendor
    signals.vendor = safeExecute(() => ({
      vendor: navigator.vendor || 'unknown',
      vendorSub: navigator.vendorSub || 'unknown',
      product: navigator.product || 'unknown',
      productSub: navigator.productSub || 'unknown'
    }), {});

    // App version details
    signals.appVersion = safeExecute(() => ({
      appVersion: navigator.appVersion || 'unknown',
      appName: navigator.appName || 'unknown',
      appCodeName: navigator.appCodeName || 'unknown',
      userAgent: navigator.userAgent || 'unknown'
    }), {});

    // Browser features detection
    signals.features = safeExecute(() => ({
      webgl: !!document.createElement('canvas').getContext('webgl'),
      webgl2: !!document.createElement('canvas').getContext('webgl2'),
      webrtc: !!window.RTCPeerConnection,
      webworker: !!window.Worker,
      serviceworker: 'serviceWorker' in navigator,
      storage: 'localStorage' in window && 'sessionStorage' in window,
      indexeddb: 'indexedDB' in window,
      canvas: !!document.createElement('canvas').getContext('2d')
    }), {});

    // Screen orientation lock support
    signals.screenOrientation = safeExecute(() => ({
      supported: 'orientation' in screen,
      type: screen.orientation?.type || 'unknown',
      angle: screen.orientation?.angle || 0
    }), {});

    // Color gamut and contrast (modern CSS features)
    signals.mediaFeatures = safeExecute(() => {
      const media = window.matchMedia('(color-gamut: p3)');
      return {
        colorGamut: media.matches ? 'p3' : 'srgb',
        contrast: window.matchMedia('(prefers-contrast: high)').matches ? 'high' : 'normal',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      };
    }, {});

    return signals;

  } catch (error) {
    console.error('Software signals collection failed:', error);
    return signals;
  }
}

/**
 * Detect installed fonts using measurement technique
 * @returns {Array<string>} List of installed font names
 */
function getInstalledFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New',
    'Georgia', 'Tahoma', 'Trebuchet MS', 'Comic Sans MS',
    'Impact', 'Arial Black', 'Lucida Console', 'Lucida Sans Unicode',
    'Palatino Linotype', 'Book Antiqua', 'Helvetica', 'Geneva',
    'MS Serif', 'MS Sans Serif', 'Symbol', 'Webdings',
    'Wingdings', 'Century Gothic', 'Garamond', 'Arial Narrow',
    'Arial Unicode MS', 'Calibri', 'Cambria', 'Candara',
    'Consolas', 'Constantia', 'Corbel', 'Franklin Gothic Medium',
    'Gabriola', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold',
    'Segoe UI Symbol', 'Sitka', 'Yu Gothic'
  ];

  const installed = [];

  // Create test element
  const testDiv = document.createElement('div');
  testDiv.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;font-size:72px;';
  document.body.appendChild(testDiv);

  try {
    // Measure each font
    testFonts.forEach(font => {
      let isInstalled = true;
      
      // Test with each base font
      baseFonts.forEach(base => {
        testDiv.style.fontFamily = `'${font}', ${base}`;
        const widthWithFont = testDiv.offsetWidth;
        testDiv.style.fontFamily = base;
        const widthWithoutFont = testDiv.offsetWidth;
        
        // If width changes with the font, it means it's installed
        if (widthWithFont === widthWithoutFont) {
          isInstalled = false;
        }
      });

      if (isInstalled) {
        installed.push(font);
      }
    });
  } finally {
    document.body.removeChild(testDiv);
  }

  return installed;
}

/**
 * Safe execution wrapper to prevent crashes
 */
function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}