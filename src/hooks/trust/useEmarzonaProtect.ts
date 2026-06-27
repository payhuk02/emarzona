import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmarzonaProtectClaim,
  fetchEmarzonaProtectStatus,
  resolveEmarzonaProtectDispute,
  backfillEmarzonaProtectEnrollments,
} from '@/lib/trust/emarzona-protect-store';
import type { ProtectReasonCode } from '@/lib/trust/emarzona-protect-policy';

export const protectKeys = {
  status: (orderId: string) => ['emarzona-protect', orderId] as const,
};

export function useEmarzonaProtectStatus(orderId: string | null | undefined) {
  return useQuery({
    queryKey: protectKeys.status(orderId ?? ''),
    queryFn: () => fetchEmarzonaProtectStatus(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useCreateEmarzonaProtectClaim(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; description: string; reasonCode: ProtectReasonCode }) =>
      createEmarzonaProtectClaim({
        orderId,
        ...input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: protectKeys.status(orderId) });
    },
  });
}

export function useResolveEmarzonaProtectDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveEmarzonaProtectDispute,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['disputes'] });
      void queryClient.invalidateQueries({ queryKey: ['emarzona-protect'] });
    },
  });
}

export function useBackfillEmarzonaProtect() {
  return useMutation({
    mutationFn: backfillEmarzonaProtectEnrollments,
  });
}
