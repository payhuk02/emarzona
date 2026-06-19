import { useEffect } from 'react';
import { usePixels } from '@/hooks/usePixels';
import { logger } from '@/lib/logger';
import { loadExternalScript } from '@/lib/security/load-external-script';

// Interfaces pour les APIs de tracking
interface PixelEventData {
  product_id?: string;
  product_name?: string;
  amount?: number;
  order_id?: string;
  content_ids?: string[];
  content_name?: string;
  value?: number;
  currency?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  transaction_id?: string;
  content_id?: string;
}

interface FacebookPixel {
  (action: string, event: string, data?: PixelEventData): void;
}

interface GoogleTag {
  (command: string, targetId: string, config?: PixelEventData): void;
}

interface TikTokPixel {
  track: (event: string, data?: PixelEventData) => void;
}

interface PinterestPixel {
  track: (event: string, data?: PixelEventData) => void;
}

declare global {
  interface Window {
    fbq?: FacebookPixel;
    gtag?: GoogleTag;
    ttq?: TikTokPixel;
    pintrk?: PinterestPixel;
  }
}

interface PixelInjectorProps {
  storeUserId?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
}

export const PixelInjector = ({
  storeUserId,
  productId,
  productName,
  productPrice,
}: PixelInjectorProps) => {
  const { pixels, trackEvent } = usePixels();

  useEffect(() => {
    if (!storeUserId) return;

    // Filter active pixels
    const activePixels = pixels.filter(p => p.is_active);

    activePixels.forEach(pixel => {
      switch (pixel.pixel_type) {
        case 'facebook':
          injectFacebookPixel(pixel.pixel_id);
          break;
        case 'google':
          injectGooglePixel(pixel.pixel_id);
          break;
        case 'tiktok':
          injectTikTokPixel(pixel.pixel_id);
          break;
        case 'pinterest':
          injectPinterestPixel(pixel.pixel_id);
          break;
        case 'custom':
          // IMPORTANT (sécurité):
          // Exécuter du code arbitraire stocké en base = XSS persistante.
          // Fonctionnalité désactivée par défaut (prod + dev).
          if (pixel.pixel_code) {
            logger.warn('Custom pixel code is disabled for security reasons.', {
              pixelId: pixel.id,
              storeUserId,
            });
          }
          break;
      }

      // Track PageView event
      if (productId) {
        trackEvent(pixel.id, 'pageview', {
          product_id: productId,
          product_name: productName,
          amount: productPrice,
        });
      }
    });

    return () => {
      // Cleanup scripts on unmount if needed
    };
  }, [storeUserId, pixels, productId, productName, productPrice, trackEvent]);

  return null;
};

// Facebook Pixel injection
const injectFacebookPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  if (window.fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as typeof window.fbq & { queue: unknown[]; callMethod?: (...args: unknown[]) => void };
  fbq.queue = [];
  window.fbq = fbq;

  loadExternalScript('https://connect.facebook.net/en_US/fbevents.js', {
    id: `fb-pixel-injector-${pixelId}`,
    onLoad: () => {
      window.fbq?.('init', pixelId);
      window.fbq?.('track', 'PageView');
    },
  });

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
};

// Google Pixel injection
const injectGooglePixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Check if already injected
  if (window.gtag) return;

  loadExternalScript(`https://www.googletagmanager.com/gtag/js?id=${pixelId}`, {
    id: `ga-pixel-injector-${pixelId}`,
    integrity: null,
  });

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${pixelId}');
  `;
  document.head.appendChild(script2);
};

// TikTok Pixel injection
const injectTikTokPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Check if already injected
  if (window.ttq) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var  ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var  i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var  e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var  i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq.i =ttq._i||{},ttq._i[e]=[],ttq._i[e].u =i,ttq.t =ttq._t||{},ttq._t[e]=+new Date,ttq.o =ttq._o||{},ttq._o[e]=n||{};var  o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var  a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
};

// Pinterest Pixel injection
const injectPinterestPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Check if already injected
  if (window.pintrk) return;

  const pintrk = function (...args: unknown[]) {
    pintrk.queue.push(args);
  } as PinterestPixel & { queue: unknown[]; version?: string };
  pintrk.queue = [];
  pintrk.version = '3.0';
  window.pintrk = pintrk;

  loadExternalScript('https://s.pinimg.com/ct/core.js', {
    id: `pinterest-pixel-${pixelId}`,
    onLoad: () => {
      window.pintrk?.('load', pixelId, { em: '<user_email_address>' });
      window.pintrk?.('page');
    },
  });

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none;" alt="" src="https://ct.pinterest.com/v3/?event=init&tid=${pixelId}&noscript=1" />`;
  document.body.appendChild(noscript);
};

// NOTE: Custom code injection intentionally removed (security).

// Export tracking functions for use in other components
export const trackAddToCart = (pixelId: string, pixelType: string, data: PixelEventData) => {
  switch (pixelType) {
    case 'facebook':
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_ids: [data.product_id],
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
    case 'google':
      if (window.gtag) {
        window.gtag('event', 'add_to_cart', {
          items: [
            {
              id: data.product_id,
              name: data.product_name,
              price: data.amount,
            },
          ],
        });
      }
      break;
    case 'tiktok':
      if (window.ttq) {
        window.ttq.track('AddToCart', {
          content_id: data.product_id,
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
  }
};

export const trackPurchase = (pixelId: string, pixelType: string, data: PixelEventData) => {
  switch (pixelType) {
    case 'facebook':
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          content_ids: [data.product_id],
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
    case 'google':
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: data.order_id,
          value: data.amount,
          currency: 'XOF',
          items: [
            {
              id: data.product_id,
              name: data.product_name,
              price: data.amount,
            },
          ],
        });
      }
      break;
    case 'tiktok':
      if (window.ttq) {
        window.ttq.track('CompletePayment', {
          content_id: data.product_id,
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
  }
};
