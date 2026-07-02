import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  STORE_RLS_POLICY_REQUIREMENTS,
  STORE_SCOPED_HOOK_REQUIREMENTS,
  buildStorePolicyPattern,
} from '@/lib/security/multi-store-isolation-contract';

const root = process.cwd();
const migrationsDir = join(root, 'supabase/migrations');

function migrationSources(): string {
  return readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => readFileSync(join(migrationsDir, f), 'utf8'))
    .join('\n');
}

describe('multi-store isolation contract (Phase 4.4)', () => {
  it('store-scoped hooks filter queries by store_id', () => {
    for (const req of STORE_SCOPED_HOOK_REQUIREMENTS) {
      const source = readFileSync(join(root, req.hookFile), 'utf8');
      expect(source, `${req.hookExport} in ${req.hookFile}`).toMatch(
        new RegExp(`export (function|const) ${req.hookExport}\\b`)
      );
      expect(source, `${req.hookFile} must .eq('store_id')`).toMatch(req.storeFilterPattern);
    }
  });

  it('RLS policies for store isolation exist in migrations', () => {
    const sql = migrationSources();
    for (const req of STORE_RLS_POLICY_REQUIREMENTS) {
      const pattern = buildStorePolicyPattern(req.table, req.policyName);
      expect(sql, `missing policy ${req.policyName} on ${req.table}`).toMatch(pattern);
    }
  });

  it('StoreContext exposes selectedStoreId for tenant scoping', () => {
    const source = readFileSync(join(root, 'src/contexts/StoreContext.tsx'), 'utf8');
    expect(source).toContain('selectedStoreId');
    expect(source).toContain('MAX_STORES_PER_USER');
  });
});
