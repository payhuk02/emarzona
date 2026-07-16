import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useVendorAutoPayoutPolicy } from '@/hooks/useVendorAutoPayoutPolicy';
import { formatCurrency } from '@/lib/utils';

export function AutoPayoutTransparencyBanner() {
  const { data: policy } = useVendorAutoPayoutPolicy();

  if (!policy?.enabled) {
    return null;
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Suggestions de retrait (pas de virement automatique)</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          Lorsque votre solde disponible atteint au moins{' '}
          <strong>{formatCurrency(policy.min_amount)}</strong> après{' '}
          <strong>{policy.delay_days} jours</strong> sans retrait, Emarzona peut{' '}
          <strong>créer une demande de retrait en attente</strong> pour vous.
        </p>
        <p>
          Chaque demande reste soumise à <strong>validation et paiement manuels</strong> par
          l&apos;équipe (Mobile Money / virement). Aucun transfert GeniusPay n&apos;est déclenché
          automatiquement depuis cette fonctionnalité.
        </p>
      </AlertDescription>
    </Alert>
  );
}
