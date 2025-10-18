import { useEffect } from 'react';
import { usePixels } from '@/hooks/usePixels';

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
  productPrice 
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
          if (pixel.pixel_code) {
            injectCustomCode(pixel.pixel_code);
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
  }, [storeUserId, pixels, productId]);

  return null;
};

// Facebook Pixel injection
const injectFacebookPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;
  
  // Check if already injected
  if ((window as any).fbq) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Add noscript pixel
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
};

// Google Pixel injection
const injectGooglePixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;
  
  // Check if already injected
  if ((window as any).gtag) return;

  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${pixelId}`;
  document.head.appendChild(script1);

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
  if ((window as any).ttq) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
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
  if ((window as any).pintrk) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function(e){if(!window.pintrk){window.pintrk = function () {
    window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
      n=window.pintrk;n.queue=[],n.version="3.0";var
      t=document.createElement("script");t.async=!0,t.src=e;var
      r=document.getElementsByTagName("script")[0];
      r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
    pintrk('load', '${pixelId}', {em: '<user_email_address>'});
    pintrk('page');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none;" alt="" src="https://ct.pinterest.com/v3/?event=init&tid=${pixelId}&noscript=1" />`;
  document.body.appendChild(noscript);
};

// Custom code injection
const injectCustomCode = (code: string) => {
  if (typeof window === 'undefined') return;

  const div = document.createElement('div');
  div.innerHTML = code;
  document.body.appendChild(div);
};

// Export tracking functions for use in other components
export const trackAddToCart = (pixelId: string, pixelType: string, data: any) => {
  switch (pixelType) {
    case 'facebook':
      if ((window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_ids: [data.product_id],
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
    case 'google':
      if ((window as any).gtag) {
        (window as any).gtag('event', 'add_to_cart', {
          items: [{
            id: data.product_id,
            name: data.product_name,
            price: data.amount,
          }],
        });
      }
      break;
    case 'tiktok':
      if ((window as any).ttq) {
        (window as any).ttq.track('AddToCart', {
          content_id: data.product_id,
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
  }
};

export const trackPurchase = (pixelId: string, pixelType: string, data: any) => {
  switch (pixelType) {
    case 'facebook':
      if ((window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          content_ids: [data.product_id],
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
    case 'google':
      if ((window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: data.order_id,
          value: data.amount,
          currency: 'XOF',
          items: [{
            id: data.product_id,
            name: data.product_name,
            price: data.amount,
          }],
        });
      }
      break;
    case 'tiktok':
      if ((window as any).ttq) {
        (window as any).ttq.track('CompletePayment', {
          content_id: data.product_id,
          content_name: data.product_name,
          value: data.amount,
          currency: 'XOF',
        });
      }
      break;
  }
};
