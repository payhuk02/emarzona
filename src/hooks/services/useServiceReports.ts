/**
 * useServiceReports Hook
 * 
 * Generate various reports: bookings, revenue, staff performance, capacity
 * Date: 29 Octobre 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Date range for reports
 */
export interface ReportDateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Booking report data
 */
export interface BookingReport {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  bookingsByStatus: Record<string, number>;
  bookingsByDay: { date: string; count: number }[];
  averageBookingsPerDay: number;
  peakDay: { date: string; count: number } | null;
}

/**
 * Revenue report data
 */
export interface RevenueReport {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  refundedRevenue: number;
  revenueByDay: { date: string; amount: number }[];
  revenueByService: { serviceId: string; serviceName: string; amount: number }[];
  averageRevenuePerBooking: number;
  topService: { id: string; name: string; revenue: number } | null;
}

/**
 * Staff performance report
 */
export interface StaffReport {
  staffId: string;
  staffName: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating?: number;
  utilizationRate: number; // percentage
}

/**
 * Capacity report
 */
export interface CapacityReport {
  serviceId: string;
  serviceName: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  utilizationRate: number; // percentage
  peakUtilization: { date: string; rate: number } | null;
}

/**
 * Generate booking report
 */
export const useBookingReport = (storeId: string, dateRange: ReportDateRange) => {
  return useQuery({
    queryKey: ['report', 'bookings', storeId, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, service:services!inner(store_id)')
        .eq('service.store_id', storeId)
        .gte('scheduled_date', new Date(dateRange.start).toISOString())
        .lte('scheduled_date', new Date(dateRange.end).toISOString());

      if (error) throw error;

      // Calculate metrics
      const totalBookings = bookings?.length || 0;
      const confirmedBookings = bookings?.filter((b) => b.status === 'confirmed').length || 0;
      const completedBookings = bookings?.filter((b) => b.status === 'completed').length || 0;
      const cancelledBookings = bookings?.filter((b) => b.status === 'cancelled').length || 0;
      const noShowBookings = bookings?.filter((b) => b.status === 'no_show').length || 0;

      // Bookings by status
      const bookingsByStatus = (bookings || []).reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Bookings by day
      const bookingsByDay = (bookings || []).reduce((acc, booking) => {
        const date = new Date(booking.scheduled_date).toISOString().split('T')[0];
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[]);

      bookingsByDay.sort((a, b) => a.date.localeCompare(b.date));

      // Peak day
      const peakDay = bookingsByDay.length > 0
        ? bookingsByDay.reduce((max, day) => (day.count > max.count ? day : max))
        : null;

      // Average bookings per day
      const days = Math.ceil(
        (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const averageBookingsPerDay = days > 0 ? totalBookings / days : 0;

      return {
        totalBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        bookingsByStatus,
        bookingsByDay,
        averageBookingsPerDay,
        peakDay,
      } as BookingReport;
    },
    enabled: !!storeId && !!dateRange.start && !!dateRange.end,
  });
};

/**
 * Generate revenue report
 */
export const useRevenueReport = (storeId: string, dateRange: ReportDateRange) => {
  return useQuery({
    queryKey: ['report', 'revenue', storeId, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, service:services!inner(store_id, name, price)')
        .eq('service.store_id', storeId)
        .gte('scheduled_date', new Date(dateRange.start).toISOString())
        .lte('scheduled_date', new Date(dateRange.end).toISOString());

      if (error) throw error;

      // Calculate total revenue
      const totalRevenue = (bookings || []).reduce(
        (sum, b) => sum + (b.service?.price || 0),
        0
      );

      const paidRevenue = (bookings || [])
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (b.amount_paid || b.service?.price || 0), 0);

      const pendingRevenue = (bookings || [])
        .filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status))
        .reduce((sum, b) => sum + (b.service?.price || 0), 0);

      const refundedRevenue = (bookings || [])
        .filter((b) => b.status === 'refunded')
        .reduce((sum, b) => sum + (b.amount_paid || b.service?.price || 0), 0);

      // Revenue by day
      const revenueByDay = (bookings || []).reduce((acc, booking) => {
        const date = new Date(booking.scheduled_date).toISOString().split('T')[0];
        const amount = booking.service?.price || 0;
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.amount += amount;
        } else {
          acc.push({ date, amount });
        }
        return acc;
      }, [] as { date: string; amount: number }[]);

      revenueByDay.sort((a, b) => a.date.localeCompare(b.date));

      // Revenue by service
      const revenueByService = (bookings || []).reduce((acc, booking) => {
        if (!booking.service) return acc;
        
        const existing = acc.find((item) => item.serviceId === booking.service_id);
        if (existing) {
          existing.amount += booking.service.price || 0;
        } else {
          acc.push({
            serviceId: booking.service_id,
            serviceName: booking.service.name,
            amount: booking.service.price || 0,
          });
        }
        return acc;
      }, [] as { serviceId: string; serviceName: string; amount: number }[]);

      revenueByService.sort((a, b) => b.amount - a.amount);

      // Top service
      const topService = revenueByService.length > 0
        ? { id: revenueByService[0].serviceId, name: revenueByService[0].serviceName, revenue: revenueByService[0].amount }
        : null;

      // Average revenue per booking
      const averageRevenuePerBooking = bookings && bookings.length > 0
        ? totalRevenue / bookings.length
        : 0;

      return {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        refundedRevenue,
        revenueByDay,
        revenueByService,
        averageRevenuePerBooking,
        topService,
      } as RevenueReport;
    },
    enabled: !!storeId && !!dateRange.start && !!dateRange.end,
  });
};

