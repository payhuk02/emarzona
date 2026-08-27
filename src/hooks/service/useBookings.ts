/**
 * Service Bookings Hooks
 * Date: 28 octobre 2025
 *
 * React Query hooks for managing service bookings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  sendBookingNotifications,
  getUserBookingNotificationPreferences,
  GUEST_BOOKING_EMAIL_PREFERENCES,
} from '@/lib/notifications/service-booking-notifications';
import { createServiceRefund } from '@/lib/services/cancellation-policy';
import { createBookingMeeting } from '@/lib/service/create-booking-meeting';
import { resolveServiceBookingEmailJoinUrl } from '@/lib/service/daily-meeting';
import { canCancelServiceBooking } from '@/lib/service/service-booking-cancellation';
import { logger } from '@/lib/logger';

const SERVICE_BOOKING_FIELDS =
  'id, product_id, user_id, provider_id, scheduled_date, scheduled_start_time, scheduled_end_time, timezone, status, staff_member_id, participants_count, meeting_url, meeting_id, meeting_platform, customer_notes, internal_notes, reminder_sent_at, reminder_sent, cancelled_at, cancellation_reason, completed_at, duration_minutes, amount_paid, payment_id, deposit_paid, created_at, updated_at';
const BOOKING_PRODUCT_FIELDS =
  'id, store_id, name, description, price, status, product_type, image_url, created_at, updated_at';
const BOOKING_CUSTOMER_FIELDS = 'id, name, email, phone, user_id, created_at, updated_at';
const BOOKING_STAFF_FIELDS =
  'id, service_product_id, store_id, name, email, phone, role, is_active, created_at, updated_at';
const BOOKING_SERVICE_FIELDS =
  'id, product_id, service_type, duration_minutes, location_type, location_address, meeting_url, timezone, requires_staff, max_participants, pricing_type, deposit_required, deposit_amount, deposit_type, allow_booking_cancellation, cancellation_deadline_hours, require_approval, buffer_time_before, buffer_time_after, max_bookings_per_day, advance_booking_days, total_bookings, total_completed_bookings, total_cancelled_bookings, total_revenue, average_rating, created_at, updated_at';

const MY_BOOKINGS_SELECT = `
  ${SERVICE_BOOKING_FIELDS},
  product:products!product_id(
    ${BOOKING_PRODUCT_FIELDS},
    service:service_products(${BOOKING_SERVICE_FIELDS})
  ),
  staff:service_staff_members(${BOOKING_STAFF_FIELDS})
`;

type MyBookingProductRow = {
  id: string;
  name: string;
  image_url?: string | null;
  service?: Record<string, unknown> | Record<string, unknown>[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type ServiceBookingRow = ServiceBooking & {
  scheduled_date?: string;
  scheduled_start_time?: string;
  amount_paid?: number | null;
  product?: { price?: number | null; name?: string; image_url?: string | null } | null;
};

/** Map DB row (scheduled_*) to UI aliases (booking_date, total_price). */
export function mapServiceBookingRow(row: ServiceBookingRow): ServiceBooking {
  const amountPaid = row.amount_paid != null ? Number(row.amount_paid) : null;
  const productPrice = row.product?.price != null ? Number(row.product.price) : 0;

  return {
    ...row,
    booking_date: row.scheduled_date ?? row.booking_date,
    booking_time: row.scheduled_start_time ?? row.booking_time,
    total_price: amountPaid ?? productPrice,
  };
}

export function mapServiceBookingRows(data: unknown[]): ServiceBooking[] {
  return (data as ServiceBookingRow[]).map(mapServiceBookingRow);
}

/** Flatten nested product.service for customer portal components. */
export function mapMyBookingRows(data: unknown[]): ServiceBooking[] {
  return data.map(row => {
    const booking = row as ServiceBooking & {
      product?: MyBookingProductRow | MyBookingProductRow[] | null;
    };
    const product = firstRelation(booking.product);
    if (!product) return booking;
    const { service, ...productSummary } = product;
    return {
      ...booking,
      product: {
        id: productSummary.id,
        name: productSummary.name,
        image_url: productSummary.image_url,
      },
      service: firstRelation(service) ?? undefined,
    } as ServiceBooking & { service?: Record<string, unknown> };
  });
}

