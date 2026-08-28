import { useQuery } from '@tanstack/react-query';
import {
  fetchServiceOrderMilestones,
  type ServiceOrderMilestoneRow,
} from '@/lib/payments/service-order-milestone-flow';

export function useServiceOrderMilestones(orderId?: string | null) {
  return useQuery<ServiceOrderMilestoneRow[]>({
    queryKey: ['service-order-milestones', orderId],
    enabled: Boolean(orderId),
    queryFn: () => fetchServiceOrderMilestones(orderId!),
  });
}
