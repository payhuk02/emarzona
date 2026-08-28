/**
 * E2E — Service projet P0→P3 : taxonomie projet, packages P1, jalons P3, cycle paiement complet.
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  applyCheckoutPlatformFee,
  cleanupServiceMilestoneFixture,
  milestoneAmounts,
  seedServiceMilestoneFixture,
} from './helpers/service-milestone-seed';
import { gotoApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

type MilestoneRow = {
  id: string;
  sort_order: number;
  trigger_type: string;
  status: string;
  amount: number;
};

test.describe('Service projet — jalons P0→P3 (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'service-project-milestone-flow E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('P0–P3: projet + package + commande + jalons held → livraison → solde paid', async ({
    page,
  }) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const fixture = await seedServiceMilestoneFixture(admin);
    let orderId: string | null = null;

    try {
      // P0 — fulfillment_mode projet persisté
      const { data: spRow } = await admin
        .from('service_products')
        .select('fulfillment_mode')
        .eq('id', fixture.serviceProductId)
        .single();
      expect(spRow?.fulfillment_mode).toBe('project');

      const { data: productRow } = await admin
        .from('products')
        .select('payment_options')
        .eq('id', fixture.productId)
        .single();
      const paymentOptions = productRow?.payment_options as {
        payment_type?: string;
        use_project_milestones?: boolean;
      };
      expect(paymentOptions?.payment_type).toBe('delivery_secured');
      expect(paymentOptions?.use_project_milestones).toBe(true);

      // P1 — prix serveur depuis package (ignore quoted_total client)
      const { data: orderRpc, error: orderError } = await admin.rpc('create_public_service_order', {
        p_product_id: fixture.productId,
        p_store_id: fixture.storeId,
        p_customer_email: fixture.buyerEmail,
        p_customer_name: 'Acheteur E2E',
        p_customer_phone: null,
        p_service_metadata: {
          fulfillment_mode: 'project',
          delivery_package_id: fixture.packageId,
          extra_ids: [],
          brief_answers: {},
          quoted_total: 1,
        },
        p_gift_card_id: null,
        p_gift_card_amount_requested: 0,
        p_coupon_code: null,
        p_affiliate_tracking_cookie: null,
        p_guest_checkout: true,
        p_booking_id: null,
      });

      expect(orderError).toBeNull();
      const orderPayload = orderRpc as {
        order_id: string;
        total_amount: number;
      };
      orderId = orderPayload.order_id;
      expect(orderId).toBeTruthy();

      const expectedTotal = applyCheckoutPlatformFee(fixture.packagePrice);
      expect(Number(orderPayload.total_amount)).toBe(expectedTotal);

      const { first, second } = milestoneAmounts(expectedTotal);

      // P3 — persistance jalons
      const { error: persistError } = await admin.rpc('persist_service_order_milestones', {
        p_order_id: orderId,
        p_milestones: [
          { label: 'Démarrage', percentage: 50, amount: first, trigger: 'order_placed' },
          { label: 'Livraison', percentage: 50, amount: second, trigger: 'delivery_approved' },
        ],
      });
      expect(persistError).toBeNull();

      const { data: milestonesAfterPersist } = await admin
        .from('service_order_milestones')
        .select('id, sort_order, trigger_type, status, amount')
        .eq('order_id', orderId)
        .order('sort_order', { ascending: true });
      expect(milestonesAfterPersist?.length).toBe(2);
      expect((milestonesAfterPersist as MilestoneRow[])[0].status).toBe('awaiting_payment');
      expect((milestonesAfterPersist as MilestoneRow[])[1].status).toBe('pending');

      // Checkout jalon 1 simulé (webhook edge)
      const { error: activateError } = await admin.rpc(
        'activate_service_order_checkout_milestones',
        {
          p_order_id: orderId,
        }
      );
      expect(activateError).toBeNull();

      const { data: afterActivate } = await admin
        .from('service_order_milestones')
        .select('trigger_type, status')
        .eq('order_id', orderId)
        .order('sort_order', { ascending: true });
      expect((afterActivate as MilestoneRow[])[0].status).toBe('held');
      expect((afterActivate as MilestoneRow[])[1].status).toBe('pending');

      // Validation livraison → libère jalon 1, active jalon 2
      const { data: approveResult, error: approveError } = await admin.rpc(
        'approve_service_project_delivery',
        { p_order_id: orderId }
      );
      expect(approveError).toBeNull();
      expect(Number((approveResult as { remaining_amount?: number })?.remaining_amount)).toBe(
        second
      );

      const { data: orderAfterApprove } = await admin
        .from('orders')
        .select('delivery_status, payment_status, remaining_amount')
        .eq('id', orderId)
        .single();
      expect(orderAfterApprove?.delivery_status).toBe('confirmed');
      expect(orderAfterApprove?.payment_status).toBe('partial');
      expect(Number(orderAfterApprove?.remaining_amount)).toBe(second);

      const { data: afterApprove } = await admin
        .from('service_order_milestones')
        .select('trigger_type, status')
        .eq('order_id', orderId)
        .order('sort_order', { ascending: true });
      expect((afterApprove as MilestoneRow[])[0].status).toBe('released');
      expect((afterApprove as MilestoneRow[])[1].status).toBe('awaiting_payment');

      // Paiement solde jalon 2
      const { error: completeError } = await admin.rpc(
        'complete_service_milestone_balance_payment',
        { p_order_id: orderId }
      );
      expect(completeError).toBeNull();

      const { data: orderFinal } = await admin
        .from('orders')
        .select('payment_status, remaining_amount')
        .eq('id', orderId)
        .single();
      expect(orderFinal?.payment_status).toBe('completed');
      expect(Number(orderFinal?.remaining_amount)).toBe(0);

      const { data: afterComplete } = await admin
        .from('service_order_milestones')
        .select('trigger_type, status')
        .eq('order_id', orderId)
        .order('sort_order', { ascending: true });
      expect((afterComplete as MilestoneRow[])[1].status).toBe('paid');

      // UI — fiche service affiche l’offre projet (smoke)
      const { data: storeRow } = await admin
        .from('stores')
        .select('slug')
        .eq('id', fixture.storeId)
        .single();
      const { data: productSlugRow } = await admin
        .from('products')
        .select('slug')
        .eq('id', fixture.productId)
        .single();

      if (storeRow?.slug && productSlugRow?.slug) {
        const response = await gotoApp(
          page,
          `/service/${productSlugRow.slug}?store=${storeRow.slug}`
        );
        expect(response?.status()).toBeLessThan(500);
        await expect(
          page.getByText(/Standard|Continuer vers le paiement|Paiement sécurisé/i).first()
        ).toBeVisible({
          timeout: 30_000,
        });
      }
    } finally {
      if (orderId) {
        await admin.from('service_order_milestones').delete().eq('order_id', orderId);
        await admin.from('order_items').delete().eq('order_id', orderId);
        await admin.from('orders').delete().eq('id', orderId);
      }
      await cleanupServiceMilestoneFixture(admin, fixture);
    }
  });
});
