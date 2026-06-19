#!/usr/bin/env node
/**
 * Purge les utilisateurs / boutiques orphelins créés par les tests E2E Playwright.
 *
 * Usage:
 *   npm run cleanup:e2e-orphans -- --dry-run
 *   npm run cleanup:e2e-orphans -- --confirm-production
 */
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import {
  assertCleanupTargetAllowed,
  isE2EOrphanEmail,
  isE2EOrphanStore,
} from './e2e-supabase-guard.mjs';
import { loadE2EEnv, validateServiceRoleKeyFormat } from './load-e2e-env.mjs';

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    confirmProduction: argv.includes('--confirm-production'),
  };
}

function createAdminClient(url, serviceKey) {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    for (const user of data.users) {
      users.push(user);
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return users;
}

async function listOrphanStores(admin) {
  const { data, error } = await admin
    .from('stores')
    .select('id, name, slug, description, user_id, created_at')
    .or('name.ilike.E2E %,slug.ilike.e2e-%,description.ilike.E2E %');

  if (error) throw error;
  return (data ?? []).filter(isE2EOrphanStore);
}

async function deleteStoreById(admin, storeId) {
  const { error } = await admin.from('stores').delete().eq('id', storeId);
  if (error) throw error;
}

async function deleteUserById(admin, userId) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function deleteStoresForUser(admin, userId) {
  const { data: stores, error } = await admin.from('stores').select('id').eq('user_id', userId);
  if (error) throw error;

  for (const store of stores ?? []) {
    await deleteStoreById(admin, store.id);
  }
}

async function main() {
  const { dryRun, confirmProduction } = parseArgs(process.argv.slice(2));
  const env = loadE2EEnv();
  const url = env.VITE_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    console.error('Variables manquantes : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    console.error('Astuce : npm run env:e2e:pull puis relancer.');
    process.exit(1);
  }

  const keyError = validateServiceRoleKeyFormat(serviceKey);
  if (keyError) {
    console.error(`SUPABASE_SERVICE_ROLE_KEY invalide : ${keyError}`);
    process.exit(1);
  }

  assertCleanupTargetAllowed(url, { confirmProduction });

  const admin = createAdminClient(url, serviceKey);
  const allUsers = await listAllUsers(admin);
  const orphanUsers = allUsers.filter(u => isE2EOrphanEmail(u.email));
  const orphanStores = await listOrphanStores(admin);

  const storeIdsFromUsers = new Set(
    (
      await Promise.all(
        orphanUsers.map(async user => {
          const { data } = await admin.from('stores').select('id').eq('user_id', user.id);
          return (data ?? []).map(s => s.id);
        })
      )
    ).flat()
  );

  const storeIdsToDelete = new Map();
  for (const store of orphanStores) {
    storeIdsToDelete.set(store.id, store);
  }
  for (const id of storeIdsFromUsers) {
    if (!storeIdsToDelete.has(id)) {
      storeIdsToDelete.set(id, { id, name: '(via user E2E)' });
    }
  }

  console.log(`Projet : ${url}`);
  console.log(`Mode   : ${dryRun ? 'dry-run (aucune suppression)' : 'suppression'}`);
  console.log(`Boutiques E2E : ${storeIdsToDelete.size}`);
  console.log(`Utilisateurs E2E : ${orphanUsers.length}`);

  if (storeIdsToDelete.size === 0 && orphanUsers.length === 0) {
    console.log('Aucun orphelin E2E trouvé.');
    return;
  }

  for (const store of storeIdsToDelete.values()) {
    console.log(`  store  ${store.id}  ${store.name ?? ''}  ${store.slug ?? ''}`);
  }
  for (const user of orphanUsers) {
    console.log(`  user   ${user.id}  ${user.email}`);
  }

  if (dryRun) {
    console.log('\nDry-run terminé. Relancez sans --dry-run pour supprimer.');
    return;
  }

  let deletedStores = 0;
  let deletedUsers = 0;
  const errors = [];

  for (const store of storeIdsToDelete.values()) {
    try {
      await deleteStoreById(admin, store.id);
      deletedStores += 1;
    } catch (error) {
      errors.push(`store ${store.id}: ${error.message ?? error}`);
    }
  }

  for (const user of orphanUsers) {
    try {
      await deleteStoresForUser(admin, user.id);
      await deleteUserById(admin, user.id);
      deletedUsers += 1;
    } catch (error) {
      errors.push(`user ${user.email}: ${error.message ?? error}`);
    }
  }

  console.log(`\nSupprimé : ${deletedStores} boutique(s), ${deletedUsers} utilisateur(s).`);

  if (errors.length > 0) {
    console.error('\nErreurs partielles :');
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error.message ?? error);
  process.exit(1);
});