async function notifyBookingParties(args: {
  bookingId: string;
  productId: string;
  userId?: string | null;
  customerId?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  type: 'confirmation' | 'cancellation' | 'reschedule';
  cancellationReason?: string;
  meetingUrl?: string;
  fallbackName?: string;
  fallbackPhone?: string;
}): Promise<void> {
  if (!args.bookingDate || !args.bookingTime) return;

  const [productResult, customerById, customerByUser] = await Promise.all([
    supabase.from('products').select('name').eq('id', args.productId).single(),
    args.customerId
      ? supabase
          .from('customers')
          .select('name, email, phone')
          .eq('id', args.customerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    args.userId
      ? supabase
          .from('customers')
          .select('name, email, phone')
          .eq('user_id', args.userId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const product = productResult.data;
  if (!product) return;

  let customer = customerById.data || customerByUser.data;
  if (!customer?.email) {
    const { data: item } = await supabase
      .from('order_items')
      .select('orders(metadata, customers(name, email, phone))')
      .eq('booking_id', args.bookingId)
      .limit(1)
      .maybeSingle();
    const orderRel = item?.orders as
      | {
          metadata?: { customer_email?: string };
          customers?: { name?: string; email?: string; phone?: string } | null;
        }
      | {
          metadata?: { customer_email?: string };
          customers?: { name?: string; email?: string; phone?: string } | null;
        }[]
      | null;
    const order = Array.isArray(orderRel) ? orderRel[0] : orderRel;
    const fromCustomer = order?.customers;
    const metaEmail = order?.metadata?.customer_email;
    if (fromCustomer?.email || metaEmail) {
      customer = {
        name: fromCustomer?.name || args.fallbackName || 'Client',
        email: fromCustomer?.email || metaEmail || '',
        phone: fromCustomer?.phone || args.fallbackPhone || null,
      };
    }
  }

  const email = customer?.email || '';
  if (!args.userId && !email.includes('@')) return;

  const preferences = args.userId
    ? await getUserBookingNotificationPreferences(args.userId)
    : GUEST_BOOKING_EMAIL_PREFERENCES;

  await sendBookingNotifications(
    args.userId || '',
    preferences,
    {
      booking_id: args.bookingId,
      service_name: product.name,
      customer_name: customer?.name || args.fallbackName || 'Client',
      customer_email: email,
      customer_phone: customer?.phone || args.fallbackPhone,
      booking_date: args.bookingDate,
      booking_time: args.bookingTime,
      cancellation_reason: args.cancellationReason,
      meeting_url: args.meetingUrl,
    },
    args.type,
    args.userId ? undefined : ['email', 'sms']
  );
}

export interface ServiceBooking {
  id: string;
  product_id: string;
  customer_id?: string;
  user_id?: string;
  booking_date?: string;
  booking_time?: string;
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_price: number;
  staff_member_id?: string;
  participants_count: number;
  deposit_paid: number;
  cancellation_reason?: string;
  meeting_url?: string;
  meeting_id?: string;
  meeting_platform?: string;
  customer_notes?: string;
  internal_notes?: string;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all bookings for a service
 */
export const useServiceBookings = (productId?: string) => {
  return useQuery({
    queryKey: ['service-bookings', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(
          `
          ${SERVICE_BOOKING_FIELDS},
          product:products(${BOOKING_PRODUCT_FIELDS}),
          customer:customers(${BOOKING_CUSTOMER_FIELDS}),
          staff:service_staff_members(${BOOKING_STAFF_FIELDS})
        `
        )
        .eq('product_id', productId!)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      return mapServiceBookingRows(data ?? []);
    },
    enabled: !!productId,
  });
};

/**
 * Get bookings for a specific date
 */
export const useBookingsByDate = (productId: string, date: string) => {
  return useQuery({
    queryKey: ['service-bookings-date', productId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(
          `
          ${SERVICE_BOOKING_FIELDS},
          customer:customers(${BOOKING_CUSTOMER_FIELDS}),
          staff:service_staff_members(${BOOKING_STAFF_FIELDS})
        `
        )
        .eq('product_id', productId)
        .eq('scheduled_date', date)
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      return mapServiceBookingRows(data ?? []);
    },
    enabled: !!productId && !!date,
  });
};

/**
 * Get user's bookings
 */
export const useMyBookings = () => {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('service_bookings')
        .select(MY_BOOKINGS_SELECT)
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true });

      if (error) {
        logger.error('Failed to load my bookings', { error: error.message, code: error.code });
        throw error;
      }
      return mapMyBookingRows(data ?? []);
    },
  });
};

