/** CSP violation report sink (report-uri). Accepts the report and returns 204. */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end();
    return;
  }
  res.status(204).end();
}
