import { execSync } from 'node:child_process';
import crypto from 'node:crypto';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';
const BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;
const STORE_ID = '9ca30045-dd35-4667-9e94-ccc020b16abe';
const TEST_KEY = 'sk_live_emarzona_verify_20260628';

function getKeys() {
  const raw = execSync(`supabase projects api-keys --project-ref ${PROJECT_REF} -o json`, {
    encoding: 'utf8',
  });
  const keys = JSON.parse(raw);
  return {
    anon: keys.find((k) => k.name === 'anon')?.api_key,
    service: keys.find((k) => k.name === 'service_role')?.api_key,
  };
}

function dbQuery(sql) {
  return execSync(`supabase db query --linked "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
}

async function run() {
  const { anon } = getKeys();
  const results = [];

  async function check(name, fn, assert) {
    try {
      const data = await fn();
      const pass = assert(data);
      results.push({ name, pass, ...data });
    } catch (error) {
      results.push({ name, pass: false, error: String(error.message || error) });
    }
  }

  await check(
    'graphql invalid key -> 401',
    async () => {
      const res = await fetch(`${BASE}/graphql-gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: 'Bearer sk_bad',
        },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      return { status: res.status, body: (await res.text()).slice(0, 160) };
    },
    (d) => d.status === 401,
  );

  await check(
    'graphql valid key -> 200',
    async () => {
      const res = await fetch(`${BASE}/graphql-gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${TEST_KEY}`,
        },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      return {
        status: res.status,
        authMode: res.headers.get('x-emarzona-auth-mode'),
        storeId: res.headers.get('x-emarzona-store-id'),
        body: (await res.text()).slice(0, 200),
      };
    },
    (d) => d.status === 200 && d.storeId === STORE_ID,
  );

  await check(
    'graphql readonly key blocks mutation -> 403',
    async () => {
      const readonlyKey = 'sk_live_readonly_test';
      const hash = crypto.createHash('sha256').update(readonlyKey).digest('hex');
      dbQuery(
        `DELETE FROM public.store_api_keys WHERE key_name='verify-readonly'; INSERT INTO public.store_api_keys (store_id, key_name, api_key_hash, api_key_prefix, scopes) VALUES ('${STORE_ID}', 'verify-readonly', '${hash}', 'sk_live_read...', ARRAY['read_catalog']::text[]);`,
      );
      const res = await fetch(`${BASE}/graphql-gateway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${readonlyKey}`,
        },
        body: JSON.stringify({ query: 'mutation { __typename }' }),
      });
      return { status: res.status, body: (await res.text()).slice(0, 160) };
    },
    (d) => d.status === 403,
  );

  await check(
    'dlq worker empty queue -> 200',
    async () => {
      const res = await fetch(`${BASE}/process-webhook-dlq`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${anon}`, apikey: anon },
      });
      return { status: res.status, body: await res.text() };
    },
    (d) => d.status === 200 && d.body.includes('No events'),
  );

  await check(
    'ai-product-generate no auth -> 401',
    async () => {
      const res = await fetch(`${BASE}/ai-product-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon },
        body: JSON.stringify({
          storeId: STORE_ID,
          promptType: 'description',
          productName: 'Casque Bluetooth Pro',
        }),
      });
      return { status: res.status, body: (await res.text()).slice(0, 160) };
    },
    (d) => d.status === 401,
  );

  await check(
    'verify_store_api_key RPC',
    async () => {
      const hash = crypto.createHash('sha256').update(TEST_KEY).digest('hex');
      const out = dbQuery(`SELECT public.verify_store_api_key('${hash}')::text as result;`);
      return { output: out.includes('true') ? 'valid' : out.slice(0, 200) };
    },
    (d) => d.output === 'valid',
  );

  await check(
    'pg_cron DLQ job active',
    async () => {
      const out = dbQuery(
        "SELECT jobname, active::text, schedule FROM cron.job WHERE jobname = 'process-webhook-dlq-worker';",
      );
      return { output: out };
    },
    (d) => d.output.includes('process-webhook-dlq-worker') && d.output.includes('true'),
  );

  await check(
    'prompt_type marketing allowed',
    async () => {
      dbQuery(
        `INSERT INTO public.ai_product_generations (store_id, model_used, prompt_type, generated_content, tokens_used) VALUES ('${STORE_ID}', 'test', 'marketing', '{\"ok\":true}'::jsonb, 1) RETURNING id;`,
      );
      return { output: 'insert ok' };
    },
    (d) => d.output === 'insert ok',
  );

  console.log(JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    process.exitCode = 1;
    console.error(`\n${failed.length} test(s) failed`);
  } else {
    console.log(`\nAll ${results.length} tests passed`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
