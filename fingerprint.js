// src/fingerprint.js

import BaseSignals from './signals/base-signals.js';
import GraphicSignals from './signals/graphic-signals.js';
import EnvironmentSignals from './signals/environment-signals.js';
import TimingSignals from './signals/timing-signals.js';
import Helpers from './utils/helpers.js';

/**
 * کلاس اصلی کتابخانه‌ی whouser
 * تمام سیگنال‌ها را جمع‌آوری کرده، وزن‌دهی کرده و هش نهایی را تولید می‌کند
 * 
 * @example
 * const fp = new Fingerprint({ accuracy: 'high' });
 * const result = await fp.getFingerprint();
 * console.log(result.hash); // "a3f5b2-9d4c7e-1f8a3d"
 */
class Fingerprint {
  constructor(options = {}) {
    this.options = {
      // فعال/غیرفعال کردن دسته‌های سیگنال
      enableBase: options.enableBase !== undefined ? options.enableBase : true,
      enableGraphic: options.enableGraphic !== undefined ? options.enableGraphic : true,
      enableEnvironment: options.enableEnvironment !== undefined ? options.enableEnvironment : true,
      enableTiming: options.enableTiming !== undefined ? options.enableTiming : true,
      
      // سطح دقت (بیشتر = سیگنال‌های بیشتر و زمان بیشتر)
      accuracy: options.accuracy || 'balanced', // 'fast', 'balanced', 'high'
      
      // وزن‌دهی سفارشی (اختیاری)
      customWeights: options.customWeights || null,
      
      // فعال کردن تشخیص فازی (Fuzzy Matching)
      enableFuzzy: options.enableFuzzy !== undefined ? options.enableFuzzy : true,
      
      // آستانه‌ی تشابه برای تشخیص فازی (۰ تا ۱)
      fuzzyThreshold: options.fuzzyThreshold || 0.7
    };
    
    // وزن‌های پیش‌فرض برای هر بخش
    this.weights = {
      hardware: 0.5,  // سخت‌افزار (پایدارترین)
      software: 0.3,  // نرم‌افزار (نسبتاً پایدار)
      visual: 0.2     // ظاهری (کمترین پایداری)
    };
    
    // اگر وزن‌های سفارشی داده شده باشد
    if (this.options.customWeights) {
      Object.assign(this.weights, this.options.customWeights);
    }
    
    // تنظیم سطح دقت
    this.setAccuracy(this.options.accuracy);
  }

  /**
   * تنظیم سطح دقت
   */
  setAccuracy(level) {
    switch(level) {
      case 'fast':
        // فقط سیگنال‌های پایه و سریع
        this.options.enableTiming = false;
        this.options.enableGraphic = false;
        this.options.enableEnvironment = false;
        break;
      case 'high':
        // همه‌ی سیگنال‌ها با دقت بالا (زمان بیشتر)
        this.options.enableTiming = true;
        this.options.enableGraphic = true;
        this.options.enableEnvironment = true;
        break;
      case 'balanced':
      default:
        // تعادل بین سرعت و دقت
        this.options.enableTiming = true;
        this.options.enableGraphic = true;
        this.options.enableEnvironment = true;
        break;
    }
  }

  /**
   * جمع‌آوری همه‌ی سیگنال‌ها
   */
  async collectAllSignals() {
    const signals = {};
    
    // سیگنال‌های پایه (همیشه فعال)
    if (this.options.enableBase) {
      const base = await BaseSignals.collectAll();
      Object.assign(signals, base);
    }
    
    // سیگنال‌های گرافیکی
    if (this.options.enableGraphic) {
      const graphic = await GraphicSignals.collectAll();
      Object.assign(signals, graphic);
    }
    
    // سیگنال‌های محیطی
    if (this.options.enableEnvironment) {
      const env = await EnvironmentSignals.collectAll();
      Object.assign(signals, env);
    }
    
    // سیگنال‌های تایمینگ
    if (this.options.enableTiming) {
      const timing = await TimingSignals.collectAll();
      Object.assign(signals, timing);
    }
    
    return signals;
  }

  /**
   * تولید هش نهایی با روش سه بخشی
   * بخش ۱: سخت‌افزاری (وزن بالا) - WebGL، CPU، حافظه
   * بخش ۲: نرم‌افزاری (وزن متوسط) - OS، مرورگر، زبان
   * بخش ۳: ظاهری (وزن کم) - رزولوشن، فونت‌ها، تایمینگ‌ها
   */
  generateHash(signals) {
    // بخش سخت‌افزاری (پایدارترین)
    const hardwarePart = this.buildHardwarePart(signals);
    
    // بخش نرم‌افزاری (نسبتاً پایدار)
    const softwarePart = this.buildSoftwarePart(signals);
    
    // بخش ظاهری (کمترین پایداری)
    const visualPart = this.buildVisualPart(signals);
    
    // هش کردن هر بخش با یک الگوریتم ساده
    const hash1 = Helpers.simpleHash(hardwarePart);
    const hash2 = Helpers.simpleHash(softwarePart);
    const hash3 = Helpers.simpleHash(visualPart);
    
    // ترکیب نهایی با وزن‌ها (برای نمایش)
    const finalHash = `${hash1}-${hash2}-${hash3}`;
    
    return {
      hash: finalHash,
      parts: {
        hardware: hash1,
        software: hash2,
        visual: hash3
      },
      // ذخیره‌ی سیگنال‌های خام برای تطابق فازی
      rawSignals: signals
    };
  }

