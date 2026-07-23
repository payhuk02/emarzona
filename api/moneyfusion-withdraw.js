/**
 * MoneyFusion withdraw proxy (Vercel)
 * Payouts from Supabase Edge hit MoneyFusion IP whitelist (Edge egress blocked).
 * Edge calls this with x-internal-secret; we forward from Vercel egress (same as payin).
 *
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET)
 * Body: {
 *   action: "withdraw" | "methods",
 *   privateKey: string,
 *   payload?: object   // required for withdraw
 * }
 */

import https from 'https';
import { URL } from 'url';

function assertInternal(req) {
  const expected = (process.env.EDGE_INTERNAL_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) return false;
  const got = (req.headers['x-internal-secret'] || '').toString().trim();
  return got.length > 0 && got === expected;
}

function requestInsecure(method, apiUrl, payload, extraHeaders = {}) {
  const u = new URL(apiUrl);
  if (u.protocol !== 'https:') {
    return Promise.reject(new Error('Only https MoneyFusion URLs are allowed'));
  }
  const body = method === 'GET' || payload == null ? null : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      ...extraHeaders,
    };
    if (body != null) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method,
        headers,
        rejectUnauthorized: false,
        timeout: 45000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 502,
            body: Buffer.concat(chunks).toString('utf8'),
            contentType: res.headers['content-type'] || 'application/json',
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MoneyFusion withdraw proxy timeout'));
    });
    if (body != null) req.write(body);
    req.end();
  });
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
    const upstream = await requestInsecure(method, apiUrl, payload, {
      'moneyfusion-private-key': privateKey,
    });
    res.setHeader('Content-Type', upstream.contentType);
    return res.status(upstream.status).send(upstream.body);
  } catch (err) {
    return res.status(502).json({
      error: 'MoneyFusion withdraw proxy failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
