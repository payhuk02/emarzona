#!/usr/bin/env node
/** Phase 2 gate rapide (~2 min) — VERIFY_FAST=1 skip Playwright canary */
import { spawnSync } from 'node:child_process';

const result = spawnSync('node', ['scripts/verify-phase2.mjs'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, VERIFY_FAST: '1' },
});
process.exit(result.status ?? 1);
