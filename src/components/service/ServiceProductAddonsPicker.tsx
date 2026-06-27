/**
 * Sélection des produits complémentaires sur fiche service (Phase 4).
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  addonEffectivePrice,
  type ServiceProductAddonWithProduct,
} from '@/lib/service/service-product-addons';

interface ServiceProductAddonsPickerProps {
  addons: ServiceProductAddonWithProduct[];
  isLoading?: boolean;
  selectedAddonProductIds: string[];
  onChange: (productIds: string[]) => void;
  className?: string;
}

export function ServiceProductAddonsPicker({
  addons,
  isLoading,
  selectedAddonProductIds,
  onChange,
  className,
}: ServiceProductAddonsPickerProps) {
  if (isLoading) {
    return <Skeleton className={cn('h-24 w-full', className)} />;
  }

  if (!addons.length) return null;

  const toggle = (productId: string, checked: boolean, isRequired: boolean) => {
    if (isRequired && !checked) return;
    const next = checked
      ? [...new Set([...selectedAddonProductIds, productId])]
      : selectedAddonProductIds.filter(id => id !== productId);
    onChange(next);
  };

  return (
    <div className={cn('space-y-3 rounded-lg border border-dashed p-4', className)}>
      <div>
        <p className="text-sm font-semibold">Produits complémentaires</p>
        <p className="text-xs text-muted-foreground">
          Ajoutez des articles digital ou physique à votre réservation (même boutique).
        </p>
      </div>
      <ul className="space-y-2">
        {addons.map(row => {
          const checked = row.is_required || selectedAddonProductIds.includes(row.addon_product_id);
          const price = addonEffectivePrice(row.addon);
          return (
            <li
              key={row.id}
              className="flex items-start gap-3 rounded-md border bg-card/50 p-3 text-sm"
            >
              <Checkbox
                id={`addon-${row.id}`}
                checked={checked}
                disabled={row.is_required}
                onCheckedChange={value =>
                  toggle(row.addon_product_id, value === true, row.is_required)
                }
                aria-label={row.addon.name}
              />
              <label htmlFor={`addon-${row.id}`} className="flex-1 cursor-pointer space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.addon.name}</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {row.addon.product_type}
                  </Badge>
                  {row.is_required && (
                    <Badge variant="outline" className="text-xs">
                      Obligatoire
                    </Badge>
                  )}
                  {row.quantity > 1 && (
                    <span className="text-xs text-muted-foreground">×{row.quantity}</span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {price.toLocaleString('fr-FR')} {row.addon.currency}
                </p>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
