/**
 * Indicateurs des moyens MoneyFusion au checkout.
 * L’API payin MF ne liste pas les opérateurs : le choix se fait sur la page hébergée MF.
 */

import { Badge } from '@/components/ui/badge';
import { Wallet } from '@/components/icons';
import { usePaymentRailsConfigPublic } from '@/hooks/admin/usePaymentRailsConfig';
import { isAggregatorEnabled, mergePaymentRailsConfig } from '@/lib/payments/payment-rails-catalog';

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
  const { data: rails } = usePaymentRailsConfigPublic();
  const config = rails ?? mergePaymentRailsConfig(null);

  if (!isAggregatorEnabled(config, 'moneyfusion')) return null;

  const ops = config.moneyfusion?.operators ?? {};
  const logos = config.moneyfusion?.logos ?? {};
  const methods = MONEYFUSION_CHECKOUT_METHODS.filter(m => ops[m.id] !== false);

  if (methods.length === 0) return null;

  return (
    <div className={className}>
      {!compact && (
        <p className="text-sm text-muted-foreground mb-2">
          Sur la page MoneyFusion vous pourrez payer avec :
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {methods.map(method => {
          const logo = logos[method.id];
          return (
            <Badge key={method.id} variant="secondary" className="gap-1.5 text-xs font-normal">
              {logo ? (
                <img src={logo} alt="" className="h-3.5 w-3.5 object-contain rounded-sm" />
              ) : (
                <Wallet className="h-3 w-3" aria-hidden />
              )}
              {method.label}
            </Badge>
          );
        })}
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
