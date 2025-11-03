/**
 * Types TypeScript pour le système de Facturation
 * Date: 26 Janvier 2025
 */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type TaxType = 'VAT' | 'GST' | 'SALES_TAX' | 'CUSTOM';

export interface TaxBreakdown {
  type: TaxType;
  name: string;
  rate: number;
  amount: number;
  applies_to_shipping: boolean;
}

export interface BillingAddress {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  state?: string;
  tax_id?: string;
}

export interface StoreInfo {
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  logo_url?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  store_id: string;
  customer_id?: string;
  invoice_date: string;
  due_date?: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  tax_breakdown: TaxBreakdown[];
  billing_address?: BillingAddress;
  store_info?: StoreInfo;
  notes?: string;
  terms?: string;
  payment_terms?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
  email_sent: boolean;
  email_sent_at?: string;
  email_recipient?: string;
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  product_type?: string;
  product_name: string;
  product_description?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TaxConfiguration {
  id: string;
  store_id?: string;
  country_code: string;
  state_province?: string;
  tax_type: TaxType;
  tax_name: string;
  rate: number;
  applies_to_product_types?: string[];
  applies_to_shipping: boolean;
  tax_inclusive: boolean;
  priority: number;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceOptions {
  order_id: string;
  auto_send_email?: boolean;
}

export interface TaxCalculationResult {
  tax_amount: number;
  tax_breakdown: TaxBreakdown[];
  subtotal: number;
  shipping_amount: number;
  total_with_tax: number;
}

