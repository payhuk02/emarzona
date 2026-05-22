/**
 * k6 load test — RPC get_marketplace_products_filtered
 *
 * Usage:
 *   k6 run scripts/k6/marketplace-rpc.js
 *
 * Env (required):
 *   SUPABASE_URL       — e.g. https://xxx.supabase.co
 *   SUPABASE_ANON_KEY  — anon/public key
 *
 * Optional:
 *   K6_VUS             — override default max VUs (default 50)
 *   K6_DURATION        — override ramp duration (default 1m)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY. Copy scripts/k6/.env.k6.example and export vars.'
  );
}

const maxVus = Number(__ENV.K6_VUS) > 0 ? Number(__ENV.K6_VUS) : 50;
const rampDuration = __ENV.K6_DURATION || '1m';

export const options = {
  stages: [
    { duration: '30s', target: Math.min(10, maxVus) },
    { duration: rampDuration, target: maxVus },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2500'],
  },
};

const rpcUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/get_marketplace_products_filtered`;

const defaultBody = JSON.stringify({
  p_limit: 24,
  p_offset: 0,
  p_category: null,
  p_product_type: null,
  p_min_price: null,
  p_max_price: null,
  p_min_rating: null,
  p_sort_by: 'created_at',
  p_sort_order: 'desc',
  p_search_query: null,
  p_featured_only: false,
});

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export default function marketplaceRpcLoad() {
  const res = http.post(rpcUrl, defaultBody, { headers });

  check(res, {
    'status is 200': r => r.status === 200,
    'response is JSON array': r => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });

  sleep(0.5 + Math.random() * 0.5);
}
