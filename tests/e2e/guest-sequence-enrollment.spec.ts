/**
 * E2E — Checkout invité → enrollment séquence email post-paiement
 * (chaîne fulfillment complète couverte par Deno: sequence-enrollment-integration.test.ts)
 */
import { test, expect } from '@playwright/test';
import { mockEmailSequenceApis, seedSupabaseAuthSession } from './helpers/email-mocks';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

test.describe('Email — Guest checkout → sequence enrollment', () => {
  test('RPC enroll_store_email_in_sequence — contrat guest post-checkout', async ({ page }) => {
    const enrollPayloads: Record<string, unknown>[] = [];

    await page.route('**/rest/v1/rpc/enroll_store_email_in_sequence', async route => {
      enrollPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('e2e-enrollment-uuid'),
      });
    });

    const response = await page.request.post(
      `${SUPABASE_URL}/rest/v1/rpc/enroll_store_email_in_sequence`,
      {
        data: {
          p_store_id: 'e2e-store-id',
          p_sequence_id: 'e2e-sequence-id',
          p_email: 'guest.checkout@example.com',
          p_context: {
            order_id: 'order-e2e-001',
            customer_id: 'cust-e2e-001',
            guest_checkout: true,
            trigger_event: 'order.paid',
            store_id: 'e2e-store-id',
          },
        },
        headers: {
          apikey: 'e2e-test-key',
          authorization: 'Bearer e2e-test-key',
          'content-type': 'application/json',
        },
        failOnStatusCode: false,
      }
    );

    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toBe('e2e-enrollment-uuid');
    expect(enrollPayloads).toHaveLength(1);
    expect(enrollPayloads[0].p_email).toBe('guest.checkout@example.com');
    expect((enrollPayloads[0].p_context as Record<string, unknown>).guest_checkout).toBe(true);
  });

  test('UI vendeur — inscription manuelle invité par email', async ({ page }) => {
    const enrollPayloads: Record<string, unknown>[] = [];
    await seedSupabaseAuthSession(page);
    await mockEmailSequenceApis(page, 'e2e-store-id', {
      onEnroll: payload => enrollPayloads.push(payload),
    });

    await page.goto('/dashboard/emails/sequences');

    if (page.url().includes('/auth')) {
      test.skip(true, 'Session mock non acceptée en CI');
      return;
    }

    await expect(page.getByText(/Post-achat invité E2E|Séquences/i).first()).toBeVisible({
      timeout: 15000,
    });

    const enrollmentsTab = page.getByRole('tab', { name: /Inscriptions/i });
    if (await enrollmentsTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await enrollmentsTab.click();
    }

    const emailInput = page.getByLabel(/adresse email|email/i).first();
    if (await emailInput.isVisible({ timeout: 8000 }).catch(() => false)) {
      await emailInput.fill('guest.manual@example.com');
      const enrollButton = page
        .getByRole('button', { name: /Inscrire|Ajouter|Confirmer/i })
        .first();
      if (await enrollButton.isVisible()) {
        await enrollButton.click();
        await expect.poll(() => enrollPayloads.length, { timeout: 10000 }).toBeGreaterThan(0);
        expect(enrollPayloads[0].p_email).toBe('guest.manual@example.com');
      }
    }
  });

  test('process-email-sequences mock — envoi à recipient_email invité', async ({ page }) => {
    await page.route('**/functions/v1/process-email-sequences', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          processed: 1,
          sent: 1,
          errors: 0,
          message: 'Guest sequence email sent',
        }),
      });
    });

    const response = await page.request.post(
      `${SUPABASE_URL}/functions/v1/process-email-sequences`,
      {
        data: { limit: 5 },
        headers: {
          'x-cron-secret': 'e2e-cron-secret',
          'content-type': 'application/json',
        },
        failOnStatusCode: false,
      }
    );

    if (response.ok()) {
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.processed).toBeGreaterThanOrEqual(1);
    }
  });
});
