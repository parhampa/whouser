// src/signals/environment-signals.js

import Helpers from '../utils/helpers.js';

/**
 * ماژول سیگنال‌های محیطی و رفتاری
 * شامل اطلاعات شبکه، سخت‌افزارهای جانبی و تنظیمات مرورگر
 * این سیگنال‌ها وزن متوسط دارند
 */
export const EnvironmentSignals = {
  /**
   * سیگنال ۱۲: اطلاعات شبکه (بدون IP)
   * شامل نوع اتصال و ویژگی‌های شبکه
   */
  getNetworkInfo() {
    return Helpers.safeExecute(() => {
      // navigator.connection در مرورگرهای مدرن
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) return 'network-unknown';
      
      const type = connection.effectiveType || 'unknown'; // 4g, 3g, 2g, slow-2g, wifi
      const rtt = connection.rtt || 0; // Round Trip Time
      const downlink = connection.downlink || 0; // سرعت دانلود (Mbps)
      
      // دسته‌بندی RTT
      let rttCategory = 'unknown';
      if (rtt < 100) rttCategory = 'fast';
      else if (rtt < 300) rttCategory = 'medium';
      else if (rtt < 600) rttCategory = 'slow';
      else rttCategory = 'very-slow';
      
      return `${type}|${rttCategory}|${Math.round(downlink)}`;
    }, 'unknown|unknown|0');
  },

  /**
   * سیگنال ۱۳: پشتیبانی از ویژگی‌های HTML5 و APIها
   * بررسی وجود APIهای مختلف در مرورگر
   */
  getFeatureSupport() {
    return Helpers.safeExecute(() => {
      const features = {
        // APIهای مهم
        serviceWorker: 'serviceWorker' in navigator,
        webRTC: 'RTCPeerConnection' in window,
        webSocket: 'WebSocket' in window,
        indexedDB: 'indexedDB' in window,
        geolocation: 'geolocation' in navigator,
        notifications: 'Notification' in window,
        webAssembly: 'WebAssembly' in window,
        webGL: 'WebGLRenderingContext' in window,
        canvas: 'HTMLCanvasElement' in window && 'getContext' in document.createElement('canvas'),
        // فرمت‌های ویدیویی
        videoFormats: {
          mp4: document.createElement('video').canPlayType('video/mp4') !== '',
          webm: document.createElement('video').canPlayType('video/webm') !== '',
          ogg: document.createElement('video').canPlayType('video/ogg') !== ''
        }
      };
      
      // تبدیل به رشته‌ی فشرده
      let str = '';
      for (const [key, value] of Object.entries(features)) {
        if (key === 'videoFormats') {
          for (const [format, supported] of Object.entries(value)) {
            str += `${format}:${supported ? '1' : '0'}|`;
          }
        } else {
          str += `${key}:${value ? '1' : '0'}|`;
        }
      }
      
      // هش کردن برای کاهش حجم
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return Math.abs(hash).toString(36);
    }, 'feature-error');
  },

  /**
   * سیگنال ۱۴: اطلاعات دستگاه‌های ورودی (ماوس، تاچ، کیبورد)
   * بدون نیاز به دسترسی، فقط قابلیت‌ها را بررسی می‌کنیم
   */
  getInputDevices() {
    return Helpers.safeExecute(() => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      const isPointerDevice = 'PointerEvent' in window;
      const isPenDevice = 'PenEvent' in window || (navigator.pointer && navigator.pointer.pen);
      
      // تشخیص تعداد مانیتورها (فقط در بعضی مرورگرها)
      let monitors = 1;
      if (window.screen && window.screen.availWidth && window.screen.availHeight) {
        // تخمین تعداد مانیتورها از طریق عرض کل
        const totalWidth = window.screen.width || 0;
        const totalHeight = window.screen.height || 0;
        const availWidth = window.screen.availWidth || 0;
        const availHeight = window.screen.availHeight || 0;
        if (totalWidth > availWidth || totalHeight > availHeight) {
          monitors = 2; // حدس ساده
        }
      }
      
      return `touch:${isTouchDevice ? '1' : '0'}|maxTouch:${maxTouchPoints}|pointer:${isPointerDevice ? '1' : '0'}|pen:${isPenDevice ? '1' : '0'}|monitors:${monitors}`;
    }, 'touch:0|maxTouch:0|pointer:0|pen:0|monitors:1');
  },

  /**
   * سیگنال ۱۵: تنظیمات صفحه‌کلید و زبان
   */
  getKeyboardInfo() {
    return Helpers.safeExecute(() => {
      // navigator.keyboard فقط در HTTPS و مرورگرهای مدرن
      let keyboardLayout = 'unknown';
      if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
        // این API نیاز به permission دارد، بنابراین فقط وجود آن را چک می‌کنیم
        keyboardLayout = 'supported';
      }
      
      // تشخیص ورودی‌های جایگزین (مثل IME)
      const hasIME = 'InputMethodManager' in window || 'mozInputMethod' in navigator;
      
      return `kb:${keyboardLayout}|ime:${hasIME ? '1' : '0'}`;
    }, 'kb:unknown|ime:0');
  },

  /**
   * سیگنال ۱۶: بررسی وجود AdBlocker یا extensions
   * با استفاده از تکنیک‌های غیرمستقیم
   */
  getAdBlockerStatus() {
    return Helpers.safeExecute(() => {
      // تکنیک ۱: تلاش برای بارگذاری یک فایل تبلیغاتی معروف
      let detected = false;
      
      // تکنیک ۲: بررسی display: none در یک المان خاص
      const testElement = document.createElement('div');
      testElement.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
      testElement.style.display = 'block';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      document.body.appendChild(testElement);
      
      // اگر AdBlocker فعال باشد، این المان را مخفی می‌کند
      const computedStyle = window.getComputedStyle(testElement);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        detected = true;
      }
      
      document.body.removeChild(testElement);
      
      // تکنیک ۳: بررسی fetch به یک دامنه‌ی تبلیغاتی (ایمن‌تر)
      // این کار را انجام نمی‌دیم چون ممکن است باعث خطای CORS بشود
      
      return detected ? 'adblock-detected' : 'no-adblock';
    }, 'no-adblock');
  },

  /**
   * سیگنال ۱۷: ویژگی‌های Battery (در صورت موجود بودن)
   * این سیگنال وزن کمی دارد اما می‌تواند مفید باشد
   */
  async getBatteryInfo() {
    try {
      if (!navigator.getBattery) return 'battery-unknown';
      const battery = await navigator.getBattery();
      const level = Math.round(battery.level * 100);
      const charging = battery.charging;
      const chargingTime = battery.chargingTime;
      
      // دسته‌بندی سطح باتری
      let levelCategory = 'unknown';
      if (level >= 75) levelCategory = 'high';
      else if (level >= 50) levelCategory = 'medium';
      else if (level >= 25) levelCategory = 'low';
      else levelCategory = 'critical';
      
      return `level:${levelCategory}|charging:${charging ? '1' : '0'}|time:${chargingTime > 0 ? Math.round(chargingTime/60) : '0'}`;
    } catch (_) {
      return 'battery-error';
    }
  },

  /**
   * جمع‌آوری همه‌ی سیگنال‌های محیطی به صورت همزمان
   */
  async collectAll() {
    const [
      network,
      features,
      input,
      keyboard,
      adblock,
      battery
    ] = await Promise.all([
      Promise.resolve(this.getNetworkInfo()),
      Promise.resolve(this.getFeatureSupport()),
      Promise.resolve(this.getInputDevices()),
      Promise.resolve(this.getKeyboardInfo()),
      Promise.resolve(this.getAdBlockerStatus()),
      this.getBatteryInfo()
    ]);

    return {
      network,
      features,
      input,
      keyboard,
      adblock,
      battery
    };
  }
};

export default EnvironmentSignals;