import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import type { StorePaymentConnection } from '@/types/store-payment-connection';
import {
  getPaymentOrchestrationV2RolloutPercent,
  isPaymentOrchestrationV2Enabled,
  isPaymentOrchestrationV2EnabledForStore,
} from '@/lib/payments/feature-flags';

interface PaymentConnectionsOnboardingChecklistProps {
  storeId: string;
  stripeConnection?: StorePaymentConnection;
  paypalConnection?: StorePaymentConnection;
  geniuspayActive: boolean;
}

function StepRow({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <li className="flex gap-3 items-start">
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" aria-hidden />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
      </div>
    </li>
  );
}

export function PaymentConnectionsOnboardingChecklist({
  storeId,
  stripeConnection,
  paypalConnection,
  geniuspayActive,
}: PaymentConnectionsOnboardingChecklistProps) {
  const stripeActive = stripeConnection?.external_account_status === 'active';
  const paypalActive = paypalConnection?.external_account_status === 'active';
  const v2Enabled = isPaymentOrchestrationV2Enabled();
  const rollout = getPaymentOrchestrationV2RolloutPercent();
  const storeInCanary = isPaymentOrchestrationV2EnabledForStore(storeId);
  const completedCount = [stripeActive, paypalActive, geniuspayActive].filter(Boolean).length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div>
            <CardTitle className="text-lg">Onboarding international</CardTitle>
            <CardDescription>
              {completedCount}/3 rails actifs · durée estimée Stripe/PayPal : 5–10 min chacun
            </CardDescription>
          </div>
          {v2Enabled && rollout < 100 && (
            <Badge variant={storeInCanary ? 'default' : 'secondary'}>
              Canary {rollout} %{' '}
              {storeInCanary ? '(votre boutique incluse)' : '(rollout progressif)'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3 list-none p-0 m-0">
          <StepRow
            done={stripeActive}
            label="Stripe Connect — cartes USD, EUR, GBP"
            detail={
              stripeActive
                ? 'Actif — les acheteurs internationaux peuvent payer par carte.'
                : 'Connectez ou complétez l’onboarding Express Stripe.'
            }
          />
          <StepRow
            done={paypalActive}
            label="PayPal Commerce — PayPal + cartes via PayPal"
            detail={
              paypalActive
                ? 'Actif — encaissement sur votre compte PayPal Business.'
                : 'Requis pour les acheteurs préférant PayPal (US, EU, UK).'
            }
          />
          <StepRow
            done={geniuspayActive}
            label="GeniusPay — mobile money & XOF (Afrique francophone)"
            detail="Inclus avec Emarzona — toujours disponible pour vos clients locaux."
          />
        </ol>

        <p className="text-xs text-muted-foreground">
          Guide vendeur : voir la section « Guide rapide » sur cette page ou{' '}
          <code className="text-xs">docs/USER_GUIDE_PAYMENT_CONNECTIONS.md</code> dans le dépôt.
          {' · '}
          Conformité PCI : aucune carte ne transite par Emarzona (redirect PSP).
        </p>
      </CardContent>
    </Card>
  );
}