/**
 * Generate staff performance report
 */
export const useStaffReport = (storeId: string, dateRange: ReportDateRange) => {
  return useQuery({
    queryKey: ['report', 'staff', storeId, dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, service:services!inner(store_id, name, price, assigned_staff)')
        .eq('service.store_id', storeId)
        .gte('scheduled_date', new Date(dateRange.start).toISOString())
        .lte('scheduled_date', new Date(dateRange.end).toISOString());

      if (error) throw error;

      // Group by staff
      const staffMap = new Map<string, StaffReport>();

      (bookings || []).forEach((booking) => {
        const staffMembers = booking.service?.assigned_staff || [];
        
        staffMembers.forEach((staffName: string) => {
          if (!staffMap.has(staffName)) {
            staffMap.set(staffName, {
              staffId: staffName,
              staffName,
              totalBookings: 0,
              completedBookings: 0,
              cancelledBookings: 0,
              totalRevenue: 0,
              utilizationRate: 0,
            });
          }

          const staff = staffMap.get(staffName)!;
          staff.totalBookings++;
          
          if (booking.status === 'completed') {
            staff.completedBookings++;
            staff.totalRevenue += booking.service?.price || 0;
          } else if (booking.status === 'cancelled') {
            staff.cancelledBookings++;
          }
        });
      });

      // Calculate utilization rates
      const staffReports = Array.from(staffMap.values()).map((staff) => {
        const utilizationRate = staff.totalBookings > 0
          ? (staff.completedBookings / staff.totalBookings) * 100
          : 0;

        return {
          ...staff,
          utilizationRate,
        };
      });

      staffReports.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return staffReports;
    },
    enabled: !!storeId && !!dateRange.start && !!dateRange.end,
  });
};

/**
 * Generate capacity report
 */
export const useCapacityReport = (storeId: string, dateRange: ReportDateRange) => {
  return useQuery({
    queryKey: ['report', 'capacity', storeId, dateRange],
    queryFn: async () => {
      // Fetch all services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, total_slots')
        .eq('store_id', storeId);

      if (servicesError) throw servicesError;

      const capacityReports: CapacityReport[] = [];

      for (const service of services || []) {
        // Count bookings for this service in the date range
        const { count, error: countError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', service.id)
          .gte('scheduled_date', new Date(dateRange.start).toISOString())
          .lte('scheduled_date', new Date(dateRange.end).toISOString())
          .neq('status', 'cancelled');

        if (countError) continue;

        const totalSlots = service.total_slots || 0;
        const bookedSlots = count || 0;
        const availableSlots = Math.max(0, totalSlots - bookedSlots);
        const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

        // TODO: Get peak utilization by day (requires more complex query)
        const peakUtilization = null;

        capacityReports.push({
          serviceId: service.id,
          serviceName: service.name,
          totalSlots,
          bookedSlots,
          availableSlots,
          utilizationRate,
          peakUtilization,
        });
      }

      capacityReports.sort((a, b) => b.utilizationRate - a.utilizationRate);

      return capacityReports;
    },
    enabled: !!storeId && !!dateRange.start && !!dateRange.end,
  });
};

/**
 * Generate complete analytics report (all metrics combined)
 */
export const useCompleteReport = (storeId: string, dateRange: ReportDateRange) => {
  const bookingReport = useBookingReport(storeId, dateRange);
  const revenueReport = useRevenueReport(storeId, dateRange);
  const staffReport = useStaffReport(storeId, dateRange);
  const capacityReport = useCapacityReport(storeId, dateRange);

  return {
    bookings: bookingReport.data,
    revenue: revenueReport.data,
    staff: staffReport.data,
    capacity: capacityReport.data,
    isLoading:
      bookingReport.isLoading ||
      revenueReport.isLoading ||
      staffReport.isLoading ||
      capacityReport.isLoading,
    isError:
      bookingReport.isError ||
      revenueReport.isError ||
      staffReport.isError ||
      capacityReport.isError,
  };
};

export default useBookingReport;

