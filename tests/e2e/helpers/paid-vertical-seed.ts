/**
 * Seed Supabase pour E2E payants (cours + artiste) — même pattern que commerce-type-gating.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { E2E_TEST_CONFIG } from '../shared/e2e-test-config';

export type SeededUser = { id: string; email: string; password: string };
export type SeededStore = { id: string; slug: string; userId: string };
export type SeededProduct = { id: string; slug: string; name: string };

export type PaidCourseFixture = {
  vendor: SeededUser;
  buyer: SeededUser;
  store: SeededStore;
  product: SeededProduct;
  courseId: string;
  orderId: string;
  customerId: string;
};

export type PaidArtistFixture = {
  vendor: SeededUser;
  buyer: SeededUser;
  store: SeededStore;
  product: SeededProduct;
  artistProductId: string;
  orderId: string;
  customerId: string;
  certificateVerificationCode?: string;
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

async function withAuthRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
      await new Promise(resolve => setTimeout(resolve, attempt * 2_000));
    }
  }
  throw lastError ?? new Error(`${label} failed`);
}

export async function createE2EUser(
  admin: SupabaseClient,
  email: string,
  password: string = E2E_TEST_CONFIG.seededUserPassword
): Promise<SeededUser> {
  return withAuthRetry(`createUser(${email})`, async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user?.id) {
      throw error ?? new Error(`createUser failed for ${email}`);
    }
    return { id: data.user.id, email, password };
  });
}

async function createStore(
  admin: SupabaseClient,
  vendorId: string,
  commerceType: 'course' | 'artist',
  runId: string
): Promise<SeededStore> {
  const name = `E2E ${commerceType} ${runId}`;
  const slug = slugify(name);
  const { data, error } = await admin
    .from('stores')
    .insert({
      user_id: vendorId,
      name,
      slug,
      description: `E2E ${commerceType} store`,
      is_active: true,
      commerce_type: commerceType,
      metadata: { commerce_type: commerceType },
    })
    .select('id, slug')
    .single();

  if (error || !data) throw error ?? new Error('store insert failed');
  return { id: data.id, slug: data.slug, userId: vendorId };
}

async function createCustomer(
  admin: SupabaseClient,
  storeId: string,
  buyer: SeededUser
): Promise<string> {
  const { data, error } = await admin
    .from('customers')
    .insert({
      id: buyer.id,
      store_id: storeId,
      email: buyer.email,
      name: 'E2E Buyer',
      full_name: 'E2E Buyer',
      metadata: { e2e: true, user_id: buyer.id },
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('customer insert failed');
  return data.id;
}

/** Numéro compatible avec check_order_number_format sur le Supabase E2E (TEST-ORDER-<digits>). */
function resolveOrderNumber(runId: string): string {
  return `TEST-ORDER-${Date.now()}${runId.slice(-4).replace(/\D/g, '') || '0'}`;
}

async function ensureCourseEnrollment(
  admin: SupabaseClient,
  courseId: string,
  productId: string,
  buyerId: string,
  orderId: string
): Promise<void> {
  const { error } = await admin.from('course_enrollments').insert({
    course_id: courseId,
    product_id: productId,
    user_id: buyerId,
    order_id: orderId,
    status: 'active',
    total_lessons: 0,
    progress_percentage: 0,
  });

  if (error) throw error;
}

export async function seedPaidCourseFixture(
  admin: SupabaseClient,
  runId: string
): Promise<PaidCourseFixture> {
  const vendor = await createE2EUser(admin, `e2e-course-vendor-${runId}@example.com`);
  const buyer = await createE2EUser(admin, `e2e-course-buyer-${runId}@example.com`);
  const store = await createStore(admin, vendor.id, 'course', runId);

  const productName = `E2E Cours ${runId}`;
  const productSlug = slugify(productName);
  const { data: product, error: productError } = await admin
    .from('products')
    .insert({
      store_id: store.id,
      name: productName,
      slug: productSlug,
      description: 'Cours E2E payant',
      price: 7500,
      currency: 'XOF',
      product_type: 'course',
      is_active: true,
      is_draft: false,
    })
    .select('id, slug, name')
    .single();

  if (productError || !product) throw productError ?? new Error('product insert failed');

  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({ product_id: product.id })
    .select('id')
    .single();

  if (courseError || !course) throw courseError ?? new Error('course insert failed');

  const customerId = await createCustomer(admin, store.id, buyer);
  const orderNumber = resolveOrderNumber(runId);

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      store_id: store.id,
      customer_id: customerId,
      order_number: orderNumber,
      total_amount: 7500,
      currency: 'XOF',
      payment_status: 'pending',
      status: 'pending',
      payment_type: 'full',
    })
    .select('id')
    .single();

  if (orderError || !order) throw orderError ?? new Error('order insert failed');

  const { error: itemError } = await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    product_type: 'course',
    product_name: product.name,
    quantity: 1,
    unit_price: 7500,
    total_price: 7500,
  });

  if (itemError) throw itemError;

  await ensureCourseEnrollment(admin, course.id, product.id, buyer.id, order.id);

  return {
    vendor,
    buyer,
    store,
    product: { id: product.id, slug: product.slug, name: product.name },
    courseId: course.id,
    orderId: order.id,
    customerId,
  };
}

