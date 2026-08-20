import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDeliveryPackages,
  fetchGigExtras,
  fetchServiceBriefFields,
  replaceDeliveryPackages,
  replaceGigExtras,
  updateServiceBriefFields,
  type ServiceBriefField,
  type ServiceDeliveryPackage,
  type ServiceGigExtra,
} from '@/lib/services/service-delivery-commerce';

export function useServiceDeliveryPackages(serviceProductId: string | null | undefined) {
  return useQuery({
    queryKey: ['service-delivery-packages', serviceProductId],
    queryFn: () => fetchDeliveryPackages(serviceProductId!),
    enabled: Boolean(serviceProductId),
  });
}

export function useServiceGigExtras(serviceProductId: string | null | undefined) {
  return useQuery({
    queryKey: ['service-gig-extras', serviceProductId],
    queryFn: () => fetchGigExtras(serviceProductId!),
    enabled: Boolean(serviceProductId),
  });
}

export function useServiceBriefFields(serviceProductId: string | null | undefined) {
  return useQuery({
    queryKey: ['service-brief-fields', serviceProductId],
    queryFn: () => fetchServiceBriefFields(serviceProductId!),
    enabled: Boolean(serviceProductId),
  });
}

export function useReplaceDeliveryPackages(serviceProductId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replaceDeliveryPackages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-delivery-packages', serviceProductId] });
    },
  });
}

export function useReplaceGigExtras(serviceProductId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replaceGigExtras,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-gig-extras', serviceProductId] });
    },
  });
}

export function useUpdateServiceBriefFields(serviceProductId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fields: ServiceBriefField[]) =>
      updateServiceBriefFields(serviceProductId!, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-brief-fields', serviceProductId] });
    },
  });
}

export type { ServiceBriefField, ServiceDeliveryPackage, ServiceGigExtra };
