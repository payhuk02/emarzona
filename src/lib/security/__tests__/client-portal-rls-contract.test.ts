import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIENT_PORTAL_RLS_REQUIREMENTS, buildPolicyPattern } from '../client-portal-rls-contract';

function loadMigrationsCorpus(): string {
  const dir = join(process.cwd(), 'supabase', 'migrations');
  return readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .map(f => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

describe('Client portal RLS contract (Phase 0.4)', () => {
  const corpus = loadMigrationsCorpus();

  it('covers all /account/* portal tables from customerRoutes', () => {
    expect(CLIENT_PORTAL_RLS_REQUIREMENTS.length).toBeGreaterThanOrEqual(14);
  });

  for (const req of CLIENT_PORTAL_RLS_REQUIREMENTS) {
    it(`migration defines "${req.policyName}" on ${req.table}`, () => {
      expect(corpus).toMatch(buildPolicyPattern(req.table, req.policyName));
    });
  }

  it('buyer orders policy scopes by auth identity (not store_id alone)', () => {
    expect(corpus).toMatch(/Buyers can select their orders[\s\S]*auth\.uid\(\)/);
  });
});
