/**
 * Services Hooks - Export Index
 * Date: 29 Octobre 2025
 */

// Services CRUD
export {
  useServices,
  useService,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useBulkUpdateServices,
} from './useServices';

// Bookings CRUD & Availability
export {
  useServiceBookings,
  useCustomerBookings,
  useBooking,
  useCreateBooking,
  useUpdateBooking,
  useCancelBooking,
  useCheckAvailability,
} from './useBookings';
export type { Booking, AvailabilitySlot } from './useBookings';

// Alerts & Notifications
export {
  useServiceAlerts,
  useUnreadAlertsCount,
  useMarkAlertAsRead,
  useMarkAllAlertsAsRead,
  useDeleteAlert,
  useClearOldAlerts,
  useAlertSettings,
  useUpdateAlertSettings,
  useCreateAlert,
  useCheckLowCapacity,
  useCheckUpcomingBookings,
} from './useServiceAlerts';
export type {
  AlertType,
  AlertPriority,
  ServiceAlert,
  AlertSettings,
} from './useServiceAlerts';

// Reports & Analytics
export {
  useBookingReport,
  useRevenueReport,
  useStaffReport,
  useCapacityReport,
  useCompleteReport,
} from './useServiceReports';
export type {
  ReportDateRange,
  BookingReport,
  RevenueReport,
  StaffReport,
  CapacityReport,
} from './useServiceReports';

