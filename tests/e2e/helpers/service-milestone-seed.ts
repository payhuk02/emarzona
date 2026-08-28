/**
 * Seed Supabase pour E2E jalons de paiement service projet (P0–P3).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './e2e-supabase-guard';
import { createE2EVendor, type VendorE2EContext } from './vendor-e2e-helpers';

export type ServiceMilestoneFixture = VendorE2EContext & {
  productId: string;
  serviceProductId: string;
  packageId: string;
  packagePrice: number;
  buyerEmail: string;
};

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

/** 2 % + 100 XOF (aligné checkout plateforme). */
export function applyCheckoutPlatformFee(subtotal: number): number {
  return Math.round(subtotal + subtotal * 0.02 + 100);
}

export function milestoneAmounts(totalWithFee: number): { first: number; second: number } {
  const first = Math.round((totalWithFee * 50) / 100);
  return { first, second: Math.max(0, totalWithFee - first) };
}

export async function seedServiceMilestoneFixture(
  admin: SupabaseClient,
  prefix = 'e2e-svc-milestone'
): Promise<ServiceMilestoneFixture> {
  assertSafeE2ESupabaseUrl(resolveE2ESupabaseUrl(), 'seedServiceMilestoneFixture');
  const ctx = await createE2EVendor(admin, 'service', prefix);
  const runId = ctx.runId;
  const buyerEmail = `buyer-milestone-${runId}@example.com`;
  const packagePrice = 100_000;
  const productName = `Service projet jalons ${runId}`;
  const productSlug = slugify(productName);

  const paymentOptions = {
    payment_type: 'delivery_secured',
    use_project_milestones: true,
    project_milestones: [
      { label: 'Démarrage', percentage: 50, trigger: 'order_placed' },
      { label: 'Livraison', percentage: 50, trigger: 'delivery_approved' },
    ],
  };

  const { data: product, error: productError } = await admin
    .from('products')
    .insert({
      store_id: ctx.storeId,
      name: productName,
      slug: productSlug,
      description: 'Service projet E2E jalons P3',
      price: packagePrice,
      currency: 'XOF',
      product_type: 'service',
      is_active: true,
      is_draft: false,
      hide_from_store: false,
      payment_options: paymentOptions,
      image_url: 'https://placehold.co/600x400/png',
    })
    .select('id')
    .single();

  if (productError || !product) {
    throw productError ?? new Error('products insert failed');
  }

  const { data: serviceProduct, error: spError } = await admin
    .from('service_products')
    .insert({
      product_id: product.id,
      store_id: ctx.storeId,
      fulfillment_mode: 'project',
      duration_minutes: 60,
      max_participants: 1,
    })
    .select('id, fulfillment_mode')
    .single();

  if (spError || !serviceProduct) {
    throw spError ?? new Error('service_products insert failed');
  }

  const { data: deliveryPackage, error: pkgError } = await admin
    .from('service_packages')
    .insert({
      service_product_id: serviceProduct.id,
      product_id: product.id,
      store_id: ctx.storeId,
      name: 'Standard',
      display_name: 'Standard',
      slug: `standard-${runId}`,
      package_kind: 'delivery_tier',
      tier: 'standard',
      price: packagePrice,
      delivery_days: 7,
      revisions: 2,
      features: ['Livraison source', 'Révisions'],
      sort_order: 0,
      is_active: true,
      is_featured: true,
    })
    .select('id, price')
    .single();

  if (pkgError || !deliveryPackage) {
    throw pkgError ?? new Error('service_packages insert failed');
  }

  return {
    ...ctx,
    productId: product.id,
    serviceProductId: serviceProduct.id,
    packageId: deliveryPackage.id,
    packagePrice: Number(deliveryPackage.price),
    buyerEmail,
  };
}

export async function cleanupServiceMilestoneFixture(
  admin: SupabaseClient,
  fixture: ServiceMilestoneFixture
): Promise<void> {
  await admin
    .from('service_order_milestones')
    .delete()
    .in(
      'order_id',
      (await admin.from('orders').select('id').eq('store_id', fixture.storeId)).data?.map(
        row => row.id
      ) ?? []
    );

  await admin.from('orders').delete().eq('store_id', fixture.storeId);
  await admin.from('service_packages').delete().eq('service_product_id', fixture.serviceProductId);
  await admin.from('service_products').delete().eq('id', fixture.serviceProductId);
  await admin.from('products').delete().eq('id', fixture.productId);
  await admin.from('stores').delete().eq('id', fixture.storeId);
  await admin.auth.admin.deleteUser(fixture.userId);
}
