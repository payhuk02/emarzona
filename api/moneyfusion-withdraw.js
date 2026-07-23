/**
 * MoneyFusion withdraw proxy (Vercel)
 * Prefer static egress (FIXIE_URL / MONEYFUSION_STATIC_EGRESS_PROXY) so MoneyFusion
 * only needs ONE stable IP (Vercel alone rotates → whitelist breaks).
 *
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET)
 *
 * POST body: { action: "withdraw" | "methods", privateKey, payload? }
 * GET  ?action=egress-ip  → diagnose outbound IP (Fixie vs dynamic)
 */

import { URL } from 'url';
import {
  moneyFusionHttpsRequest,
  getStaticEgressProxyUrl,
  getPinnedEgressIp,
} from '../lib/api/moneyfusion-https.js';

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

async function handleEgressIp(req, res) {
  if (!assertInternal(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const hasStatic = Boolean(getStaticEgressProxyUrl());
  const pinned = getPinnedEgressIp();
  const samples = Math.min(5, Math.max(1, Number(req.query?.samples) || (pinned ? 1 : 3)));
  try {
    const seen = [];
    for (let i = 0; i < samples; i++) {
      const upstream = await moneyFusionHttpsRequest('GET', 'https://api.ipify.org', null, {
        Accept: 'text/plain',
      });
      if (upstream.status < 400 && upstream.body?.trim()) {
        const ip = upstream.body.trim();
        if (!seen.includes(ip)) seen.push(ip);
      }
    }
    if (seen.length === 0) {
      return res.status(502).json({
        error: 'Could not resolve egress IP',
        staticProxyConfigured: hasStatic,
        pinnedEgressIp: pinned || null,
      });
    }
    const egressIp = pinned || seen[0];
    const loadBalanced = !pinned && seen.length > 1;
    return res.status(200).json({
      egressIp,
      egressIps: seen,
      pinnedEgressIp: pinned || null,
      staticProxyConfigured: hasStatic,
      mode: pinned ? 'static-proxy-pinned' : hasStatic ? 'static-proxy' : 'vercel-dynamic',
      hint: !hasStatic
        ? 'No static proxy. Set FIXIE_URL then whitelist the returned IP once.'
        : loadBalanced
          ? `Fixie load-balances across ${seen.join(' + ')}. Whitelist BOTH in MoneyFusion → Mon Compte → API KEY (retrait), or set FIXIE_OUTBOUND_IP to pin one.`
          : `Whitelist this IP in MoneyFusion → Mon Compte → API KEY (retraits): ${egressIp}. API de Paiement is for payin only.`,
    });
  } catch (err) {
    return res.status(502).json({
      error: 'egress lookup failed',
      detail: err instanceof Error ? err.message : String(err),
      staticProxyConfigured: hasStatic,
      pinnedEgressIp: pinned || null,
    });
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-internal-secret');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const action = String(req.query?.action || '').trim();
    if (action === 'egress-ip') {
      return handleEgressIp(req, res);
    }
    return res.status(400).json({ error: 'GET requires ?action=egress-ip' });
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
    const egressMode = getPinnedEgressIp()
      ? 'static-proxy-pinned'
      : getStaticEgressProxyUrl()
        ? 'static-proxy'
        : 'vercel-dynamic';
    res.setHeader('X-Emarzona-Egress', egressMode);
    if (getPinnedEgressIp()) res.setHeader('X-Emarzona-Egress-Ip', getPinnedEgressIp());
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
