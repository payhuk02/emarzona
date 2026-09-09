/**
 * Admin — Agrégateurs & opérateurs de paiement (+ logos)
 */
import { useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePaymentRailsConfig } from '@/hooks/admin/usePaymentRailsConfig';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import {
  PAYMENT_RAILS_CATALOG,
  type PaymentRailAggregatorId,
} from '@/lib/payments/payment-rails-catalog';
import { AlertCircle, CreditCard, ImagePlus, Info, Loader2, Save, Trash2 } from 'lucide-react';

export default function AdminPaymentRails() {
  const { can } = useCurrentAdminPermissions();
  const {
    config,
    isLoading,
    isError,
    isDirty,
    isSaving,
    uploadingLogoKey,
    setAggregatorEnabled,
    setOperatorEnabled,
    setOperatorLogo,
    uploadOperatorLogo,
    resetLocal,
    save,
  } = usePaymentRailsConfig();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!can('payments.manage')) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vous n’avez pas la permission de gérer les paiements.</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6" aria-hidden />
              Agrégateurs & opérateurs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Activez ou désactivez chaque agrégateur et ses moyens. Uploadez les logos affichés au
              checkout.
            </p>
          </div>
          <div className="flex gap-2">
            {isDirty && (
              <Button type="button" variant="outline" onClick={resetLocal} disabled={isSaving}>
                Annuler
              </Button>
            )}
            <Button type="button" onClick={() => void save()} disabled={!isDirty || isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4 mr-2" aria-hidden />
              )}
              Enregistrer
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Impossible de charger la configuration. Vérifiez que la migration{' '}
              <code className="text-xs">payment_rails</code> est appliquée.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading &&
          PAYMENT_RAILS_CATALOG.map(agg => {
            const aggId = agg.id as PaymentRailAggregatorId;
            const row = config[aggId];
            const enabled = row?.enabled !== false;
            return (
              <Card key={agg.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{agg.label}</CardTitle>
                      <CardDescription>{agg.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={enabled ? 'default' : 'secondary'}>
                        {enabled ? 'Actif' : 'Désactivé'}
                      </Badge>
                      <Switch
                        checked={enabled}
                        onCheckedChange={v => setAggregatorEnabled(aggId, v)}
                        aria-label={`Activer ${agg.label}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agg.adminNote && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">{agg.adminNote}</AlertDescription>
                    </Alert>
                  )}
                  {!enabled && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Cet agrégateur est désactivé : il n’apparaîtra plus sur le checkout.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Opérateurs</p>
                    <ul className="divide-y rounded-lg border">
                      {agg.operators.map(op => {
                        const opOn = row?.operators?.[op.id] !== false;
                        const logoUrl = row?.logos?.[op.id] || null;
                        const uploadKey = `${aggId}:${op.id}`;
                        const isUploading = uploadingLogoKey === uploadKey;
                        return (
                          <li
                            key={op.id}
                            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 shrink-0 rounded-full border bg-muted/40 overflow-hidden flex items-center justify-center">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt=""
                                    className="h-full w-full object-contain p-1"
                                  />
                                ) : (
                                  <ImagePlus
                                    className="h-4 w-4 text-muted-foreground"
                                    aria-hidden
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <Label
                                  htmlFor={`${agg.id}-${op.id}`}
                                  className={!enabled ? 'text-muted-foreground' : undefined}
                                >
                                  {op.label}
                                  {op.countryLabel ? (
                                    <span className="text-muted-foreground font-normal">
                                      {' '}
                                      · {op.countryLabel}
                                    </span>
                                  ) : null}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {op.id} · {op.kind}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  <input
                                    ref={el => {
                                      fileInputs.current[uploadKey] = el;
                                    }}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      e.target.value = '';
                                      if (file) void uploadOperatorLogo(aggId, op.id, file);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    disabled={isUploading || isSaving}
                                    onClick={() => fileInputs.current[uploadKey]?.click()}
                                  >
                                    {isUploading ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <ImagePlus className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    {logoUrl ? 'Changer' : 'Logo'}
                                  </Button>
                                  {logoUrl ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-destructive"
                                      disabled={isUploading || isSaving}
                                      onClick={() => setOperatorLogo(aggId, op.id, null)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Retirer
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <Switch
                              id={`${agg.id}-${op.id}`}
                              checked={opOn}
                              disabled={!enabled}
                              onCheckedChange={v => setOperatorEnabled(aggId, op.id, v)}
                              aria-label={`Activer ${op.label}`}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </AdminLayout>
  );
}
