// src/index.js

import Fingerprint from './fingerprint.js';
import Helpers from './utils/helpers.js';

/**
 * تابع کمکی برای دریافت سریع اثر انگشت با تنظیمات پیش‌فرض
 * این ساده‌ترین روش استفاده از کتابخانه است
 * 
 * @param {Object} options - تنظیمات اختیاری
 * @param {string} options.accuracy - سطح دقت: 'fast' | 'balanced' | 'high'
 * @param {number} options.fuzzyThreshold - آستانه‌ی تشابه برای تشخیص فازی (۰ تا ۱)
 * @param {Object} options.customWeights - وزن‌دهی سفارشی به بخش‌های سه‌گانه
 * @param {boolean} options.enableBase - فعال‌سازی سیگنال‌های پایه
 * @param {boolean} options.enableGraphic - فعال‌سازی سیگنال‌های گرافیکی
 * @param {boolean} options.enableEnvironment - فعال‌سازی سیگنال‌های محیطی
 * @param {boolean} options.enableTiming - فعال‌سازی سیگنال‌های تایمینگ
 * @returns {Promise<Object>} - شامل hash، parts، rawSignals و metadata
 * 
 * @example
 * // استفاده ساده
 * import { getFingerprint } from 'whouser';
 * const fingerprint = await getFingerprint();
 * console.log(fingerprint.hash); // "a3f5b2-9d4c7e-1f8a3d"
 * 
 * @example
 * // استفاده با تنظیمات پیشرفته
 * const fingerprint = await getFingerprint({
 *   accuracy: 'high',
 *   fuzzyThreshold: 0.8,
 *   customWeights: { hardware: 0.6, software: 0.3, visual: 0.1 }
 * });
 */
export async function getFingerprint(options = {}) {
  const instance = new Fingerprint(options);
  return await instance.getFingerprint();
}

/**
 * کلاس اصلی کتابخانه برای استفاده‌ی پیشرفته‌تر
 * با این کلاس می‌توانید چندین اثر انگشت تولید کرده و آن‌ها را با هم مقایسه کنید
 * 
 * @example
 * import { Fingerprint } from 'whouser';
 * 
 * const fp = new Fingerprint({ accuracy: 'high' });
 * const result1 = await fp.getFingerprint();
 * const result2 = await fp.getFingerprint();
 * const isSame = fp.compare(result1, result2); // true
 */
export { Fingerprint };

/**
 * توابع کمکی برای استفاده‌ی پیشرفته
 * شامل توابعی برای هش کردن، نرمال‌سازی و تشخیص مرورگر
 * 
 * @example
 * import { Helpers } from 'whouser';
 * const hash = Helpers.simpleHash('my string');
 * const browser = Helpers.detectBrowser();
 */
export { Helpers };

/**
 * خروجی پیش‌فرض برای محیط‌های قدیمی (CommonJS)
 * اگر از require استفاده می‌کنید
 * 
 * @example
 * const whouser = require('whouser');
 * const fp = await whouser.getFingerprint();
 */
export default {
  getFingerprint,
  Fingerprint,
  Helpers
};

// ==========================================
// مثال‌های کامل استفاده (برای مرجع)
// ==========================================

/*
 * مثال ۱: ساده‌ترین حالت
 * مناسب برای اکثر موارد استفاده
 */
/*
import { getFingerprint } from 'whouser';

(async () => {
  const result = await getFingerprint();
  console.log('Fingerprint:', result.hash);
  console.log('Parts:', result.parts);
  console.log('Metadata:', result.metadata);
})();
*/

/*
 * مثال ۲: با دقت بالا و مقایسه‌ی دو کاربر
 * مناسب برای سناریوهای امنیتی و تشخیص هویت
 */
/*
import { Fingerprint } from 'whouser';

(async () => {
  const fp = new Fingerprint({ 
    accuracy: 'high', 
    fuzzyThreshold: 0.75 
  });
  
  // اثر انگشت کاربر اول
  const user1 = await fp.getFingerprint();
  console.log('User 1:', user1.hash);
  
  // اثر انگشت کاربر دوم (مثلاً بعد از تغییر رزولوشن)
  const user2 = await fp.getFingerprint();
  console.log('User 2:', user2.hash);
  
  // مقایسه
  const isSame = fp.compare(user1, user2);
  console.log('Same user?', isSame); // احتمالاً true
})();
*/

/*
 * مثال ۳: غیرفعال کردن برخی از سیگنال‌ها برای سرعت بیشتر
 * مناسب برای دستگاه‌های ضعیف یا اتصالات کند
 */
/*
import { getFingerprint } from 'whouser';

(async () => {
  const result = await getFingerprint({
    accuracy: 'fast',
    enableGraphic: false, // غیرفعال کردن سیگنال‌های گرافیکی سنگین
    enableTiming: false   // غیرفعال کردن بنچمارک‌های تایمینگ
  });
  console.log('Fast fingerprint:', result.hash);
})();
*/

/*
 * مثال ۴: تشخیص فازی با آستانه‌ی سفارشی
 * مناسب برای سناریوهایی که تغییرات زیادی انتظار می‌رود
 */
/*
import { Fingerprint } from 'whouser';

(async () => {
  const fp = new Fingerprint({ 
    fuzzyThreshold: 0.5 // آستانه‌ی پایین‌تر = تشخیص راحت‌تر
  });
  
  const userA = await fp.getFingerprint();
  // ... تغییرات در دستگاه کاربر
  const userB = await fp.getFingerprint();
  
  const isSame = fp.compare(userA, userB);
  console.log('Same user with low threshold?', isSame);
})();
*/

/*
 * مثال ۵: ذخیره‌سازی و بازیابی اثر انگشت
 * برای شناسایی کاربر در بازدیدهای بعدی
 */
/*
import { getFingerprint } from 'whouser';

// ذخیره‌سازی
const fp = await getFingerprint();
localStorage.setItem('whouser_id', fp.hash);

// بازیابی
const storedHash = localStorage.getItem('whouser_id');
if (storedHash === fp.hash) {
  console.log('Welcome back, returning user!');
} else {
  console.log('New visitor detected.');
}
*/