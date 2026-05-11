/**
 * Service Hooks - Export Index
 * Date: 28 octobre 2025
 * Updated: Audit P1 - Export complet
 */

// Service Products
export {
  useServiceProducts,
  useServiceProduct,
  useCreateServiceProduct,
  useUpdateServiceProduct,
  useDeleteServiceProduct,
  useServiceStats,
  usePopularServices,
  useTopRatedServices,
  type ServiceProduct,
} from './useServiceProducts';

// Bookings
export {
  useServiceBookings,
  useBookingsByDate,
  useMyBookings,
  useCreateBooking,
  useUpdateBooking,
  useCancelBooking,
  useConfirmBooking,
  useCompleteBooking,
  useMarkNoShow,
  useUpcomingBookings,
  useBookingStats,
  type ServiceBooking,
} from './useBookings';

// Availability & Staff
export {
  useAvailabilitySlots,
  useSlotsByDay,
  useCreateAvailabilitySlot,
  useUpdateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useStaffMembers,
  useCreateStaffMember,
  useUpdateStaffMember,
  useDeleteStaffMember,
  useCheckSlotAvailability,
  useAvailableTimeSlots,
  type AvailabilitySlot,
  type StaffMember,
} from './useAvailability';

// Calendar Integrations
export * from './useCalendarIntegrations';

// Recurring Bookings
export * from './useRecurringBookings';

// Resource Conflict Settings
export * from './useResourceConflictSettings';

// Service Booking Validation
export * from './useServiceBookingValidation';

// Service Packages
export * from './useServicePackages';

// Staff Availability Settings
export * from './useStaffAvailabilitySettings';
