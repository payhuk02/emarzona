import fs from 'fs';

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

const token = process.env.CLOUDFLARE_API_TOKEN;
const zone = 'ea0e62cd904bd3ee53604b2962db81a6';
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function main() {
  const get = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/bot_management`, {
    headers,
  });
  const current = await get.json();
  console.log('CURRENT:', JSON.stringify(current, null, 2));

  if (!current.success) {
    process.exit(1);
  }

  const body = {
    ...(current.result || {}),
    // Disable classic Bot Fight Mode if present (Free) — cannot be skipped via WAF
    fight_mode: false,
    // Super Bot Fight Mode: never challenge static JS/CSS
    sbfm_static_resource_protection: false,
    // Prefer allow over challenge for automated traffic on storefront assets zone-wide
    // (zone is storefronts only — myemarzona.shop)
    sbfm_definitely_automated: 'allow',
    sbfm_likely_automated: 'allow',
    sbfm_verified_bots: 'allow',
  };

  // Remove read-only fields that break PUT
  for (const k of ['using_latest_model', 'ai_bots_protection', 'crawler_protection']) {
    // keep if API accepts; strip unknown later on error
  }

  const put = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/bot_management`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const updated = await put.json();
  console.log('PUT:', JSON.stringify(updated, null, 2));

  if (!updated.success) {
    // Retry minimal payload
    const minimal = {
      fight_mode: false,
      sbfm_static_resource_protection: false,
    };
    const put2 = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/bot_management`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(minimal),
    });
    const updated2 = await put2.json();
    console.log('PUT_MINIMAL:', JSON.stringify(updated2, null, 2));
    if (!updated2.success) process.exit(1);
  }

  // Patch custom skip rule: keep only valid products + sbfm phase
  const entry = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/rulesets/phases/http_request_firewall_custom/entrypoint`,
    { headers }
  ).then(r => r.json());

  const rulesetId = entry.result?.id;
  const rule = (entry.result?.rules || []).find(r =>
    String(r.description || '').includes('skip Bot Fight')
  );
  if (rulesetId && rule?.id) {
    const patchBody = {
      action: 'skip',
      action_parameters: {
        phases: ['http_request_sbfm'],
        products: ['bic', 'hot', 'securityLevel', 'uaBlock', 'zoneLockdown'],
      },
      expression:
        '(starts_with(http.request.uri.path, "/js/") or starts_with(http.request.uri.path, "/assets/") or starts_with(http.request.uri.path, "/fonts/"))',
      description: rule.description,
      enabled: true,
    };
    const patched = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone}/rulesets/${rulesetId}/rules/${rule.id}`,
      { method: 'PATCH', headers, body: JSON.stringify(patchBody) }
    ).then(r => r.json());
    console.log('SKIP_RULE_PATCH:', JSON.stringify({ success: patched.success, errors: patched.errors }, null, 2));
  }

  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ purge_everything: true }),
  });
  console.log('PURGED');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
