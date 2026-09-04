/**
 * Injecte preconnect/dns-prefetch pour Supabase (et storage) selon VITE_SUPABASE_URL.
 * Complète les hints statiques de index.html pour preview/E2E où l'URL diffère.
 */
import { useEffect } from 'react';

function ensureHint(rel: string, href: string, crossOrigin?: string) {
  if (typeof document === 'undefined' || !href) return;
  const existing = document.head.querySelector(`link[rel="${rel}"][href="${href}"]`);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (crossOrigin) link.crossOrigin = crossOrigin;
  document.head.appendChild(link);
}

function originFromEnvUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function ResourceHints() {
  useEffect(() => {
    const supabaseOrigin = originFromEnvUrl(import.meta.env.VITE_SUPABASE_URL);
    if (supabaseOrigin) {
      ensureHint('preconnect', supabaseOrigin, 'anonymous');
      ensureHint('dns-prefetch', supabaseOrigin);
      // Storage API same origin — hint helps first product image / logo fetches
      ensureHint('preconnect', `${supabaseOrigin}/storage/v1`, 'anonymous');
    }

    // Common CDN / analytics already in index.html; reinforce for SPA navigations
    ensureHint('dns-prefetch', 'https://images.unsplash.com');
    ensureHint('preconnect', 'https://storage.googleapis.com', 'anonymous');
  }, []);

  return null;
}
