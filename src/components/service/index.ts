/**
 * Service Components - Export Index
 * Date: 28 octobre 2025
 */

// Service Card
export { ServiceCard, ServicesGrid } from './ServiceCard';

// Booking Card
export { BookingCard, BookingsList } from './BookingCard';

// Time Slot Picker
export { TimeSlotPicker } from './TimeSlotPicker';

// Calendar
export { ServiceCalendar } from './ServiceCalendar';

// Booking Calendar (react-big-calendar)
export { ServiceBookingCalendar } from './ServiceBookingCalendar';
export type { BookingEvent, BookingEventType } from './ServiceBookingCalendar';

// Service Status Indicator (Day 1 - Professional Components)
export { ServiceStatusIndicator } from './ServiceStatusIndicator';
export type { ServiceStatus, ServiceStatusVariant, ServiceStatusIndicatorProps } from './ServiceStatusIndicator';

// Booking Info Display (Day 1 - Professional Components)
export { BookingInfoDisplay } from './BookingInfoDisplay';
export type { 
  BookingStatus, 
  BookingInfoVariant, 
  BookingCustomer, 
  BookingService, 
  BookingLocation,
  BookingInfoDisplayProps 
} from './BookingInfoDisplay';

// Services List (Day 2 - Professional Components)
export { ServicesList } from './ServicesList';
export type { Service, ServicesFilters, ServicesListProps } from './ServicesList';

// Service Package Manager (Day 2 - Professional Components)
export { ServicePackageManager } from './ServicePackageManager';
export type { 
  PackageTier, 
  PackageOption, 
  ServicePackage, 
  ServicePackageManagerProps 
} from './ServicePackageManager';

// Booking History (Day 3 - Professional Components)
export { BookingHistory } from './BookingHistory';
export type { 
  BookingEventType, 
  BookingHistoryEvent, 
  BookingHistoryFilters, 
  BookingHistoryProps 
} from './BookingHistory';

// Bulk Service Update (Day 3 - Professional Components)
export { BulkServiceUpdate } from './BulkServiceUpdate';
export type { 
  BulkUpdateField, 
  BulkUpdateMode, 
  BulkServiceItem, 
  BulkUpdateChanges, 
  BulkServiceUpdateProps 
} from './BulkServiceUpdate';

