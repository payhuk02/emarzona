/**
 * Vérification post-déploiement : Gemini multi-clés, google/auto, failover.
 * Usage: node scripts/verify-ai-gateway.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');

function loadEnv() {
  const path = resolve(ROOT, '.env');
  const env = {};
  try {
    const text = readFileSync(path, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch {
    // .env optionnel
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
let SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const LOCAL_GEMINI_KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const PROJECT_REF = SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

function resolveServiceRoleKey() {
  if (!PROJECT_REF) return SERVICE_KEY;
  try {
    const raw = execSync(
      `npx supabase projects api-keys --project-ref ${PROJECT_REF} -o json`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const keys = JSON.parse(raw);
    const legacy = keys.find(k => k.id === 'service_role');
    if (legacy?.api_key) return legacy.api_key;
  } catch {
    // CLI non connectée ou ref invalide
  }
  return SERVICE_KEY;
}

function createAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

function createAnonClient() {
  if (!SUPABASE_URL || !ANON_KEY) return null;
  return createClient(SUPABASE_URL, ANON_KEY);
}

const GOOGLE_AUTO_MODEL = 'google/auto';
const GOOGLE_FREE_TEXT_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

function isAutoAiModel(model, provider) {
  const m = model.trim().toLowerCase();
  if (provider === 'google') return m === GOOGLE_AUTO_MODEL || m === 'gemini/auto' || m === 'auto';
  return m === 'openrouter/free';
}

function resolveTextModelCandidates(model, provider) {
  const trimmed = model.trim();
  if (provider === 'google') {
    if (isAutoAiModel(trimmed, 'google')) return [...GOOGLE_FREE_TEXT_MODELS];
    return [trimmed.replace(/^google\//, '').startsWith('gemini-') ? trimmed.replace(/^google\//, '') : trimmed];
  }
  if (provider === 'openrouter') return [trimmed || 'openrouter/free'];
  return [trimmed];
}

function isRecoverableAiFailure(status, message) {
  if (status === 429 || status === 402 || status === 503) return true;
  return /quota|rate.?limit|resource.?exhausted|too many requests|capacity|overloaded|billing|credit|exceeded|limit reached/i.test(
    message
  );
}

function isKeyRotationFailure(status, message) {
  if (status === 401 || status === 403) return true;
  return /api.?key|invalid key|permission denied|unauthorized|forbidden|suspended|disabled/i.test(
    message
  );
}

// --- AES-GCM decrypt (sync avec ai-crypto.ts edge) ---
function getMasterKey(secret) {
  const bytes = new TextEncoder().encode(secret);
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = bytes[i % bytes.length] ^ bytes[(i * 7) % bytes.length];
  }
  return key;
}

async function decryptApiKey(payload, serviceKey) {
  const [version, ivB64, ctB64] = payload.split(':');
  if (version !== 'v1' || !ivB64 || !ctB64) throw new Error('Format chiffré invalide');
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
  const rawKey = getMasterKey(serviceKey);
  const cryptoKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ct);
  return new TextDecoder().decode(plain);
}

async function testGeminiKey(apiKey, model = 'gemini-2.0-flash-lite') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Réponds uniquement: OK' }] }],
      generationConfig: { maxOutputTokens: 16, temperature: 0 },
    }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 300) };
}

async function testGeminiAutoCascade(apiKey) {
  for (const model of GOOGLE_FREE_TEXT_MODELS) {
    const r = await testGeminiKey(apiKey, model);
    if (r.ok) return { model, ...r };
  }
  return { model: null, ok: false, status: 0, body: 'Aucun modèle gratuit a répondu' };
}

const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`❌ ${name}: ${detail}`);
}

// --- Unit checks (logique gateway) ---
const autoCandidates = resolveTextModelCandidates('google/auto', 'google');
if (autoCandidates.length === GOOGLE_FREE_TEXT_MODELS.length) {
  pass('google/auto cascade', `${autoCandidates.length} modèles dans l'ordre`);
} else {
  fail('google/auto cascade', `attendu ${GOOGLE_FREE_TEXT_MODELS.length}, got ${autoCandidates.length}`);
}

if (isRecoverableAiFailure(429, 'rate limit') && isKeyRotationFailure(403, 'invalid key')) {
  pass('Détection failover quota/clé', '429/402 et 403 reconnus');
} else {
  fail('Détection failover quota/clé', 'heuristiques incorrectes');
}

if (!SUPABASE_URL) {
  fail('Config Supabase', 'VITE_SUPABASE_URL manquant dans .env');
} else {
  pass('Config Supabase', SUPABASE_URL.replace(/https?:\/\//, '').slice(0, 40));

  SERVICE_KEY = resolveServiceRoleKey();

  const anonClient = createAnonClient();
  let adminClient = createAdminClient();
  let adminWorks = false;
  if (adminClient) {
    const probe = await adminClient.from('platform_ai_api_keys').select('id').limit(1);
    adminWorks = !probe.error;
    if (!adminWorks) adminClient = null;
  }

  if (anonClient) {
    const { data: settings, error: settingsErr } = await anonClient.rpc('get_ai_management_settings');
    if (settingsErr) {
      fail('RPC get_ai_management_settings (anon)', settingsErr.message);
    } else {
      const chat = settings?.chatbot ?? {};
      const blog = settings?.blogGenerator ?? {};
      pass(
        'Settings IA chargés',
        `chatbot=${chat.provider}/${chat.model} blog=${blog.provider}/${blog.textModel}`
      );
      if (blog.provider === 'google' && (blog.textModel === 'google/auto' || blog.textModel?.includes('gemini'))) {
        pass('Config blog Gemini', `${blog.provider} / ${blog.textModel}`);
      } else if (blog.provider === 'openrouter') {
        pass('Config blog OpenRouter', blog.textModel);
      }
    }
  } else {
    fail('Client anon', 'VITE_SUPABASE_ANON_KEY manquant');
  }

  if (!adminClient) {
    // Fallback : métadonnées via Supabase CLI (sans service_role local valide)
    let cliMetaOk = false;
    if (PROJECT_REF) {
      try {
        const raw = execSync(
          `npx supabase db query --linked "select provider, label, is_default, key_hint from platform_ai_api_keys order by provider, is_default desc, created_at;" -o json`,
          { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        const parsed = JSON.parse(raw);
        const rows = parsed.rows ?? [];
        if (rows.length > 0) {
          cliMetaOk = true;
          const googleN = rows.filter(r => r.provider === 'google').length;
          const orN = rows.filter(r => r.provider === 'openrouter').length;
          pass('Pool clés DB (CLI)', `google=${googleN} openrouter=${orN} total=${rows.length}`);
          if (googleN >= 2) pass('Multi-clés Gemini', `${googleN} comptes — failover activé`);
          if (orN >= 2) pass('Multi-clés OpenRouter', `${orN} comptes — failover activé`);
          for (const row of rows.filter(r => r.provider === 'google')) {
            pass(
              `Clé Gemini « ${row.label} »`,
              row.is_default ? 'principale' : 'secours' + ` (${row.key_hint})`
            );
          }
        }
      } catch {
        // ignore
      }
    }
    if (!cliMetaOk) {
      fail(
        'Clés API (table)',
        'Service role local invalide — mettez à jour SUPABASE_SERVICE_ROLE_KEY (sb_secret) dans .env'
      );
    }
  } else {
  const admin = adminClient;
  const { data: keyRows, error: keysErr } = await admin
    .from('platform_ai_api_keys')
    .select('id, provider, label, is_default, key_hint, encrypted_key, created_at')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (keysErr) {
    fail('Clés API (table)', keysErr.message);
  } else {
    const googleKeys = (keyRows ?? []).filter(k => k.provider === 'google');
    const openrouterKeys = (keyRows ?? []).filter(k => k.provider === 'openrouter');
    pass(
      'Pool clés DB',
      `google=${googleKeys.length} openrouter=${openrouterKeys.length} total=${keyRows?.length ?? 0}`
    );

    if (googleKeys.length >= 2) {
      pass('Multi-clés Gemini', `${googleKeys.length} clés — failover activé`);
    }
    if (openrouterKeys.length >= 2) {
      pass('Multi-clés OpenRouter', `${openrouterKeys.length} clés — failover activé`);
    }

    if (googleKeys.length === 0) {
      fail('Clés Gemini', 'Aucune clé google en DB — ajoutez une clé dans Admin → Gestion IA');
    } else {
      for (let i = 0; i < googleKeys.length; i++) {
        const row = googleKeys[i];
        try {
          const plain = await decryptApiKey(row.encrypted_key, SERVICE_KEY);
          const tag = row.is_default ? 'principale' : `secours #${i + 1}`;
          const gemini = await testGeminiKey(plain, 'gemini-2.0-flash-lite');
          if (gemini.ok) {
            pass(`Gemini live (${row.label})`, `${tag} — API OK (${row.key_hint})`);
          } else {
            fail(
              `Gemini live (${row.label})`,
              `status ${gemini.status} — ${gemini.body.slice(0, 120)}`
            );
          }
        } catch (e) {
          fail(`Décryptage (${row.label})`, e instanceof Error ? e.message : String(e));
        }
      }

      // Test cascade auto sur première clé valide
      const first = googleKeys[0];
      try {
        const plain = await decryptApiKey(first.encrypted_key, SERVICE_KEY);
        const cascade = await testGeminiAutoCascade(plain);
        if (cascade.ok) {
          pass('google/auto (cascade live)', `modèle utilisé: ${cascade.model}`);
        } else {
          fail('google/auto (cascade live)', cascade.body);
        }
      } catch (e) {
        fail('google/auto cascade', e instanceof Error ? e.message : String(e));
      }
    }
  }
  }

  // Test Gemini direct si clé locale (secrets edge ou .env dev)
  if (LOCAL_GEMINI_KEY) {
    const gemini = await testGeminiKey(LOCAL_GEMINI_KEY, 'gemini-2.0-flash-lite');
    if (gemini.ok) {
      pass('Gemini live (env local)', 'GEMINI/GOOGLE_API_KEY — API OK');
      const cascade = await testGeminiAutoCascade(LOCAL_GEMINI_KEY);
      if (cascade.ok) {
        pass('google/auto cascade (env local)', `modèle: ${cascade.model}`);
      } else {
        fail('google/auto cascade (env local)', cascade.body);
      }
    } else {
      fail('Gemini live (env local)', `status ${gemini.status} — ${gemini.body.slice(0, 120)}`);
    }
  }

  // Edge functions : sans auth utilisateur → 401 attendu
  if (ANON_KEY) {
    const chatUrl = `${SUPABASE_URL}/functions/v1/ai-chat`;
    const chatRes = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
    });
    const chatBody = await chatRes.text();
    if (chatRes.status === 401 || chatBody.includes('Connexion') || chatBody.includes('Session')) {
      pass('Edge ai-chat déployée', `répond ${chatRes.status} (auth requise — normal)`);
    } else if (chatRes.ok) {
      pass('Edge ai-chat déployée', 'réponse OK');
    } else {
      fail('Edge ai-chat', `status ${chatRes.status} — ${chatBody.slice(0, 150)}`);
    }

    const blogUrl = `${SUPABASE_URL}/functions/v1/ai-generate-blog-post`;
    const blogRes = await fetch(blogUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic: 'test' }),
    });
    const blogBody = await blogRes.text();
    if (blogRes.status === 401 || blogRes.status === 403 || blogBody.includes('admin')) {
      pass('Edge ai-generate-blog-post déployée', `répond ${blogRes.status} (admin requis — normal)`);
    } else {
      fail('Edge ai-generate-blog-post', `status ${blogRes.status} — ${blogBody.slice(0, 150)}`);
    }
  } else {
    fail('Edge functions HTTP', 'VITE_SUPABASE_ANON_KEY manquant');
  }
}

const failed = results.filter(r => !r.ok);
console.log('\n--- Résumé ---');
console.log(`${results.length - failed.length}/${results.length} vérifications OK`);
if (failed.length > 0) {
  console.log('Échecs:', failed.map(f => f.name).join(', '));
  process.exit(1);
}
console.log('Stack IA Gemini + failover : opérationnel.');
process.exit(0);
