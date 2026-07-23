/**
 * Proxy MoneyFusion paiementNotif — Node can relax TLS where Deno Edge cannot
 * (MF cert NotValidForName breaks Edge verify → paid txs stay processing).
 *
 * Auth: x-internal-secret === EDGE_INTERNAL_SECRET (or CRON_SECRET fallback)
 * Query: ?token=<tokenPay>
 */
import https from 'https';

const MF_STATUS_HOST = 'www.pay.moneyfusion.net';

function assertInternal(req) {
  const expected = (process.env.EDGE_INTERNAL_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) return false;
  const got = (req.headers['x-internal-secret'] || '').toString().trim();
  return got.length > 0 && got === expected;
}

function fetchMfStatus(token) {
  const path = `/paiementNotif/${encodeURIComponent(token)}`;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: MF_STATUS_HOST,
        path,
        method: 'GET',
        headers: { Accept: 'application/json' },
        // MoneyFusion presents a cert whose SAN does not match the hostname
        // from some runtimes; Edge Deno fails hard — this proxy is the workaround.
        rejectUnauthorized: false,
        timeout: 25000,
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode || 502,
            body,
            contentType: res.headers['content-type'] || 'application/json',
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MoneyFusion status timeout'));
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

  const token = String(req.query?.token || '').trim();
  if (!token || token.length < 8) {
    return res.status(400).json({ error: 'token required' });
  }

  try {
    const upstream = await fetchMfStatus(token);
    res.setHeader('Content-Type', upstream.contentType);
    return res.status(upstream.status).send(upstream.body);
  } catch (err) {
    return res.status(502).json({
      error: 'MoneyFusion status proxy failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
