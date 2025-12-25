/**
 * Badge pour afficher les alertes prix
 * Date: 27 Janvier 2025
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown } from '@/components/icons';
import { cn } from '@/lib/utils';

interface PriceAlertBadgeProps {
  oldPrice: number;
  newPrice: number;
  currency: string;
  className?: string;
}

export const PriceAlertBadge = ({
  oldPrice,
  newPrice,
  currency,
  className,
}: PriceAlertBadgeProps) => {
  const priceDrop = oldPrice - newPrice;
  const priceDropPercentage = ((priceDrop / oldPrice) * 100).toFixed(0);

  return (
    <Badge
      variant="destructive"
      className={cn('flex items-center gap-1', className)}
    >
      <TrendingDown className="h-3 w-3" />
      <span>
        -{priceDropPercentage}% ({priceDrop.toLocaleString()} {currency})
      </span>
    </Badge>
  );
};

