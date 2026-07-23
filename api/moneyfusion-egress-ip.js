/**
 * Diagnose egress IP (Vercel dynamic vs static proxy).
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET)
 * GET /api/moneyfusion-egress-ip
 */

import { moneyFusionHttpsRequest, getStaticEgressProxyUrl } from './_lib/moneyfusion-https.js';

function assertInternal(req) {
  const expected = (process.env.EDGE_INTERNAL_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) return false;
  const got = (req.headers['x-internal-secret'] || '').toString().trim();
  return got.length > 0 && got === expected;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-internal-secret');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!assertInternal(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hasStatic = Boolean(getStaticEgressProxyUrl());

  try {
    // ipify over the same egress path as MoneyFusion withdraw
    const upstream = await moneyFusionHttpsRequest('GET', 'https://api.ipify.org', null, {
      Accept: 'text/plain',
    });
    if (upstream.status >= 400 || !upstream.body?.trim()) {
      return res.status(502).json({
        error: 'Could not resolve egress IP',
        detail: upstream.body,
        staticProxyConfigured: hasStatic,
      });
    }

    const egressIp = upstream.body.trim();
    return res.status(200).json({
      egressIp,
      staticProxyConfigured: hasStatic,
      mode: hasStatic ? 'static-proxy' : 'vercel-dynamic',
      hint: hasStatic
        ? `Whitelist ONLY this IP in MoneyFusion (Modifier Emarzona + Mon Compte API KEY): ${egressIp}`
        : 'No static proxy. Vercel IP rotates — set FIXIE_URL or MONEYFUSION_STATIC_EGRESS_PROXY, then whitelist the returned IP once.',
    });
  } catch (err) {
    return res.status(502).json({
      error: 'egress lookup failed',
      detail: err instanceof Error ? err.message : String(err),
      staticProxyConfigured: hasStatic,
    });
  }
}
