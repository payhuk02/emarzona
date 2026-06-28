import {
  injectTenantFilters,
  scopeGraphqlQuery,
  TenantGuardError,
} from '../supabase/functions/_shared/graphql-tenant-guard.ts';

const STORE = '9ca30045-dd35-4667-9e94-ccc020b16abe';

const q1 = `query { productsCollection(first: 5) { edges { node { id name } } } }`;
const s1 = injectTenantFilters(q1, STORE);
if (!s1.includes(`storeId: { eq: "${STORE}"`)) {
  console.error('FAIL: storeId filter not injected', s1);
  process.exit(1);
}

try {
  scopeGraphqlQuery('{ __schema { types { name } } }', STORE, ['read_catalog']);
  console.error('FAIL: introspection should be blocked');
  process.exit(1);
} catch (e) {
  if (!(e instanceof TenantGuardError)) throw e;
}

try {
  scopeGraphqlQuery('{ ordersCollection { edges { node { id } } } }', STORE, ['read_catalog']);
  console.error('FAIL: orders should require read_orders');
  process.exit(1);
} catch (e) {
  if (!(e instanceof TenantGuardError)) throw e;
}

console.log('graphql-tenant-guard unit checks passed');
