/**
 * Epic 3.3.3 — Analytics prestataire via RPC get_service_analytics_summary
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceAnalyticsDailyPoint {
  date: string;
  total?: number;
  completed?: number;
  revenue?: number;
}

export interface ServiceAnalyticsSummary {
  product_id: string;
  start_date: string;
  end_date: string;
  total_bookings: number;
  completed: number;
  cancelled: number;
  confirmed: number;
  pending: number;
  no_show: number;
  revenue: number;
  average_booking_value: number;
  cancellation_rate: number;
  occupancy_rate: number;
  average_rating: number;
  daily_bookings: ServiceAnalyticsDailyPoint[];
  daily_revenue: ServiceAnalyticsDailyPoint[];
}

export function useServiceAnalyticsSummary(serviceId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['service-analytics-summary', serviceId, startDate, endDate],
    queryFn: async (): Promise<ServiceAnalyticsSummary> => {
      const { data, error } = await supabase.rpc('get_service_analytics_summary', {
        p_product_id: serviceId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data as ServiceAnalyticsSummary;
    },
    enabled: Boolean(serviceId && startDate && endDate),
  });
}
