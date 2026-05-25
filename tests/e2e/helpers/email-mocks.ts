import type { Page, Route } from '@playwright/test';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';

/** Mock RPC désabonnement public (évite dépendance clé publishable en CI). */
export async function mockRecordEmailUnsubscribe(page: Page): Promise<void> {
  await page.route(`**/rest/v1/rpc/record_email_unsubscribe`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(true),
    });
  });
}

/** Session Supabase minimale pour accéder au dashboard emails. */
export async function seedSupabaseAuthSession(page: Page): Promise<void> {
  const storageKey = `sb-${PROJECT_REF}-auth-token`;
  const session = {
    access_token: 'e2e-mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-mock-refresh-token',
    user: {
      id: 'e2e-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'vendor@emarzona.com',
      user_metadata: { full_name: 'E2E Vendor' },
    },
  };

  await page.addInitScript(
    ({ key, value }) => {
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    { key: storageKey, value: session }
  );
}

export async function mockEmailCampaignApis(page: Page, storeId = 'e2e-store-id'): Promise<void> {
  await page.route(`**/rest/v1/stores*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: storeId,
            name: 'Boutique E2E',
            slug: 'boutique-e2e',
            user_id: 'e2e-user-id',
          },
        ]),
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/rest/v1/email_campaigns*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/rest/v1/email_templates*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'e2e-template-id',
            slug: 'welcome-user',
            name: 'Welcome E2E',
            category: 'marketing',
            is_active: true,
            store_id: null,
          },
        ]),
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/functions/v1/send-email`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        messageId: 'e2e-resend-msg-id',
      }),
    });
  });
}
