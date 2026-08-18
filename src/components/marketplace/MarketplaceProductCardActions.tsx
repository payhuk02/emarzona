/**
 * Actions marketplace — grille 2x2 (Acheter, Voir, Contacter, WhatsApp).
 */
import { Link } from 'react-router-dom';
import { VendorMessagingLink } from '@/components/vendor/VendorMessagingLink';
import { Button } from '@/components/ui/button';
import { Eye, MessageCircle, MessageSquare, ShoppingCart, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePublicWhatsAppConfig } from '@/hooks/usePublicWhatsAppConfig';
import { buildProductWhatsAppMessage, buildWhatsAppClickUrl } from '@/lib/whatsapp/whatsapp-url';

export type MarketplaceCardBuyIcon = 'cart' | 'calendar';

const actionBtnClass =
  'w-full min-h-[40px] h-10 px-2 sm:px-3 text-xs sm:text-sm font-medium text-white touch-manipulation active:scale-[0.98] transition-transform';

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
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
  paymentUrl?: string | null;
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
  whatsappNumber,
  whatsappEnabled,
  paymentUrl,
}: MarketplaceProductCardActionsProps) {
  const BuyIcon = buyLoading ? Loader2 : buyIcon === 'calendar' ? Calendar : ShoppingCart;
  const { data: whatsappConfig } = usePublicWhatsAppConfig();

  const whatsappHref =
    whatsappEnabled && whatsappNumber?.trim() && whatsappConfig?.enabled !== false
      ? buildWhatsAppClickUrl(
          whatsappConfig?.click_url_base ?? 'https://wa.me',
          whatsappNumber,
          buildProductWhatsAppMessage(productName, paymentUrl || '')
        )
      : null;

  return (
    <div
      className={cn('mp-product-card__actions grid grid-cols-2 gap-2 w-full min-w-0', className)}
    >
      <Button
        type="button"
        data-action="primary"
        size="sm"
        disabled={buyDisabled || buyLoading}
        onClick={onBuy}
        aria-label={buyAriaLabel}
        className={cn(
          actionBtnClass,
          'font-semibold tracking-tight',
          'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
          'shadow-sm hover:shadow-md transition-all duration-200',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        <BuyIcon
          className={cn(
            'h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mr-1.5',
            buyLoading && 'animate-spin'
          )}
          aria-hidden="true"
        />
        <span className="truncate min-w-0">{buyLabel}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        data-action="view"
        className={cn(
          actionBtnClass,
          'bg-gradient-to-r from-amber-500/95 to-yellow-600/95 hover:from-amber-600 hover:to-yellow-700',
          'border-amber-500/80'
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
            actionBtnClass,
            'bg-gradient-to-r from-purple-700/95 to-purple-900/95 hover:from-purple-800 hover:to-purple-950',
            'border-purple-700/80'
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

      {whatsappHref && (
        <Button
          variant="outline"
          size="sm"
          data-action="whatsapp"
          title={`WhatsApp — ${productName}`}
          className={cn(
            actionBtnClass,
            'bg-gradient-to-r from-green-500/95 to-emerald-600/95 hover:from-green-600 hover:to-emerald-700',
            'border-green-600/80'
          )}
          asChild
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Contacter ${productName} sur WhatsApp`}
            className="flex items-center justify-center gap-1.5 min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">WhatsApp</span>
          </a>
        </Button>
      )}
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
