import { GuestPurchaseDialog } from '@/components/checkout/GuestPurchaseDialog';
import { PhysicalQuickOrderDialog } from '@/components/physical/PhysicalQuickOrderDialog';
import type { MarketplaceBuyProduct } from '@/hooks/marketplace/useMarketplaceGuestBuy';

type MarketplaceGuestBuyDialogsProps = {
  product: MarketplaceBuyProduct;
  price: number;
  guestOpen: boolean;
  setGuestOpen: (open: boolean) => void;
  physicalOpen: boolean;
  setPhysicalOpen: (open: boolean) => void;
  loading: boolean;
  onGuestConfirm: (info: { email: string; fullName: string; phone?: string }) => Promise<void>;
};

export function MarketplaceGuestBuyDialogs({
  product,
  price,
  guestOpen,
  setGuestOpen,
  physicalOpen,
  setPhysicalOpen,
  loading,
  onGuestConfirm,
}: MarketplaceGuestBuyDialogsProps) {
  return (
    <>
      <GuestPurchaseDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        productName={product.name}
        onConfirm={onGuestConfirm}
        loading={loading}
      />

      {product.store_id && product.product_type === 'physical' && (
        <PhysicalQuickOrderDialog
          open={physicalOpen}
          onOpenChange={setPhysicalOpen}
          product={{
            productId: product.id,
            storeId: product.store_id,
            name: product.name,
            price,
            currency: product.currency || 'XOF',
            payment_options: product.payment_options,
          }}
        />
      )}
    </>
  );
}
