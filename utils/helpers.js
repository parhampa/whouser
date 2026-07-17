// src/utils/helpers.js

/**
 * توابع کمکی عمومی برای کتابخانه اثر انگشت
 * بدون وابستگی به هیچ کتابخانه‌ی دیگری
 */

export const Helpers = {
  /**
   * تشخیص نوع مرورگر و نسخه‌ی اصلی آن
   * برای وزن‌دهی به سیگنال‌ها بر اساس محدودیت‌های مرورگر
   */
  detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    let browser = 'unknown';
    let version = 0;

    if (ua.includes('firefox')) {
      browser = 'firefox';
      const match = ua.match(/firefox\/(\d+)/);
      version = match ? parseInt(match[1], 10) : 0;
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'safari';
      const match = ua.match(/version\/(\d+)/);
      version = match ? parseInt(match[1], 10) : 0;
    } else if (ua.includes('chrome')) {
      browser = 'chrome';
      const match = ua.match(/chrome\/(\d+)/);
      version = match ? parseInt(match[1], 10) : 0;
    } else if (ua.includes('edg')) {
      browser = 'edge';
      const match = ua.match(/edg\/(\d+)/);
      version = match ? parseInt(match[1], 10) : 0;
    }
    return { browser, version };
  },

  /**
   * گرد کردن اعداد به دسته‌های مشخص برای نرمال‌سازی
   * مثلاً رزولوشن صفحه را به نزدیک‌ترین مضرب ۱۰۰ گرد می‌کند
   */
  roundToBucket(value, step = 100) {
    if (typeof value !== 'number' || !isFinite(value)) return 0;
    return Math.round(value / step) * step;
  },

  /**
   * نرمال‌سازی رشته‌ها با حذف فاصله‌های اضافی و تبدیل به حروف کوچک
   * برای مقایسه‌ی فونت‌ها و مقادیر متنی
   */
  normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  },

  /**
   * ایجاد یک هش ساده و سریع (CRC-32 مانند) برای قطعات کوچک
   * این هش فقط برای بخش‌های داخلی استفاده می‌شود، نه هش نهایی
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  },

  /**
   * اجرای یک تابع با خطای خاموش (در صورت بروز خطا، مقدار پیش‌فرض برمی‌گردد)
   * برای جلوگیری از خراب شدن کل اثر انگشت به خاطر یک سیگنال
   */
  safeExecute(fn, fallback = null) {
    try {
      const result = fn();
      return (result !== undefined && result !== null) ? result : fallback;
    } catch (_) {
      return fallback;
    }
  },

  /**
   * بررسی اینکه آیا یک سیگنال باید نادیده گرفته شود (مثلاً در حالت Private/Incognito)
   */
  isIncognito() {
    return new Promise((resolve) => {
      // ساده‌ترین روش: بررسی وجود localStorage با try/catch
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        resolve(false);
      } catch (_) {
        resolve(true);
      }
    });
  }
};

export default Helpers;