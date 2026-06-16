/**
 * POST /api/cache/warm — Précharge les pages critiques (post-deploy / cron).
 * Auth: Bearer CACHE_INVALIDATION_SECRET
 */

const WARM_TARGETS = [
  { path: '/', priority: 'critical' },
  { path: '/marketplace', priority: 'critical' },
  { path: '/marketplace?type=digital', priority: 'high' },
  { path: '/marketplace?type=physical', priority: 'high' },
  { path: '/marketplace?type=service', priority: 'high' },
  { path: '/marketplace?type=course', priority: 'high' },
  { path: '/marketplace?type=artist', priority: 'high' },
];

function checkAuth(req) {
  const secret = process.env.CACHE_INVALIDATION_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';

  if (secret && auth === `Bearer ${secret}`) return { ok: true };
  if (cronSecret && auth === `Bearer ${cronSecret}`) return { ok: true };

  if (!secret && !cronSecret) {
    return { ok: false, reason: 'CACHE_INVALIDATION_SECRET not configured' };
  }
  return { ok: false, reason: 'Unauthorized' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = checkAuth(req);
  if (!auth.ok) {
    return res.status(auth.reason === 'Unauthorized' ? 401 : 503).json({ error: auth.reason });
  }

  const baseUrl =
    req.body?.baseUrl ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.emarzona.com');

  const targets = req.body?.paths
    ? req.body.paths.map(p => ({ path: p, priority: 'normal' }))
    : WARM_TARGETS;

  const start = Date.now();
  const results = [];

  for (const target of targets) {
    const url = `${baseUrl}${target.path}`;
    const t0 = Date.now();
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EmarzonaCacheWarmer/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      results.push({
        path: target.path,
        success: response.ok,
        status: response.status,
        durationMs: Date.now() - t0,
      });
    } catch (error) {
      results.push({
        path: target.path,
        success: false,
        error: error.message,
        durationMs: Date.now() - t0,
      });
    }
  }

  const succeeded = results.filter(r => r.success).length;

  return res.status(200).json({
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    durationMs: Date.now() - start,
    results,
    timestamp: new Date().toISOString(),
  });
}
