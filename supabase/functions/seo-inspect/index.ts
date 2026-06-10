/**
 * Edge Function: seo-inspect
 * Récupère une URL en se faisant passer pour un crawler (Googlebot)
 * et extrait les balises SEO essentielles : title, description, canonical,
 * hreflang, og:*, twitter:*, robots, schema.org JSON-LD.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAuthenticatedUser } from '../_shared/edge-auth-utils.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface SeoData {
  url: string;
  status: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  hreflang: Array<{ lang: string; href: string }>;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
  h1: string[];
  error?: string;
}

function attr(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

function extractMeta(html: string, url: string, status: number): SeoData {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || html;

  const title = attr(head, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = attr(
    head,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const canonical = attr(head, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const robots = attr(head, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);

  const hreflang: Array<{ lang: string; href: string }> = [];
  const hreflangRegex =
    /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi;
  let hl: RegExpExecArray | null;
  while ((hl = hreflangRegex.exec(head))) hreflang.push({ lang: hl[1], href: hl[2] });

  const og: Record<string, string> = {};
  const ogRegex = /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let om: RegExpExecArray | null;
  while ((om = ogRegex.exec(head))) og[om[1]] = om[2];

  const twitter: Record<string, string> = {};
  const twRegex = /<meta[^>]+name=["']twitter:([^"']+)["'][^>]+content=["']([^"']*)["']/gi;
  let tm: RegExpExecArray | null;
  while ((tm = twRegex.exec(head))) twitter[tm[1]] = tm[2];

  const jsonLd: unknown[] = [];
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = ldRegex.exec(html))) {
    try {
      jsonLd.push(JSON.parse(lm[1].trim()));
    } catch {
      /* skip */
    }
  }

  const h1: string[] = [];
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1m: RegExpExecArray | null;
  while ((h1m = h1Regex.exec(html))) {
    h1.push(
      h1m[1]
        .replace(/<[^>]+>/g, '')
        .trim()
        .slice(0, 200)
    );
  }

  return { url, status, title, description, canonical, robots, hreflang, og, twitter, jsonLd, h1 };
}

const ALLOWED_SEO_HOSTS = (
  Deno.env.get('SEO_INSPECT_ALLOWED_HOSTS') ||
  'emarzona.com,www.emarzona.com,myemarzona.shop,localhost,127.0.0.1'
)
  .split(',')
  .map(h => h.trim().toLowerCase())
  .filter(Boolean);

function isAllowedSeoUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_SEO_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authResult = await requireAuthenticatedUser(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'urls array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const limited = urls.slice(0, 50).filter((u: string) => isAllowedSeoUrl(u));
    if (limited.length === 0) {
      return new Response(JSON.stringify({ error: 'No allowed URLs to inspect' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const results: SeoData[] = await Promise.all(
      limited.map(async (u: string) => {
        try {
          const r = await fetch(u, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
              Accept: 'text/html',
            },
            redirect: 'follow',
          });
          const html = await r.text();
          return extractMeta(html, u, r.status);
        } catch (e) {
          return {
            url: u,
            status: 0,
            title: null,
            description: null,
            canonical: null,
            robots: null,
            hreflang: [],
            og: {},
            twitter: {},
            jsonLd: [],
            h1: [],
            error: (e as Error).message,
          };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
