import { Badge } from '@/components/ui/badge';
import { CreditCard, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';

type PhysicalCheckoutMethodBadgeProps = {
  paymentOptions?: unknown;
  className?: string;
  size?: 'sm' | 'md';
};

/**
 * Badge affiché sous le nom du produit : mode de paiement configuré par le vendeur.
 */
export function PhysicalCheckoutMethodBadge({
  paymentOptions,
  className,
  size = 'sm',
}: PhysicalCheckoutMethodBadgeProps) {
  const { checkout_method_label, checkout_method } = parsePhysicalCheckoutOptions(
    paymentOptions as Parameters<typeof parsePhysicalCheckoutOptions>[0]
  );

  const sizeClass =
    size === 'sm' ? 'text-[10px] sm:text-xs px-2 py-0.5' : 'text-xs sm:text-sm px-2.5 py-1';

  const isCod = checkout_method === 'cash_on_delivery';

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        isCod
          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/40'
          : 'bg-blue-500/15 text-blue-800 dark:text-blue-200 border-blue-500/40',
        sizeClass,
        className
      )}
    >
      {isCod ? (
        <Truck className="h-3 w-3 mr-1 shrink-0" />
      ) : (
        <CreditCard className="h-3 w-3 mr-1 shrink-0" />
      )}
      {checkout_method_label}
    </Badge>
  );
}
