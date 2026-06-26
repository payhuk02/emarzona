/**
 * Phase 0.5 — Smoke tests sécurité post-deploy (SECURE_DEPLOY_CHECKLIST.md)
 * Usage: node scripts/verify-secure-deploy.mjs
 */
import { createClient } from '@supabase/supabase-js';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
} from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env).replace(/\/$/, '');
const internalSecret = env.EDGE_INTERNAL_SECRET?.trim() || null;
const buyerEmail = env.E2E_BUYER_EMAIL?.trim() || null;
const buyerPassword = env.E2E_BUYER_PASSWORD?.trim() || null;

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  checks: {},
};

function setCheck(name, result) {
  report.checks[name] = result;
  if (result.ok === false && !result.skipped) report.ok = false;
}

async function postJson(path, { headers = {}, body = {} } = {}) {
  const res = await fetch(`${url}/functions/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

async function getBuyerJwt() {
  if (!buyerEmail || !buyerPassword) return null;
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || null;
  if (!anonKey) return null;

  const sb = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.signInWithPassword({
    email: buyerEmail,
    password: buyerPassword,
  });
  if (error || !data.session?.access_token) return null;
  return { token: data.session.access_token, email: buyerEmail.toLowerCase() };
}

// webhook-delivery sans secret → 401
try {
  const res = await postJson('webhook-delivery', { body: {} });
  setCheck('webhook_delivery_no_secret', {
    ok: res.status === 401,
    status: res.status,
    expected: 401,
  });
} catch (e) {
  setCheck('webhook_delivery_no_secret', {
    ok: false,
    error: e instanceof Error ? e.message : String(e),
  });
}

// webhook-delivery secret invalide → 401
try {
  const res = await postJson('webhook-delivery', {
    headers: { 'x-internal-secret': 'invalid-smoke-secret' },
    body: {},
  });
  setCheck('webhook_delivery_bad_secret', {
    ok: res.status === 401,
    status: res.status,
    expected: 401,
  });
} catch (e) {
  setCheck('webhook_delivery_bad_secret', {
    ok: false,
    error: e instanceof Error ? e.message : String(e),
  });
}

// webhook-delivery secret valide → pas 401 (200 ou 400 selon payload)
if (internalSecret) {
  try {
    const res = await postJson('webhook-delivery', {
      headers: { 'x-internal-secret': internalSecret },
      body: {},
    });
    setCheck('webhook_delivery_valid_secret', {
      ok: res.status !== 401 && res.status !== 500,
      status: res.status,
      note: '500 = EDGE_INTERNAL_SECRET non configuré côté Edge',
    });
  } catch (e) {
    setCheck('webhook_delivery_valid_secret', {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
} else {
  setCheck('webhook_delivery_valid_secret', {
    skipped: true,
    reason: 'EDGE_INTERNAL_SECRET absent (env) — test positif non exécuté',
  });
}

// send-email sans auth → 401
try {
  const res = await postJson('send-email', {
    body: { to: 'smoke@example.com', subject: 'x', html: '<p>x</p>' },
  });
  setCheck('send_email_no_auth', {
    ok: res.status === 401,
    status: res.status,
    expected: 401,
  });
} catch (e) {
  setCheck('send_email_no_auth', {
    ok: false,
    error: e instanceof Error ? e.message : String(e),
  });
}

const buyer = await getBuyerJwt();

if (buyer) {
  // send-email utilisateur + html custom → 403
  try {
    const res = await postJson('send-email', {
      headers: { Authorization: `Bearer ${buyer.token}` },
      body: {
        to: buyer.email,
        subject: 'smoke',
        html: '<p>forbidden</p>',
      },
    });
    setCheck('send_email_user_html_forbidden', {
      ok: res.status === 403,
      status: res.status,
      expected: 403,
    });
  } catch (e) {
    setCheck('send_email_user_html_forbidden', {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // send-email utilisateur vers autre destinataire → 403
  try {
    const res = await postJson('send-email', {
      headers: { Authorization: `Bearer ${buyer.token}` },
      body: {
        to: 'other-recipient@example.com',
        template: 'welcome',
        subject: 'smoke',
      },
    });
    setCheck('send_email_user_other_recipient_forbidden', {
      ok: res.status === 403,
      status: res.status,
      expected: 403,
    });
  } catch (e) {
    setCheck('send_email_user_other_recipient_forbidden', {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
} else {
  setCheck('send_email_user_html_forbidden', {
    skipped: true,
    reason: 'E2E_BUYER_EMAIL/PASSWORD + anon key requis',
  });
  setCheck('send_email_user_other_recipient_forbidden', {
    skipped: true,
    reason: 'E2E_BUYER_EMAIL/PASSWORD + anon key requis',
  });
}

// send-email internal → pas 401 (200 ou erreur métier acceptable)
if (internalSecret) {
  try {
    const res = await postJson('send-email', {
      headers: { 'x-internal-secret': internalSecret },
      body: {
        to: 'internal-smoke@example.com',
        subject: 'Emarzona secure deploy smoke',
        html: '<p>internal smoke — no delivery expected if Resend rejects test domain</p>',
      },
    });
    setCheck('send_email_internal_secret', {
      ok: res.status !== 401,
      status: res.status,
      note: '403/422 Resend acceptable ; 401 interdit',
    });
  } catch (e) {
    setCheck('send_email_internal_secret', {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
} else {
  setCheck('send_email_internal_secret', {
    skipped: true,
    reason: 'EDGE_INTERNAL_SECRET absent (env)',
  });
}

// service role key ne doit pas être exposée côté client build
const serviceKey = getServiceRoleKey(env);
setCheck('service_role_not_in_vite_env', {
  ok: !env.VITE_SUPABASE_SERVICE_ROLE_KEY && !env.VITE_SERVICE_ROLE_KEY,
  vite_service_role_present: Boolean(
    env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SERVICE_ROLE_KEY
  ),
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
