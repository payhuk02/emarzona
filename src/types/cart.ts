/**
 * Types TypeScript pour le système de Panier
 * Date: 26 Janvier 2025
 * Support: Produits digitaux, physiques, services, cours
 */

export type ProductType = 'digital' | 'physical' | 'service' | 'course';

export interface CartItem {
  id?: string;
  product_id: string;
  product_type: ProductType;
  product_name: string;
  product_image_url?: string | null;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  discount_amount?: number;
  discount_percentage?: number;
  coupon_code?: string | null;
  metadata?: Record<string, any>;
  added_at?: string;
  updated_at?: string;
}

export interface CartSummary {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  item_count: number;
}

export interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
}

export interface AddToCartOptions {
  product_id: string;
  product_type: ProductType;
  quantity?: number;
  variant_id?: string;
  variant_name?: string;
  metadata?: Record<string, any>;
  coupon_code?: string;
}

export interface UpdateCartItemOptions {
  item_id: string;
  quantity?: number;
  variant_id?: string;
}

export interface CouponApplication {
  code: string;
  discount_amount?: number;
  discount_percentage?: number;
  valid: boolean;
  message?: string;
}

