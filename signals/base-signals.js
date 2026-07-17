// src/signals/base-signals.js

import Helpers from '../utils/helpers.js';

/**
 * ماژول سیگنال‌های پایه
 * شامل اطلاعات سیستم‌عامل، سخت‌افزار، صفحه‌نمایش، مرورگر، زبان و حالت مخفی
 * این سیگنال‌ها بالاترین وزن را در هش نهایی دارند (بخش Hardware و Software)
 */
export const BaseSignals = {
  /**
   * سیگنال ۱: اطلاعات سیستم‌عامل و پلتفرم
   * ترکیبی از platform، os و معماری
   */
  getOSInfo() {
    return Helpers.safeExecute(() => {
      const platform = navigator.platform || 'unknown';
      const ua = navigator.userAgent;
      let os = 'unknown';
      
      if (ua.indexOf('Win') !== -1) os = 'Windows';
      else if (ua.indexOf('Mac') !== -1) os = 'MacOS';
      else if (ua.indexOf('Linux') !== -1) os = 'Linux';
      else if (ua.indexOf('Android') !== -1) os = 'Android';
      else if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';
      
      // تشخیص معماری از userAgent یا platform
      let arch = 'unknown';
      if (ua.includes('x86_64') || ua.includes('WOW64') || ua.includes('Win64')) arch = 'x64';
      else if (ua.includes('arm') || ua.includes('ARM')) arch = 'arm';
      else if (ua.includes('aarch64')) arch = 'arm64';
      
      return `${os}|${platform}|${arch}`;
    }, 'unknown|unknown|unknown');
  },

  /**
   * سیگنال ۲: اطلاعات صفحه‌نمایش (نرمال‌سازی شده)
   * ترکیب عرض، ارتفاع، عمق رنگ و نسبت پیکسل
   * با گرد کردن به دسته‌های ۱۰۰ پیکسلی برای مقاومت در برابر تغییرات جزئی
   */
  getScreenInfo() {
    return Helpers.safeExecute(() => {
      const screen = window.screen;
      const width = Helpers.roundToBucket(screen.width, 100);
      const height = Helpers.roundToBucket(screen.height, 100);
      const colorDepth = screen.colorDepth || 24;
      const pixelRatio = Helpers.roundToBucket(window.devicePixelRatio || 1, 0.5);
      
      // نسبت تصویر (aspect ratio) به صورت دسته‌بندی شده
      const aspect = (width / height);
      let aspectCategory = 'other';
      if (Math.abs(aspect - 1.333) < 0.05) aspectCategory = '4x3';
      else if (Math.abs(aspect - 1.6) < 0.05) aspectCategory = '16x10';
      else if (Math.abs(aspect - 1.777) < 0.05) aspectCategory = '16x9';
      else if (Math.abs(aspect - 2.333) < 0.05) aspectCategory = '21x9';
      
      return `${width}x${height}|${colorDepth}bit|${pixelRatio}x|${aspectCategory}`;
    }, '0x0|0|0|other');
  },

  /**
   * سیگنال ۳: مشخصات سخت‌افزاری CPU و حافظه
   */
  getHardwareInfo() {
    return Helpers.safeExecute(() => {
      const cores = navigator.hardwareConcurrency || 0;
      // deviceMemory در بعضی مرورگرها موجود است (مخصوص کروم)
      let memory = navigator.deviceMemory || 0;
      // گرد کردن حافظه به دسته‌های ۲، ۴، ۸، ۱۶ گیگ
      if (memory > 0) {
        if (memory <= 2) memory = 2;
        else if (memory <= 4) memory = 4;
        else if (memory <= 8) memory = 8;
        else if (memory <= 16) memory = 16;
        else memory = 32;
      }
      
      // تعداد هسته‌ها را هم دسته‌بندی می‌کنیم
      let coresCategory = 'unknown';
      if (cores <= 2) coresCategory = '1-2';
      else if (cores <= 4) coresCategory = '3-4';
      else if (cores <= 8) coresCategory = '5-8';
      else if (cores > 8) coresCategory = '9+';
      
      return `${coresCategory}|${memory}GB`;
    }, 'unknown|0');
  },

  /**
   * سیگنال ۴: اطلاعات مرورگر (نام و نسخه اصلی)
   */
  getBrowserInfo() {
    return Helpers.safeExecute(() => {
      const { browser, version } = Helpers.detectBrowser();
      // نسخه را به دسته‌های اصلی تقسیم می‌کنیم (مثلاً ۱۲۰، ۱۲۱، ...)
      const versionCategory = Math.floor(version / 10) * 10;
      return `${browser}|v${versionCategory}`;
    }, 'unknown|0');
  },

  /**
   * سیگنال ۵: تنظیمات زبان و منطقه زمانی
   */
  getLocaleInfo() {
    return Helpers.safeExecute(() => {
      const languages = navigator.languages || [navigator.language || 'en-US'];
      // فقط اولین زبان و زبان‌های اصلی را می‌گیریم (حداکثر ۳ تا)
      const primaryLang = languages[0] || 'en-US';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      // فقط منطقه‌ی اصلی timezone (مثلاً Asia/Tehran -> Asia)
      const tzRegion = timezone.split('/')[0] || 'unknown';
      return `${primaryLang}|${tzRegion}`;
    }, 'en-US|unknown');
  },

  /**
   * سیگنال ۶: تشخیص حالت مخفی (Incognito/Private)
   * این یک سیگنال کمکی برای تمایز است
   */
  async getIncognitoStatus() {
    return await Helpers.isIncognito();
  },

  /**
   * جمع‌آوری همه‌ی سیگنال‌های پایه به صورت همزمان
   * برای سیگنال‌های Async، از Promise.all استفاده می‌کنیم
   */
  async collectAll() {
    const [os, screen, hardware, browser, locale, incognito] = await Promise.all([
      Promise.resolve(this.getOSInfo()),
      Promise.resolve(this.getScreenInfo()),
      Promise.resolve(this.getHardwareInfo()),
      Promise.resolve(this.getBrowserInfo()),
      Promise.resolve(this.getLocaleInfo()),
      this.getIncognitoStatus()
    ]);

    return {
      os,
      screen,
      hardware,
      browser,
      locale,
      incognito
    };
  }
};

export default BaseSignals;