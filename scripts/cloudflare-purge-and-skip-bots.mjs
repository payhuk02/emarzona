/**
 * Purge Cloudflare cache for myemarzona.shop + skip Bot Fight on hashed assets.
 *
 * Required env:
 *   CLOUDFLARE_API_TOKEN   — token with Zone.Cache Purge + Zone.WAF Write (or Account.WAF)
 * Optional:
 *   CLOUDFLARE_ZONE_ID     — zone id for myemarzona.shop (auto-resolved if omitted)
 *   CLOUDFLARE_ACCOUNT_ID  — only needed if zone lookup fails without it
 *
 * Usage:
 *   $env:CLOUDFLARE_API_TOKEN = '<token>'
 *   node scripts/cloudflare-purge-and-skip-bots.mjs
 */

const API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'myemarzona.shop';
const RULE_DESCRIPTION = 'Emarzona — skip Bot Fight on hashed build assets (/js /assets /fonts)';

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error('Missing CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function cf(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    const err = JSON.stringify(json.errors || json, null, 2);
    throw new Error(`${method} ${path} failed (${res.status}): ${err}`);
  }
  return json;
}

async function resolveZoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID?.trim()) {
    return process.env.CLOUDFLARE_ZONE_ID.trim();
  }
  const data = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
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
  return [
    '(http.request.uri.path matches "^/js/"',
    'or http.request.uri.path matches "^/assets/"',
    'or http.request.uri.path matches "^/fonts/")',
  ].join(' ');
}

async function ensureSkipBotFightRule(zoneId) {
  console.log('Ensuring WAF skip-Bot-Fight rule for /js|/assets|/fonts…');

  const phase = 'http_request_firewall_custom';
  const entrypoint = await cf(`/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`);
  const rulesetId = entrypoint.result?.id;
  if (!rulesetId) {
    throw new Error(`No entrypoint ruleset for phase ${phase}`);
  }

  const existing = entrypoint.result?.rules || [];
  const match = existing.find(r => r.description === RULE_DESCRIPTION);
  const ruleBody = {
    action: 'skip',
    action_parameters: {
      products: ['bic', 'hot', 'securityLevel', 'rateLimit', 'waf'],
      phases: ['http_request_sbfm'],
    },
    expression: skipBotsExpression(),
    description: RULE_DESCRIPTION,
    enabled: true,
  };

  // Prefer Super Bot Fight Mode skip when API supports products botfight / sbfm variants
  // Fallback products list covers BIC + SBFM phase skip used by CF dashboard "Skip".
  const altRuleBody = {
    ...ruleBody,
    action_parameters: {
      products: ['botFightMode', 'bic'],
      phases: ['http_request_sbfm'],
    },
  };

  if (match?.id) {
    try {
      await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules/${match.id}`, {
        method: 'PATCH',
        body: altRuleBody,
      });
    } catch {
      await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules/${match.id}`, {
        method: 'PATCH',
        body: ruleBody,
      });
    }
    console.log(`Updated existing rule ${match.id}`);
    return;
  }

  try {
    await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules`, {
      method: 'POST',
      body: altRuleBody,
    });
  } catch (firstErr) {
    console.warn('Primary skip payload rejected, retrying fallback…', String(firstErr.message || firstErr));
    await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules`, {
      method: 'POST',
      body: ruleBody,
    });
  }
  console.log('Created skip-Bot-Fight custom rule.');
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
