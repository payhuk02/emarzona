/**
 * Epic 4.5 — SAML 2.0 HTTP-Redirect (authn) + HTTP-POST (ACS) validation
 * Minimal implementation without heavy XML libs — RSA-SHA256 signature verify.
 */

const SAML_NS = {
  protocol: 'urn:oasis:names:tc:SAML:2.0:protocol',
  assertion: 'urn:oasis:names:tc:SAML:2.0:assertion',
};

export interface SamlValidationResult {
  email: string;
  groups: string[];
  nameId: string;
  sessionIndex?: string;
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importIdpPublicKey(certPem: string): Promise<CryptoKey> {
  const der = pemToDer(certPem);
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

function decodeSamlPayload(encoded: string): string {
  const normalized = encoded.replace(/ /g, '+');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function getTagContent(xml: string, tag: string): string | null {
  const patterns = [
    new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'),
    new RegExp(`<([a-zA-Z0-9:]+:)?${tag}[^>]*>([^<]*)</([a-zA-Z0-9:]+:)?${tag}>`, 'i'),
  ];
  for (const re of patterns) {
    const m = xml.match(re);
    if (m) return (m[2] ?? m[1] ?? '').trim();
  }
  return null;
}

function getAttributeValues(xml: string, attrName: string): string[] {
  const values: string[] = [];
  const attrRe = new RegExp(
    `<(?:saml2?:)?Attribute[^>]*Name="${attrName}"[^>]*>([\\s\\S]*?)</(?:saml2?:)?Attribute>`,
    'gi'
  );
  let attrMatch;
  while ((attrMatch = attrRe.exec(xml)) !== null) {
    const block = attrMatch[1];
    const valRe = /<(?:saml2?:)?AttributeValue[^>]*>([^<]*)<\/(?:saml2?:)?AttributeValue>/gi;
    let valMatch;
    while ((valMatch = valRe.exec(block)) !== null) {
      values.push(valMatch[1].trim());
    }
  }
  return values;
}

function assertNotExpired(xml: string): void {
  const notOnOrAfter = getTagContent(xml, 'NotOnOrAfter');
  if (notOnOrAfter && new Date(notOnOrAfter) < new Date()) {
    throw new Error('SAML assertion expired');
  }
}

function assertStatusSuccess(xml: string): void {
  const status = getTagContent(xml, 'StatusCode');
  if (status && !status.includes('Success')) {
    throw new Error(`SAML status not success: ${status}`);
  }
}

async function verifyXmlSignature(xml: string, certPem: string): Promise<void> {
  const sigMatch = xml.match(/<(?:ds:)?Signature[\s\S]*?<\/(?:ds:)?Signature>/i);
  if (!sigMatch) {
    throw new Error('SAML response is not signed');
  }
  const sigBlock = sigMatch[0];

  const signedInfoMatch = sigBlock.match(/<(?:ds:)?SignedInfo[\s\S]*?<\/(?:ds:)?SignedInfo>/i);
  const sigValueMatch = sigBlock.match(
    /<(?:ds:)?SignatureValue[^>]*>([^<]+)<\/(?:ds:)?SignatureValue>/i
  );
  if (!signedInfoMatch || !sigValueMatch) {
    throw new Error('Invalid SAML signature structure');
  }

  const signedInfo = signedInfoMatch[0];
  const sigValueB64 = sigValueMatch[1].replace(/\s/g, '');
  const sigBytes = Uint8Array.from(atob(sigValueB64), c => c.charCodeAt(0));

  const key = await importIdpPublicKey(certPem);
  const data = new TextEncoder().encode(signedInfo);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, data);
  if (!valid) {
    throw new Error('SAML signature verification failed');
  }
}

export function extractEmailFromAssertion(xml: string): string {
  const nameId = getTagContent(xml, 'NameID');
  if (nameId && nameId.includes('@')) {
    return nameId.toLowerCase().trim();
  }

  for (const attr of [
    'email',
    'mail',
    'emailAddress',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  ]) {
    const vals = getAttributeValues(xml, attr);
    if (vals[0]?.includes('@')) return vals[0].toLowerCase().trim();
  }

  throw new Error('Email not found in SAML assertion');
}

export function extractGroupsFromAssertion(xml: string): string[] {
  const groups: string[] = [];
  for (const attr of [
    'groups',
    'memberOf',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
  ]) {
    groups.push(...getAttributeValues(xml, attr));
  }
  return [...new Set(groups.filter(Boolean))];
}

export async function validateSamlResponse(
  samlResponseB64: string,
  idpCertPem: string,
  _expectedAudience?: string
): Promise<SamlValidationResult> {
  const xml = decodeSamlPayload(samlResponseB64);
  assertStatusSuccess(xml);
  assertNotExpired(xml);
  await verifyXmlSignature(xml, idpCertPem);

  const email = extractEmailFromAssertion(xml);
  const nameId = getTagContent(xml, 'NameID') || email;
  const sessionIndex = getTagContent(xml, 'SessionIndex') ?? undefined;

  return {
    email,
    groups: extractGroupsFromAssertion(xml),
    nameId,
    sessionIndex,
  };
}

export function buildSamlAuthnRedirectUrl(
  idpSsoUrl: string,
  spEntityId: string,
  acsUrl: string,
  relayState: string
): string {
  const issueInstant = new Date().toISOString();
  const requestId = `_${crypto.randomUUID().replace(/-/g, '')}`;
  const authnRequest = [
    `<samlp:AuthnRequest xmlns:samlp="${SAML_NS.protocol}"`,
    ` xmlns:saml="${SAML_NS.assertion}"`,
    ` ID="${requestId}" Version="2.0" IssueInstant="${issueInstant}"`,
    ` Destination="${idpSsoUrl}" AssertionConsumerServiceURL="${acsUrl}"`,
    ` ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">`,
    `<saml:Issuer>${spEntityId}</saml:Issuer>`,
    `<samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>`,
    `</samlp:AuthnRequest>`,
  ].join('');

  const encoded = btoa(authnRequest);
  const params = new URLSearchParams({
    SAMLRequest: encoded,
    RelayState: relayState,
  });
  const sep = idpSsoUrl.includes('?') ? '&' : '?';
  return `${idpSsoUrl}${sep}${params.toString()}`;
}

export function getSpEntityId(): string {
  const site = (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').replace(/\/$/, '');
  return `${site}/auth/sso/saml`;
}
