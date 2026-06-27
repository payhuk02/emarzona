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

// Bookings — schéma service_bookings (canonical: src/hooks/service/useBookings.ts)
export {
  useServiceBookings,
  useMyBookings as useCustomerBookings,
  useCreateBooking,
  useUpdateBooking,
  useCancelBooking,
} from '@/hooks/service/useBookings';
export type { ServiceBooking as Booking } from '@/hooks/service/useBookings';

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
export type { AlertType, AlertPriority, ServiceAlert, AlertSettings } from './useServiceAlerts';

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
