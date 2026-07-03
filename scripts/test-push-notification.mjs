#!/usr/bin/env node
/**
 * Test end-to-end Web Push (VAPID + edge function send-push-notification).
 *
 * Prérequis :
 *   1. Edge function déployée : npx supabase functions deploy send-push-notification
 *   2. Secrets Supabase : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (+ VAPID_SUBJECT optionnel)
 *   3. Utilisateur avec abonnement push actif (PWA / dashboard → activer push)
 *
 * Usage:
 *   npm run test:push-notification -- --dry-run
 *   npm run test:push-notification -- --user-id <uuid>
 *   PUSH_TEST_USER_ID=<uuid> npm run test:push-notification
 *   npm run test:push-notification -- --email buyer@example.com
 *
 * Variables .env :
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (sb_secret_…)
 *   PUSH_TEST_USER_ID | E2E_BUYER_EMAIL (+ E2E_BUYER_PASSWORD optionnel pour résolution)
 *   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (optionnel — validation locale)
 *   VITE_VAPID_PUBLIC_KEY (optionnel — parité client/serveur)
 */
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
  getVercelCredentials,
} from './load-supabase-env.mjs';
import { validateVapidKeyPair, vapidPublicKeysMatch } from './vapid-utils.mjs';

function parseArgs(argv) {
  const out = {
    dryRun: false,
    allowNoSubscriptions: false,
    userId: process.env.PUSH_TEST_USER_ID?.trim() || null,
    email: process.env.PUSH_TEST_EMAIL?.trim() || null,
    title: 'Emarzona — test push',
    body: null,
    json: argv.includes('--json'),
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--allow-no-subscriptions') out.allowNoSubscriptions = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--user-id' && argv[i + 1]) out.userId = argv[++i].trim();
    else if (arg.startsWith('--user-id=')) out.userId = arg.slice('--user-id='.length).trim();
    else if (arg === '--email' && argv[i + 1]) out.email = argv[++i].trim();
    else if (arg.startsWith('--email=')) out.email = arg.slice('--email='.length).trim();
    else if (arg === '--title' && argv[i + 1]) out.title = argv[++i];
    else if (arg.startsWith('--title=')) out.title = arg.slice('--title='.length);
    else if (arg === '--body' && argv[i + 1]) out.body = argv[++i];
    else if (arg.startsWith('--body=')) out.body = arg.slice('--body='.length);
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npm run test:push-notification -- [options]

Options:
  --dry-run                  Vérifie config + déploiement sans envoyer
  --user-id <uuid>           Utilisateur cible
  --email <email>            Résout user_id via auth admin
  --title "..."              Titre notification (défaut: Emarzona — test push)
  --body "..."               Corps (défaut: horodaté)
  --allow-no-subscriptions   Exit 0 même sans abonnement push
  --json                     Sortie JSON uniquement
  -h, --help                 Cette aide
`);
      process.exit(0);
    }
  }

  if (!out.email && process.env.E2E_BUYER_EMAIL?.trim() && !out.userId) {
    out.email = process.env.E2E_BUYER_EMAIL.trim();
  }

  if (!out.body) {
    out.body = `Smoke test push — ${new Date().toISOString()}`;
  }

  return out;
}

function getProjectRef(env, url) {
  return (
    env.SUPABASE_PROJECT_REF?.trim() ||
    url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
    null
  );
}

function listSupabaseSecrets(projectRef) {
  const r = spawnSync('npx', ['supabase', 'secrets', 'list', '--project-ref', projectRef], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    return { ok: false, error: r.stderr?.trim() || r.stdout?.trim() || 'supabase secrets list failed' };
  }
  const keys = new Set();
  for (const line of r.stdout.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s/);
    if (match) keys.add(match[1]);
  }
  return { ok: true, keys };
}

async function checkVercelVapidPublicKey(env) {
  const { token, projectId, orgId } = getVercelCredentials(env);
  if (!token || !projectId) {
    return { skipped: true, reason: 'VERCEL_TOKEN/VERCEL_PROJECT_ID absent' };
  }
  const qs = orgId ? `?teamId=${encodeURIComponent(orgId)}` : '';
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { ok: false, error: `Vercel env list HTTP ${res.status}` };
  }
  const data = await res.json();
  const entry = (data.envs ?? []).find(e => e.key === 'VITE_VAPID_PUBLIC_KEY');
  return {
    ok: Boolean(entry),
    configured: Boolean(entry),
    preview: entry?.value?.slice?.(0, 12) ?? null,
  };
}

async function checkEdgeFunctionDeployed(url, apikey) {
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/send-push-notification`, {
    method: 'OPTIONS',
    headers: { apikey },
  });
  if (res.status === 404) {
    return { ok: false, error: 'Edge function non déployée (404)' };
  }
  return { ok: true, status: res.status };
}

