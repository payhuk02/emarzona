/**
 * Purge Cloudflare cache for myemarzona.shop + skip Bot Fight on hashed assets.
 *
 * Auth (one of):
 *   CLOUDFLARE_API_TOKEN              — API Token (Bearer) with Zone.Cache Purge + Zone.WAF Edit
 *   CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL — Global API Key (X-Auth-Key) + account email
 *
 * Optional:
 *   CLOUDFLARE_ZONE_ID — zone id for myemarzona.shop (auto-resolved if omitted)
 *
 * Usage:
 *   node scripts/cloudflare-purge-and-skip-bots.mjs
 */

import fs from 'fs';

const API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'myemarzona.shop';
const RULE_DESCRIPTION = 'Emarzona — skip Bot Fight on hashed build assets (/js /assets /fonts)';

function loadDotEnvFile() {
  try {
    const path = `${process.cwd()}/.env`;
    if (!fs.existsSync(path)) return;
    const text = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim().replace(/^\uFEFF/, '');
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      // Always apply CLOUDFLARE_* from .env (shell may have a stale partial token)
      if (key.startsWith('CLOUDFLARE_') || process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore missing .env
  }
}

loadDotEnvFile();

const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
const apiKey = process.env.CLOUDFLARE_API_KEY?.trim() || apiToken;
const email = process.env.CLOUDFLARE_EMAIL?.trim();

const isHexGlobalKey = key => /^[a-f0-9]{32,37}$/i.test(key || '');

function buildAuthHeaders() {
  // Prefer Bearer when it looks like an API Token (not a hex Global API Key)
  if (apiToken && !isHexGlobalKey(apiToken)) {
    return {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };
  }
  if (apiKey && email && isHexGlobalKey(apiKey)) {
    return {
      'X-Auth-Email': email,
      'X-Auth-Key': apiKey,
      'Content-Type': 'application/json',
    };
  }
  if (apiToken && isHexGlobalKey(apiToken) && !email) {
    console.error(
      'CLOUDFLARE_API_TOKEN looks like a Global API Key (hex).\n' +
        'Add CLOUDFLARE_EMAIL=your@email.com to .env\n' +
        '— or create an API Token (Create Token) and paste that instead.'
    );
    process.exit(1);
  }
  console.error('Missing CLOUDFLARE_API_TOKEN (or CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL)');
  process.exit(1);
}

const headers = buildAuthHeaders();
console.log(
  `Auth: ${isHexGlobalKey(apiKey) ? 'Global API Key' : 'API Token'}` +
    (email ? ` + ${email}` : '')
);

async function cf(path, { method = 'GET', body, allowStatuses = [] } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if ((!res.ok || json.success === false) && !allowStatuses.includes(res.status)) {
    const err = JSON.stringify(json.errors || json, null, 2);
    throw new Error(`${method} ${path} failed (${res.status}): ${err}`);
  }
  return { status: res.status, json };
}

async function resolveZoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID?.trim()) {
    return process.env.CLOUDFLARE_ZONE_ID.trim();
  }
  const { json: data } = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
  const zone = data.result?.[0];
  if (!zone?.id) {
    throw new Error(`Zone not found for ${ZONE_NAME}. Set CLOUDFLARE_ZONE_ID.`);
  }
  return zone.id;
}

async function purgeZone(zoneId) {
  console.log(`Purging cache for zone ${ZONE_NAME} (${zoneId})…`);
  await cf(`/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    body: { purge_everything: true },
  });
  console.log('Cache purge requested (everything).');
}

/**
 * WAF custom ruleset entry: skip Bot Fight / Super Bot Fight for build assets.
 * Expression matches storefront + apex asset paths.
 */
function skipBotsExpression() {
  // Avoid `matches` (regex) — requires Business / WAF Advanced.
  // `starts_with` works on Free/Pro.
  return [
    '(starts_with(http.request.uri.path, "/js/")',
    'or starts_with(http.request.uri.path, "/assets/")',
    'or starts_with(http.request.uri.path, "/fonts/"))',
  ].join(' ');
}

function buildSkipRuleBodies() {
  const base = {
    expression: skipBotsExpression(),
    description: RULE_DESCRIPTION,
    enabled: true,
  };
  // Note: product "botFightMode" is INVALID — classic Bot Fight Mode cannot be
  // skipped via WAF (disable it in Security → Bots). We only skip SBFM + products.
  return [
    {
      ...base,
      action: 'skip',
      action_parameters: {
        phases: ['http_request_sbfm', 'http_request_firewall_managed', 'http_ratelimit'],
        products: ['bic', 'hot', 'securityLevel', 'uaBlock', 'zoneLockdown'],
      },
    },
    {
      ...base,
      action: 'skip',
      action_parameters: {
        phases: ['http_request_sbfm'],
        products: ['bic', 'hot', 'securityLevel'],
      },
    },
    {
      ...base,
      action: 'skip',
      action_parameters: {
        phases: ['http_request_sbfm'],
      },
    },
  ];
}

async function ensureSkipBotFightRule(zoneId) {
  console.log('Ensuring WAF skip-Bot-Fight rule for /js|/assets|/fonts…');

  const phase = 'http_request_firewall_custom';
  const entryPath = `/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`;
  const { status, json: entrypoint } = await cf(entryPath, { allowStatuses: [404] });

  const candidates = buildSkipRuleBodies();

  // No custom ruleset yet → create entrypoint with the skip rule
  if (status === 404 || !entrypoint.result?.id) {
    let lastErr;
    for (const rule of candidates) {
      try {
        await cf(entryPath, {
          method: 'PUT',
          body: {
            rules: [rule],
          },
        });
        console.log('Created custom ruleset entrypoint + skip-Bot-Fight rule.');
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Failed to create entrypoint ruleset');
  }

  const rulesetId = entrypoint.result.id;
  const existing = entrypoint.result.rules || [];
  const match = existing.find(r => r.description === RULE_DESCRIPTION);

  if (match?.id) {
    let lastErr;
    for (const rule of candidates) {
      try {
        await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules/${match.id}`, {
          method: 'PATCH',
          body: rule,
        });
        console.log(`Updated existing rule ${match.id}`);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Failed to update skip rule');
  }

  let lastErr;
  for (const rule of candidates) {
    try {
      await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules`, {
        method: 'POST',
        body: rule,
      });
      console.log('Created skip-Bot-Fight custom rule.');
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Failed to create skip rule');
}

async function main() {
  const zoneId = await resolveZoneId();
  await purgeZone(zoneId);
  await ensureSkipBotFightRule(zoneId);
  console.log('Done.');
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
