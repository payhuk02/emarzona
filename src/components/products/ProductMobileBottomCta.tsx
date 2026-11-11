/**
 * CTA d’achat mobile fixe — visible uniquement une fois le bas de page atteint.
 */
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ProductMobileBottomCtaProps = {
  visible: boolean;
  productName: string;
  priceLabel?: string | null;
  ctaLabel: string;
  loading?: boolean;
  disabled?: boolean;
  onBuy: () => void;
};

export function ProductMobileBottomCta({
  visible,
  productName,
  priceLabel,
  ctaLabel,
  loading = false,
  disabled = false,
  onBuy,
}: ProductMobileBottomCtaProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 md:hidden',
        'border-t border-border/80 bg-background/95 backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]',
        'transition-transform duration-300 ease-out will-change-transform',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      )}
      role="region"
      aria-label="Acheter ce produit"
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-3 pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{productName}</p>
          {priceLabel ? (
            <p className="truncate text-xs font-medium text-primary">{priceLabel}</p>
          ) : null}
        </div>
        <Button
          size="lg"
          className="min-h-[44px] shrink-0 rounded-full px-4 text-sm font-semibold shadow-md touch-manipulation"
          onClick={onBuy}
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
          )}
          {loading ? 'Chargement…' : ctaLabel}
        </Button>
      </div>
    </div>
  );
}
