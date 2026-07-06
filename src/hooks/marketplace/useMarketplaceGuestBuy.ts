import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMarketplaceProductCTA } from '@/lib/marketplace-product-cta';
import type { GuestCustomerInfo } from '@/components/checkout/GuestPurchaseDialog';
import type { PhysicalProductPaymentOptions } from '@/types/physical-product';

export type MarketplaceBuyProduct = {
  id: string;
  slug: string;
  name: string;
  store_id?: string;
  product_type?: string | null;
  currency?: string | null;
  payment_options?: PhysicalProductPaymentOptions | string | null;
};

type UseMarketplaceGuestBuyOptions = {
  product: MarketplaceBuyProduct;
  price: number;
  storeSlug?: string;
};

export function useMarketplaceGuestBuy({
  product,
  price: _price,
  storeSlug: _storeSlug,
}: UseMarketplaceGuestBuyOptions) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [physicalOpen, setPhysicalOpen] = useState(false);

  const cta = getMarketplaceProductCTA(product.product_type, product.payment_options);

  const proceedWithCustomer = useCallback(
    async (customer: GuestCustomerInfo) => {
      if (!product.store_id) {
        toast({
          title: 'Erreur',
          description: 'Boutique non disponible',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      try {
        if (cta.action === 'service') {
          const params = new URLSearchParams({ guestEmail: customer.email });
          if (customer.fullName) params.set('guestName', customer.fullName);
          navigate(`/service/${product.id}?${params.toString()}`);
          return;
        }

        if (cta.action === 'course') {
          const params = new URLSearchParams({ guestEmail: customer.email });
          if (customer.fullName) params.set('guestName', customer.fullName);
          navigate(`/courses/${product.slug}?${params.toString()}`);
          return;
        }

        const checkoutParams = new URLSearchParams({
          productId: product.id,
          storeId: product.store_id,
          guestEmail: customer.email,
        });
        if (customer.fullName) checkoutParams.set('guestName', customer.fullName);
        if (customer.phone) checkoutParams.set('guestPhone', customer.phone);

        if (cta.action === 'checkout') {
          navigate(`/checkout?${checkoutParams.toString()}`);
          return;
        }
      } catch (e: unknown) {
        toast({
          title: 'Erreur',
          description: e instanceof Error ? e.message : "Impossible de poursuivre l'achat",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setGuestOpen(false);
      }
    },
    [cta.action, navigate, product, toast]
  );

  const handleBuyClick = useCallback(async () => {
    if (!product.store_id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non disponible',
        variant: 'destructive',
      });
      return;
    }

    if (cta.action === 'physical_quick_order') {
      setPhysicalOpen(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      await proceedWithCustomer({
        email: user.email,
        fullName: (user.user_metadata?.full_name as string | undefined) || user.email.split('@')[0],
      });
      return;
    }

    setGuestOpen(true);
  }, [cta.action, proceedWithCustomer, product.store_id, toast]);

  return {
    product,
    cta,
    loading,
    guestOpen,
    setGuestOpen,
    physicalOpen,
    setPhysicalOpen,
    handleBuyClick,
    proceedWithCustomer,
  };
}
