/**
 * Edge Function: og-image
 * Génère dynamiquement des images Open Graph (1200x630) en SVG.
 *
 * Usage:
 *   /functions/v1/og-image?title=Mon%20Produit&subtitle=Boutique&type=product
 *
 * Paramètres:
 *   - title    : titre principal (obligatoire, max ~80 chars)
 *   - subtitle : sous-titre (optionnel, max ~120 chars)
 *   - type     : 'product' | 'store' | 'course' | 'page' (change l'accent visuel)
 *
 * Note: retourne du SVG. Facebook/Twitter acceptent SVG via og:image quand
 * le content-type est correct, mais pour une compat 100% (LinkedIn, WhatsApp),
 * pré-générer en PNG via un job asynchrone reste recommandé.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PALETTE: Record<string, { from: string; to: string; accent: string; label: string }> = {
  product: { from: '#3b82f6', to: '#1e40af', accent: '#fbbf24', label: 'PRODUIT' },
  store: { from: '#10b981', to: '#047857', accent: '#fde68a', label: 'BOUTIQUE' },
  course: { from: '#8b5cf6', to: '#5b21b6', accent: '#fbbf24', label: 'FORMATION' },
  page: { from: '#0f172a', to: '#1e293b', accent: '#3b82f6', label: 'EMARZONA' },
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]!));
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = w;
      if (lines.length === maxLines - 1) break;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current && lines.length < maxLines) lines.push(current.trim());
  if (lines.length === maxLines && words.length > lines.join(' ').split(' ').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > maxCharsPerLine - 1
      ? last.slice(0, maxCharsPerLine - 1) + '…'
      : last + '…';
  }
  return lines;
}

serve(req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const title = url.searchParams.get('title') ?? 'Emarzona';
  const subtitle = url.searchParams.get('subtitle') ?? '';
  const type = url.searchParams.get('type') ?? 'page';
  const theme = PALETTE[type] ?? PALETTE.page;

  const titleLines = wrapText(title.slice(0, 120), 28, 3);
  const subtitleLines = subtitle ? wrapText(subtitle.slice(0, 160), 50, 2) : [];

  const titleStartY = 230 + (3 - titleLines.length) * 35;
  const titleTSpans = titleLines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 90}">${escapeXml(line)}</tspan>`)
    .join('');

  const subtitleStartY = titleStartY + titleLines.length * 90 + 30;
  const subtitleTSpans = subtitleLines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Bandeau type -->
  <rect x="80" y="80" width="${theme.label.length * 14 + 40}" height="44" rx="22" fill="${theme.accent}" fill-opacity="0.2" stroke="${theme.accent}" stroke-width="2"/>
  <text x="${80 + (theme.label.length * 14 + 40) / 2}" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="${theme.accent}" text-anchor="middle" letter-spacing="2">${theme.label}</text>

  <!-- Titre principal -->
  <text x="80" y="${titleStartY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${titleTSpans}</text>

  <!-- Sous-titre -->
  ${subtitleLines.length ? `<text x="80" y="${subtitleStartY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="400" fill="#ffffff" fill-opacity="0.85">${subtitleTSpans}</text>` : ''}

  <!-- Footer / branding -->
  <line x1="80" y1="540" x2="1120" y2="540" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2"/>
  <text x="80" y="585" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="700" fill="#ffffff">emarzona.com</text>
  <text x="1120" y="585" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#ffffff" fill-opacity="0.7" text-anchor="end">Plateforme e-commerce et marketing</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
    },
  });
});