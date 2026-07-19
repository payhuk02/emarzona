/**
 * Seed Supabase pour E2E panier mixte service + produit physique (même boutique).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { E2E_TEST_CONFIG } from '../shared/e2e-test-config';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './e2e-supabase-guard';
import {
  createE2EUser,
  type SeededUser,
  type SeededStore,
  type SeededProduct,
} from './paid-vertical-seed';
import { ensureE2eSchemaPatches } from './e2e-schema-patches';
import { seedStorePhysicalSubscriptionTrial } from './seed-physical-subscription';

export type MixedCartFixture = {
  vendor: SeededUser;
  buyer: SeededUser;
  store: SeededStore;
  serviceProduct: SeededProduct & { serviceProductId: string };
  physicalProduct: SeededProduct & { physicalProductId: string };
  bookingId?: string;
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

async function createServiceStore(
  admin: SupabaseClient,
  vendorId: string,
  runId: string
): Promise<SeededStore> {
  const name = `E2E Mixed ${runId}`;
  const slug = slugify(name);
  const { data, error } = await admin
    .from('stores')
    .insert({
      user_id: vendorId,
      name,
      slug,
      description: 'E2E mixed cart store',
      is_active: true,
      commerce_type: 'service',
      metadata: { commerce_type: 'service' },
    })
    .select('id, slug')
    .single();

  if (error || !data) throw error ?? new Error('store insert failed');
  return { id: data.id, slug: data.slug, userId: vendorId };
}

function tomorrowAt10(): { date: Date; iso: string; dayOfWeek: number } {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return { date, iso: date.toISOString(), dayOfWeek: date.getDay() };
}

export async function seedMixedCartFixture(
  admin: SupabaseClient,
  runId: string
): Promise<MixedCartFixture> {
  assertSafeE2ESupabaseUrl(resolveE2ESupabaseUrl(), 'seedMixedCartFixture');
  await ensureE2eSchemaPatches(admin);
  const vendor = await createE2EUser(admin, `e2e-mixed-vendor-${runId}@example.com`);
  const buyer = await createE2EUser(admin, `e2e-mixed-buyer-${runId}@example.com`);
  const store = await createServiceStore(admin, vendor.id, runId);

  const serviceName = `E2E Service ${runId}`;
  const serviceSlug = slugify(serviceName);
  const { data: serviceRow, error: serviceProductError } = await admin
    .from('products')
    .insert({
      store_id: store.id,
      name: serviceName,
      slug: serviceSlug,
      description: 'Service E2E panier mixte',
      price: 5000,
      currency: 'XOF',
      product_type: 'service',
      is_active: true,
      is_draft: false,
      hide_from_store: false,
      image_url: 'https://placehold.co/600x400/png',
    })
    .select('id, slug, name')
    .single();

  if (serviceProductError || !serviceRow) {
    throw serviceProductError ?? new Error('service product insert failed');
  }

  const { data: serviceProduct, error: spError } = await admin
    .from('service_products')
    .insert({
      product_id: serviceRow.id,
      store_id: store.id,
      duration_minutes: 60,
      max_participants: 5,
      advance_booking_days: 30,
    })
    .select('id')
    .single();

  if (spError || !serviceProduct) throw spError ?? new Error('service_products insert failed');

  await seedStorePhysicalSubscriptionTrial(admin, store.id);

  const { date } = tomorrowAt10();
  for (let dow = 0; dow <= 6; dow += 1) {
    const { error: slotError } = await admin.from('service_availability_slots').insert({
      service_product_id: serviceProduct.id,
      day_of_week: dow,
      start_time: '09:00:00',
      end_time: '18:00:00',
      is_active: true,
    });
    if (slotError) throw slotError;
  }

  const physicalName = `E2E Physical ${runId}`;
  const physicalSlug = slugify(physicalName);
  const { data: physicalRow, error: physicalProductError } = await admin
    .from('products')
    .insert({
      store_id: store.id,
      name: physicalName,
      slug: physicalSlug,
      description: 'Produit physique E2E panier mixte',
      price: 3500,
      currency: 'XOF',
      product_type: 'physical',
      is_active: true,
      is_draft: false,
      hide_from_store: false,
      stock: 25,
      stock_quantity: 25,
    })
    .select('id, slug, name')
    .single();

  if (physicalProductError || !physicalRow) {
    throw physicalProductError ?? new Error('physical product insert failed');
  }

  const physicalSku = `E2E-MIX-${runId}`;
  const { data: physicalProduct, error: ppError } = await admin
    .from('physical_products')
    .insert({
      product_id: physicalRow.id,
      store_id: store.id,
      requires_shipping: true,
      weight: 0.5,
      sku: physicalSku,
      // Skip legacy inventory_items trigger; mixed-cart does not exercise stock reservation.
      track_inventory: false,
    })
    .select('id')
    .single();

  if (ppError || !physicalProduct) throw ppError ?? new Error('physical_products insert failed');

  return {
    vendor,
    buyer,
    store,
    serviceProduct: {
      id: serviceRow.id,
      slug: serviceRow.slug,
      name: serviceRow.name,
      serviceProductId: serviceProduct.id,
    },
    physicalProduct: {
      id: physicalRow.id,
      slug: physicalRow.slug,
      name: physicalRow.name,
      physicalProductId: physicalProduct.id,
    },
  };
}

export async function assertServiceBookingStatus(
  admin: SupabaseClient,
  bookingId: string,
  expectedStatus: string
): Promise<void> {
  const { data, error } = await admin
    .from('service_bookings')
    .select('status')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status !== expectedStatus) {
    throw new Error(`Expected booking ${bookingId} status ${expectedStatus}, got ${data?.status}`);
  }
}

export async function simulateMixedCartPayment(
  admin: SupabaseClient,
  orderId: string,
  bookingId: string
): Promise<void> {
  const { error: orderError } = await admin
    .from('orders')
    .update({
      status: 'completed',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (orderError) throw orderError;

  const { error: bookingError } = await admin
    .from('service_bookings')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('status', 'pending');

  if (bookingError) throw bookingError;
}

export async function cleanupMixedCartFixture(
  admin: SupabaseClient,
  fixture: MixedCartFixture
): Promise<void> {
  const userIds = [fixture.vendor.id, fixture.buyer.id];

  try {
    await admin.from('cart_items').delete().eq('user_id', fixture.buyer.id);
    await admin.from('service_bookings').delete().eq('product_id', fixture.serviceProduct.id);
    await admin
      .from('order_items')
      .delete()
      .in('product_id', [fixture.serviceProduct.id, fixture.physicalProduct.id]);
    await admin.from('orders').delete().eq('store_id', fixture.store.id);
    await admin
      .from('service_availability_slots')
      .delete()
      .eq('service_product_id', fixture.serviceProduct.serviceProductId);
    await admin
      .from('physical_products')
      .delete()
      .eq('id', fixture.physicalProduct.physicalProductId);
    await admin.from('service_products').delete().eq('id', fixture.serviceProduct.serviceProductId);
    await admin
      .from('products')
      .delete()
      .in('id', [fixture.serviceProduct.id, fixture.physicalProduct.id]);
    await admin.from('stores').delete().eq('id', fixture.store.id);
  } catch {
    // best-effort
  }

  for (const id of userIds) {
    try {
      await admin.auth.admin.deleteUser(id);
    } catch {
      // ignore
    }
  }
}

export { E2E_TEST_CONFIG, tomorrowAt10 };
