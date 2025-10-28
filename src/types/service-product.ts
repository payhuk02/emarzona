/**
 * Service Product Types
 * Date: 28 octobre 2025
 */

export interface ServiceAvailabilitySlot {
  day: number; // 0-6 (Sunday-Saturday)
  start_time: string; // 'HH:MM'
  end_time: string; // 'HH:MM'
}

export interface ServiceStaffMember {
  id?: string;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  availability?: ServiceAvailabilitySlot[];
}

export interface ServiceBookingOptions {
  allow_booking_cancellation: boolean;
  cancellation_deadline_hours: number; // Hours before appointment
  require_approval: boolean;
  buffer_time_before: number; // Minutes
  buffer_time_after: number; // Minutes
  max_bookings_per_day?: number;
  advance_booking_days: number; // How far in advance can book
}

export interface ServiceProductFormData {
  // Basic Info (Step 1)
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  tags: string[];
  images: string[];
  
  // Duration & Availability (Step 2)
  service_type: 'appointment' | 'class' | 'event' | 'consultation' | 'other';
  duration_minutes: number;
  location_type: 'on_site' | 'online' | 'customer_location' | 'flexible';
  location_address?: string;
  meeting_url?: string;
  
  // Availability
  availability_slots: ServiceAvailabilitySlot[];
  timezone: string;
  
  // Staff & Resources (Step 3)
  requires_staff: boolean;
  staff_members: ServiceStaffMember[];
  max_participants: number; // 1 for individual, >1 for group
  resources_needed?: string[];
  
  // Pricing & Options (Step 4)
  pricing_type: 'fixed' | 'hourly' | 'per_participant';
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_type?: 'fixed' | 'percentage';
  
  // Booking Options
  booking_options: ServiceBookingOptions;
  
  // Meta
  is_active: boolean;
}

