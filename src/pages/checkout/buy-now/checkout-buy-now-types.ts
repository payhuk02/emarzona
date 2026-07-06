import type { Currency } from '@/lib/currency-converter';
import type { PhysicalProductPaymentOptions } from '@/types/physical-product';

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export type CheckoutUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
} | null;

export type CheckoutStore = {
  id: string;
  name?: string | null;
  slug?: string | null;
  subdomain?: string | null;
  default_currency?: string | null;
} | null;

export type CheckoutProduct = {
  id: string;
  store_id?: string;
  slug?: string | null;
  name?: string | null;
  price?: number | null;
  promotional_price?: number | null;
  currency?: string | null;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  product_type?: string | null;
  payment_options?: PhysicalProductPaymentOptions | string | null;
  stores?: CheckoutStore | CheckoutStore[] | null;
} | null;

export type CheckoutVariant = {
  id: string;
  price?: number | null;
  promotional_price?: number | null;
  option1_value?: string | null;
  name?: string | null;
} | null;

export type AppliedBuyNowCoupon = {
  id: string;
  discountAmount: number;
  code: string;
};

export type ProductCurrency = Currency | string;
