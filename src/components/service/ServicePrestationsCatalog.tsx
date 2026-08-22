/**
 * Read-only packages + extras on the public service product page.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type {
  ServiceDeliveryPackage,
  ServiceGigExtra,
} from '@/lib/services/service-delivery-commerce';

interface ServicePrestationsCatalogProps {
  packages: ServiceDeliveryPackage[];
  extras: ServiceGigExtra[];
  currency?: string;
  isLoading?: boolean;
}

export function ServicePrestationsCatalog({
  packages,
  extras,
  currency = 'XOF',
  isLoading = false,
}: ServicePrestationsCatalogProps) {
  const activePackages = packages.filter(pkg => pkg.is_active);
  const activeExtras = extras.filter(extra => extra.is_active);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base md:text-lg">Tarifs & prestations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement des formules…</p>
        </CardContent>
      </Card>
    );
  }

  if (activePackages.length === 0 && activeExtras.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base md:text-lg">Tarifs & prestations</CardTitle>
        <CardDescription>
          Formules et options configurables. Choisissez une formule dans le panneau de commande pour
          personnaliser le devis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activePackages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activePackages.map(pkg => (
              <div key={pkg.id} className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{pkg.name}</p>
                  {pkg.is_featured && <Badge>Populaire</Badge>}
                </div>
                <p className="text-lg font-bold">{formatCurrency(pkg.price, currency)}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {pkg.delivery_days} j
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> {pkg.revisions} rév.
                  </span>
                </div>
                {pkg.description && (
                  <p className="text-xs text-muted-foreground">{pkg.description}</p>
                )}
                {pkg.features.length > 0 && (
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 6).map(feat => (
                      <li key={feat} className="text-xs flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {activeExtras.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Options supplémentaires</p>
            <ul className="space-y-2">
              {activeExtras.map(extra => (
                <li
                  key={extra.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{extra.name}</p>
                    {extra.description && (
                      <p className="text-xs text-muted-foreground">{extra.description}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap">
                    +{formatCurrency(extra.price, extra.currency || currency)}
                    {extra.extra_days > 0 ? ` · +${extra.extra_days} j` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
