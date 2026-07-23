/**
 * Proxy MoneyFusion payin initiate — Node TLS-tolerant (Edge Deno fails NotValidForName).
 *
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET)
 * Body: { apiUrl: string, payload: object }
 */
import https from 'https';
import { URL } from 'url';

function assertInternal(req) {
  const expected = (process.env.EDGE_INTERNAL_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) return false;
  const got = (req.headers['x-internal-secret'] || '').toString().trim();
  return got.length > 0 && got === expected;
}

function postJsonInsecure(apiUrl, payload) {
  const u = new URL(apiUrl);
  if (u.protocol !== 'https:') {
    return Promise.reject(new Error('Only https MONEYFUSION_API_URL is allowed'));
  }
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        rejectUnauthorized: false,
        timeout: 30000,
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
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
      reject(new Error('MoneyFusion pay proxy timeout'));
    });
    req.write(body);
    req.end();
  });
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

  const apiUrl = typeof req.body?.apiUrl === 'string' ? req.body.apiUrl.trim() : '';
  const payload = req.body?.payload;
  if (!apiUrl.startsWith('https://') || !payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'apiUrl (https) and payload object required' });
  }

  // Only allow MoneyFusion hosts
  try {
    const host = new URL(apiUrl).hostname.toLowerCase();
    if (
      !host.endsWith('moneyfusion.net') &&
      !host.endsWith('pay.moneyfusion.net') &&
      host !== 'www.pay.moneyfusion.net' &&
      host !== 'pay.moneyfusion.net' &&
      host !== 'payin.moneyfusion.net' &&
      host !== 'api.moneyfusion.net'
    ) {
      return res.status(400).json({ error: 'apiUrl host not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid apiUrl' });
  }

  try {
    const upstream = await postJsonInsecure(apiUrl, payload);
    res.setHeader('Content-Type', upstream.contentType);
    return res.status(upstream.status).send(upstream.body);
  } catch (err) {
    return res.status(502).json({
      error: 'MoneyFusion pay proxy failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
