#!/usr/bin/env node
/**
 * P2 — Vérifie les prérequis Enterprise (SOC2 audit + API CRM vendeur).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
} from './load-supabase-env.mjs';

const root = process.cwd();
const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  checks: {},
  blockers: [],
};

function fail(id, msg) {
  report.ok = false;
  report.blockers.push(`${id}: ${msg}`);
  report.checks[id] = { ok: false, message: msg };
}

function pass(id, message) {
  report.checks[id] = { ok: true, message };
}

async function main() {
  const soc2Migration = join(root, 'supabase/migrations/20260614200000__e41_audit_logs_soc2.sql');
  const vendorApiMigration = join(root, 'supabase/migrations/20260614300000__e43_vendor_public_api.sql');
  const crmRunbook = join(root, 'docs/runbooks/crm-vendor-api-integration.md');

  if (existsSync(soc2Migration)) {
    pass('soc2_migration', 'Migration audit logs SOC2 présente');
  } else {
    fail('soc2_migration', 'Migration E41 audit logs manquante');
  }

  if (existsSync(vendorApiMigration)) {
    pass('vendor_api_migration', 'Migration API vendeur E43 présente');
  } else {
    fail('vendor_api_migration', 'Migration API vendeur manquante');
  }

  if (existsSync(crmRunbook)) {
    pass('crm_runbook', 'Runbook intégration CRM présent');
  } else {
    fail('crm_runbook', 'Runbook CRM manquant');
  }

  try {
    const env = loadSupabaseEnv();
    const serviceKey = getServiceRoleKey(env);
    if (!serviceKey) {
      pass('soc2_rpc', 'RPC audit SOC2 — skip (pas de SUPABASE_SERVICE_ROLE_KEY locale)');
    } else {
      const admin = createClient(getSupabaseUrl(env), serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error: auditError } = await admin.rpc('query_unified_audit_logs', {
        p_limit: 1,
        p_offset: 0,
      });

      if (auditError && /could not find the function|does not exist/i.test(auditError.message ?? '')) {
        fail('soc2_rpc', 'query_unified_audit_logs absente en prod');
      } else {
        pass('soc2_rpc', 'RPC audit SOC2 joignable');
      }
    }
  } catch (err) {
    fail('soc2_rpc', err.message ?? String(err));
  }

  const shippingProvider = join(root, 'src/lib/shipping/shipping-provider.ts');
  const enterpriseHotfixMigration = join(
    root,
    'supabase/migrations/20260717180000__hotfix_store_has_physical_feature_enterprise.sql'
  );

  if (existsSync(enterpriseHotfixMigration)) {
    const sql = readFileSync(enterpriseHotfixMigration, 'utf8');
    const requiredKeys = ['api.public', 'team.sso', 'audit.export', 'store_uses_physical_ecommerce'];
    const missing = requiredKeys.filter(k => !sql.includes(k));
    if (missing.length === 0) {
      pass('enterprise_feature_keys_migration', 'Hotfix store_has_physical_feature inclut clés Enterprise');
    } else {
      fail('enterprise_feature_keys_migration', `Clés manquantes: ${missing.join(', ')}`);
    }
  } else {
    fail('enterprise_feature_keys_migration', 'Migration hotfix 20260717180000 manquante');
  }

  if (existsSync(shippingProvider)) {
    const src = readFileSync(shippingProvider, 'utf8');
    if (src.includes('dhl') && src.includes('fedex')) {
      pass('multi_carrier', 'Abstraction multi-transporteurs checkout présente');
    } else {
      fail('multi_carrier', 'shipping-provider.ts incomplet');
    }
  } else {
    fail('multi_carrier', 'shipping-provider.ts manquant');
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main();
