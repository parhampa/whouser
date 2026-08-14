import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// ============================================
// 1. Setup JSDOM with full browser environment
// ============================================
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  referrer: 'http://localhost',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000,
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.screen = dom.window.screen;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLParagraphElement = dom.window.HTMLParagraphElement;
global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.HTMLVideoElement = dom.window.HTMLVideoElement;
global.HTMLAudioElement = dom.window.HTMLAudioElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.TouchEvent = dom.window.TouchEvent;
global.DOMException = dom.window.DOMException;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.Document = dom.window.Document;
global.Comment = dom.window.Comment;
global.Text = dom.window.Text;
global.Range = dom.window.Range;
global.Selection = dom.window.Selection;
global.getComputedStyle = dom.window.getComputedStyle;
global.matchMedia = dom.window.matchMedia;

// ============================================
// 2. Mock Navigator with full properties
// ============================================
const mockNavigator = {
  language: 'en-US',
  languages: ['en-US', 'en'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'Win32',
  cookieEnabled: true,
  doNotTrack: '1',
  hardwareConcurrency: 8,
  deviceMemory: 8,
  maxTouchPoints: 0,
  vendor: 'Google Inc.',
  vendorSub: '',
  product: 'Gecko',
  productSub: '20030107',
  appName: 'Netscape',
  appVersion: '5.0 (Windows)',
  appCodeName: 'Mozilla',
  plugins: [
    { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
    { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
    { name: 'Native Client', description: 'Native Client', filename: 'internal-nacl-plugin' },
  ],
  mimeTypes: [
    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
    { type: 'text/plain', suffixes: 'txt', description: 'Plain Text' },
    { type: 'text/html', suffixes: 'html,htm', description: 'HyperText Markup Language' },
    { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
  ],
  getBattery: vi.fn().mockResolvedValue({
    level: 0.8,
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
  }),
  storage: {
    estimate: vi.fn().mockResolvedValue({
      quota: 10000000000,
      usage: 5000000000,
    }),
  },
  connection: {
    effectiveType: '4g',
    rtt: 50,
    downlink: 10,
    saveData: false,
  },
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  mediaDevices: {
    enumerateDevices: vi.fn().mockResolvedValue([]),
  },
  permissions: {
    query: vi.fn().mockResolvedValue({ state: 'prompt' }),
  },
  webkitGetUserMedia: vi.fn(),
  mozGetUserMedia: vi.fn(),
  msGetUserMedia: vi.fn(),
};

// Override navigator with our mock
Object.assign(global.navigator, mockNavigator);
global.navigator = global.navigator || {};

// ============================================
// 3. Mock Screen
// ============================================
Object.assign(global.screen, {
  width: 1920,
  height: 1080,
  colorDepth: 24,
  pixelDepth: 24,
  availWidth: 1920,
  availHeight: 1040,
  orientation: { type: 'landscape-primary', angle: 0 },
  availLeft: 0,
  availTop: 0,
  deviceXDPI: 96,
  deviceYDPI: 96,
  logicalXDPI: 96,
  logicalYDPI: 96,
});

// ============================================
// 4. Mock Window properties
// ============================================
Object.assign(global.window, {
  innerWidth: 1920,
  innerHeight: 1080,
  outerWidth: 1920,
  outerHeight: 1080,
  devicePixelRatio: 1,
  pageXOffset: 0,
  pageYOffset: 0,
  screenX: 0,
  screenY: 0,
  scrollX: 0,
  scrollY: 0,
  location: {
    href: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost',
  },
  history: {
    length: 1,
    scrollRestoration: 'auto',
    state: null,
  },
  performance: {
    now: vi.fn(() => {
      let time = 0;
      return () => {
        time += 1;
        return time;
      };
    })(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000000,
    },
    timing: {
      navigationStart: Date.now() - 1000,
      unloadEventStart: 0,
      unloadEventEnd: 0,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: Date.now() - 900,
      domainLookupStart: Date.now() - 800,
      domainLookupEnd: Date.now() - 750,
      connectStart: Date.now() - 700,
      connectEnd: Date.now() - 650,
      secureConnectionStart: Date.now() - 680,
      requestStart: Date.now() - 600,
      responseStart: Date.now() - 500,
      responseEnd: Date.now() - 400,
      domLoading: Date.now() - 300,
      domInteractive: Date.now() - 200,
      domContentLoadedEventStart: Date.now() - 150,
      domContentLoadedEventEnd: Date.now() - 100,
      domComplete: Date.now() - 50,
      loadEventStart: Date.now() - 20,
      loadEventEnd: Date.now(),
    },
    navigation: {
      type: 0,
      redirectCount: 0,
    },
    getEntries: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
  requestAnimationFrame: vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
  }),
  cancelAnimationFrame: vi.fn(),
  requestIdleCallback: vi.fn((cb) => {
    setTimeout(cb, 100);
    return 1;
  }),
  cancelIdleCallback: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  ontouchstart: null,
  onload: null,
  onerror: null,
  onresize: null,
  onscroll: null,
  onfocus: null,
  onblur: null,
  onbeforeunload: null,
  onunload: null,
});

// ============================================
// 5. Mock Canvas 2D Context
// ============================================
const mockCanvas2DContext = {
  canvas: { width: 256, height: 128 },
  textBaseline: '',
  textAlign: '',
  fillStyle: '',
  strokeStyle: '',
  font: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn((text) => {
    const width = text.length * 7.5;
    return { width, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 3 };
  }),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  createLinearGradient: vi.fn((x0, y0, x1, y1) => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn((x0, y0, r0, x1, y1, r1) => ({
    addColorStop: vi.fn(),
  })),
  createPattern: vi.fn(() => ({})),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => true),
  isPointInStroke: vi.fn(() => true),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn((x, y, w, h) => {
    const data = new Uint8ClampedArray(w * h * 4);
    // Fill with some pattern
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (i / 4) % 256;
      data[i + 1] = (i / 4 + 50) % 256;
      data[i + 2] = (i / 4 + 100) % 256;
      data[i + 3] = 255;
    }
    return { data, width: w, height: h };
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn((w, h) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  })),
  toDataURL: vi.fn((type, quality) => {
    return `data:${type || 'image/png'};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }),
  toBlob: vi.fn((callback, type, quality) => {
    const blob = new Blob(['mock data'], { type: type || 'image/png' });
    callback(blob);
  }),
};

// ============================================
// 6. Mock WebGL Context
// ============================================
class MockWebGLRenderingContext {
  constructor() {
    this.VENDOR = 0x1F00;
    this.RENDERER = 0x1F01;
    this.VERSION = 0x1F02;
    this.SHADING_LANGUAGE_VERSION = 0x1F03;
    this.MAX_TEXTURE_SIZE = 0x0D33;
    this.MAX_VIEWPORT_DIMS = 0x0D3A;
    this.COLOR_BUFFER_BIT = 0x00004000;
    this.RGBA = 0x1908;
    this.UNSIGNED_BYTE = 0x1401;
    this.FLOAT = 0x1406;
    this.TEXTURE_2D = 0x0DE1;
    this.TEXTURE_MAG_FILTER = 0x2800;
    this.TEXTURE_MIN_FILTER = 0x2801;
    this.TEXTURE_WRAP_S = 0x2802;
    this.TEXTURE_WRAP_T = 0x2803;
    this.CLAMP_TO_EDGE = 0x812F;
    this.LINEAR = 0x2601;
    this.NEAREST = 0x2600;
  }

  getParameter = vi.fn((param) => {
    const params = {
      [this.VENDOR]: 'Google Inc.',
      [this.RENDERER]: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)',
      [this.VERSION]: 'WebGL 2.0 (OpenGL ES 3.2)',
      [this.SHADING_LANGUAGE_VERSION]: 'WebGL GLSL ES 3.00',
      [this.MAX_TEXTURE_SIZE]: 16384,
      [this.MAX_VIEWPORT_DIMS]: [16384, 16384],
    };
    return params[param] || null;
  });

  getSupportedExtensions = vi.fn(() => [
    'WEBGL_debug_renderer_info',
    'WEBGL_compressed_texture_s3tc',
    'OES_texture_float',
    'EXT_texture_filter_anisotropic',
    'WEBGL_depth_texture',
    'OES_standard_derivatives',
    'EXT_shader_texture_lod',
  ]);

  clearColor = vi.fn();
  clear = vi.fn();
  readPixels = vi.fn((x, y, width, height, format, type, pixels) => {
    // Fill with sample data
    for (let i = 0; i < 4; i++) {
      pixels[i] = Math.floor(Math.random() * 256);
    }
  });
  viewport = vi.fn();
  scissor = vi.fn();
  enable = vi.fn();
  disable = vi.fn();
  bindTexture = vi.fn();
  texImage2D = vi.fn();
  texParameteri = vi.fn();
  getExtension = vi.fn();
  createBuffer = vi.fn(() => ({}));
  deleteBuffer = vi.fn();
  bindBuffer = vi.fn();
  bufferData = vi.fn();
  createShader = vi.fn(() => ({}));
  deleteShader = vi.fn();
  shaderSource = vi.fn();
  compileShader = vi.fn();
  createProgram = vi.fn(() => ({}));
  deleteProgram = vi.fn();
  attachShader = vi.fn();
  linkProgram = vi.fn();
  useProgram = vi.fn();
  getProgramParameter = vi.fn(() => true);
  getShaderParameter = vi.fn(() => true);
  getProgramInfoLog = vi.fn(() => '');
  getShaderInfoLog = vi.fn(() => '');
  createTexture = vi.fn(() => ({}));
  deleteTexture = vi.fn();
  activeTexture = vi.fn();
  generateMipmap = vi.fn();
  getError = vi.fn(() => 0);
  getParameter = vi.fn(() => {
    return 'WebGL 2.0';
  });
}

// ============================================
// 7. Mock AudioContext
// ============================================
class MockAudioNode {
  constructor() {
    this.numberOfInputs = 1;
    this.numberOfOutputs = 1;
    this.channelCount = 2;
    this.channelCountMode = 'max';
    this.channelInterpretation = 'speakers';
  }
  connect = vi.fn(() => {});
  disconnect = vi.fn(() => {});
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.type = 'sawtooth';
    this.frequency = { value: 440, setValueAtTime: vi.fn() };
    this.detune = { value: 0, setValueAtTime: vi.fn() };
    this.start = vi.fn();
    this.stop = vi.fn();
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = { value: 0.1, setValueAtTime: vi.fn() };
  }
}

class MockOfflineAudioContext {
  constructor(channels = 1, length = 44100, sampleRate = 44100) {
    this.channels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.currentTime = 0;
    this.destination = {};
    this.oncomplete = null;
    this.createOscillator = vi.fn(() => new MockOscillatorNode());
    this.createGain = vi.fn(() => new MockGainNode());
    this.createBufferSource = vi.fn(() => ({
      ...new MockAudioNode(),
      buffer: null,
      loop: false,
      loopEnd: 0,
      loopStart: 0,
      playbackRate: { value: 1, setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    }));
    this.createBuffer = vi.fn((channels, length, sampleRate) => ({
      numberOfChannels: channels,
      length: length,
      sampleRate: sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length)),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    }));
    this.startRendering = vi.fn(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const channelData = new Float32Array(1000);
          for (let i = 0; i < 1000; i++) {
            channelData[i] = Math.sin(i / 10) * 0.5 + 0.5;
          }
          const result = {
            renderedBuffer: {
              numberOfChannels: 1,
              length: 1000,
              sampleRate: 44100,
              getChannelData: vi.fn(() => channelData),
            },
          };
          if (this.oncomplete) {
            this.oncomplete(result);
          }
          resolve(result);
        }, 10);
      });
    });
    this.resume = vi.fn().mockResolvedValue(undefined);
    this.suspend = vi.fn().mockResolvedValue(undefined);
    this.close = vi.fn().mockResolvedValue(undefined);
    this.decodeAudioData = vi.fn((buffer) => {
      return Promise.resolve({
        numberOfChannels: 2,
        length: 44100,
        sampleRate: 44100,
        getChannelData: vi.fn(() => new Float32Array(44100)),
      });
    });
  }
}

// ============================================
// 8. Register all mocks globally
// ============================================
// Canvas
const mockCanvas = {
  width: 256,
  height: 128,
  getContext: vi.fn((contextType, attributes) => {
    if (contextType === '2d') {
      return mockCanvas2DContext;
    }
    if (contextType === 'webgl2' || contextType === 'webgl' || contextType === 'experimental-webgl') {
      return new MockWebGLRenderingContext();
    }
    return null;
  }),
  toDataURL: vi.fn((type, quality) => {
    return `data:${type || 'image/png'};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }),
  toBlob: vi.fn((callback, type, quality) => {
    const blob = new Blob(['mock data'], { type: type || 'image/png' });
    callback(blob);
  }),
  getContextAttributes: vi.fn(() => ({ alpha: true, antialias: true })),
  captureStream: vi.fn(() => ({
    getTracks: vi.fn(() => []),
  })),
};

// Document.createElement override
document.createElement = vi.fn((tag) => {
  if (tag === 'canvas') {
    return mockCanvas;
  }
  if (tag === 'div' || tag === 'span' || tag === 'p') {
    return dom.window.document.createElement(tag);
  }
  if (tag === 'img') {
    const img = dom.window.document.createElement('img');
    img.width = 0;
    img.height = 0;
    img.onload = null;
    img.onerror = null;
    img.src = '';
    return img;
  }
  return dom.window.document.createElement(tag);
});

// AudioContext mocks
global.AudioContext = vi.fn(() => new MockOfflineAudioContext(2, 44100, 44100));
global.OfflineAudioContext = vi.fn((channels, length, sampleRate) => 
  new MockOfflineAudioContext(channels, length, sampleRate)
);
global.webkitOfflineAudioContext = global.OfflineAudioContext;

// WebGL constants
global.WebGLRenderingContext = MockWebGLRenderingContext;
global.WebGL2RenderingContext = MockWebGLRenderingContext;

// WebAssembly
global.WebAssembly = {
  compile: vi.fn(),
  instantiate: vi.fn(),
  validate: vi.fn(() => true),
};

// ============================================
// 9. Utility function to reset mocks between tests
// ============================================
export function resetMocks() {
  vi.clearAllMocks();
  
  // Reset navigator properties
  global.navigator.plugins = [
    { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
    { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
    { name: 'Native Client', description: 'Native Client', filename: 'internal-nacl-plugin' },
  ];
  global.navigator.mimeTypes = [
    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
    { type: 'text/plain', suffixes: 'txt', description: 'Plain Text' },
    { type: 'text/html', suffixes: 'html,htm', description: 'HyperText Markup Language' },
  ];
  
  // Reset performance.now mock
  let time = 0;
  global.window.performance.now = vi.fn(() => {
    time += 1;
    return time;
  });
  
  // Reset canvas mocks
  mockCanvas.getContext.mockClear();
  mockCanvas.toDataURL.mockClear();
  mockCanvas2DContext.fillText.mockClear();
  mockCanvas2DContext.fillRect.mockClear();
  mockCanvas2DContext.measureText.mockClear();
  mockCanvas2DContext.getImageData.mockClear();
  mockCanvas2DContext.toDataURL.mockClear();
  
  // Reset WebGL mocks
  const webgl = new MockWebGLRenderingContext();
  webgl.getParameter.mockClear();
  webgl.getSupportedExtensions.mockClear();
  webgl.readPixels.mockClear();
  
  // Reset Audio mocks
  global.OfflineAudioContext.mockClear();
  
  // Reset document.createElement
  document.createElement.mockClear();
}

// ============================================
// 10. Additional global polyfills
// ============================================
// URL and URLSearchParams
global.URL = dom.window.URL;
global.URLSearchParams = dom.window.URLSearchParams;

// Blob and File
global.Blob = dom.window.Blob;
global.File = dom.window.File;
global.FileReader = dom.window.FileReader;

// FormData
global.FormData = dom.window.FormData;

// Headers, Request, Response (for fetch)
global.Headers = dom.window.Headers;
global.Request = dom.window.Request;
global.Response = dom.window.Response;
global.fetch = vi.fn(() => 
  Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
);

// AbortController
global.AbortController = dom.window.AbortController;
global.AbortSignal = dom.window.AbortSignal;

// ============================================
// 11. Export everything
// ============================================
export {
  dom,
  mockCanvas,
  mockCanvas2DContext,
  MockWebGLRenderingContext,
  MockOfflineAudioContext,
};
