/**
 * Bouton remboursement — délègue à refundPayment (multi-PSP)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, RotateCcw } from 'lucide-react';
import { useRefundTransaction } from '@/hooks/payments/useRefundTransaction';
import { getPaymentProviderLabel } from '@/lib/payments/payment-provider-labels';

interface RefundTransactionButtonProps {
  transactionId: string;
  amount: number;
  currency: string;
  paymentProvider?: string | null;
  status: string;
  size?: 'sm' | 'default';
  className?: string;
  onRefunded?: () => void;
}

export function RefundTransactionButton({
  transactionId,
  amount,
  currency,
  paymentProvider,
  status,
  size = 'sm',
  className,
  onRefunded,
}: RefundTransactionButtonProps) {
  const refundMutation = useRefundTransaction();
  const [open, setOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(String(amount));
  const [reason, setReason] = useState('');

  if (status !== 'completed') {
    return null;
  }

  const providerLabel = getPaymentProviderLabel(paymentProvider);

  const handleConfirm = async () => {
    const parsed = parseFloat(refundAmount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    const result = await refundMutation.mutateAsync({
      transactionId,
      amount: parsed,
      reason: reason.trim() || 'Remboursement vendeur',
    });

    if (result.success) {
      setOpen(false);
      onRefunded?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          className={className}
          onClick={e => e.stopPropagation()}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Rembourser
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={e => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer le remboursement</AlertDialogTitle>
          <AlertDialogDescription>
            Le remboursement sera traité via <strong>{providerLabel}</strong>. Cette action est
            irréversible côté PSP.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor={`refund-amount-${transactionId}`}>Montant ({currency})</Label>
            <Input
              id={`refund-amount-${transactionId}`}
              type="number"
              min={0}
              max={amount}
              step="0.01"
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum : {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`refund-reason-${transactionId}`}>Motif (optionnel)</Label>
            <Textarea
              id={`refund-reason-${transactionId}`}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Demande client, retour produit…"
              rows={2}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={refundMutation.isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={refundMutation.isPending}
            onClick={e => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {refundMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement…
              </>
            ) : (
              'Confirmer le remboursement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
