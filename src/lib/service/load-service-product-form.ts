import { supabase } from '@/integrations/supabase/client';
import type {
  ServiceAvailabilitySlot,
  ServiceProductFormData,
  ServiceStaffMember,
} from '@/types/service-product';

const PRODUCT_FIELDS =
  'id, store_id, name, slug, description, short_description, price, promotional_price, currency, category, category_id, tags, images, image_url, meta_title, meta_description, og_image, faqs, payment_options, hide_purchase_count, hide_likes_count, hide_recommendations_count, hide_downloads_count, hide_reviews_count, hide_rating, is_active, whatsapp_number, whatsapp_enabled';
const SERVICE_PRODUCT_FIELDS =
  'id, product_id, service_type, duration_minutes, location_type, location_address, meeting_url, timezone, requires_staff, max_participants, pricing_type, deposit_required, deposit_amount, deposit_type, allow_booking_cancellation, cancellation_deadline_hours, require_approval, buffer_time_before, buffer_time_after, advance_booking_days, fulfillment_mode, category_attributes';
const SERVICE_AVAILABILITY_SLOT_FIELDS =
  'id, service_product_id, day_of_week, start_time, end_time';
const SERVICE_STAFF_FIELDS = 'id, service_product_id, name, email, role, avatar_url, is_active';
const SERVICE_RESOURCE_FIELDS =
  'id, service_product_id, name, resource_type, quantity, is_required';
const PRODUCT_AFFILIATE_FIELDS =
  'id, product_id, affiliate_enabled, commission_rate, commission_type, fixed_commission_amount, cookie_duration_days, min_order_amount, allow_self_referral, require_approval, terms_and_conditions';

