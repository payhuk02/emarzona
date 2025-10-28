/**
 * Service Hooks - Export Index
 * Date: 28 octobre 2025
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

