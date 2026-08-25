/**
 * Service Product Types
 * Date: 28 octobre 2025
 */

import type {
  ServiceGigExtraDraft,
  ServiceGigPackageDraft,
} from '@/lib/services/service-gig-package-drafts';
import type { ServiceBriefField } from '@/lib/services/service-delivery-commerce';

export interface ServiceAvailabilitySlot {
  day: number; // 0-6 (Sunday-Saturday)
  day_of_week?: number;
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
  slug?: string;
  description: string;
  short_description?: string;
  price: number;
  promotional_price?: number;
  currency?: string;
  pricing_model?: string;
  compare_at_price: number | null;
  category: string;
  category_id: string | null;
  parent_category_id?: string | null;
  fulfillment_mode?: 'appointment' | 'project' | 'both';
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

  // Statistics Display Settings
  hide_purchase_count?: boolean;
  hide_likes_count?: boolean;
  hide_recommendations_count?: boolean;
  hide_downloads_count?: boolean;
  hide_reviews_count?: boolean;
  hide_rating?: boolean;

  whatsapp_number?: string;
  whatsapp_enabled?: boolean;

  category_attributes?: Record<string, string | number | boolean | string[]>;
  delivery_packages?: ServiceGigPackageDraft[];
  gig_extras?: ServiceGigExtraDraft[];
  brief_fields?: ServiceBriefField[];

  // Meta
  is_active: boolean;
}