async function resolveUserId(admin, { userId, email }) {
  if (userId) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      throw new Error(`Utilisateur introuvable pour --user-id ${userId}: ${error?.message ?? 'unknown'}`);
    }
    return { id: data.user.id, email: data.user.email ?? null };
  }

  if (!email) {
    throw new Error(
      'Cible manquante — fournissez --user-id, --email, PUSH_TEST_USER_ID ou E2E_BUYER_EMAIL'
    );
  }

  let page = 1;
  const needle = email.toLowerCase();
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find(u => u.email?.toLowerCase() === needle);
    if (found) return { id: found.id, email: found.email ?? null };
    if (data.users.length < 200) break;
    page++;
  }

  throw new Error(`Aucun utilisateur auth pour l'email ${email}`);
}

async function listActivePushSubscriptions(admin, userId) {
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, is_active, last_used_at, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_used_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

async function invokeSendPush(url, serviceKey, payload) {
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/send-push-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }

  return { status: res.status, json };
}

const args = parseArgs(process.argv);
const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = getServiceRoleKey(env);
const projectRef = getProjectRef(env, url);

/** @type {Record<string, unknown>} */
const report = {
  ok: false,
  timestamp: new Date().toISOString(),
  dryRun: args.dryRun,
  target: { userId: args.userId, email: args.email },
  checks: {},
  subscriptions: [],
  invoke: null,
  blockers: [],
  hints: [],
};

function pass(name, detail) {
  report.checks[name] = { ok: true, ...detail };
}

function fail(name, detail) {
  report.checks[name] = { ok: false, ...detail };
  report.blockers.push(typeof detail === 'string' ? detail : detail.error || name);
}

