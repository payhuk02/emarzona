import { test } from '@playwright/test';
import { getTestConfig } from './shared/e2e-test-config';

test('debug search_products rpc', async () => {
  const { admin } = getTestConfig();
  
  // Search for the product that failed in CI (just an example name, or query all recent)
  const { data, error } = await admin.rpc('search_products', {
    p_search_query: 'Digital marketplace E2E',
    p_limit: 10,
    p_offset: 0
  });
  
  console.log('RPC Error:', error);
  console.log('RPC Data count:', data?.length);
  if (data?.length > 0) {
    console.log('Sample Data:', data[0]);
  }
});
