/**
 * MoneyFusion withdraw proxy (Vercel)
 * Prefer static egress (FIXIE_URL / MONEYFUSION_STATIC_EGRESS_PROXY) so MoneyFusion
 * only needs ONE stable IP (Vercel alone rotates → whitelist breaks).
 *
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET)
 * Body: {
 *   action: "withdraw" | "methods",
 *   privateKey: string,
 *   payload?: object   // required for withdraw
 * }
 */

import { URL } from 'url';
import { moneyFusionHttpsRequest, getStaticEgressProxyUrl } from './_lib/moneyfusion-https.js';

function assertInternal(req) {
  const expected = (process.env.EDGE_INTERNAL_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) return false;
  const got = (req.headers['x-internal-secret'] || '').toString().trim();
  return got.length > 0 && got === expected;
}

const ALLOWED_HOSTS = new Set([
  'pay.moneyfusion.net',
  'www.pay.moneyfusion.net',
  'api.moneyfusion.net',
]);

function assertMoneyFusionHost(apiUrl) {
  const host = new URL(apiUrl).hostname.toLowerCase();
  return ALLOWED_HOSTS.has(host) || host.endsWith('.moneyfusion.net');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-internal-secret');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!assertInternal(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const action = String(req.body?.action || '').trim();
  const privateKey = String(req.body?.privateKey || '').trim();
  if (!privateKey) {
    return res.status(400).json({ error: 'privateKey required' });
  }

  const base = (
    process.env.MONEYFUSION_PAYOUT_BASE_URL || 'https://pay.moneyfusion.net/api/v1'
  ).replace(/\/+$/, '');

  let apiUrl;
  let method;
  let payload = null;

  if (action === 'withdraw') {
    apiUrl = `${base}/withdraw`;
    method = 'POST';
    payload = req.body?.payload;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'payload object required for withdraw' });
    }
  } else if (action === 'methods') {
    apiUrl = `${base}/withdraw/methods`;
    method = 'GET';
  } else {
    return res.status(400).json({ error: 'action must be withdraw or methods' });
  }

  try {
    if (!assertMoneyFusionHost(apiUrl)) {
      return res.status(400).json({ error: 'apiUrl host not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid apiUrl' });
  }

  try {
    const upstream = await moneyFusionHttpsRequest(method, apiUrl, payload, {
      'moneyfusion-private-key': privateKey,
    });
    if (!getStaticEgressProxyUrl()) {
      res.setHeader('X-Emarzona-Egress', 'vercel-dynamic');
    } else {
      res.setHeader('X-Emarzona-Egress', 'static-proxy');
    }
    res.setHeader('Content-Type', upstream.contentType);
    return res.status(upstream.status).send(upstream.body);
  } catch (err) {
    return res.status(502).json({
      error: 'MoneyFusion withdraw proxy failed',
      detail: err instanceof Error ? err.message : String(err),
      hint: getStaticEgressProxyUrl()
        ? undefined
        : 'Configure FIXIE_URL or MONEYFUSION_STATIC_EGRESS_PROXY for a single stable IP (Vercel IPs rotate; 0.0.0.0 is rejected by MoneyFusion).',
    });
  }
}
