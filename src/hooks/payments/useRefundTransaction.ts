import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  refundPayment,
  type RefundOptions,
  type RefundResult,
} from '@/lib/payments/refund-payment';

export function useRefundTransaction() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: RefundOptions): Promise<RefundResult> => {
      return refundPayment(options);
    },
    onSuccess: result => {
      if (!result.success) {
        toast({
          title: 'Échec du remboursement',
          description: result.error ?? 'Erreur inconnue',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Remboursement effectué',
        description: result.refund_id
          ? `Réf. ${result.refund_id} — ${result.amount} ${result.currency}`
          : 'La transaction a été remboursée.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
