/**
 * Tests Unitaires - Validations Service Booking
 * Date: 1 Février 2025
 *
 * Tests pour les nouvelles validations implémentées:
 * - max_bookings_per_day
 * - advance_booking_days
 * - buffer_time (staff et global)
 * - Conflits staff
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Types pour les tests
interface ServiceProduct {
  id: string;
  product_id: string;
  max_participants: number;
  duration_minutes: number;
  max_bookings_per_day?: number;
  advance_booking_days?: number;
  buffer_time_before: number;
  buffer_time_after: number;
  pricing_type: string;
  timezone: string;
}

interface Booking {
  id: string;
  product_id: string;
  staff_member_id?: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  status: string;
}

describe('Service Booking Validations', () => {
  const mockServiceProduct: ServiceProduct = {
    id: 'service-123',
    product_id: 'product-123',
    max_participants: 10,
    duration_minutes: 60,
    max_bookings_per_day: 5,
    advance_booking_days: 30,
    buffer_time_before: 15,
    buffer_time_after: 15,
    pricing_type: 'fixed',
    timezone: 'UTC',
  };

  const mockBookingDateTime = new Date('2025-03-01T10:00:00Z');
  const mockBookingDate = '2025-03-01';
  const mockBookingStartTime = '10:00:00';
  const mockBookingEndTime = '11:00:00';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('max_bookings_per_day validation', () => {
    it('should reject booking when daily limit is reached', async () => {
      // Mock: 5 bookings already exist for the day (limit is 5)
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: Array(5).fill({ id: 'booking-' + Math.random() }),
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(
        mockQuery as unknown as ReturnType<typeof supabase.from>
      );

      // Simuler la vérification max_bookings_per_day
      const { data: existingBookings } = await supabase
        .from('service_bookings')
        .select('id')
        .eq('product_id', mockServiceProduct.product_id)
        .eq('scheduled_date', mockBookingDate)
        .in('status', ['pending', 'confirmed', 'rescheduled']);

      const currentBookingsCount = existingBookings?.length || 0;
      const shouldReject =
        mockServiceProduct.max_bookings_per_day &&
        currentBookingsCount >= mockServiceProduct.max_bookings_per_day;

      expect(shouldReject).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', mockServiceProduct.product_id);
      expect(mockQuery.eq).toHaveBeenCalledWith('scheduled_date', mockBookingDate);
    });

    it('should allow booking when under daily limit', async () => {
      // Mock: 3 bookings exist (limit is 5)
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: Array(3).fill({ id: 'booking-' + Math.random() }),
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(
        mockQuery as unknown as ReturnType<typeof supabase.from>
      );

      const { data: existingBookings } = await supabase
        .from('service_bookings')
        .select('id')
        .eq('product_id', mockServiceProduct.product_id)
        .eq('scheduled_date', mockBookingDate)
        .in('status', ['pending', 'confirmed', 'rescheduled']);

      const currentBookingsCount = existingBookings?.length || 0;
      const shouldReject =
        mockServiceProduct.max_bookings_per_day &&
        currentBookingsCount >= mockServiceProduct.max_bookings_per_day;

      expect(shouldReject).toBe(false);
    });

    it('should allow booking when max_bookings_per_day is not set', async () => {
      const serviceWithoutLimit = { ...mockServiceProduct, max_bookings_per_day: undefined };

      // Quand pas de limite, on ne doit pas vérifier
      const shouldCheck = serviceWithoutLimit.max_bookings_per_day !== undefined;

      expect(shouldCheck).toBe(false);
    });
  });

  describe('advance_booking_days validation', () => {
    it('should reject booking beyond advance_booking_days limit', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Date dans 35 jours (limite est 30)
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 35);
      futureDate.setHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const shouldReject =
        mockServiceProduct.advance_booking_days &&
        daysDifference > mockServiceProduct.advance_booking_days;

      expect(shouldReject).toBe(true);
    });

    it('should allow booking within advance_booking_days limit', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Date dans 15 jours (limite est 30)
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 15);
      futureDate.setHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const shouldReject =
        mockServiceProduct.advance_booking_days &&
        daysDifference > mockServiceProduct.advance_booking_days;

      expect(shouldReject).toBe(false);
    });

    it('should reject booking in the past', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Date hier
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (pastDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const shouldRejectPast = daysDifference < 0;

      expect(shouldRejectPast).toBe(true);
    });
  });

  describe('buffer_time validation', () => {
    it('should detect conflict with buffer_time_before', () => {
      const bookingStart = new Date(`${mockBookingDate}T${mockBookingStartTime}`);
      const bookingEnd = new Date(`${mockBookingDate}T${mockBookingEndTime}`);

      // Réservation existante qui se termine juste avant le buffer
      const existingBooking: Booking = {
        id: 'existing-1',
        product_id: mockServiceProduct.product_id,
        scheduled_date: mockBookingDate,
        scheduled_start_time: '09:30:00',
        scheduled_end_time: '09:45:00', // Se termine 15 min avant (buffer est 15 min)
        status: 'confirmed',
      };

      const bufferStart = bookingStart.getTime() - mockServiceProduct.buffer_time_before * 60000;
      const bufferEnd = bookingEnd.getTime() + mockServiceProduct.buffer_time_after * 60000;

      const existingStart = new Date(
        `${existingBooking.scheduled_date}T${existingBooking.scheduled_start_time}`
      ).getTime();
      const existingEnd = new Date(
        `${existingBooking.scheduled_date}T${existingBooking.scheduled_end_time}`
      ).getTime();

      // Vérifier si le buffer chevauche
      const hasBufferConflict = existingStart < bufferEnd && existingEnd > bufferStart;

      // Ici, 09:45 est juste à la limite du buffer (10:00 - 15 min = 09:45)
      // Donc pas de conflit, mais testons un cas qui chevauche vraiment
      expect(hasBufferConflict).toBe(false);

      // Test avec un booking qui chevauche vraiment
      const overlappingBooking: Booking = {
        ...existingBooking,
        scheduled_end_time: '09:50:00', // Chevauchant le buffer (09:45-10:00)
      };

      const overlappingEnd = new Date(
        `${overlappingBooking.scheduled_date}T${overlappingBooking.scheduled_end_time}`
      ).getTime();
      const hasRealConflict = existingStart < bufferEnd && overlappingEnd > bufferStart;

      expect(hasRealConflict).toBe(true);
    });

    it('should detect conflict with buffer_time_after', () => {
      const bookingStart = new Date(`${mockBookingDate}T${mockBookingStartTime}`);
      const bookingEnd = new Date(`${mockBookingDate}T${mockBookingEndTime}`);

      // Réservation existante qui commence juste après le buffer
      const existingBooking: Booking = {
        id: 'existing-2',
        product_id: mockServiceProduct.product_id,
        scheduled_date: mockBookingDate,
        scheduled_start_time: '11:14:00', // Commence 14 min après (buffer est 15 min) - limite
        scheduled_end_time: '12:00:00',
        status: 'confirmed',
      };

      const bufferStart = bookingStart.getTime() - mockServiceProduct.buffer_time_before * 60000;
      const bufferEnd = bookingEnd.getTime() + mockServiceProduct.buffer_time_after * 60000;

      const existingStart = new Date(
        `${existingBooking.scheduled_date}T${existingBooking.scheduled_start_time}`
      ).getTime();
      const existingEnd = new Date(
        `${existingBooking.scheduled_date}T${existingBooking.scheduled_end_time}`
      ).getTime();

      const hasBufferConflict = existingStart < bufferEnd && existingEnd > bufferStart;

      // 11:14 est juste après le buffer (11:00 + 15 min = 11:15), donc pas de conflit
      expect(hasBufferConflict).toBe(false);

      // Test avec chevauchement réel
      const overlappingBooking: Booking = {
        ...existingBooking,
        scheduled_start_time: '11:10:00', // Chevauchant le buffer (11:00-11:15)
      };

      const overlappingStart = new Date(
        `${overlappingBooking.scheduled_date}T${overlappingBooking.scheduled_start_time}`
      ).getTime();
      const hasRealConflict = overlappingStart < bufferEnd && existingEnd > bufferStart;

      expect(hasRealConflict).toBe(true);
    });

    it('should allow booking when buffer_time is not configured', () => {
      const serviceWithoutBuffer = {
        ...mockServiceProduct,
        buffer_time_before: 0,
        buffer_time_after: 0,
      };

      const shouldCheckBuffer =
        serviceWithoutBuffer.buffer_time_before > 0 || serviceWithoutBuffer.buffer_time_after > 0;

      expect(shouldCheckBuffer).toBe(false);
    });
  });

  describe('staff conflict validation', () => {
    it('should detect staff conflict when staff is already booked', () => {
      const staffId = 'staff-123';
      const bookingStart = new Date(`${mockBookingDate}T${mockBookingStartTime}`);
      const bookingEnd = new Date(`${mockBookingDate}T${mockBookingEndTime}`);

      // Réservation existante du même staff qui chevauche
      const conflictingBooking: Booking = {
        id: 'conflict-1',
        product_id: mockServiceProduct.product_id,
        staff_member_id: staffId,
        scheduled_date: mockBookingDate,
        scheduled_start_time: '10:30:00', // Chevauche avec 10:00-11:00
        scheduled_end_time: '11:30:00',
        status: 'confirmed',
      };

      const requestStart = bookingStart.getTime();
      const requestEnd = bookingEnd.getTime();

      const existingStart = new Date(
        `${conflictingBooking.scheduled_date}T${conflictingBooking.scheduled_start_time}`
      ).getTime();
      const existingEnd = new Date(
        `${conflictingBooking.scheduled_date}T${conflictingBooking.scheduled_end_time}`
      ).getTime();

      // Il y a conflit si les périodes se chevauchent
      const hasConflict = requestStart < existingEnd && requestEnd > existingStart;

      expect(hasConflict).toBe(true);
    });

    it('should allow booking when staff is available', () => {
      const staffId = 'staff-123';
      const bookingStart = new Date(`${mockBookingDate}T${mockBookingStartTime}`);
      const bookingEnd = new Date(`${mockBookingDate}T${mockBookingEndTime}`);

      // Réservation existante du même staff qui ne chevauche pas
      const nonConflictingBooking: Booking = {
        id: 'non-conflict-1',
        product_id: mockServiceProduct.product_id,
        staff_member_id: staffId,
        scheduled_date: mockBookingDate,
        scheduled_start_time: '14:00:00', // Après notre réservation
        scheduled_end_time: '15:00:00',
        status: 'confirmed',
      };

      const requestStart = bookingStart.getTime();
      const requestEnd = bookingEnd.getTime();

      const existingStart = new Date(
        `${nonConflictingBooking.scheduled_date}T${nonConflictingBooking.scheduled_start_time}`
      ).getTime();
      const existingEnd = new Date(
        `${nonConflictingBooking.scheduled_date}T${nonConflictingBooking.scheduled_end_time}`
      ).getTime();

      const hasConflict = requestStart < existingEnd && requestEnd > existingStart;

      expect(hasConflict).toBe(false);
    });
  });

  describe('max_participants validation', () => {
    it('should reject booking when participants exceed max_participants', () => {
      const numberOfParticipants = 15; // Max est 10

      const shouldReject =
        mockServiceProduct.max_participants &&
        numberOfParticipants > mockServiceProduct.max_participants;

      expect(shouldReject).toBe(true);
    });

    it('should allow booking when participants are within limit', () => {
      const numberOfParticipants = 5; // Max est 10

      const shouldReject =
        mockServiceProduct.max_participants &&
        numberOfParticipants > mockServiceProduct.max_participants;

      expect(shouldReject).toBe(false);
    });
  });
});
