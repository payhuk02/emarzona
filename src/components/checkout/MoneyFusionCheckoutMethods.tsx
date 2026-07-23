/**
 * Indicateurs des moyens MoneyFusion au checkout.
 * L’API payin MF ne liste pas les opérateurs : le choix se fait sur la page hébergée MF.
 * On affiche ici les moyens supportés (info acheteur) avant redirection.
 */

import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard } from '@/components/icons';

const MONEYFUSION_CHECKOUT_METHODS = [
  { id: 'orange', label: 'Orange Money', kind: 'mobile' as const },
  { id: 'mtn', label: 'MTN MoMo', kind: 'mobile' as const },
  { id: 'moov', label: 'Moov Money', kind: 'mobile' as const },
  { id: 'wave', label: 'Wave', kind: 'mobile' as const },
  { id: 'card', label: 'Carte bancaire', kind: 'card' as const },
];

export function MoneyFusionCheckoutMethods({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={className}>
      {!compact && (
        <p className="text-sm text-muted-foreground mb-2">
          Sur la page MoneyFusion vous pourrez payer avec :
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {MONEYFUSION_CHECKOUT_METHODS.map(method => (
          <Badge key={method.id} variant="secondary" className="gap-1 text-xs font-normal">
            {method.kind === 'card' ? (
              <CreditCard className="h-3 w-3" aria-hidden />
            ) : (
              <Wallet className="h-3 w-3" aria-hidden />
            )}
            {method.label}
          </Badge>
        ))}
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground mt-2">
          Les opérateurs disponibles dépendent du pays du numéro et de votre compte MoneyFusion.
        </p>
      )}
    </div>
  );
}

export { MONEYFUSION_CHECKOUT_METHODS };
