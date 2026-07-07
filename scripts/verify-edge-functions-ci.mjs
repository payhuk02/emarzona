#!/usr/bin/env node
/** Reproduit .github/workflows/tests.yml job edge-functions */
import { spawnSync } from 'node:child_process';

const DENO = process.platform === 'win32' ? 'npx' : 'deno';
const DENO_ARGS_PREFIX = process.platform === 'win32' ? ['deno'] : [];

function runDeno(args) {
  return spawnSync(DENO, [...DENO_ARGS_PREFIX, ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

const FMT_FILES = [
  'supabase/functions/_shared/stripe-api.ts',
  'supabase/functions/stripe-tax-calculate/index.ts',
  'supabase/functions/stripe-create-checkout/index.ts',
  'supabase/functions/stripe-connect-onboard/index.ts',
  'supabase/functions/stripe-connect-webhook/index.ts',
  'supabase/functions/stripe-refund/index.ts',
];

const steps = [
  { label: 'deno fmt --check (Stripe)', args: ['fmt', '--check', ...FMT_FILES] },
  {
    label: 'deno check email workflow',
    args: [
      'check',
      '--config',
      'supabase/functions/deno.json',
      'supabase/functions/_shared/workflow-executor.ts',
      'supabase/functions/_shared/post-order-payment-fulfillment.ts',
      'supabase/functions/trigger-email-workflows/index.ts',
      'supabase/functions/execute-email-workflow/index.ts',
      'supabase/functions/_shared/sequence-enrollment-utils.ts',
      'supabase/functions/_shared/resend-webhook-utils.ts',
      'supabase/functions/resend-webhook-handler/index.ts',
    ],
  },
  {
    label: 'deno check Payment V2 / Stripe Tax',
    args: [
      'check',
      '--config',
      'supabase/functions/deno.json',
      'supabase/functions/_shared/stripe-api.ts',
      'supabase/functions/stripe-tax-calculate/index.ts',
      'supabase/functions/stripe-create-checkout/index.ts',
    ],
  },
  {
    label: 'deno test contract',
    args: [
      'test',
      '--allow-env',
      '--allow-net',
      '--config',
      'supabase/functions/deno.json',
      'supabase/functions/gdpr-export/index.test.ts',
      'supabase/functions/stripe-tax-calculate/index.test.ts',
      'supabase/functions/_shared/__tests__/resend-webhook-utils.test.ts',
      'supabase/functions/_shared/__tests__/sequence-enrollment-utils.test.ts',
      'supabase/functions/_shared/__tests__/sequence-enrollment-integration.test.ts',
    ],
  },
];

let ok = true;
for (const step of steps) {
  console.log(`\n▶ ${step.label}`);
  const r = runDeno(step.args);
  if (r.status !== 0) {
    ok = false;
    break;
  }
}

if (!ok) {
  console.error('\n❌ Edge Functions CI gate failed. Fix: npx deno fmt ' + FMT_FILES.join(' '));
  process.exit(1);
}
console.log('\n✓ Edge Functions CI gate passed');
process.exit(0);
