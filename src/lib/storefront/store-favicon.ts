const DEFAULT_FAVICON = '/icon-32x32.png';

function getMimeType(url: string): string {
  if (url.endsWith('.ico')) return 'image/x-icon';
  if (url.endsWith('.svg')) return 'image/svg+xml';
  if (url.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

function resolveStoreFaviconUrl(store: {
  favicon_url?: string | null;
  apple_touch_icon_url?: string | null;
  logo_url?: string | null;
}): string | null {
  return store.favicon_url || store.apple_touch_icon_url || store.logo_url || null;
}

/**
 * Applique le favicon d'une boutique sur les pages storefront thémées.
 * Retourne une fonction de nettoyage qui restaure le favicon plateforme.
 */
export function applyStoreFavicon(
  store: {
    favicon_url?: string | null;
    apple_touch_icon_url?: string | null;
    logo_url?: string | null;
  } | null
): () => void {
  const faviconUrl = store ? resolveStoreFaviconUrl(store) : null;
  if (!faviconUrl) {
    return () => {};
  }

  const managedLinks = document.querySelectorAll('link[data-store-favicon="true"]');
  managedLinks.forEach(link => link.remove());

  const mimeType = getMimeType(faviconUrl);
  const timestamp = Date.now();
  const href = `${faviconUrl}?v=${timestamp}`;

  const specs = [
    { rel: 'icon', type: mimeType },
    { rel: 'icon', type: 'image/png', sizes: '32x32' },
    { rel: 'icon', type: 'image/png', sizes: '16x16' },
    { rel: 'apple-touch-icon', sizes: '180x180' },
  ];

  specs.forEach(spec => {
    const link = document.createElement('link');
    link.rel = spec.rel;
    if (spec.type) link.type = spec.type;
    if (spec.sizes) link.sizes = spec.sizes;
    link.href = href;
    link.setAttribute('data-store-favicon', 'true');
    document.head.appendChild(link);
  });

  return () => {
    document.querySelectorAll('link[data-store-favicon="true"]').forEach(link => link.remove());

    const defaultLink = document.querySelector('link#favicon-default') as HTMLLinkElement | null;
    if (defaultLink) {
      defaultLink.href = `${DEFAULT_FAVICON}?v=${Date.now()}`;
    }
  };
}
