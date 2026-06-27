/**
 * Bouton réclamation Protect sur une commande payée.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck } from 'lucide-react';
import { useEmarzonaProtectStatus } from '@/hooks/trust/useEmarzonaProtect';
import { EmarzonaProtectBadge } from '@/components/trust/EmarzonaProtectBadge';
import { protectStatusLabel } from '@/lib/trust/emarzona-protect-policy';

interface OrderProtectClaimButtonProps {
  orderId: string;
  paymentStatus: string;
}

export function OrderProtectClaimButton({ orderId, paymentStatus }: OrderProtectClaimButtonProps) {
  const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed';
  const { data: status, isLoading } = useEmarzonaProtectStatus(isPaid ? orderId : null);

  if (!isPaid) return null;

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!status || status.status === 'none' || status.status === 'ineligible') {
    return null;
  }

  return (
    <div className="space-y-2 w-full">
      <EmarzonaProtectBadge status={status} compact />
      {status.canClaim ? (
        <Button variant="outline" className="w-full" asChild>
          <Link to={`/disputes/create?orderId=${orderId}`}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Ouvrir une réclamation Protect
          </Link>
        </Button>
      ) : status.disputeId ? (
        <Button variant="outline" className="w-full" asChild>
          <Link to={`/disputes/${status.disputeId}`}>Voir le litige Protect</Link>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">{protectStatusLabel(status.status)}</p>
      )}
    </div>
  );
}
