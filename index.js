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
 * @returns {Promise<Object>} - شامل hash، parts، rawSignals و metadata
 * 
 * @example
 * // استفاده ساده
 * const fingerprint = await getFingerprint();
 * console.log(fingerprint.hash); // "a3f5-9d2b-7e1c"
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
 * const fp = new Fingerprint({ accuracy: 'high' });
 * const result1 = await fp.getFingerprint();
 * const result2 = await fp.getFingerprint();
 * const isSame = fp.compare(result1, result2); // true
 */
export { Fingerprint };

/**
 * توابع کمکی برای استفاده‌ی پیشرفته
 * شامل توابعی برای هش کردن، نرمال‌سازی و تشخیص مرورگر
 */
export { Helpers };

/**
 * خروجی پیش‌فرض برای استفاده در محیط‌های قدیمی (CommonJS)
 * اگر از require استفاده می‌کنید
 */
export default {
  getFingerprint,
  Fingerprint,
  Helpers
};

// ==========================================
// مثال کامل استفاده در پایین فایل (برای مرجع)
// ==========================================

/*
// مثال ۱: ساده‌ترین حالت
(async () => {
  const result = await getFingerprint();
  console.log('Fingerprint:', result.hash);
  console.log('Parts:', result.parts);
  console.log('Metadata:', result.metadata);
})();

// مثال ۲: با دقت بالا و مقایسه‌ی دو کاربر
(async () => {
  const fp = new Fingerprint({ accuracy: 'high', fuzzyThreshold: 0.75 });
  
  // اثر انگشت کاربر اول
  const user1 = await fp.getFingerprint();
  console.log('User 1:', user1.hash);
  
  // اثر انگشت کاربر دوم (مثلاً بعد از تغییر رزولوشن)
  const user2 = await fp.getFingerprint();
  console.log('User 2:', user2.hash);
  
  // مقایسه
  const isSame = fp.compare(user1, user2);
  console.log('Same user?', isSame); // احتمالاً true به دلیل تطابق فازی
})();

// مثال ۳: غیرفعال کردن برخی از سیگنال‌ها برای سرعت بیشتر
(async () => {
  const result = await getFingerprint({
    accuracy: 'fast',
    enableGraphic: false, // غیرفعال کردن سیگنال‌های گرافیکی سنگین
    enableTiming: false   // غیرفعال کردن بنچمارک‌های تایمینگ
  });
  console.log('Fast fingerprint:', result.hash);
})();
*/