export async function seedPaidArtistFixture(
  admin: SupabaseClient,
  runId: string
): Promise<PaidArtistFixture> {
  const vendor = await createE2EUser(admin, `e2e-artist-vendor-${runId}@example.com`);
  const buyer = await createE2EUser(admin, `e2e-artist-buyer-${runId}@example.com`);
  const store = await createStore(admin, vendor.id, 'artist', runId);

  const productName = `E2E Oeuvre ${runId}`;
  const productSlug = slugify(productName);
  const { data: product, error: productError } = await admin
    .from('products')
    .insert({
      store_id: store.id,
      name: productName,
      slug: productSlug,
      description: 'Oeuvre E2E payante',
      price: 12000,
      currency: 'XOF',
      product_type: 'artist',
      is_active: true,
    })
    .select('id, slug, name')
    .single();

  if (productError || !product) throw productError ?? new Error('product insert failed');

  const { data: artistProduct, error: artistError } = await admin
    .from('artist_products')
    .insert({
      product_id: product.id,
      store_id: store.id,
      artist_type: 'visual_artist',
      artist_name: 'E2E Artiste',
      artwork_title: productName,
      artwork_edition_type: 'original',
      certificate_of_authenticity: true,
      requires_shipping: false,
      artwork_link_url: 'https://example.com/e2e-artwork',
    })
    .select('id')
    .single();

  if (artistError || !artistProduct)
    throw artistError ?? new Error('artist_products insert failed');

  const customerId = await createCustomer(admin, store.id, buyer);
  const orderNumber = resolveOrderNumber(runId);

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      store_id: store.id,
      customer_id: customerId,
      order_number: orderNumber,
      total_amount: 12000,
      currency: 'XOF',
      payment_status: 'pending',
      status: 'pending',
      payment_type: 'full',
    })
    .select('id')
    .single();

  if (orderError || !order) throw orderError ?? new Error('order insert failed');

  const { error: itemError } = await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    product_type: 'artist',
    product_name: product.name,
    quantity: 1,
    unit_price: 12000,
    total_price: 12000,
  });

  if (itemError) throw itemError;

  const verificationCode = `E2E${runId.slice(-6).toUpperCase()}`;
  const { error: certError } = await admin.from('artist_product_certificates').insert({
    order_id: order.id,
    product_id: product.id,
    artist_product_id: artistProduct.id,
    user_id: buyer.id,
    buyer_name: 'E2E Buyer',
    buyer_email: buyer.email,
    certificate_number: `CERT-${runId}`,
    verification_code: verificationCode,
    is_public: true,
    artwork_title: productName,
    artist_name: 'E2E Artiste',
    purchase_date: new Date().toISOString().slice(0, 10),
    is_valid: true,
    is_generated: true,
  });
  if (certError) throw certError;

  return {
    vendor,
    buyer,
    store,
    product: { id: product.id, slug: product.slug, name: product.name },
    artistProductId: artistProduct.id,
    orderId: order.id,
    customerId,
    certificateVerificationCode: verificationCode,
  };
}

export async function cleanupPaidFixture(
  admin: SupabaseClient,
  fixture: PaidCourseFixture | PaidArtistFixture
): Promise<void> {
  const ids = [fixture.vendor.id, fixture.buyer.id];

  try {
    if ('courseId' in fixture) {
      await admin.from('course_enrollments').delete().eq('course_id', fixture.courseId);
    }
    if ('artistProductId' in fixture) {
      await admin.from('artist_product_certificates').delete().eq('order_id', fixture.orderId);
    }
    await admin.from('order_items').delete().eq('order_id', fixture.orderId);
    await admin.from('orders').delete().eq('id', fixture.orderId);
    await admin.from('customers').delete().eq('id', fixture.customerId);
    if ('courseId' in fixture) {
      await admin.from('courses').delete().eq('id', fixture.courseId);
    }
    if ('artistProductId' in fixture) {
      await admin.from('artist_products').delete().eq('id', fixture.artistProductId);
    }
    await admin.from('products').delete().eq('id', fixture.product.id);
    await admin.from('stores').delete().eq('id', fixture.store.id);
  } catch {
    // best-effort
  }

  for (const userId of ids) {
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // best-effort
    }
  }
}

export async function assertCourseEnrollment(
  admin: SupabaseClient,
  courseId: string,
  userId: string
): Promise<void> {
  const { data, error } = await admin
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error('course_enrollments row missing after paid order');
  }
}

export async function assertCertificateVerification(
  admin: SupabaseClient,
  verificationCode: string
): Promise<void> {
  const { data, error } = await admin.rpc('verify_artist_certificate_by_code', {
    p_code: verificationCode.trim().toUpperCase(),
  });

  if (error) throw error;
  if (!data || (data as { valid?: boolean }).valid !== true) {
    throw new Error(`verify_artist_certificate_by_code invalid for ${verificationCode}`);
  }
}
