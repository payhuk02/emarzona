/**
 * HTTPS client for MoneyFusion with optional static egress proxy.
 *
 * Env (first match wins):
 *   MONEYFUSION_STATIC_EGRESS_PROXY
 *   FIXIE_URL
 *   QUOTAGUARDSTATIC_URL
 *   QUOTAGUARD_URL
 *
 * Format: http://user:pass@host:port
 *
 * Without a proxy, Vercel uses rotating IPs → MoneyFusion whitelist breaks.
 */

import http from 'http';
import tls from 'tls';
import { URL } from 'url';

export function getStaticEgressProxyUrl() {
  return (
    process.env.MONEYFUSION_STATIC_EGRESS_PROXY ||
    process.env.FIXIE_URL ||
    process.env.QUOTAGUARDSTATIC_URL ||
    process.env.QUOTAGUARD_URL ||
    ''
  ).trim();
}

function buildAuthHeader(proxyUrl) {
  if (!proxyUrl.username && !proxyUrl.password) return null;
  const user = decodeURIComponent(proxyUrl.username || '');
  const pass = decodeURIComponent(proxyUrl.password || '');
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

function connectTls(targetHost, proxyUrlString) {
  return new Promise((resolve, reject) => {
    if (!proxyUrlString) {
      const socket = tls.connect({
        host: targetHost,
        port: 443,
        servername: targetHost,
        rejectUnauthorized: false,
      });
      socket.once('secureConnect', () => resolve(socket));
      socket.once('error', reject);
      return;
    }

    let proxyUrl;
    try {
      proxyUrl = new URL(proxyUrlString);
    } catch {
      reject(new Error('Invalid static egress proxy URL'));
      return;
    }

    const connectHeaders = {
      Host: `${targetHost}:443`,
      Connection: 'close',
    };
    const auth = buildAuthHeader(proxyUrl);
    if (auth) connectHeaders['Proxy-Authorization'] = auth;

    const req = http.request({
      host: proxyUrl.hostname,
      port: Number(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80),
      method: 'CONNECT',
      path: `${targetHost}:443`,
      headers: connectHeaders,
      timeout: 20000,
    });

    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        reject(new Error(`Proxy CONNECT failed: HTTP ${res.statusCode}`));
        return;
      }
      const tlsSocket = tls.connect({
        socket,
        servername: targetHost,
        rejectUnauthorized: false,
      });
      tlsSocket.once('secureConnect', () => resolve(tlsSocket));
      tlsSocket.once('error', reject);
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Proxy CONNECT timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

function parseHttpResponse(raw) {
  const sep = raw.indexOf('\r\n\r\n');
  if (sep < 0) {
    return { status: 502, headers: {}, body: raw, contentType: 'text/plain' };
  }
  const head = raw.slice(0, sep);
  const body = raw.slice(sep + 4);
  const lines = head.split('\r\n');
  const status = Number((lines[0].match(/\s(\d{3})\s/) || [])[1]) || 502;
  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const idx = lines[i].indexOf(':');
    if (idx > 0) {
      headers[lines[i].slice(0, idx).trim().toLowerCase()] = lines[i].slice(idx + 1).trim();
    }
  }
  return {
    status,
    headers,
    body,
    contentType: headers['content-type'] || 'application/json',
  };
}

/**
 * HTTPS request (TLS-tolerant), via static egress proxy when configured.
 */
export async function moneyFusionHttpsRequest(method, apiUrl, payload, extraHeaders = {}) {
  const u = new URL(apiUrl);
  if (u.protocol !== 'https:') {
    throw new Error('Only https MoneyFusion URLs are allowed');
  }

  const body = method === 'GET' || payload == null ? null : JSON.stringify(payload);
  const proxyUrl = getStaticEgressProxyUrl();
  const socket = await connectTls(u.hostname, proxyUrl || null);

  const headerLines = [
    `${method} ${u.pathname}${u.search} HTTP/1.1`,
    `Host: ${u.hostname}`,
    'Accept: application/json',
    'Connection: close',
  ];
  for (const [k, v] of Object.entries(extraHeaders)) {
    if (v != null && v !== '') headerLines.push(`${k}: ${v}`);
  }
  if (body != null) {
    headerLines.push('Content-Type: application/json');
    headerLines.push(`Content-Length: ${Buffer.byteLength(body)}`);
  }

  const requestRaw = `${headerLines.join('\r\n')}\r\n\r\n${body != null ? body : ''}`;

  return new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('MoneyFusion request timeout'));
    }, 45000);

    socket.on('data', (c) => chunks.push(c));
    socket.on('end', () => {
      clearTimeout(timer);
      const parsed = parseHttpResponse(Buffer.concat(chunks).toString('utf8'));
      resolve({
        status: parsed.status,
        body: parsed.body,
        contentType: parsed.contentType,
        viaStaticProxy: Boolean(proxyUrl),
      });
    });
    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    socket.write(requestRaw);
  });
}
