import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, ExternalLink, RefreshCw } from 'lucide-react';
import type { StorePaymentConnection } from '@/types/store-payment-connection';

const STATUS_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: 'Actif', variant: 'default' },
  pending: { label: 'En attente', variant: 'secondary' },
  restricted: { label: 'Action requise', variant: 'destructive' },
  disabled: { label: 'Désactivé', variant: 'outline' },
  revoked: { label: 'Révoqué', variant: 'outline' },
};

interface StripeConnectCardProps {
  connection?: StorePaymentConnection;
  isConnecting: boolean;
  isSyncing: boolean;
  onConnect: () => void;
  onSync: () => void;
}

export function StripeConnectCard({
  connection,
  isConnecting,
  isSyncing,
  onConnect,
  onSync,
}: StripeConnectCardProps) {
  const status = connection?.external_account_status ?? 'pending';
  const statusMeta = STATUS_LABELS[status] ?? STATUS_LABELS.pending;
  const isActive = status === 'active';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#635bff]/10">
              <CreditCard className="h-5 w-5 text-[#635bff]" />
            </div>
            <div>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>
                Acceptez les cartes internationales (USD, EUR, GBP…) — fonds sur votre compte
                Stripe.
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection?.external_account_id && (
          <p className="text-sm text-muted-foreground font-mono truncate">
            Compte : {connection.external_account_id}
          </p>
        )}

        {status === 'restricted' && (
          <Alert>
            <AlertDescription>
              Stripe demande des informations supplémentaires. Reprenez l&apos;onboarding pour
              activer les paiements.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {!isActive ? (
            <Button onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection…
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {connection ? 'Compléter Stripe' : 'Connecter Stripe'}
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" onClick={onSync} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Actualiser le statut
            </Button>
          )}

          {connection && !isActive && (
            <Button variant="outline" onClick={onSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier le statut'}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Commission plateforme Emarzona prélevée automatiquement sur chaque vente (voir paramètres
          admin). Conforme PCI : aucune carte ne transite par Emarzona.
        </p>
      </CardContent>
    </Card>
  );
}
