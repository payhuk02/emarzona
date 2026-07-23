/**
 * Diagnose Vercel egress IP seen by the public internet.
 * MoneyFusion whitelist must include this IP (it rotates on serverless).
 *
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET)
 * GET /api/moneyfusion-egress-ip
 */

import https from 'https';

function assertInternal(req) {
  const expected = (process.env.EDGE_INTERNAL_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) return false;
  const got = (req.headers['x-internal-secret'] || '').toString().trim();
  return got.length > 0 && got === expected;
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        method: 'GET',
        headers: { Accept: 'text/plain, application/json' },
        timeout: 10000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 502,
            body: Buffer.concat(chunks).toString('utf8').trim(),
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('egress lookup timeout'));
    });
    req.end();
  });
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

  try {
    const upstream = await fetchText('https://api.ipify.org');
    if (upstream.status >= 400 || !upstream.body) {
      return res.status(502).json({ error: 'Could not resolve egress IP', detail: upstream.body });
    }
    return res.status(200).json({
      egressIp: upstream.body,
      hint:
        'Ajoutez cette IP dans MoneyFusion (Mon Compte → API KEY et API de Paiement → Emarzona). Sur Vercel elle peut changer.',
    });
  } catch (err) {
    return res.status(502).json({
      error: 'egress lookup failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
