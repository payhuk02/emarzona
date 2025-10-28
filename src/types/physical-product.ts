/**
 * Physical Product Types
 * Date: 27 octobre 2025
 */

export interface PhysicalProductVariant {
  id?: string;
  option1_value: string;
  option2_value?: string;
  option3_value?: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  image_url?: string;
}

export interface PhysicalProductOption {
  name: string;
  values: string[];
}

export interface PhysicalProductDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
  unit: 'cm' | 'in';
}

export interface PhysicalProductFormData {
  // Basic Info
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  images: string[];
  category_id: string | null;
  tags: string[];
  
  // Variants
  has_variants: boolean;
  variants: PhysicalProductVariant[];
  options: PhysicalProductOption[];
  
  // Inventory
  track_inventory: boolean;
  continue_selling_when_out_of_stock: boolean;
  inventory_policy: 'deny' | 'continue';
  quantity: number;
  sku: string;
  barcode: string;
  
  // Shipping
  requires_shipping: boolean;
  weight: number | null;
  weight_unit: 'kg' | 'lb' | 'g' | 'oz';
  dimensions: PhysicalProductDimensions;
  shipping_class: string | null;
  free_shipping: boolean;
  
  // Meta
  is_active: boolean;
}