  /**
   * ساخت بخش سخت‌افزاری
   */
  buildHardwarePart(signals) {
    const parts = [];
    
    // WebGL Vendor & Renderer
    if (signals.webglInfo) {
      parts.push(signals.webglInfo);
    }
    
    // CPU benchmark
    if (signals.cpu) {
      parts.push(signals.cpu);
    }
    
    // Memory benchmark
    if (signals.memory) {
      parts.push(signals.memory);
    }
    
    // تعداد هسته‌ها و حافظه (از base-signals)
    if (signals.hardware) {
      parts.push(signals.hardware);
    }
    
    // اطلاعات GPU از گرافیک
    if (signals.gpuInfo) {
      parts.push(signals.gpuInfo);
    }
    
    return parts.join('|');
  }

  /**
   * ساخت بخش نرم‌افزاری
   */
  buildSoftwarePart(signals) {
    const parts = [];
    
    // OS و پلتفرم
    if (signals.os) {
      parts.push(signals.os);
    }
    
    // مرورگر و نسخه
    if (signals.browser) {
      parts.push(signals.browser);
    }
    
    // زبان و منطقه زمانی
    if (signals.locale) {
      parts.push(signals.locale);
    }
    
    // ویژگی‌های پشتیبانی شده
    if (signals.features) {
      parts.push(signals.features);
    }
    
    // وضعیت AdBlocker
    if (signals.adblock) {
      parts.push(signals.adblock);
    }
    
    // اطلاعات دستگاه‌های ورودی
    if (signals.input) {
      parts.push(signals.input);
    }
    
    return parts.join('|');
  }

  /**
   * ساخت بخش ظاهری
   */
  buildVisualPart(signals) {
    const parts = [];
    
    // رزولوشن و صفحه‌نمایش
    if (signals.screen) {
      parts.push(signals.screen);
    }
    
    // لیست فونت‌ها (از گرافیک)
    if (signals.fonts) {
      parts.push(signals.fonts);
    }
    
    // Canvas و Audio fingerprint (از گرافیک)
    if (signals.canvas) {
      parts.push(signals.canvas);
    }
    if (signals.audio) {
      parts.push(signals.audio);
    }
    
    // تایمینگ‌های صفحه
    if (signals.pageTiming) {
      parts.push(signals.pageTiming);
    }
    
    // عملکرد Canvas و WebGL
    if (signals.canvasPerf) {
      parts.push(signals.canvasPerf);
    }
    if (signals.webglPerf) {
      parts.push(signals.webglPerf);
    }
    
    // اطلاعات شبکه (نوع اتصال)
    if (signals.network) {
      parts.push(signals.network);
    }
    
    return parts.join('|');
  }

  /**
   * تشخیص تطابق فازی بین دو اثر انگشت
   * بر اساس تشابه بخش‌های سه‌گانه
   */
  fuzzyMatch(hash1, hash2) {
    if (!hash1 || !hash2) return false;
    
    // اگر هش‌ها دقیقاً برابر باشند
    if (hash1.hash === hash2.hash) return true;
    
    // بخش‌ها را جدا می‌کنیم
    const parts1 = hash1.hash.split('-');
    const parts2 = hash2.hash.split('-');
    
    if (parts1.length !== 3 || parts2.length !== 3) return false;
    
    // شمارش تعداد بخش‌های مشابه
    let matchCount = 0;
    for (let i = 0; i < 3; i++) {
      if (parts1[i] === parts2[i]) {
        matchCount++;
      }
    }
    
    // محاسبه‌ی نسبت تشابه
    const similarity = matchCount / 3;
    
    // اگر تشابه بیشتر از آستانه باشد
    return similarity >= this.options.fuzzyThreshold;
  }

  /**
   * متد اصلی برای گرفتن اثر انگشت
   * این متد را کاربر صدا می‌زند
   */
  async getFingerprint() {
    try {
      // جمع‌آوری سیگنال‌ها
      const signals = await this.collectAllSignals();
      
      // تولید هش
      const result = this.generateHash(signals);
      
      // اضافه کردن اطلاعات متادیتا برای دیباگ
      result.metadata = {
        timestamp: Date.now(),
        accuracy: this.options.accuracy,
        signalsCount: Object.keys(signals).length
      };
      
      return result;
    } catch (error) {
      console.error('Fingerprint error:', error);
      // در صورت خطا، یک هش پیش‌فرض برمی‌گردانیم
      return {
        hash: 'error-' + Date.now(),
        parts: { hardware: 'error', software: 'error', visual: 'error' },
        rawSignals: {},
        metadata: {
          timestamp: Date.now(),
          accuracy: this.options.accuracy,
          error: error.message
        }
      };
    }
  }

  /**
   * متد کمکی برای مقایسه‌ی دو اثر انگشت
   */
  compare(fingerprint1, fingerprint2) {
    if (!fingerprint1 || !fingerprint2) return false;
    return this.fuzzyMatch(fingerprint1, fingerprint2);
  }
}

export default Fingerprint;