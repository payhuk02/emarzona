#!/usr/bin/env node
/**
 * verify:routes — lazy imports + nav URLs vs registered routes (CI gate).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const auditScript = join(root, 'scripts/audit-platform-routes.mjs');

if (!existsSync(auditScript)) {
  console.error('Missing scripts/audit-platform-routes.mjs');
  process.exit(1);
}

const result = spawnSync(process.execPath, [auditScript], {
  cwd: root,
  encoding: 'utf8',
});

const stdout = result.stdout || '';
const stderr = result.stderr || '';
if (stderr) process.stderr.write(stderr);

const jsonStart = stdout.lastIndexOf('{');
if (jsonStart < 0) {
  console.error('verify:routes — no JSON report from audit-platform-routes.mjs');
  process.stdout.write(stdout);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(stdout.slice(jsonStart));
} catch (err) {
  console.error('verify:routes — failed to parse audit JSON:', err.message);
  process.stdout.write(stdout);
  process.exit(1);
}

const missingImports = report.missingImports ?? [];
const missingNav = report.missingNav ?? [];
const namedExportIssues = report.namedExportIssues ?? [];
const blockers = [...missingImports, ...missingNav, ...namedExportIssues];

console.log(
  JSON.stringify(
    {
      ok: blockers.length === 0,
      registeredCount: report.registeredCount,
      lazyImports: report.lazyImports,
      navUrls: report.navUrls,
      missingImports,
      missingNav,
      namedExportIssues,
    },
    null,
    2
  )
);

if (blockers.length > 0) {
  console.error(`\nverify:routes FAILED — ${blockers.length} blocker(s)`);
  process.exit(1);
}

console.log('\nverify:routes OK');
process.exit(0);
