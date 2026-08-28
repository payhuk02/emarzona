/**
 * Read-only packages + extras on the public service product page.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type {
  ServiceDeliveryPackage,
  ServiceGigExtra,
} from '@/lib/services/service-delivery-commerce';
import { ServicePackageComparisonTable } from './ServicePackageComparisonTable';

interface ServicePrestationsCatalogProps {
  packages: ServiceDeliveryPackage[];
  extras: ServiceGigExtra[];
  currency?: string;
  isLoading?: boolean;
  selectedPackageId?: string | null;
  onSelectPackage?: (packageId: string) => void;
}

export function ServicePrestationsCatalog({
  packages,
  extras,
  currency = 'XOF',
  isLoading = false,
  selectedPackageId,
  onSelectPackage,
}: ServicePrestationsCatalogProps) {
  const activePackages = packages.filter(pkg => pkg.is_active);
  const activeExtras = extras.filter(extra => extra.is_active);

  if (isLoading) {
    return (
      <ServicePackageComparisonTable
        packages={packages}
        currency={currency}
        isLoading
        selectedPackageId={selectedPackageId}
        onSelectPackage={onSelectPackage}
      />
    );
  }

  if (activePackages.length === 0 && activeExtras.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {activePackages.length > 0 && (
        <ServicePackageComparisonTable
          packages={packages}
          currency={currency}
          selectedPackageId={selectedPackageId}
          onSelectPackage={onSelectPackage}
        />
      )}

      {activeExtras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Options supplémentaires
            </CardTitle>
            <CardDescription>
              Extras configurables depuis le panneau de commande à droite.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
