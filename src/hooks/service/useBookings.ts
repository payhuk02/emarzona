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
  scheduleBookingReminders,
  getUserBookingNotificationPreferences,
} from '@/lib/notifications/service-booking-notifications';
import { createServiceRefund } from '@/lib/services/cancellation-policy';
import { createBookingMeeting } from '@/lib/service/create-booking-meeting';
import { logger } from '@/lib/logger';

const SERVICE_BOOKING_FIELDS =
  'id, product_id, user_id, provider_id, scheduled_date, scheduled_start_time, scheduled_end_time, timezone, status, staff_member_id, participants_count, meeting_url, customer_notes, internal_notes, reminder_sent_at, reminder_sent, cancelled_at, cancellation_reason, completed_at, duration_minutes, amount_paid, payment_id, deposit_paid, created_at, updated_at';
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
  service?: Record<string, unknown> | null;
};

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
    const booking = row as ServiceBooking & { product?: MyBookingProductRow | null };
    const product = booking.product;
    if (!product) return booking;
    const { service, ...productSummary } = product;
    return {
      ...booking,
      product: {
        id: productSummary.id,
        name: productSummary.name,
        image_url: productSummary.image_url,
      },
      service: service ?? undefined,
    } as ServiceBooking & { service?: Record<string, unknown> };
  });
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
          // Récupérer les infos du produit et du client
          const [productResult, customerResult] = await Promise.all([
            supabase.from('products').select('name, store_id').eq('id', result.product_id).single(),
            supabase
              .from('customers')
              .select('name, email, phone')
              .eq('id', result.customer_id)
              .maybeSingle(),
          ]);

          const product = productResult.data;
          const customer = customerResult.data;

          if (product && customer && result.user_id) {
            // Récupérer les préférences
            const preferences = await getUserBookingNotificationPreferences(result.user_id);

            // Envoyer la notification de confirmation
            await sendBookingNotifications(
              result.user_id,
              preferences,
              {
                booking_id: result.id,
                service_name: product.name,
                customer_name: customer.name || 'Client',
                customer_email: customer.email || '',
                customer_phone: customer.phone || undefined,
                booking_date: bookingDate,
                booking_time: bookingTime,
              },
              'confirmation'
            );

            // Planifier les rappels automatiques
            await scheduleBookingReminders(result.id, bookingDate, bookingTime, preferences);
          }
        } catch (notificationError) {
          // Ne pas faire échouer la création si les notifications échouent
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
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
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
          const [productResult, userProfileResult] = await Promise.all([
            supabase.from('products').select('name').eq('id', result.product_id).single(),
            supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', result.user_id)
              .maybeSingle(),
          ]);

          const product = productResult.data;
          const userProfile = userProfileResult.data;

          if (product && result.user_id) {
            const preferences = await getUserBookingNotificationPreferences(result.user_id);

            await sendBookingNotifications(
              result.user_id,
              preferences,
              {
                booking_id: result.id,
                service_name: product.name,
                customer_name: userProfile?.full_name || 'Client',
                customer_email: userProfile?.email || '',
                customer_phone: userProfile?.phone || undefined,
                booking_date: result.scheduled_date || result.booking_date,
                booking_time: result.scheduled_start_time || result.booking_time,
                cancellation_reason: reason,
              },
              'cancellation'
            );

            // 🆕 Créer automatiquement le remboursement selon la politique
            try {
              await createServiceRefund(result.id, 'original_payment', reason, false);
            } catch (refundError) {
              // Ne pas faire échouer l'annulation si le remboursement échoue
              logger.warn('Error creating automatic refund', {
                error: refundError,
                bookingId: result.id,
              });
            }
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
            await createBookingMeeting(
              result.id,
              (serviceRow.preferred_meeting_platform as 'zoom' | 'google_meet' | null) ?? undefined
            );
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
          const [productResult, userProfileResult] = await Promise.all([
            supabase.from('products').select('name').eq('id', result.product_id).single(),
            supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', result.user_id)
              .maybeSingle(),
          ]);

          const product = productResult.data;
          const userProfile = userProfileResult.data;

          if (product && result.user_id) {
            const preferences = await getUserBookingNotificationPreferences(result.user_id);

            await sendBookingNotifications(
              result.user_id,
              preferences,
              {
                booking_id: result.id,
                service_name: product.name,
                customer_name: userProfile?.full_name || 'Client',
                customer_email: userProfile?.email || '',
                customer_phone: userProfile?.phone || undefined,
                booking_date: result.scheduled_date || result.booking_date,
                booking_time: result.scheduled_start_time || result.booking_time,
              },
              'confirmation'
            );
          }
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
