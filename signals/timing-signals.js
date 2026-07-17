// src/signals/timing-signals.js

import Helpers from '../utils/helpers.js';

/**
 * ماژول سیگنال‌های تایمینگ و عملکرد
 * این سیگنال‌ها از تفاوت‌های ظریف در سرعت CPU، معماری و مرورگر استفاده می‌کنند
 * وزن متوسط دارند و در برابر تغییرات جزئی مقاوم هستند
 */
export const TimingSignals = {
  /**
   * سیگنال ۱۸: تست عملکرد CPU با حلقه‌های سنگین ریاضی
   * تفاوت سرعت اجرا در دستگاه‌های مختلف را نشان می‌دهد
   * با اجرای چندین بار و گرفتن میانگین، خطا را کاهش می‌دهیم
   */
  getCpuBenchmark() {
    return Helpers.safeExecute(() => {
      const iterations = 500000; // ۵۰۰ هزار بار تکرار
      let results = [];
      
      // ۳ بار تست می‌کنیم و میانگین می‌گیریم
      for (let test = 0; test < 3; test++) {
        const start = performance.now();
        let sum = 0;
        for (let i = 0; i < iterations; i++) {
          // عملیات سنگین ریاضی با اعداد اعشاری
          sum += Math.sqrt(i) * Math.sin(i) + Math.cos(i * 0.1);
          sum = sum % 1000; // جلوگیری از overflow
        }
        const end = performance.now();
        results.push(end - start);
      }
      
      // میانگین زمان اجرا (میلی‌ثانیه)
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      
      // دسته‌بندی سرعت CPU بر اساس زمان اجرا
      let speedCategory = 'unknown';
      if (avgTime < 50) speedCategory = 'very-fast';
      else if (avgTime < 100) speedCategory = 'fast';
      else if (avgTime < 200) speedCategory = 'medium';
      else if (avgTime < 400) speedCategory = 'slow';
      else speedCategory = 'very-slow';
      
      // گرد کردن به نزدیک‌ترین عدد صحیح برای نرمال‌سازی
      const roundedTime = Math.round(avgTime / 5) * 5;
      
      return `${speedCategory}|${roundedTime}ms`;
    }, 'unknown|0');
  },

  /**
   * سیگنال ۱۹: تست حافظه‌ی کش و عملکرد آرایه
   * تفاوت در معماری حافظه و کش CPU را نشان می‌دهد
   */
  getMemoryBenchmark() {
    return Helpers.safeExecute(() => {
      const size = 100000; // ۱۰۰ هزار المان
      let results = [];
      
      for (let test = 0; test < 3; test++) {
        const arr = new Array(size);
        const start = performance.now();
        
        // عملیات سنگین روی آرایه
        for (let i = 0; i < size; i++) {
          arr[i] = Math.random() * 1000;
        }
        
        // مرتب‌سازی جزئی
        arr.sort((a, b) => a - b);
        
        const end = performance.now();
        results.push(end - start);
      }
      
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      
      let memoryCategory = 'unknown';
      if (avgTime < 100) memoryCategory = 'fast';
      else if (avgTime < 200) memoryCategory = 'medium';
      else if (avgTime < 400) memoryCategory = 'slow';
      else memoryCategory = 'very-slow';
      
      const roundedTime = Math.round(avgTime / 10) * 10;
      
      return `${memoryCategory}|${roundedTime}ms`;
    }, 'unknown|0');
  },

  /**
   * سیگنال ۲۰: زمان بارگذاری و رندرینگ صفحه
   * تفاوت در سرعت شبکه و پردازش گرافیکی را نشان می‌دهد
   */
  getPageTiming() {
    return Helpers.safeExecute(() => {
      if (!window.performance || !window.performance.timing) {
        return 'timing-unavailable';
      }
      
      const timing = window.performance.timing;
      
      // زمان پاسخگویی DNS
      const dns = timing.domainLookupEnd - timing.domainLookupStart;
      
      // زمان اتصال TCP
      const tcp = timing.connectEnd - timing.connectStart;
      
      // زمان دریافت اولین بایت (TTFB)
      const ttfb = timing.responseStart - timing.navigationStart;
      
      // زمان بارگذاری کامل DOM
      const domLoad = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      // زمان بارگذاری کامل صفحه
      const pageLoad = timing.loadEventEnd - timing.navigationStart;
      
      // دسته‌بندی مقادیر
      const categorizeTime = (time) => {
        if (time < 100) return 'fast';
        if (time < 300) return 'medium';
        if (time < 600) return 'slow';
        return 'very-slow';
      };
      
      // فقط از مقادیر مثبت و معتبر استفاده می‌کنیم
      const validDns = dns > 0 && dns < 10000 ? categorizeTime(dns) : 'unknown';
      const validTtfb = ttfb > 0 && ttfb < 10000 ? categorizeTime(ttfb) : 'unknown';
      const validDomLoad = domLoad > 0 && domLoad < 20000 ? categorizeTime(domLoad) : 'unknown';
      
      return `dns:${validDns}|ttfb:${validTtfb}|dom:${validDomLoad}`;
    }, 'timing-unavailable');
  },

  /**
   * سیگنال ۲۱: تست عملکرد Canvas (رندرینگ)
   * تفاوت در عملکرد GPU و درایورها را نشان می‌دهد
   */
  getCanvasPerformance() {
    return Helpers.safeExecute(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return 'canvas-unavailable';
      
      const start = performance.now();
      
      // رسم اشکال پیچیده
      for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 400, Math.random() * 400, Math.random() * 50, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
        ctx.fill();
        ctx.stroke();
      }
      
      // رسم متن‌های مختلف
      for (let i = 0; i < 50; i++) {
        ctx.font = `${Math.floor(Math.random() * 30 + 10)}px Arial`;
        ctx.fillText('Test ' + i, Math.random() * 300, Math.random() * 300);
      }
      
      const end = performance.now();
      const time = end - start;
      
      let perfCategory = 'unknown';
      if (time < 50) perfCategory = 'fast';
      else if (time < 100) perfCategory = 'medium';
      else if (time < 200) perfCategory = 'slow';
      else perfCategory = 'very-slow';
      
      const roundedTime = Math.round(time / 5) * 5;
      
      return `${perfCategory}|${roundedTime}ms`;
    }, 'canvas-unavailable');
  },

  /**
   * سیگنال ۲۲: تست WebGL عملکردی (رندرینگ 3D)
   * این تست سنگین‌تر است و تفاوت GPUها را بهتر نشان می‌دهد
   */
  getWebGLPerformance() {
    return Helpers.safeExecute(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'webgl-unavailable';
      
      const start = performance.now();
      
      // یک مثلث ساده با تغییر رنگ‌ها
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;
      
      const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_color;
        void main() {
          gl_FragColor = u_color;
        }
      `;
      
      // ایجاد شیدرها (این کد ساده شده است)
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
      
      // اجرای چندین بار رندرینگ برای اندازه‌گیری عملکرد
      for (let i = 0; i < 50; i++) {
        const color = [Math.random(), Math.random(), Math.random(), 1.0];
        const colorLocation = gl.getUniformLocation(program, 'u_color');
        gl.uniform4f(colorLocation, ...color);
        
        // رسم یک مثلث
        const positions = new Float32Array([
          -0.5, -0.5,
          0.5, -0.5,
          0.0, 0.5
        ]);
        
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      
      const end = performance.now();
      const time = end - start;
      
      let perfCategory = 'unknown';
      if (time < 100) perfCategory = 'fast';
      else if (time < 200) perfCategory = 'medium';
      else if (time < 400) perfCategory = 'slow';
      else perfCategory = 'very-slow';
      
      const roundedTime = Math.round(time / 10) * 10;
      
      // همچنین اطلاعات GPU vendor را هم می‌توانیم استخراج کنیم
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      let gpuVendor = 'unknown';
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
        gpuVendor = `${vendor}|${renderer}`.substring(0, 50); // محدود کردن طول
      }
      
      return `${perfCategory}|${roundedTime}ms|${gpuVendor}`;
    }, 'webgl-unavailable');
  },

  /**
   * جمع‌آوری همه‌ی سیگنال‌های تایمینگ به صورت همزمان
   */
  async collectAll() {
    const [
      cpu,
      memory,
      pageTiming,
      canvasPerf,
      webglPerf
    ] = await Promise.all([
      Promise.resolve(this.getCpuBenchmark()),
      Promise.resolve(this.getMemoryBenchmark()),
      Promise.resolve(this.getPageTiming()),
      Promise.resolve(this.getCanvasPerformance()),
      Promise.resolve(this.getWebGLPerformance())
    ]);

    return {
      cpu,
      memory,
      pageTiming,
      canvasPerf,
      webglPerf
    };
  }
};

export default TimingSignals;