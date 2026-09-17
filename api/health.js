/**
 * Platform utility endpoint (Hobby plan: max 12 serverless functions).
 * - GET /api/health — offline detection
 * - POST /api/posthog-analytics-query — rewritten here via vercel.json
 */
import posthogAnalyticsQuery from '../lib/api/posthog-analytics-query-handler.js';

export default async function handler(req, res) {
  const route = typeof req.query?.__route === 'string' ? req.query.__route : '';
  if (route === 'posthog-analytics-query') {
    return posthogAnalyticsQuery(req, res);
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(200).json({
    status: 'ok',
    service: 'emarzona',
    timestamp: new Date().toISOString(),
  });
}
