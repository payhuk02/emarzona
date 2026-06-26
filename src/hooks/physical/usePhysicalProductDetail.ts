import { useQuery } from '@tanstack/react-query';
import {
  fetchPhysicalProductDetail,
  type PhysicalProductDetailData,
} from '@/lib/physical/fetch-physical-product-detail';

export function usePhysicalProductDetail(productId: string | undefined) {
  return useQuery({
    queryKey: ['physical-product', productId],
    queryFn: () => fetchPhysicalProductDetail(productId!),
    enabled: Boolean(productId),
  });
}

export type { PhysicalProductDetailData };
