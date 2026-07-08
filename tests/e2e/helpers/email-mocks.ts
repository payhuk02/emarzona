import type { Page, Route } from '@playwright/test';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';

export const E2E_STORE_ID = '11111111-1111-4111-8111-111111111111';
export const E2E_USER_ID = '22222222-2222-4222-8222-222222222222';
export const E2E_SEQUENCE_ID = '33333333-3333-4333-8333-333333333333';

function wantsSingleObject(route: Route): boolean {
  const accept = route.request().headers()['accept'] ?? '';
  return accept.includes('application/vnd.pgrst.object+json');
}

function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

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
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    `https://${PROJECT_REF}.supabase.co`;
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const session = {
    access_token: 'e2e-mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-mock-refresh-token',
    user: {
      id: E2E_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'vendor@emarzona.com',
      user_metadata: { full_name: 'E2E Vendor' },
    },
  };

  await page.addInitScript(
    ({ key, value, storeId }) => {
      sessionStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem('selectedStoreId', storeId);
    },
    { key: storageKey, value: session, storeId: E2E_STORE_ID }
  );
}

export async function mockEmailCampaignApis(page: Page, storeId = E2E_STORE_ID): Promise<void> {
  const storeRow = {
    id: storeId,
    user_id: E2E_USER_ID,
    name: 'Boutique E2E',
    slug: 'boutique-e2e',
    subdomain: 'boutique-e2e',
    description: null,
    default_currency: 'XOF',
    custom_domain: null,
    domain_status: null,
    domain_verification_token: null,
    domain_verified_at: null,
    domain_error_message: null,
    logo_url: null,
    banner_url: null,
    info_message: null,
    info_message_color: null,
    info_message_font: null,
    metadata: {},
    commerce_type: 'physical',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await page.route(`**/auth/v1/user`, async (route: Route) => {
    await fulfillJson(route, {
      user: {
        id: E2E_USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'vendor@emarzona.com',
        user_metadata: { full_name: 'E2E Vendor' },
      },
    });
  });

  await page.route(`**/rest/v1/stores*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      const isSingle = wantsSingleObject(route);
      console.log('stores mock hit! url:', route.request().url(), 'isSingle:', isSingle);
      await fulfillJson(route, isSingle ? storeRow : [storeRow]);
      return;
    }
    await route.continue();
  });

  await page.route(`**/rest/v1/store_platform_subscriptions*`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      const subscriptionRow = {
        status: 'active',
        trial_ends_at: null,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {},
        platform_vendor_plans: {
          name: 'Physical Standard E2E',
          slug: 'physical_standard',
          monthly_price: 29,
          trial_days: null,
        },
      };
      // `useStorePhysicalAccess` utilises `.maybeSingle()` ce qui envoie `Accept: */*` parfois,
      // on renvoie l'objet direct car on sait que c'est le comportement attendu ici.
      const url = route.request().url();
      const isSingle =
        wantsSingleObject(route) || url.includes('limit=1') || url.includes('limit=2');
      await fulfillJson(route, isSingle ? subscriptionRow : [subscriptionRow]);
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
  id: E2E_SEQUENCE_ID,
  store_id: E2E_STORE_ID,
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
  storeId = E2E_STORE_ID,
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
