import { supabase } from '@/integrations/supabase/client';
import type { PhysicalCheckoutMethod } from '@/constants/physical-checkout-options';

export type CreatePublicPhysicalOrderParams = {
  productId: string;
  storeId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  quantity?: number;
  variantId?: string;
  checkoutMethod?: PhysicalCheckoutMethod;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  affiliateTrackingCookie?: string | null;
  guestCheckout?: boolean;
};

export type CreatePublicPhysicalOrderResult = {
  order_id: string;
  order_number: string;
  order_item_id: string;
  inventory_id: string | null;
  cash_on_delivery: boolean;
  total_amount: number;
  currency: string;
  customer_id: string;
};

export async function createPublicPhysicalOrder(
  params: CreatePublicPhysicalOrderParams
): Promise<CreatePublicPhysicalOrderResult> {
  const { data, error } = await supabase.rpc('create_public_physical_order', {
    p_product_id: params.productId,
    p_store_id: params.storeId,
    p_customer_email: params.customerEmail.trim(),
    p_customer_name: params.customerName.trim(),
    p_customer_phone: params.customerPhone ?? null,
    p_quantity: params.quantity ?? 1,
    p_variant_id: params.variantId ?? null,
    p_checkout_method: params.checkoutMethod ?? null,
    p_shipping_address: params.shippingAddress,
    p_affiliate_tracking_cookie: params.affiliateTrackingCookie ?? null,
    p_guest_checkout: params.guestCheckout ?? true,
  });

  if (error) {
    throw new Error(error.message || 'Erreur lors de la création de la commande');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Réponse invalide du serveur');
  }

  return data as CreatePublicPhysicalOrderResult;
}