try {
  if (!serviceKey) {
    fail('service_role_key', {
      error: 'SUPABASE_SERVICE_ROLE_KEY manquant dans .env (sb_secret_…)',
    });
    throw new Error('missing service role');
  }
  pass('service_role_key', { configured: true });

  if (!projectRef) {
    fail('project_ref', { error: 'Impossible de déduire SUPABASE_PROJECT_REF' });
    throw new Error('missing project ref');
  }
  pass('project_ref', { projectRef });

  const secrets = listSupabaseSecrets(projectRef);
  if (!secrets.ok) {
    fail('supabase_secrets', { error: secrets.error });
    report.hints.push('Connectez supabase CLI : npx supabase login');
  } else {
    const hasPublic = secrets.keys.has('VAPID_PUBLIC_KEY');
    const hasPrivate = secrets.keys.has('VAPID_PRIVATE_KEY');
    const hasSubject = secrets.keys.has('VAPID_SUBJECT') || secrets.keys.has('VAPID_ADMIN_CONTACT');
    pass('supabase_vapid_secrets', { hasPublic, hasPrivate, hasSubject });
    if (!hasPublic || !hasPrivate) {
      fail('supabase_vapid_secrets', {
        error: 'VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY absent des secrets Supabase Edge',
      });
      report.hints.push('npm run setup:vapid-secrets');
      report.hints.push(
        'npx supabase functions deploy send-push-notification --project-ref ' + projectRef
      );
    }
  }

  const localPublic = env.VAPID_PUBLIC_KEY?.trim() || env.VITE_VAPID_PUBLIC_KEY?.trim();
  const localPrivate = env.VAPID_PRIVATE_KEY?.trim();
  const keyValidation = validateVapidKeyPair(localPublic, localPrivate);
  if (localPublic) {
    pass('local_vapid_public', {
      ok: keyValidation.ok || keyValidation.publicOnly,
      length: localPublic.length,
      detail: keyValidation.error ?? 'valid',
    });
  } else {
    report.checks.local_vapid_public = {
      skipped: true,
      reason: 'VAPID_PUBLIC_KEY absent du .env local',
    };
  }

  if (localPrivate) {
    if (keyValidation.ok) pass('local_vapid_private', { ok: true });
    else fail('local_vapid_private', { error: keyValidation.error });
  }

  const clientPublic = env.VITE_VAPID_PUBLIC_KEY?.trim();
  const serverPublic = env.VAPID_PUBLIC_KEY?.trim();
  const parity = vapidPublicKeysMatch(clientPublic, serverPublic);
  if (parity === true) pass('vapid_public_parity', { match: true });
  else if (parity === false) {
    fail('vapid_public_parity', {
      error: 'VITE_VAPID_PUBLIC_KEY ≠ VAPID_PUBLIC_KEY dans .env local',
    });
    report.hints.push('Alignez les clés publiques client (Vercel) et serveur (Supabase)');
  }

  const vercelVapid = await checkVercelVapidPublicKey(env);
  report.checks.vercel_vapid_public = vercelVapid;

  const edge = await checkEdgeFunctionDeployed(url, serviceKey);
  if (edge.ok) pass('edge_function_deployed', { status: edge.status });
  else {
    fail('edge_function_deployed', { error: edge.error });
    report.hints.push(
      'npx supabase functions deploy send-push-notification --project-ref ' + projectRef
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const user = await resolveUserId(admin, args);
  report.target = { userId: user.id, email: user.email };

  const subscriptions = await listActivePushSubscriptions(admin, user.id);
  report.subscriptions = subscriptions.map(s => ({
    id: s.id,
    endpointHost: (() => {
      try {
        return new URL(s.endpoint).host;
      } catch {
        return 'invalid-endpoint';
      }
    })(),
    lastUsedAt: s.last_used_at,
  }));

  pass('push_subscriptions', { count: subscriptions.length });

  if (subscriptions.length === 0) {
    report.hints.push(
      "Aucun abonnement push actif — ouvrez l'app, activez les notifications push (Paramètres ou /notifications → Préférences), puis relancez."
    );
    if (!args.allowNoSubscriptions && !args.dryRun) {
      report.blockers.push('No active push subscriptions for target user');
    }
  }

  if (args.dryRun) {
    report.checks.send_push = { skipped: true, reason: '--dry-run' };
  } else if (subscriptions.length > 0) {
    const invoke = await invokeSendPush(url, serviceKey, {
      user_id: user.id,
      title: args.title,
      body: args.body,
      url: '/notifications',
      tag: 'emarzona-push-smoke-test',
      data: { source: 'test-push-notification.mjs' },
    });

    report.invoke = {
      status: invoke.status,
      response: invoke.json,
    };

    const sent = invoke.json?.sent ?? 0;
    const failed = invoke.json?.failed ?? 0;
    const vapidMisconfig = invoke.status === 503;

    if (vapidMisconfig) {
      fail('send_push', { error: invoke.json?.error || 'VAPID keys not configured on Edge' });
      report.hints.push('npm run setup:vapid-secrets && redeploy send-push-notification');
    } else if (invoke.status >= 400) {
      fail('send_push', { status: invoke.status, error: invoke.json?.error || invoke.json?.raw });
    } else if (sent > 0) {
      pass('send_push', { sent, failed, total: invoke.json?.total });
      report.hints.push('Vérifiez la notification sur l’appareil / navigateur abonné.');
    } else if (failed > 0) {
      fail('send_push', {
        error: 'Tous les envois push ont échoué',
        results: invoke.json?.results,
      });
      report.hints.push('Abonnements expirés ? Réactivez push depuis le dashboard.');
    } else {
      fail('send_push', { error: invoke.json?.message || 'Aucun push envoyé' });
    }
  } else if (args.allowNoSubscriptions) {
    report.checks.send_push = { skipped: true, reason: 'no subscriptions (--allow-no-subscriptions)' };
  }
} catch (err) {
  if (!report.blockers.length) {
    report.blockers.push(err instanceof Error ? err.message : String(err));
  }
}

report.ok =
  report.blockers.length === 0 &&
  (args.dryRun ||
    report.checks.send_push?.skipped ||
    (report.checks.send_push?.ok === true && (report.invoke?.response?.sent ?? 0) > 0));

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('\n=== Emarzona — test push notification ===\n');
  console.log(
    `Cible : ${report.target.userId ?? '—'}${report.target.email ? ` (${report.target.email})` : ''}`
  );
  console.log(`Mode  : ${args.dryRun ? 'dry-run' : 'envoi réel'}\n`);

  for (const [name, check] of Object.entries(report.checks)) {
    const icon = check.skipped ? '○' : check.ok === false ? '✗' : '✓';
    const detail = check.error || check.reason || check.detail || JSON.stringify(check);
    console.log(`${icon} ${name}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }

  if (report.subscriptions.length) {
    console.log(`\nAbonnements actifs : ${report.subscriptions.length}`);
    for (const s of report.subscriptions) {
      console.log(`  • ${s.id.slice(0, 8)}… → ${s.endpointHost}`);
    }
  }

  if (report.invoke) {
    console.log('\nRéponse edge function :');
    console.log(JSON.stringify(report.invoke, null, 2));
  }

  if (report.hints.length) {
    console.log('\nConseils :');
    for (const h of report.hints) console.log(`  → ${h}`);
  }

  console.log(`\n${report.ok ? '✓ SUCCÈS' : '✗ ÉCHEC'}\n`);
}

process.exit(report.ok ? 0 : 1);
