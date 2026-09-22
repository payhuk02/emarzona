/**
 * Audit + harden Cloudflare skip for hashed assets on myemarzona.shop
 */
import fs from 'fs';

const API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'myemarzona.shop';
const RULE_DESCRIPTION = 'Emarzona — skip Bot Fight on hashed build assets (/js /assets /fonts)';

function loadEnv() {
  const text = fs.readFileSync('.env', 'utf8').replace(/^\uFEFF/, '');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
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
    if (key.startsWith('CLOUDFLARE_')) process.env[key] = val;
  }
}

loadEnv();

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error('Missing CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function cf(path, { method = 'GET', body, allowStatuses = [] } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if ((!res.ok || json.success === false) && !allowStatuses.includes(res.status)) {
    throw new Error(`${method} ${path} (${res.status}): ${JSON.stringify(json.errors || json)}`);
  }
  return { status: res.status, json };
}

const assetExpr =
  '(starts_with(http.request.uri.path, "/js/") or starts_with(http.request.uri.path, "/assets/") or starts_with(http.request.uri.path, "/fonts/") or starts_with(http.request.uri.path, "/cdn-cgi/"))';

async function main() {
  const { json: zones } = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
  const zoneId = zones.result?.[0]?.id;
  if (!zoneId) throw new Error('zone not found');
  console.log('zone', zoneId);

  // 1) Show current custom firewall rules
  const phase = 'http_request_firewall_custom';
  const entryPath = `/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`;
  const { status, json: entry } = await cf(entryPath, { allowStatuses: [404] });
  console.log(
    'custom rules:',
    JSON.stringify(
      (entry.result?.rules || []).map(r => ({
        id: r.id,
        enabled: r.enabled,
        action: r.action,
        desc: r.description,
        expression: r.expression,
        params: r.action_parameters,
      })),
      null,
      2
    )
  );

  // Strongest skip payload for Bot Fight + Super Bot Fight + BIC
  const skipRule = {
    action: 'skip',
    action_parameters: {
      phases: ['http_request_sbfm'],
      products: ['botFightMode', 'bic', 'hot', 'securityLevel', 'rateLimit', 'waf', 'zoneLockdown', 'uaBlock'],
    },
    description: RULE_DESCRIPTION,
    expression: assetExpr,
    enabled: true,
  };

  if (status === 404 || !entry.result?.id) {
    await cf(entryPath, { method: 'PUT', body: { rules: [skipRule] } });
    console.log('Created custom entrypoint with hardened skip rule');
  } else {
    const rulesetId = entry.result.id;
    const match = (entry.result.rules || []).find(r => r.description === RULE_DESCRIPTION);
    if (match?.id) {
      await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules/${match.id}`, {
        method: 'PATCH',
        body: skipRule,
      });
      console.log('Patched existing skip rule', match.id);
    } else {
      await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules`, {
        method: 'POST',
        body: skipRule,
      });
      console.log('Added skip rule');
    }
  }

  // 2) Configuration Rules: force SBFM allow for static assets (plan-dependent)
  const cfgPhase = 'http_config_settings';
  const cfgPath = `/zones/${zoneId}/rulesets/phases/${cfgPhase}/entrypoint`;
  const cfgRule = {
    action: 'set_config',
    action_parameters: {
      // Super Bot Fight Mode knobs (ignored if entitlement missing)
      sbfm_definitely_automated: 'allow',
      sbfm_likely_automated: 'allow',
      sbfm_verified_bots: 'allow',
      sbfm_static_resource_protection: false,
      bic: false,
    },
    description: 'Emarzona — allow bots / disable BIC on hashed assets',
    expression: assetExpr,
    enabled: true,
  };

  try {
    const { status: cfgStatus, json: cfgEntry } = await cf(cfgPath, { allowStatuses: [404] });
    if (cfgStatus === 404 || !cfgEntry.result?.id) {
      await cf(cfgPath, { method: 'PUT', body: { rules: [cfgRule] } });
      console.log('Created configuration rule for SBFM allow on assets');
    } else {
      const rulesetId = cfgEntry.result.id;
      const match = (cfgEntry.result.rules || []).find(
        r => r.description === cfgRule.description
      );
      if (match?.id) {
        await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules/${match.id}`, {
          method: 'PATCH',
          body: cfgRule,
        });
        console.log('Patched configuration rule', match.id);
      } else {
        await cf(`/zones/${zoneId}/rulesets/${rulesetId}/rules`, {
          method: 'POST',
          body: cfgRule,
        });
        console.log('Added configuration rule');
      }
    }
  } catch (err) {
    console.warn('Configuration Rules not applied:', err.message || err);
  }

  // 3) Purge again so challenge HTML isn't sticky
  await cf(`/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    body: { purge_everything: true },
  });
  console.log('Purged zone cache');

  // Re-read custom rules
  const { json: finalEntry } = await cf(entryPath);
  console.log(
    'final custom rules:',
    JSON.stringify(
      (finalEntry.result?.rules || []).map(r => ({
        enabled: r.enabled,
        action: r.action,
        expression: r.expression,
        params: r.action_parameters,
      })),
      null,
      2
    )
  );
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
