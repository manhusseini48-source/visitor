/**
 * Device and Browser Detection Utility
 * Extracts accurate hardware, OS, and browser details for analytics & observatory
 */

export interface DetectedDeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  userAgent: string;
  language: string;
  isStandalonePWA: boolean;
  platform: string;
}

export function detectCurrentDevice(): DetectedDeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'desktop',
      os: 'نامشخص',
      browser: 'نامشخص',
      screenWidth: 1920,
      screenHeight: 1080,
      viewportWidth: 1920,
      viewportHeight: 1080,
      pixelRatio: 1,
      userAgent: '',
      language: 'fa-AF',
      isStandalonePWA: false,
      platform: '',
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // Screen & Viewport
  const screenWidth = window.screen?.width || window.innerWidth || 0;
  const screenHeight = window.screen?.height || window.innerHeight || 0;
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const pixelRatio = Math.round((window.devicePixelRatio || 1) * 100) / 100;

  // Standalone PWA detection
  const isStandalonePWA =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  // OS Detection
  let os = 'سایر';
  if (/windows phone/i.test(ua)) {
    os = 'Windows Phone';
  } else if (/windows nt 10\.0/i.test(ua)) {
    os = 'ویندوز ۱۰ / ۱۱';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'ویندوز ۸.۱';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'ویندوز ۷';
  } else if (/windows/i.test(ua)) {
    os = 'ویندوز';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android\s([0-9.]+)/i);
    os = match ? `اندروید ${match[1]}` : 'اندروید';
  } else if (/ipad/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
    const match = ua.match(/os\s([0-9_]+)/i);
    const ver = match ? match[1].replace(/_/g, '.') : '';
    os = ver ? `iPadOS ${ver}` : 'iPadOS (آی‌پد)';
  } else if (/iphone/i.test(ua)) {
    const match = ua.match(/iphone\sos\s([0-9_]+)/i);
    const ver = match ? match[1].replace(/_/g, '.') : '';
    os = ver ? `iOS ${ver} (آیفون)` : 'iOS (آیفون)';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'مک‌اواس (macOS)';
  } else if (/cros/i.test(ua)) {
    os = 'سیستم‌عامل کروم';
  } else if (/linux/i.test(ua)) {
    os = 'لینوکس';
  }

  // Browser Detection
  let browser = 'مرورگر وب';
  if (/samsungbrowser/i.test(ua)) {
    const match = ua.match(/samsungbrowser\/([0-9.]+)/i);
    browser = match ? `سامسونگ اینترنت ${match[1].split('.')[0]}` : 'سامسونگ اینترنت';
  } else if (/edg([ea]|ios)?\/([0-9.]+)/i.test(ua)) {
    browser = 'مایکروسافت اج';
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'اپرا (Opera)';
  } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua)) {
    const match = ua.match(/(chrome|crios)\/([0-9.]+)/i);
    browser = match ? `گوگل کروم ${match[2].split('.')[0]}` : 'گوگل کروم';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'موزیلا فایرفاکس';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'سافاری (Apple Safari)';
  } else if (/duckduckgo/i.test(ua)) {
    browser = 'داک‌داک‌گو';
  }

  // Device Type Detection
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (platform === 'MacIntel' && maxTouchPoints > 1) ||
    (maxTouchPoints > 1 && Math.min(screenWidth, screenHeight) >= 600 && Math.max(screenWidth, screenHeight) <= 1200);

  const isMobile =
    /(android.*mobile|iphone|ipod|blackberry|bb10|windows phone|iemobile|mobile safari|opera mini)/i.test(ua) ||
    (maxTouchPoints > 0 && Math.min(screenWidth, screenHeight) < 600);

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  } else {
    // If screen width is small (e.g. mobile viewport) and has touch
    if (screenWidth <= 500) {
      deviceType = 'mobile';
    } else if (screenWidth <= 1024 && maxTouchPoints > 0) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }
  }

  return {
    deviceType,
    os,
    browser,
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    pixelRatio,
    userAgent: ua,
    language: navigator.language || 'fa-AF',
    isStandalonePWA,
    platform,
  };
}
