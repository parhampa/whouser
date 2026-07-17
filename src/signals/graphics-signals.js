// src/signals/graphic-signals.js

import Helpers from '../utils/helpers.js';

/**
 * ماژول سیگنال‌های گرافیکی
 * شامل Canvas Fingerprinting، WebGL، Audio Context و فونت‌ها
 * این سیگنال‌ها وزن بالایی در بخش Visual و Hardware هش نهایی دارند
 */
export const GraphicSignals = {
  /**
   * سیگنال ۷: Canvas Fingerprinting
   * تفاوت در نحوه‌ی رندر کردن متن و اشکال توسط GPU و درایورهای مختلف
   * با استفاده از ترکیب متن و اشکال هندسی برای دقت بیشتر
   */
  getCanvasFingerprint() {
    return Helpers.safeExecute(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return 'canvas-unavailable';
      
      // پس‌زمینه
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 256, 128);
      
      // متن با فونت‌های مختلف
      const texts = [
        'whouser',
        'Browser Fingerprint',
        'abcdefghijklmnopqrstuvwxyz',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '0123456789',
        '!@#$%^&*()_+-=',
        'آب پخته',
        '🙂🎉🔥'
      ];
      
      const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
      
      texts.forEach((text, index) => {
        const font = fonts[index % fonts.length];
        const size = 14 + (index * 2);
        ctx.font = `${size}px "${font}"`;
        ctx.fillStyle = `hsl(${index * 30}, 70%, 40%)`;
        ctx.fillText(text, 5 + (index * 5), 20 + (index * 15));
      });
      
      // اشکال هندسی
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        const x = 30 + (i * 20);
        const y = 80 + (i % 5) * 8;
        ctx.arc(x, y, 5 + (i % 8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${i * 20}, ${200 - i * 15}, ${100 + i * 10}, 0.7)`;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // خطوط و مستطیل‌ها
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 50, 30);
      ctx.strokeRect(200, 80, 40, 30);
      
      // مثلث
      ctx.beginPath();
      ctx.moveTo(220, 10);
      ctx.lineTo(240, 40);
      ctx.lineTo(200, 40);
      ctx.closePath();
      ctx.fillStyle = 'rgba(100, 150, 200, 0.5)';
      ctx.fill();
      ctx.stroke();
      
      // خط مورب برای تشخیص Anti-Aliasing
      ctx.beginPath();
      ctx.moveTo(0, 127);
      ctx.lineTo(255, 0);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // دریافت Data URL با کیفیت بالا
      const dataUrl = canvas.toDataURL('image/png');
      
      // ایجاد هش از Data URL
      let hash = 0;
      for (let i = 0; i < dataUrl.length; i++) {
        const char = dataUrl.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return Math.abs(hash).toString(36);
    }, 'canvas-error');
  },

  /**
   * سیگنال ۸: WebGL Fingerprinting
   * شامل اطلاعات پردازنده گرافیکی (GPU) و قابلیت‌های آن
   * این سیگنال بسیار پایدار است و به ندرت تغییر می‌کند
   */
  getWebGLInfo() {
    return Helpers.safeExecute(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'webgl-unavailable';
      
      // اطلاعات GPU از طریق debug extension
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      let vendor = 'unknown';
      let renderer = 'unknown';
      
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
      
      // نسخه‌ی WebGL
      const version = gl.getParameter(gl.VERSION) || 'unknown';
      
      // پشتیبانی از extension‌های مهم
      const extensions = gl.getSupportedExtensions() || [];
      const hasExtensions = {
        textureFloat: extensions.includes('OES_texture_float'),
        textureHalfFloat: extensions.includes('OES_texture_half_float'),
        standardDerivatives: extensions.includes('OES_standard_derivatives'),
        vertexArrayObject: extensions.includes('OES_vertex_array_object'),
        depthTexture: extensions.includes('WEBGL_depth_texture'),
        drawBuffers: extensions.includes('WEBGL_draw_buffers'),
        shaderTextureLod: extensions.includes('EXT_shader_texture_lod'),
        fragDepth: extensions.includes('EXT_frag_depth'),
        blendMinMax: extensions.includes('EXT_blend_minmax'),
        colorBufferFloat: extensions.includes('EXT_color_buffer_float'),
        colorBufferHalfFloat: extensions.includes('EXT_color_buffer_half_float')
      };
      
      // ترکیب تمام اطلاعات
      const extString = Object.entries(hasExtensions)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join('|');
      
      // محدود کردن طول رشته
      const extHash = Helpers.simpleHash(extString);
      
      return `vendor:${vendor}|renderer:${renderer}|version:${version}|ext:${extHash}`;
    }, 'webgl-error');
  },

  /**
   * سیگنال ۹: Audio Fingerprinting
   * ویژگی‌های منحصربه‌فرد در پردازش صوت توسط سخت‌افزار
   * این سیگنال در مرورگرهای مختلف متفاوت است
   */
  getAudioFingerprint() {
    return Helpers.safeExecute(() => {
      // بررسی وجود AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return 'audio-unavailable';
      
      const context = new AudioContext();
      
      // ایجاد یک oscillator ساده
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 440; // A4
      gainNode.gain.value = 0.1;
      
      // تنظیم زمان
      const startTime = context.currentTime;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
      
      // دریافت داده‌های صوتی
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      
      // اتصال analyser
      const source = context.createOscillator();
      source.connect(analyser);
      source.connect(context.destination);
      source.frequency.value = 440;
      source.type = 'sawtooth';
      source.start(0);
      source.stop(0.1);
      
      // دریافت داده‌ها
      analyser.getFloatFrequencyData(dataArray);
      
      // ایجاد هش از داده‌های صوتی
      let hash = 0;
      for (let i = 0; i < Math.min(dataArray.length, 100); i++) {
        const value = Math.round(dataArray[i] * 1000);
        hash = ((hash << 5) - hash) + value;
        hash = hash & hash;
      }
      
      // بستن context برای جلوگیری از مصرف حافظه
      context.close();
      
      return Math.abs(hash).toString(36);
    }, 'audio-error');
  },

  /**
   * سیگنال ۱۰: لیست فونت‌های نصب شده
   * با استفاده از تکنیک Flash of Unstyled Text (FOUT)
   * این سیگنال ممکن است با نصب فونت‌های جدید تغییر کند
   */
  getFontFingerprint() {
    return Helpers.safeExecute(() => {
      const fonts = Helpers.getInstalledFonts();
      
      if (!fonts || fonts.length === 0) return 'fonts-unavailable';
      
      // فقط ۱۰ فونت اول را هش می‌کنیم
      const fontString = fonts.slice(0, 10).join('|');
      const hash = Helpers.simpleHash(fontString);
      
      return `count:${fonts.length}|hash:${hash}`;
    }, 'fonts-error');
  },

  /**
   * سیگنال ۱۱: ترکیب Canvas و WebGL (تکنیک اختصاصی)
   * تفاوت بین رندرینگ 2D و 3D را محاسبه می‌کند
   * این یک سیگنال منحصربه‌فرد است که در کتابخانه‌های دیگر وجود ندارد
   */
  getCanvasWebGLDifference() {
    return Helpers.safeExecute(() => {
      // Canvas 2D
      const canvas2d = document.createElement('canvas');
      canvas2d.width = 100;
      canvas2d.height = 100;
      const ctx = canvas2d.getContext('2d');
      if (!ctx) return 'canvas2d-unavailable';
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(10, 10, 80, 80);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(20, 20, 60, 60);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(30, 30, 40, 40);
      
      const dataUrl2d = canvas2d.toDataURL('image/png');
      
      // WebGL برای رندرینگ مشابه
      const canvas3d = document.createElement('canvas');
      canvas3d.width = 100;
      canvas3d.height = 100;
      const gl = canvas3d.getContext('webgl');
      if (!gl) return 'webgl-unavailable';
      
      // تنظیم viewport
      gl.viewport(0, 0, 100, 100);
      gl.clearColor(1.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // رسم یک مربع قرمز
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;
      const fragmentShaderSource = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `;
      
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      
      const positions = new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5
      ]);
      
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      const dataUrl3d = canvas3d.toDataURL('image/png');
      
      // محاسبه تفاوت بین دو Data URL
      const hash2d = Helpers.simpleHash(dataUrl2d);
      const hash3d = Helpers.simpleHash(dataUrl3d);
      
      return `diff:${hash2d}|${hash3d}`;
    }, 'webgl-canvas-diff-error');
  },

  /**
   * جمع‌آوری همه‌ی سیگنال‌های گرافیکی به صورت همزمان
   */
  async collectAll() {
    const [
      canvas,
      webgl,
      audio,
      fonts,
      diff
    ] = await Promise.all([
      Promise.resolve(this.getCanvasFingerprint()),
      Promise.resolve(this.getWebGLInfo()),
      Promise.resolve(this.getAudioFingerprint()),
      Promise.resolve(this.getFontFingerprint()),
      Promise.resolve(this.getCanvasWebGLDifference())
    ]);

    return {
      canvas,
      webglInfo: webgl,
      audio,
      fonts,
      canvasWebGLDiff: diff
    };
  }
};

export default GraphicSignals;