/**
 * Create a new booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ServiceBooking>) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // 🆕 Envoyer les notifications et planifier les rappels
      const bookingDate = data.scheduled_date ?? data.booking_date;
      const bookingTime = data.scheduled_start_time ?? data.booking_time;

      if (result && bookingDate && bookingTime) {
        try {
          await notifyBookingParties({
            bookingId: result.id,
            productId: result.product_id,
            userId: result.user_id,
            customerId: result.customer_id,
            bookingDate,
            bookingTime,
            type: 'confirmation',
          });
        } catch (notificationError) {
          logger.warn('Error sending booking notifications', {
            error: notificationError,
            bookingId: result.id,
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Update a booking
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceBooking> }) => {
      const { data: before } = await supabase
        .from('service_bookings')
        .select(
          'id, product_id, user_id, customer_id, scheduled_date, scheduled_start_time, booking_date, booking_time'
        )
        .eq('id', id)
        .maybeSingle();

      const { data: result, error } = await supabase
        .from('service_bookings')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const scheduleChanged =
        before &&
        ((data.scheduled_date && data.scheduled_date !== before.scheduled_date) ||
          (data.scheduled_start_time &&
            data.scheduled_start_time !== before.scheduled_start_time) ||
          (data.booking_date && data.booking_date !== before.booking_date) ||
          (data.booking_time && data.booking_time !== before.booking_time));

      if (result && scheduleChanged) {
        try {
          await notifyBookingParties({
            bookingId: result.id,
            productId: result.product_id,
            userId: result.user_id,
            customerId: result.customer_id,
            bookingDate: result.scheduled_date || result.booking_date,
            bookingTime: result.scheduled_start_time || result.booking_time,
            type: 'reschedule',
          });
        } catch (notificationError) {
          logger.warn('Error sending reschedule notification', {
            error: notificationError,
            bookingId: id,
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Cancel a booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      bypassPolicy = false,
    }: {
      id: string;
      reason?: string;
      /** Vendeur / admin : ignore allow_booking_cancellation client */
      bypassPolicy?: boolean;
    }) => {
      const { data: existing, error: loadError } = await supabase
        .from('service_bookings')
        .select(
          `
          id, product_id, status, scheduled_date, scheduled_start_time, booking_date, booking_time,
          product:products!product_id(
            id,
            service:service_products(allow_booking_cancellation, cancellation_deadline_hours)
          )
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (loadError) throw loadError;
      if (!existing) throw new Error('Réservation introuvable');

      if (!bypassPolicy) {
        const product = Array.isArray(existing.product) ? existing.product[0] : existing.product;
        const serviceRaw =
          product && typeof product === 'object'
            ? (product as { service?: unknown }).service
            : null;
        const service = Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw;
        const eligibility = canCancelServiceBooking(
          {
            status: existing.status,
            scheduled_date: existing.scheduled_date,
            scheduled_start_time: existing.scheduled_start_time,
            booking_date: existing.booking_date,
            booking_time: existing.booking_time,
          },
          (service as {
            allow_booking_cancellation?: boolean;
            cancellation_deadline_hours?: number;
          } | null) ?? null
        );

        if (!eligibility.allowed) {
          throw new Error(eligibility.reason || 'Annulation impossible');
        }
      }

      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 🆕 Envoyer la notification d'annulation et créer le remboursement
      if (result) {
        try {
          const { data: userProfile } = result.user_id
            ? await supabase
                .from('profiles')
                .select('display_name, first_name, last_name, phone')
                .eq('user_id', result.user_id)
                .maybeSingle()
            : { data: null };

          const fullName =
            userProfile?.display_name ||
            [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') ||
            undefined;

          await notifyBookingParties({
            bookingId: result.id,
            productId: result.product_id,
            userId: result.user_id,
            customerId: result.customer_id,
            bookingDate: result.scheduled_date || result.booking_date,
            bookingTime: result.scheduled_start_time || result.booking_time,
            type: 'cancellation',
            cancellationReason: reason,
            fallbackName: fullName,
            fallbackPhone: userProfile?.phone || undefined,
          });

          try {
            await createServiceRefund(result.id, 'original_payment', reason, false);
          } catch (refundError) {
            logger.warn('Error creating automatic refund', {
              error: refundError,
              bookingId: result.id,
            });
          }
        } catch (notificationError) {
          logger.warn('Error sending cancellation notification', {
            error: notificationError,
            bookingId: id,
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Confirm a booking
 */
export const useConfirmBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({ status: 'confirmed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Epic 3.3.5 — créer Zoom/Meet pour services en ligne
      if (result) {
        try {
          const { data: serviceRow } = await supabase
            .from('service_products')
            .select('location_type, preferred_meeting_platform')
            .eq('product_id', result.product_id)
            .maybeSingle();

          if (serviceRow?.location_type === 'online' && !result.meeting_url) {
            await createBookingMeeting(result.id);
          }
        } catch (meetingError) {
          logger.warn('Auto meeting creation on confirm failed', {
            bookingId: id,
            error: meetingError,
          });
        }
      }

      // 🆕 Envoyer la notification de confirmation
      if (result) {
        try {
          const [userProfileResult, meetingResult] = await Promise.all([
            result.user_id
              ? supabase
                  .from('profiles')
                  .select('display_name, first_name, last_name, phone')
                  .eq('user_id', result.user_id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
            supabase
              .from('service_bookings')
              .select('meeting_url, meeting_platform')
              .eq('id', result.id)
              .maybeSingle(),
          ]);

          const userProfile = userProfileResult.data;
          const fullName =
            userProfile?.display_name ||
            [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') ||
            undefined;
          const portal =
            typeof window !== 'undefined'
              ? `${window.location.origin}/account/bookings`
              : '/account/bookings';
          const meetingUrl = resolveServiceBookingEmailJoinUrl({
            meetingUrl: meetingResult.data?.meeting_url,
            meetingPlatform: meetingResult.data?.meeting_platform,
            portalUrl: portal,
          });

          await notifyBookingParties({
            bookingId: result.id,
            productId: result.product_id,
            userId: result.user_id,
            customerId: result.customer_id,
            bookingDate: result.scheduled_date || result.booking_date,
            bookingTime: result.scheduled_start_time || result.booking_time,
            type: 'confirmation',
            meetingUrl,
            fallbackName: fullName,
            fallbackPhone: userProfile?.phone || undefined,
          });
        } catch (notificationError) {
          logger.warn('Error sending confirmation notification', {
            error: notificationError,
            bookingId: id,
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Complete a booking
 */
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
    },
  });
};

/**
 * Mark as no-show
 */
export const useMarkNoShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({ status: 'no_show' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
    },
  });
};

/**
 * Get upcoming bookings
 */
export const useUpcomingBookings = (productId?: string) => {
  return useQuery({
    queryKey: ['upcoming-bookings', productId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('service_bookings')
        .select(
          `
          ${SERVICE_BOOKING_FIELDS},
          product:products(${BOOKING_PRODUCT_FIELDS}),
          customer:customers(${BOOKING_CUSTOMER_FIELDS}),
          staff:service_staff_members(${BOOKING_STAFF_FIELDS})
        `
        )
        .gte('scheduled_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true })
        .limit(10);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return mapServiceBookingRows(data ?? []);
    },
  });
};

function resolveBookingRevenue(
  booking: {
    id: string;
    amount_paid?: number | null;
    product?: { price?: number | null } | null;
  },
  orderRevenueByBooking: Record<string, number>
): number {
  const fromOrder = orderRevenueByBooking[booking.id];
  if (fromOrder != null) return fromOrder;
  if (booking.amount_paid != null) return Number(booking.amount_paid);
  return Number(booking.product?.price ?? 0);
}

/**
 * Get booking statistics
 */
export const useBookingStats = (productId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['booking-stats', productId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('service_bookings')
        .select(
          `
          id,
          status,
          scheduled_date,
          amount_paid,
          product:products(price)
        `
        )
        .eq('product_id', productId);

      if (startDate) {
        query = query.gte('scheduled_date', startDate);
      }
      if (endDate) {
        query = query.lte('scheduled_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const bookings = data ?? [];
      const completedIds = bookings.filter(b => b.status === 'completed').map(b => b.id);
      const orderRevenueByBooking: Record<string, number> = {};

      if (completedIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('booking_id, total_price, orders!inner(payment_status)')
          .in('booking_id', completedIds)
          .eq('orders.payment_status', 'paid');

        for (const item of orderItems ?? []) {
          if (item.booking_id && item.total_price != null) {
            orderRevenueByBooking[item.booking_id] = Number(item.total_price);
          }
        }
      }

      const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        noShow: bookings.filter(b => b.status === 'no_show').length,
        revenue: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + resolveBookingRevenue(b, orderRevenueByBooking), 0),
      };

      return stats;
    },
    enabled: !!productId,
  });
};
