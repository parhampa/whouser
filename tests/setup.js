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
