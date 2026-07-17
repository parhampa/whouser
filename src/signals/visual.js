// src/signals/visual.js

/**
 * Collect visual-related signals for fingerprinting
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in ms for each signal
 * @returns {Promise<Object>} Visual signals
 */
export async function getVisualSignals(options = {}) {
  const timeout = options.timeout || 3000;

  const signals = {};

  try {
    // Canvas fingerprint
    signals.canvas = safeExecute(() => getCanvasFingerprint(), {
      hash: 'error',
      data: null
    });

    // WebGL fingerprint
    signals.webgl = safeExecute(() => getWebGLFingerprint(), {
      vendor: 'error',
      renderer: 'error',
      hash: 'error'
    });

    // Audio fingerprint
    try {
      signals.audio = await Promise.race([
        getAudioFingerprint(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Audio timeout')), timeout))
      ]);
    } catch (e) {
      signals.audio = { error: 'timeout or unavailable' };
    }

    // Screen size & DPI
    signals.screen = safeExecute(() => ({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    }), {});

    // WebGL performance (optional, can be heavy)
    signals.webglPerformance = safeExecute(() => getWebGLPerformance(), {
      fps: 'unknown',
      renderTime: 'unknown'
    });

    // Color depth and gamut
    signals.color = safeExecute(() => ({
      depth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      gamut: window.matchMedia('(color-gamut: p3)').matches ? 'p3' : 'srgb',
      hdr: window.matchMedia('(dynamic-range: high)').matches
    }), {});

    return signals;

  } catch (error) {
    console.error('Visual signals collection failed:', error);
    return signals;
  }
}

/**
 * Generate Canvas fingerprint using various text and shapes
 * @returns {Object} { hash, data }
 */
function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Draw text with different styles
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.font = '11pt Arial';
  ctx.fillText('Whouser fingerprint', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.font = '18pt Times New Roman';
  ctx.fillText('Canvas Text', 4, 45);

  // Draw geometric shapes
  ctx.beginPath();
  ctx.arc(50, 70, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#3c3';
  ctx.fill();

  ctx.beginPath();
  ctx.rect(180, 60, 40, 40);
  ctx.fillStyle = '#c33';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw lines and curves
  ctx.beginPath();
  ctx.moveTo(200, 20);
  ctx.quadraticCurveTo(220, 5, 240, 20);
  ctx.strokeStyle = '#09f';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Add some anti-aliasing noise
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.2)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 128, 2, 2);
  }

  // Get image data and generate hash
  const imageData = ctx.getImageData(0, 0, 256, 128).data;
  const hash = simpleHash(imageData);
  
  return {
    hash,
    data: Array.from(imageData.slice(0, 100)) // Only store small sample
  };
}

/**
 * Generate WebGL fingerprint with renderer info and extensions
 * @returns {Object} { vendor, renderer, hash }
 */
function getWebGLFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return { vendor: 'unsupported', renderer: 'unsupported', hash: 'unsupported' };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  let vendor = 'unknown';
  let renderer = 'unknown';

  if (debugInfo) {
    vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  }

  // Collect extensions
  const extensions = gl.getSupportedExtensions() || [];
  const extensionHash = simpleHash(extensions.join(','));

  // Get WebGL parameters
  const parameters = {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
    aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
  };

  const paramHash = simpleHash(JSON.stringify(parameters));
  const combinedHash = simpleHash(vendor + renderer + extensionHash + paramHash);

  return {
    vendor,
    renderer,
    extensions: extensions.slice(0, 20), // limit size
    parameters,
    hash: combinedHash
  };
}

/**
 * Generate Audio fingerprint using oscillator
 * @returns {Promise<Object>} { hash, data }
 */
function getAudioFingerprint() {
  return new Promise((resolve, reject) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        reject(new Error('AudioContext not supported'));
        return;
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 440;
      
      gain.gain.value = 0.1; // low volume to avoid disturbing user
      analyser.fftSize = 2048;
      
      oscillator.connect(analyser);
      analyser.connect(gain);
      gain.connect(context.destination);
      
      oscillator.start(0);
      
      // Collect audio data after a short delay
      setTimeout(() => {
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(dataArray);
        oscillator.stop(0);
        context.close();
        
        // Generate hash from the audio data
        const hash = simpleHash(Array.from(dataArray.slice(0, 200)));
        resolve({
          hash,
          data: Array.from(dataArray.slice(0, 50)) // small sample
        });
      }, 100);
      
      // Cleanup on error
      setTimeout(() => reject(new Error('Audio fingerprint timeout')), 2000);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Simple WebGL performance test (can be heavy, use with caution)
 * @returns {Object} { fps, renderTime }
 */
function getWebGLPerformance() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const gl = canvas.getContext('webgl');
  
  if (!gl) {
    return { fps: 'unsupported', renderTime: 'unsupported' };
  }

  const start = performance.now();
  let frames = 0;
  const maxFrames = 30;
  
  // Simple rendering loop (synchronous)
  for (let i = 0; i < maxFrames; i++) {
    gl.clearColor(Math.random(), Math.random(), Math.random(), 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Draw random triangles
    const vertices = new Float32Array([
      Math.random()*2-1, Math.random()*2-1,
      Math.random()*2-1, Math.random()*2-1,
      Math.random()*2-1, Math.random()*2-1
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Simple shader program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0, 1); }
    `);
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
      void main() { gl_FragColor = vec4(1, 0, 0, 1); }
    `);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    frames++;
  }
  
  const end = performance.now();
  const totalTime = end - start;
  
  return {
    fps: Math.round(frames / (totalTime / 1000)),
    renderTime: Math.round(totalTime / frames)
  };
}

/**
 * Simple hash function for fingerprint data
 * @param {any} data - Data to hash (string, array, or object)
 * @returns {string} Hex hash string
 */
function simpleHash(data) {
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