/**
 * Indicateurs des moyens MoneyFusion au checkout.
 * L’API payin MF ne liste pas les opérateurs : le choix se fait sur la page hébergée MF.
 * Observé sur payin.moneyfusion.net (août 2026) : Mobile Money + crypto — pas de Visa/Mastercard
 * malgré le marketing MF. Les opérateurs varient selon le préfixe pays du numéro.
 */

import { Badge } from '@/components/ui/badge';
import { Wallet } from '@/components/icons';

const MONEYFUSION_CHECKOUT_METHODS = [
  { id: 'orange', label: 'Orange Money', kind: 'mobile' as const },
  { id: 'mtn', label: 'MTN MoMo', kind: 'mobile' as const },
  { id: 'moov', label: 'Moov Money', kind: 'mobile' as const },
  { id: 'wave', label: 'Wave', kind: 'mobile' as const },
  { id: 'crypto', label: 'Cryptomonnaie', kind: 'crypto' as const },
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
            <Wallet className="h-3 w-3" aria-hidden />
            {method.label}
          </Badge>
        ))}
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground mt-2">
          Les opérateurs disponibles dépendent du pays du numéro. La carte bancaire n&apos;est pas
          proposée sur la page MoneyFusion — utilisez Stripe pour Visa / Mastercard.
        </p>
      )}
    </div>
  );
}

export { MONEYFUSION_CHECKOUT_METHODS };
