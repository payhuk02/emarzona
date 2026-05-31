/** Lightweight health check for offline mode detection (Vercel serverless). */
export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.status(200).json({
    status: 'ok',
    service: 'emarzona',
    timestamp: new Date().toISOString(),
  });
}
