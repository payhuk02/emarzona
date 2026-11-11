/**
 * Fix Cloudflare edge for apex/www myemarzona.shop → www.emarzona.com
 *
 * Root cause of ERR_TOO_MANY_REDIRECTS (observed):
 * - Through Cloudflare: 308 Location=same URL (never reaches Vercel, no x-vercel-id)
 * - Direct to Vercel: 308 → https://www.emarzona.com/ (already fixed via domain redirects)
 *
 * Required token permissions:
 *   Zone.Redirect Rules (Edit)  — Single Redirect
 *   Zone.Page Rules (Edit)      — fallback forwarding URL
 *   Zone.DNS (Edit)             — optional: point @ / www to cname.vercel-dns.com
 *   Zone.Cache Purge            — purge after change
 *
 * Usage:
 *   node scripts/cloudflare-fix-apex-to-platform.mjs
 */
import fs from 'fs';

const API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'myemarzona.shop';
const PLATFORM = 'https://www.emarzona.com';
const RULE_DESC = 'Emarzona — apex/www myemarzona.shop → www.emarzona.com';

function loadDotEnvFile() {
  const path = `${process.cwd()}/.env`;
  if (!fs.existsSync(path)) return;
  const text = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key.startsWith('CLOUDFLARE_') || process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadDotEnvFile();

const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
const email = process.env.CLOUDFLARE_EMAIL?.trim();
const isHex = /^[a-f0-9]{32,37}$/i.test(apiToken || '');
const headers =
  apiToken && !isHex
    ? { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
    : {
        'X-Auth-Email': email,
        'X-Auth-Key': apiToken,
        'Content-Type': 'application/json',
      };

if (!apiToken) {
  console.error('Missing CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

async function cf(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

const zoneRes = await cf('GET', `/zones?name=${ZONE_NAME}`);
if (!zoneRes.success) {
  console.error('zone lookup failed', zoneRes.errors);
  process.exit(1);
}
const zoneId = zoneRes.result[0].id;
console.log('ZONE', zoneId);

// 1) Single Redirect (preferred)
const redirectBody = {
  rules: [
    {
      expression: '(http.host eq "myemarzona.shop") or (http.host eq "www.myemarzona.shop")',
      description: RULE_DESC,
      action: 'redirect',
      action_parameters: {
        from_value: {
          status_code: 301,
          target_url: {
            expression: `concat("${PLATFORM}", http.request.uri.path)`,
          },
          preserve_query_string: true,
        },
      },
      enabled: true,
    },
  ],
};

const single = await cf(
  'PUT',
  `/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`,
  redirectBody
);
console.log('\nSingle Redirect:', single.success ? 'OK' : JSON.stringify(single.errors));

// 2) Page Rules fallback if Single Redirect unauthorized
if (!single.success) {
  for (const host of ['myemarzona.shop', 'www.myemarzona.shop']) {
    const pr = await cf('POST', `/zones/${zoneId}/pagerules`, {
      targets: [
        {
          target: 'url',
          constraint: { operator: 'matches', value: `${host}/*` },
        },
      ],
      actions: [
        {
          id: 'forwarding_url',
          value: { url: `${PLATFORM}/$1`, status_code: 301 },
        },
      ],
      status: 'active',
    });
    console.log(`Page Rule ${host}:`, pr.success ? 'OK' : JSON.stringify(pr.errors));
  }
}

// 3) Purge
const purge = await cf('POST', `/zones/${zoneId}/purge_cache`, { purge_everything: true });
console.log('\nCache purge:', purge.success ? 'OK' : JSON.stringify(purge.errors));

console.log(`
Manual checklist if API lacks Redirect/DNS permissions:
1. Cloudflare → ${ZONE_NAME} → Rules → Redirect Rules
   - Delete any rule that forwards apex/www to itself
   - Add: myemarzona.shop OR www.myemarzona.shop → ${PLATFORM} (301)
2. DNS: @ and www must target cname.vercel-dns.com (not a self/parking A record)
3. SSL/TLS mode: Full (strict) — Flexible causes redirect loops
4. Vercel domains already set:
   - myemarzona.shop → www.emarzona.com (308)
   - www.myemarzona.shop → www.emarzona.com (308)
`);
