/**
 * Fiverr-style package comparison table for public service pages.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Minus, RefreshCw, X } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { ServiceDeliveryPackage } from '@/lib/services/service-delivery-commerce';

interface ServicePackageComparisonTableProps {
  packages: ServiceDeliveryPackage[];
  currency?: string;
  selectedPackageId?: string | null;
  onSelectPackage?: (packageId: string) => void;
  isLoading?: boolean;
}

function collectFeatureRows(packages: ServiceDeliveryPackage[]): string[] {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const pkg of packages) {
    for (const feature of pkg.features) {
      const trimmed = feature.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        rows.push(trimmed);
      }
    }
  }
  return rows;
}

export function ServicePackageComparisonTable({
  packages,
  currency = 'XOF',
  selectedPackageId,
  onSelectPackage,
  isLoading = false,
}: ServicePackageComparisonTableProps) {
  const activePackages = useMemo(
    () => [...packages.filter(pkg => pkg.is_active)].sort((a, b) => a.sort_order - b.sort_order),
    [packages]
  );

  const featureRows = useMemo(() => collectFeatureRows(activePackages), [activePackages]);

  const defaultSelectedId =
    selectedPackageId ||
    activePackages.find(pkg => pkg.is_featured)?.id ||
    activePackages[0]?.id ||
    null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base md:text-lg">Comparer les formules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement des formules…</p>
        </CardContent>
      </Card>
    );
  }

  if (activePackages.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm sm:text-base md:text-lg">Comparer les formules</CardTitle>
        <CardDescription>
          Tableau comparatif des offres. Sélectionnez une formule pour personnaliser votre commande.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 z-20 bg-muted/95 backdrop-blur-sm p-3 text-left font-medium text-muted-foreground min-w-[140px]">
                  Critère
                </th>
                {activePackages.map(pkg => {
                  const selected = defaultSelectedId === pkg.id;
                  return (
                    <th
                      key={pkg.id}
                      className={cn(
                        'p-3 text-left align-top min-w-[160px] border-l',
                        selected && 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">{pkg.name}</span>
                          {pkg.is_featured && <Badge>Populaire</Badge>}
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(pkg.price, currency)}</p>
                        {onSelectPackage && (
                          <Button
                            type="button"
                            size="sm"
                            variant={selected ? 'default' : 'outline'}
                            className="w-full min-h-[40px]"
                            onClick={() => onSelectPackage(pkg.id)}
                          >
                            {selected ? 'Sélectionnée' : 'Choisir'}
                          </Button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="sticky left-0 z-10 bg-background p-3 font-medium text-muted-foreground">
                  Délai de livraison
                </td>
                {activePackages.map(pkg => (
                  <td key={`${pkg.id}-days`} className="p-3 border-l">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {pkg.delivery_days} jour{pkg.delivery_days > 1 ? 's' : ''}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="sticky left-0 z-10 bg-background p-3 font-medium text-muted-foreground">
                  Révisions incluses
                </td>
                {activePackages.map(pkg => (
                  <td key={`${pkg.id}-revisions`} className="p-3 border-l">
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      {pkg.revisions}
                    </span>
                  </td>
                ))}
              </tr>
              {activePackages.some(pkg => pkg.description) && (
                <tr className="border-b">
                  <td className="sticky left-0 z-10 bg-background p-3 font-medium text-muted-foreground align-top">
                    Description
                  </td>
                  {activePackages.map(pkg => (
                    <td
                      key={`${pkg.id}-desc`}
                      className="p-3 border-l text-muted-foreground align-top"
                    >
                      {pkg.description || '—'}
                    </td>
                  ))}
                </tr>
              )}
              {featureRows.map(feature => (
                <tr key={feature} className="border-b last:border-b-0">
                  <td className="sticky left-0 z-10 bg-background p-3 text-muted-foreground align-top">
                    {feature}
                  </td>
                  {activePackages.map(pkg => {
                    const included = pkg.features.some(f => f.trim() === feature);
                    return (
                      <td key={`${pkg.id}-${feature}`} className="p-3 border-l text-center">
                        {included ? (
                          <Check className="h-4 w-4 text-primary mx-auto" aria-label="Inclus" />
                        ) : (
                          <Minus
                            className="h-4 w-4 text-muted-foreground/50 mx-auto"
                            aria-label="Non inclus"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {featureRows.length === 0 && (
                <tr>
                  <td
                    colSpan={activePackages.length + 1}
                    className="p-4 text-center text-muted-foreground"
                  >
                    <X className="h-4 w-4 inline mr-1 opacity-50" />
                    Aucune fonctionnalité détaillée pour ces formules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
