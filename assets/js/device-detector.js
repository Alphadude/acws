/**
 * ACWS — Client Device Detection Service
 * Synchronously detects device form factor (mobile, tablet, desktop),
 * operating system, browser, screen resolution, and hardware capabilities.
 * Zero permissions, zero user prompts, zero network latency.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.ACWSDeviceDetector = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function getDeviceInfo() {
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const win = typeof window !== 'undefined' ? window : {};
    const scr = typeof screen !== 'undefined' ? screen : {};
    const ua = nav.userAgent || '';

    // 1. Operating System & Version Detection
    let os = 'Unknown';
    let osVersion = '';

    if (/iPad|iPhone|iPod/.test(ua)) {
      os = 'iOS';
      const match = ua.match(/OS (\d+[._]\d+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (/Android/.test(ua)) {
      os = 'Android';
      const match = ua.match(/Android\s+([\d.]+)/);
      if (match) osVersion = match[1];
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      // Modern iPads on iPadOS 13+ present as MacIntel with touch support
      if (nav.maxTouchPoints && nav.maxTouchPoints > 1) {
        os = 'iOS'; // iPadOS
      } else {
        os = 'macOS';
        const match = ua.match(/Mac OS X\s+([\d_]+)/);
        if (match) osVersion = match[1].replace(/_/g, '.');
      }
    } else if (/Windows NT/.test(ua)) {
      os = 'Windows';
      const match = ua.match(/Windows NT ([\d.]+)/);
      if (match) {
        const verMap = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
        osVersion = verMap[match[1]] || match[1];
      }
    } else if (/CrOS/.test(ua)) {
      os = 'Chrome OS';
    } else if (/Linux/.test(ua)) {
      os = 'Linux';
    }

    // 2. Browser & Version Detection
    let browser = 'Unknown';
    let browserVersion = '';

    if (/Edg\//.test(ua)) {
      browser = 'Edge';
      const match = ua.match(/Edg\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (/SamsungBrowser/.test(ua)) {
      browser = 'Samsung Internet';
      const match = ua.match(/SamsungBrowser\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (/OPR\/|Opera\//.test(ua)) {
      browser = 'Opera';
      const match = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
      browser = 'Safari';
      const match = ua.match(/Version\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (/Firefox\//.test(ua)) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/([\d.]+)/);
      if (match) browserVersion = match[1];
    }

    // Major browser version
    const majorBrowserVersion = browserVersion ? browserVersion.split('.')[0] : '';

    // 3. Form Factor / Device Type Detection
    let deviceType = 'desktop';
    const isTouch = (typeof win.ontouchstart !== 'undefined') || (nav.maxTouchPoints && nav.maxTouchPoints > 0);
    const screenWidth = scr.width || win.innerWidth || 0;
    const screenHeight = scr.height || win.innerHeight || 0;
    const minDim = Math.min(screenWidth, screenHeight);

    if (os === 'iOS') {
      if (/iPad/.test(ua) || (nav.maxTouchPoints && nav.maxTouchPoints > 1 && screenWidth >= 768)) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }
    } else if (os === 'Android') {
      if (/Mobile/.test(ua) || minDim < 600) {
        deviceType = 'mobile';
      } else {
        deviceType = 'tablet';
      }
    } else if (isTouch && minDim > 0 && minDim < 600) {
      deviceType = 'mobile';
    } else if (isTouch && minDim >= 600 && minDim <= 1024) {
      deviceType = 'tablet';
    }

    // 4. Orientation & Viewport
    let orientation = 'unknown';
    if (scr.orientation && scr.orientation.type) {
      orientation = scr.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
    } else if (win.innerHeight && win.innerWidth) {
      orientation = win.innerHeight >= win.innerWidth ? 'portrait' : 'landscape';
    }

    // 5. Timezone & Locale
    let timezone = '';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
      // Ignore
    }

    const language = nav.language || nav.userLanguage || 'en-GB';

    // 6. User-friendly Device Summary Label
    const summary = `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} (${os}${osVersion ? ' ' + osVersion : ''}) · ${browser}${majorBrowserVersion ? ' ' + majorBrowserVersion : ''}`;

    return {
      deviceType,
      os,
      osVersion: osVersion || undefined,
      browser,
      browserVersion: majorBrowserVersion || undefined,
      screenResolution: `${screenWidth}x${screenHeight}`,
      viewport: `${win.innerWidth || 0}x${win.innerHeight || 0}`,
      pixelRatio: win.devicePixelRatio || 1,
      touchSupport: !!isTouch,
      orientation,
      language,
      timezone,
      summary,
      userAgent: ua.slice(0, 500),
      capturedAt: new Date().toISOString()
    };
  }

  return {
    getDeviceInfo
  };
}));

