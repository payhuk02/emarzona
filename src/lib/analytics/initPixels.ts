/**
 * Système d'injection automatique des pixels de tracking
 * Google Analytics, Facebook Pixel, Google Tag Manager, TikTok
 * Date : 27 octobre 2025
 */

// Déclarer les types pour window
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    ttq?: any;
  }
}

/**
 * Initialiser Google Analytics 4 (GA4)
 */
export const initGoogleAnalytics = (measurementId: string) => {
  if (!measurementId || typeof window === 'undefined') return;

  // Vérifier si déjà initialisé
  if (document.getElementById(`ga-${measurementId}`)) {
    console.log('Google Analytics already initialized');
    return;
  }

  // Script GA4
  const script = document.createElement('script');
  script.id = `ga-${measurementId}`;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Configuration
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer!.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    page_path: window.location.pathname,
  });

  console.log(`✅ Google Analytics initialized: ${measurementId}`);
};

/**
 * Initialiser Facebook Pixel
 */
export const initFacebookPixel = (pixelId: string) => {
  if (!pixelId || typeof window === 'undefined') return;

  // Vérifier si déjà initialisé
  if (window.fbq) {
    console.log('Facebook Pixel already initialized');
    return;
  }

  // Facebook Pixel Code
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  window.fbq!('init', pixelId);
  window.fbq!('track', 'PageView');

  console.log(`✅ Facebook Pixel initialized: ${pixelId}`);
};

/**
 * Initialiser Google Tag Manager
 */
export const initGoogleTagManager = (containerId: string) => {
  if (!containerId || typeof window === 'undefined') return;

  // Vérifier si déjà initialisé
  if (document.getElementById(`gtm-${containerId}`)) {
    console.log('Google Tag Manager already initialized');
    return;
  }

  // Google Tag Manager
  (function (w: any, d: any, s: any, l: any, i: any) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.id = `gtm-${i}`;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', containerId);

  console.log(`✅ Google Tag Manager initialized: ${containerId}`);
};

/**
 * Initialiser TikTok Pixel
 */
export const initTikTokPixel = (pixelId: string) => {
  if (!pixelId || typeof window === 'undefined') return;

  // Vérifier si déjà initialisé
  if (window.ttq) {
    console.log('TikTok Pixel already initialized');
    return;
  }

  // TikTok Pixel Code
  (function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    (ttq.methods = [
      'page',
      'track',
      'identify',
      'instances',
      'debug',
      'on',
      'off',
      'once',
      'ready',
      'alias',
      'group',
      'enableCookie',
      'disableCookie',
    ]),
      (ttq.setAndDefer = function (t: any, e: any) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      });
    for (var i = 0; i < ttq.methods.length; i++)
      ttq.setAndDefer(ttq, ttq.methods[i]);
    (ttq.instance = function (t: any) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
        ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    }),
      (ttq.load = function (e: any, n: any) {
        var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        (ttq._i = ttq._i || {}),
          (ttq._i[e] = []),
          (ttq._i[e]._u = i),
          (ttq._t = ttq._t || {}),
          (ttq._t[e] = +new Date()),
          (ttq._o = ttq._o || {}),
          (ttq._o[e] = n || {});
        var o = document.createElement('script');
        (o.type = 'text/javascript'),
          (o.async = !0),
          (o.src = i + '?sdkid=' + e + '&lib=' + t);
        var a = document.getElementsByTagName('script')[0];
        a.parentNode!.insertBefore(o, a);
      });

    ttq.load(pixelId);
    ttq.page();
  })(window, document, 'ttq');

  console.log(`✅ TikTok Pixel initialized: ${pixelId}`);
};

/**
 * Tracker un événement personnalisé vers tous les pixels actifs
 */
export const trackEvent = (
  eventName: string,
  eventData?: Record<string, any>
) => {
  if (typeof window === 'undefined') return;

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, eventData);
    console.log(`📊 GA Event: ${eventName}`, eventData);
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', eventName, eventData);
    console.log(`📘 FB Event: ${eventName}`, eventData);
  }

  // TikTok Pixel
  if (window.ttq) {
    window.ttq.track(eventName, eventData);
    console.log(`🎵 TikTok Event: ${eventName}`, eventData);
  }
};

/**
 * Tracker une conversion (inscription au cours)
 */
export const trackConversion = (courseId: string, value?: number) => {
  trackEvent('Purchase', {
    course_id: courseId,
    value: value || 0,
    currency: 'XOF',
  });
};

/**
 * Tracker un clic
 */
export const trackClick = (element: string, metadata?: Record<string, any>) => {
  trackEvent('Click', {
    element,
    ...metadata,
  });
};

