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

const MOCK_SEQUENCE = {
  id: 'e2e-sequence-id',
  store_id: 'e2e-store-id',
  name: 'Post-achat invité E2E',
  description: 'Séquence test checkout invité',
  trigger_type: 'event',
  trigger_config: { event_name: 'order.paid' },
  status: 'active',
  enrolled_count: 0,
  completed_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/** Mocks séquences email + enrollment invité (post-checkout). */
export async function mockEmailSequenceApis(
  page: Page,
  storeId = 'e2e-store-id',
  options?: {
    onEnroll?: (payload: Record<string, unknown>) => void;
  }
): Promise<void> {
  await mockEmailCampaignApis(page, storeId);

  await page.route(`**/rest/v1/email_sequences*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ ...MOCK_SEQUENCE, store_id: storeId }]),
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/rest/v1/email_sequence_steps*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'e2e-step-1',
            sequence_id: MOCK_SEQUENCE.id,
            step_order: 1,
            template_id: 'e2e-template-id',
            delay_type: 'immediate',
            delay_value: 0,
            created_at: new Date().toISOString(),
          },
        ]),
      });
      return;
    }
    await route.continue();
  });

  let guestEnrollments: Array<Record<string, unknown>> = [];

  await page.route(`**/rest/v1/email_sequence_enrollments*`, async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestEnrollments),
      });
      return;
    }
    if (method === 'PATCH') {
      const url = route.request().url();
      const idMatch = url.match(/id=eq\.([^&]+)/);
      const enrollmentId = idMatch?.[1];
      guestEnrollments = guestEnrollments.map(row =>
        row.id === enrollmentId ? { ...row, status: 'paused' } : row
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(guestEnrollments.filter(r => r.id === enrollmentId)),
      });
      return;
    }
    await route.continue();
  });

  await page.route(`**/rest/v1/rpc/enroll_store_email_in_sequence`, async (route: Route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    options?.onEnroll?.(body);

    const enrollment = {
      id: 'e2e-guest-enrollment-id',
      sequence_id: body.p_sequence_id,
      user_id: null,
      recipient_email: body.p_email,
      status: 'active',
      current_step: 1,
      completed_steps: [],
      enrolled_at: new Date().toISOString(),
      next_email_at: new Date().toISOString(),
      context: body.p_context,
    };
    guestEnrollments = [enrollment];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify('e2e-guest-enrollment-id'),
    });
  });
}
