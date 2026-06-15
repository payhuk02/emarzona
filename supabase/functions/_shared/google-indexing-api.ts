/**
 * Epic 5.2 — Google Indexing API (service account JWT)
 */
import { SignJWT, importPKCS8 } from 'npm:jose@5';

export interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
}

export function parseGoogleServiceAccountJson(
  raw: string | undefined
): GoogleServiceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GoogleServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getGoogleIndexingAccessToken(
  serviceAccount: GoogleServiceAccount
): Promise<string> {
  const privateKey = await importPKCS8(serviceAccount.private_key.replace(/\\n/g, '\n'), 'RS256');

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/indexing',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token error: ${err}`);
  }

  const data = (await tokenRes.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('Missing access_token from Google');
  return data.access_token;
}

export async function submitGoogleIndexingUrl(
  accessToken: string,
  url: string,
  urlType: 'URL_UPDATED' | 'URL_DELETED'
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type: urlType }),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }

  return { ok: res.ok, status: res.status, body };
}
