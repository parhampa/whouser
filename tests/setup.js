import { vi } from 'vitest';

// Mock navigator with common properties
const mockNavigator = {
  language: 'en-US',
  languages: ['en-US', 'en'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  platform: 'Win32',
  cookieEnabled: true,
  doNotTrack: '1',
  plugins: [
    { name: 'Chrome PDF Plugin' },
    { name: 'Chrome PDF Viewer' },
    { name: 'Native Client' },
  ],
  mimeTypes: [
    { type: 'application/pdf' },
    { type: 'text/plain' },
    { type: 'text/html' },
  ],
  hardwareConcurrency: 8,
  deviceMemory: 8,
  maxTouchPoints: 0,
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
};

// Mock window
const mockWindow = {
  screen: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24,
    availWidth: 1920,
    availHeight: 1040,
    orientation: { type: 'landscape-primary' },
  },
  devicePixelRatio: 1,
  innerWidth: 1920,
  innerHeight: 1080,
  outerWidth: 1920,
  outerHeight: 1080,
  ontouchstart: null,
  navigator: mockNavigator,
  document: {
    createElement: vi.fn(),
  },
};

// Setup global mocks
global.window = mockWindow;
global.navigator = mockNavigator;
global.screen = mockWindow.screen;
global.document = mockWindow.document;

// Mock canvas and context
const mockCanvas = {
  width: 256,
  height: 128,
  getContext: vi.fn(() => ({
    textBaseline: '',
    fillStyle: '',
    font: '',
    fillText: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    save: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    restore: vi.fn(),
    moveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(256 * 128 * 4),
    })),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    measureText: vi.fn(() => ({ width: 100 })),
    clearRect: vi.fn(),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
};

document.createElement.mockImplementation((tag) => {
  if (tag === 'canvas') {
    return mockCanvas;
  }
  return {};
});

// Mock AudioContext (for audio fingerprint)
global.AudioContext = vi.fn();
global.OfflineAudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({
    type: '',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 0 },
    connect: vi.fn(),
  })),
  destination: {},
  currentTime: 0,
  oncomplete: null,
  startRendering: vi.fn(() => {
    setTimeout(() => {
      if (global.OfflineAudioContext.mock.calls[0][0].oncomplete) {
        global.OfflineAudioContext.mock.calls[0][0].oncomplete({
          renderedBuffer: {
            getChannelData: vi.fn(() => new Float32Array(1000).fill(0.5)),
          },
        });
      }
    }, 10);
  }),
}));

// Mock WebGL
global.WebGLRenderingContext = {};
global.WebGL2RenderingContext = {};

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
  },
};

// Mock WebAssembly
global.WebAssembly = {
  compile: vi.fn(),
};

// Helper to reset mocks between tests
export function resetMocks() {
  vi.clearAllMocks();
  global.navigator.plugins = [
    { name: 'Chrome PDF Plugin' },
    { name: 'Chrome PDF Viewer' },
    { name: 'Native Client' },
  ];
  global.navigator.mimeTypes = [
    { type: 'application/pdf' },
    { type: 'text/plain' },
    { type: 'text/html' },
  ];
  document.createElement.mockClear();
}
// اضافه کردن به انتهای فایل tests/setup.js

// Mock WebGL rendering context
const mockWebGLRenderingContext = {
  getParameter: vi.fn((param) => {
    const params = {
      [global.WebGLRenderingContext?.VENDOR || 0x1F00]: 'Google Inc.',
      [global.WebGLRenderingContext?.RENDERER || 0x1F01]: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)',
      [global.WebGLRenderingContext?.VERSION || 0x1F02]: 'WebGL 2.0 (OpenGL ES 3.2)',
      [global.WebGLRenderingContext?.SHADING_LANGUAGE_VERSION || 0x1F03]: 'WebGL GLSL ES 3.00',
      [global.WebGLRenderingContext?.MAX_TEXTURE_SIZE || 0x0D33]: 16384,
      [global.WebGLRenderingContext?.MAX_VIEWPORT_DIMS || 0x0D3A]: [16384, 16384],
    };
    return params[param] || null;
  }),
  getSupportedExtensions: vi.fn(() => [
    'WEBGL_debug_renderer_info',
    'WEBGL_compressed_texture_s3tc',
    'OES_texture_float',
    'EXT_texture_filter_anisotropic',
    'WEBGL_depth_texture',
    'OES_standard_derivatives',
    'EXT_shader_texture_lod',
  ]),
  clearColor: vi.fn(),
  clear: vi.fn(),
  readPixels: vi.fn((x, y, width, height, format, type, pixels) => {
    // Fill with some sample data
    for (let i = 0; i < 4; i++) {
      pixels[i] = Math.floor(Math.random() * 256);
    }
  }),
  COLOR_BUFFER_BIT: 0x00004000,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
};

// Mock canvas with getContext returning WebGL and 2D contexts
const mockCanvas2D = {
  textBaseline: '',
  fillStyle: '',
  font: '',
  fillText: vi.fn(),
  fillRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  save: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  restore: vi.fn(),
  moveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(256 * 128 * 4).fill(128),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  measureText: vi.fn(() => ({ width: 100 })),
  clearRect: vi.fn(),
};

// Extend the mock canvas to support both 2d and webgl contexts
const mockCanvas = {
  width: 256,
  height: 128,
  getContext: vi.fn((contextType) => {
    if (contextType === '2d') {
      return mockCanvas2D;
    }
    if (contextType === 'webgl2' || contextType === 'webgl' || contextType === 'experimental-webgl') {
      return mockWebGLRenderingContext;
    }
    return null;
  }),
  toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
};

// Override document.createElement for canvas
document.createElement = vi.fn((tag) => {
  if (tag === 'canvas') {
    return mockCanvas;
  }
  // Default behavior for other elements
  return {};
});

// Mock OfflineAudioContext for audio fingerprint
const mockOfflineAudioContext = {
  createOscillator: vi.fn(() => ({
    type: '',
    frequency: { value: 440, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 0.1, setValueAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  destination: {},
  currentTime: 0,
  oncomplete: null,
  startRendering: vi.fn(function() {
    // Simulate async rendering
    setTimeout(() => {
      if (this.oncomplete) {
        const channelData = new Float32Array(1000);
        // Fill with predictable pattern for testing
        for (let i = 0; i < 1000; i++) {
          channelData[i] = Math.sin(i / 10) * 0.5 + 0.5;
        }
        this.oncomplete({
          renderedBuffer: {
            getChannelData: vi.fn(() => channelData),
          },
        });
      }
    }, 10);
  }),
};

// Set up AudioContext mocks
global.OfflineAudioContext = vi.fn(() => mockOfflineAudioContext);
global.AudioContext = vi.fn(() => ({
  ...mockOfflineAudioContext,
  // AudioContext has slightly different API
  createBufferSource: vi.fn(),
  createScriptProcessor: vi.fn(),
}));

// Also support webkitOfflineAudioContext for Safari
global.webkitOfflineAudioContext = global.OfflineAudioContext;