export async function loadServiceProductFormData(
  productId: string,
  userId?: string
): Promise<Partial<ServiceProductFormData>> {
  if (userId) {
    const { data: ownershipCheck, error: ownershipError } = await supabase
      .from('products')
      .select(
        `
        id,
        stores!inner(user_id)
      `
      )
      .eq('id', productId)
      .eq('stores.user_id', userId)
      .single();

    if (ownershipError || !ownershipCheck) {
      throw new Error('Accès non autorisé à ce produit');
    }
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Produit non trouvé');

  const { data: serviceProduct, error: serviceError } = await supabase
    .from('service_products')
    .select(SERVICE_PRODUCT_FIELDS)
    .eq('product_id', productId)
    .maybeSingle();

  if (serviceError && serviceError.code !== 'PGRST116') throw serviceError;

  const { data: availabilitySlots, error: slotsError } = await supabase
    .from('service_availability_slots')
    .select(SERVICE_AVAILABILITY_SLOT_FIELDS)
    .eq('service_product_id', serviceProduct?.id || productId);
  if (slotsError) throw slotsError;

  const { data: staffMembers, error: staffError } = await supabase
    .from('service_staff_members')
    .select(SERVICE_STAFF_FIELDS)
    .eq('service_product_id', serviceProduct?.id || productId);
  if (staffError) throw staffError;

  const { data: resources, error: resourcesError } = await supabase
    .from('service_resources')
    .select(SERVICE_RESOURCE_FIELDS)
    .eq('service_product_id', serviceProduct?.id || productId);
  if (resourcesError) throw resourcesError;

  const { data: affiliateSettings } = await supabase
    .from('product_affiliate_settings')
    .select(PRODUCT_AFFILIATE_FIELDS)
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  const resourceNames = (resources || [])
    .map((r: Record<string, unknown>) => (r.name as string) || '')
    .filter(Boolean);

  let categorySlug = product.category || '';
  let parentCategoryId: string | null = null;
  if (product.category_id) {
    const { data: categoryRow } = await supabase
      .from('categories')
      .select('id, slug, parent_id')
      .eq('id', product.category_id)
      .maybeSingle();
    if (categoryRow?.slug) categorySlug = categoryRow.slug;
    if (categoryRow?.parent_id) parentCategoryId = categoryRow.parent_id;
  }

  return {
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    short_description: product.short_description || '',
    price: product.price || 0,
    currency: product.currency || 'XOF',
    promotional_price: product.promotional_price || undefined,
    category: categorySlug,
    category_id: product.category_id || null,
    parent_category_id: parentCategoryId,
    category_attributes:
      ((
        serviceProduct as {
          category_attributes?: Record<string, string | number | boolean | string[]>;
        } | null
      )?.category_attributes as Record<string, string | number | boolean | string[]>) || {},
    fulfillment_mode:
      (serviceProduct as { fulfillment_mode?: string } | null)?.fulfillment_mode === 'project' ||
      (serviceProduct as { fulfillment_mode?: string } | null)?.fulfillment_mode === 'both'
        ? ((serviceProduct as { fulfillment_mode: string }).fulfillment_mode as 'project' | 'both')
        : 'appointment',
    tags: product.tags || [],
    images: product.images || (product.image_url ? [product.image_url] : []),
    image_url: product.image_url || '',
    service_type:
      (serviceProduct?.service_type as
        | 'appointment'
        | 'class'
        | 'event'
        | 'consultation'
        | 'other') || 'appointment',
    duration: serviceProduct?.duration_minutes || 60,
    duration_minutes: serviceProduct?.duration_minutes || 60,
    location_type:
      (serviceProduct?.location_type as 'on_site' | 'online' | 'customer_location' | 'flexible') ||
      'on_site',
    location_address: serviceProduct?.location_address || undefined,
    meeting_url: serviceProduct?.meeting_url || undefined,
    availability_slots: (availabilitySlots || []).map((slot: Record<string, unknown>) => ({
      day: (slot.day_of_week as number) || 0,
      start_time: (slot.start_time as string) || '09:00',
      end_time: (slot.end_time as string) || '17:00',
    })) as ServiceAvailabilitySlot[],
    timezone: serviceProduct?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    requires_staff: serviceProduct?.requires_staff ?? false,
    staff_members: (staffMembers || []).map((staff: Record<string, unknown>) => ({
      id: staff.id as string,
      name: (staff.name as string) || '',
      email: (staff.email as string) || '',
      role: (staff.role as string) || undefined,
      avatar_url: (staff.avatar_url as string) || undefined,
    })) as ServiceStaffMember[],
    max_participants: serviceProduct?.max_participants || 1,
    resources: resourceNames,
    resources_needed: resourceNames,
    pricing_type:
      (serviceProduct?.pricing_type as 'fixed' | 'hourly' | 'per_participant') || 'fixed',
    deposit_required: serviceProduct?.deposit_required || false,
    deposit_amount: serviceProduct?.deposit_amount || undefined,
    deposit_type: (serviceProduct?.deposit_type as 'fixed' | 'percentage') || undefined,
    booking_options: {
      allow_booking_cancellation: serviceProduct?.allow_booking_cancellation ?? true,
      cancellation_deadline_hours: serviceProduct?.cancellation_deadline_hours || 24,
      require_approval: serviceProduct?.require_approval || false,
      buffer_time_before: serviceProduct?.buffer_time_before || 0,
      buffer_time_after: serviceProduct?.buffer_time_after || 0,
      advance_booking_days: serviceProduct?.advance_booking_days || 30,
      max_bookings_per_day: serviceProduct?.max_bookings_per_day ?? undefined,
    },
    affiliate: affiliateSettings
      ? {
          enabled: affiliateSettings.affiliate_enabled || false,
          commission_rate: affiliateSettings.commission_rate || 10,
          commission_type:
            (affiliateSettings.commission_type as 'percentage' | 'fixed') || 'percentage',
          fixed_commission_amount: affiliateSettings.fixed_commission_amount || 0,
          cookie_duration_days: affiliateSettings.cookie_duration_days || 30,
          min_order_amount: affiliateSettings.min_order_amount || 0,
          allow_self_referral: affiliateSettings.allow_self_referral || false,
          require_approval: affiliateSettings.require_approval || false,
          terms_and_conditions: affiliateSettings.terms_and_conditions || '',
        }
      : {
          enabled: false,
          commission_rate: 10,
          commission_type: 'percentage' as const,
          fixed_commission_amount: 0,
          cookie_duration_days: 30,
          min_order_amount: 0,
          allow_self_referral: false,
          require_approval: false,
          terms_and_conditions: '',
        },
    seo: {
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: product.og_image || '',
    },
    faqs: product.faqs || [],
    payment: product.payment_options || {
      payment_type: 'full',
      percentage_rate: 30,
    },
    hide_purchase_count: product.hide_purchase_count || false,
    hide_likes_count: product.hide_likes_count || false,
    hide_recommendations_count: product.hide_recommendations_count || false,
    hide_downloads_count: product.hide_downloads_count || false,
    hide_reviews_count: product.hide_reviews_count || false,
    hide_rating: product.hide_rating || false,
    whatsapp_number: product.whatsapp_number || '',
    whatsapp_enabled: Boolean(product.whatsapp_enabled),
    is_active: product.is_active ?? true,
  };
}

export function asServiceDuplicateForm(
  data: Partial<ServiceProductFormData>
): Partial<ServiceProductFormData> {
  const baseName = (data.name || 'Service').replace(/\s*\(copie\)\s*$/i, '').trim();
  return {
    ...data,
    name: `${baseName} (copie)`,
    slug: '',
    is_active: false,
  };
}
