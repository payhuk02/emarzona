import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import { PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE } from '../../src/lib/commerce/store-capability-map';
import {
  expectSidebarHasLink,
  expectSidebarMissingLink,
  loginSeededSeller,
  waitForCommerceSidebarGating,
} from './helpers/seller-dashboard-setup';
import { seedStorePhysicalSubscriptionTrial } from './helpers/seed-physical-subscription';

type StoreCommerceType = 'physical' | 'digital' | 'service' | 'course' | 'artist';

const TYPES: readonly StoreCommerceType[] = ['physical', 'digital', 'service', 'course', 'artist'];

const ALL_CREATE_PATHS = [
  '/dashboard/products/new',
  '/dashboard/products/new/physical',
  '/dashboard/products/new/digital',
  '/dashboard/products/new/service',
  '/dashboard/products/new/artist',
  '/dashboard/courses/new',
] as const;

const WRONG_CREATE_PATH_BY_TYPE: Record<StoreCommerceType, string> = {
  physical: '/dashboard/products/new/digital',
  digital: '/dashboard/products/new/physical',
  service: '/dashboard/products/new/artist',
  course: '/dashboard/products/new/service',
  artist: '/dashboard/courses/new',
};

function requiredEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const typeAssertions: Record<
  StoreCommerceType,
  {
    mustHave: string[];
    mustNotHave: string[];
    forbiddenDirectPath: string;
  }
> = {
  physical: {
    mustHave: ['/dashboard/shipping'],
    mustNotHave: [
      '/dashboard/digital-products',
      '/dashboard/bookings',
      '/dashboard/courses',
      '/dashboard/auctions',
    ],
    forbiddenDirectPath: '/dashboard/digital-products',
  },
  digital: {
    mustHave: ['/dashboard/digital-products'],
    mustNotHave: [
      '/dashboard/shipping',
      '/dashboard/bookings',
      '/dashboard/courses',
      '/dashboard/auctions',
    ],
    forbiddenDirectPath: '/dashboard/shipping',
  },
  service: {
    mustHave: ['/dashboard/bookings'],
    mustNotHave: [
      '/dashboard/shipping',
      '/dashboard/digital-products',
      '/dashboard/courses',
      '/dashboard/auctions',
    ],
    forbiddenDirectPath: '/dashboard/digital-products',
  },
  course: {
    mustHave: ['/dashboard/courses'],
    mustNotHave: [
      '/dashboard/shipping',
      '/dashboard/digital-products',
      '/dashboard/bookings',
      '/dashboard/auctions',
    ],
    forbiddenDirectPath: '/dashboard/shipping',
  },
  artist: {
    mustHave: ['/dashboard/artist-products', '/dashboard/auctions', '/dashboard/portfolios'],
    mustNotHave: [
      '/dashboard/shipping',
      '/dashboard/digital-products',
      '/dashboard/bookings',
      '/dashboard/courses',
    ],
    forbiddenDirectPath: '/dashboard/digital-products',
  },
};

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Commerce type gating (E2E minimal)', () => {
  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'commerce-type-gating E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  for (const commerceType of TYPES) {
    test(`create store (${commerceType}) -> sidebar/route gating`, async ({ page }, testInfo) => {
      const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);

      const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const email = `e2e-commerce-${commerceType}-${runId}@example.com`;
      const password = `E2E!${runId}aA1`;
      const storeName = `E2E ${commerceType} ${runId}`;
      const storeSlug = slugify(storeName);

      const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      expect(userError, 'admin.createUser should succeed').toBeNull();
      expect(createdUser.user?.id, 'created user id').toBeTruthy();
      const userId = createdUser.user!.id;

      const { data: storeData, error: storeError } = await admin
        .from('stores')
        .insert({
          user_id: userId,
          name: storeName,
          slug: storeSlug,
          description: `E2E store for ${commerceType}`,
          is_active: true,
          commerce_type: commerceType,
          metadata: { commerce_type: commerceType },
        })
        .select('id')
        .single();

      expect(storeError, 'insert store should succeed').toBeNull();
      const storeId = (storeData as { id: string } | null)?.id;
      expect(storeId, 'created store id').toBeTruthy();

      if (commerceType === 'physical') {
        await seedStorePhysicalSubscriptionTrial(admin, storeId!);
      }

      await loginSeededSeller(page, admin, email);

      // Ensure sidebar loaded (commerce_type from StoreContext drives nav filtering)
      await expect(page.locator('.app-sidebar')).toBeVisible();

      const { mustHave, mustNotHave, forbiddenDirectPath } = typeAssertions[commerceType];
      const ownCreatePath = PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE[commerceType];

      await waitForCommerceSidebarGating(page, commerceType);

      for (const path of mustHave) {
        await expectSidebarHasLink(page, path);
      }
      for (const path of mustNotHave) {
        await expectSidebarMissingLink(page, path);
      }

      for (const path of ALL_CREATE_PATHS) {
        if (path !== ownCreatePath) {
          await expectSidebarMissingLink(page, path);
        }
      }

      // Direct URL access should redirect to /dashboard if forbidden
      await page.goto(forbiddenDirectPath, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL('/dashboard', { timeout: 20_000 });

      const wrongCreatePath = WRONG_CREATE_PATH_BY_TYPE[commerceType];
      await page.goto(wrongCreatePath, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL('/dashboard', { timeout: 20_000 });

      if (commerceType === 'artist') {
        await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL('/dashboard/artist-products', { timeout: 20_000 });
      }

      // Cleanup best-effort (do not fail test run on cleanup errors)
      try {
        await admin.from('stores').delete().eq('id', storeId!);
      } catch (e) {
        testInfo.attach('cleanup-store-error', { body: String(e), contentType: 'text/plain' });
      }
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch (e) {
        testInfo.attach('cleanup-user-error', { body: String(e), contentType: 'text/plain' });
      }
    });
  }
});
