import { formatPrice } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import type { ServiceDisplayPrice } from '@/lib/service/service-pricing';

type ServicePriceDisplaySize = 'sm' | 'md' | 'lg';

interface ServicePriceDisplayProps {
  display: ServiceDisplayPrice;
  currency?: string;
  size?: ServicePriceDisplaySize;
  align?: 'left' | 'right';
  className?: string;
  amountClassName?: string;
}

const AMOUNT_SIZE: Record<ServicePriceDisplaySize, string> = {
  sm: 'text-sm sm:text-base font-bold',
  md: 'text-lg sm:text-xl md:text-2xl font-bold',
  lg: 'text-2xl md:text-3xl font-bold',
};

export function ServicePriceDisplay({
  display,
  currency = 'XOF',
  size = 'md',
  align = 'left',
  className,
  amountClassName,
}: ServicePriceDisplayProps) {
  const amountText = display.amount === 0 ? 'Gratuit' : `${formatPrice(display.amount, currency)}`;

  return (
    <div className={cn(align === 'right' ? 'text-right' : 'text-left', className)}>
      {display.showStartingFrom && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">À partir de</p>
      )}
      <div
        className={cn(
          'flex items-baseline gap-1.5 sm:gap-2 flex-wrap',
          align === 'right' && 'justify-end'
        )}
      >
        <p className={cn(AMOUNT_SIZE[size], 'whitespace-nowrap text-primary', amountClassName)}>
          {amountText}
          {display.amount > 0 && display.unitSuffix ? (
            <span className="text-sm font-medium text-muted-foreground ml-1">
              {display.unitSuffix}
            </span>
          ) : null}
        </p>
        {display.originalAmount != null && display.originalAmount > display.amount && (
          <span className="text-xs sm:text-sm text-muted-foreground line-through whitespace-nowrap">
            {formatPrice(display.originalAmount, currency)}
          </span>
        )}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{display.unitLabel}</p>
    </div>
  );
}
