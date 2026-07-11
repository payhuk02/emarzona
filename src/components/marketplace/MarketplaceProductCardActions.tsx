/**
 * Actions marketplace — layout enterprise (Amazon/Shopify pattern).
 * CTA principal pleine largeur + actions secondaires en grille 2 colonnes.
 */
import { Link } from 'react-router-dom';
import { VendorMessagingLink } from '@/components/vendor/VendorMessagingLink';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, ShoppingCart, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MarketplaceCardBuyIcon = 'cart' | 'calendar';

export interface MarketplaceProductCardActionsProps {
  productId: string;
  productName: string;
  productUrl: string;
  storeId?: string | null;
  buyLabel: string;
  buyAriaLabel: string;
  buyLoading?: boolean;
  buyDisabled?: boolean;
  buyIcon?: MarketplaceCardBuyIcon;
  onBuy: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onView?: () => void;
  className?: string;
}

export function MarketplaceProductCardActions({
  productId,
  productName,
  productUrl,
  storeId,
  buyLabel,
  buyAriaLabel,
  buyLoading = false,
  buyDisabled = false,
  buyIcon = 'cart',
  onBuy,
  onView,
  className,
}: MarketplaceProductCardActionsProps) {
  const BuyIcon = buyLoading ? Loader2 : buyIcon === 'calendar' ? Calendar : ShoppingCart;

  return (
    <div className={cn('mp-product-card__actions flex flex-col gap-2 w-full min-w-0', className)}>
      <Button
        type="button"
        data-action="primary"
        size="sm"
        disabled={buyDisabled || buyLoading}
        onClick={onBuy}
        aria-label={buyAriaLabel}
        className={cn(
          'w-full min-h-[44px] h-11 px-3 sm:px-4',
          'text-sm font-semibold tracking-tight',
          'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
          'text-white shadow-sm hover:shadow-md',
          'touch-manipulation active:scale-[0.98] transition-all duration-200',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        <BuyIcon
          className={cn('h-4 w-4 flex-shrink-0 mr-2', buyLoading && 'animate-spin')}
          aria-hidden="true"
        />
        <span className="truncate min-w-0">{buyLabel}</span>
      </Button>

      <div className={cn('grid gap-2 w-full min-w-0', storeId ? 'grid-cols-2' : 'grid-cols-1')}>
        <Button
          variant="outline"
          size="sm"
          data-action="view"
          className={cn(
            'w-full min-h-[40px] h-10 px-2 sm:px-3',
            'text-xs sm:text-sm font-medium text-white',
            'bg-gradient-to-r from-amber-500/95 to-yellow-600/95 hover:from-amber-600 hover:to-yellow-700',
            'border-amber-500/80 touch-manipulation active:scale-[0.98] transition-transform'
          )}
          asChild
        >
          <Link
            to={productUrl}
            aria-label={`Voir les détails de ${productName}`}
            onClick={() => onView?.()}
            className="flex items-center justify-center gap-1.5 min-w-0"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">Voir</span>
          </Link>
        </Button>

        {storeId && (
          <Button
            variant="outline"
            size="sm"
            data-action="contact"
            title={`Contacter le vendeur — ${productName}`}
            className={cn(
              'w-full min-h-[40px] h-10 px-2',
              'text-xs sm:text-sm font-medium text-white',
              'bg-gradient-to-r from-purple-700/95 to-purple-900/95 hover:from-purple-800 hover:to-purple-950',
              'border-purple-700/80 touch-manipulation active:scale-[0.98] transition-transform'
            )}
            asChild
          >
            <VendorMessagingLink
              storeId={storeId}
              productId={productId}
              aria-label={`Contacter le vendeur pour ${productName}`}
              className="flex items-center justify-center gap-1.5 min-w-0"
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">Contacter</span>
            </VendorMessagingLink>
          </Button>
        )}
      </div>
    </div>
  );
}

export interface MarketplaceProductCardPriceRowProps {
  priceId?: string;
  children: React.ReactNode;
  alertSlot?: React.ReactNode;
  className?: string;
}

export function MarketplaceProductCardPriceRow({
  priceId,
  children,
  alertSlot,
  className,
}: MarketplaceProductCardPriceRowProps) {
  return (
    <div className={cn('mp-product-card__price mb-3 sm:mb-4 min-w-0', className)}>
      <div id={priceId} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
        {children}
      </div>
      {alertSlot ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">{alertSlot}</div>
      ) : null}
    </div>
  );
}
