/**
 * Couche d'accès données panier — abstrait Supabase pour cart_items + produits.
 * Pattern aligné sur lib/loyalty/loyalty-data.ts
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/integrations/supabase/types';
import type { CartItem } from '@/types/cart';

type DbClient = SupabaseClient<Database>;
type CartItemInsert = Database['public']['Tables']['cart_items']['Insert'];
type CartItemUpdate = Database['public']['Tables']['cart_items']['Update'];

export const CART_ITEM_FIELDS =
  'id, user_id, session_id, product_id, product_type, product_name, product_image_url, variant_id, variant_name, quantity, unit_price, discount_amount, coupon_code, metadata, currency, added_at, updated_at';

export const CART_PRODUCT_SNAPSHOT_FIELDS =
  'id, name, image_url, price, currency, promotional_price, product_type, store_id';

export type CartProductSnapshot = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  currency: string | null;
  promotional_price: number | null;
  product_type: string;
  store_id: string;
};

export interface CartScope {
  userId?: string | null;
  sessionId?: string | null;
}

export async function fetchCartItems(
  scope: CartScope,
  client: DbClient = supabase
): Promise<CartItem[]> {
  let query = client
    .from('cart_items')
    .select(CART_ITEM_FIELDS)
    .order('added_at', { ascending: false });

  if (scope.userId) {
    query = query.eq('user_id', scope.userId);
  } else if (scope.sessionId) {
    query = query.eq('session_id', scope.sessionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as CartItem[]) ?? [];
}

export async function fetchProductForCart(
  productId: string,
  client: DbClient = supabase
): Promise<CartProductSnapshot> {
  const { data, error } = await client
    .from('products')
    .select(CART_PRODUCT_SNAPSHOT_FIELDS)
    .eq('id', productId)
    .single();

  if (error || !data) {
    throw new Error('Produit non trouvé');
  }

  return data as CartProductSnapshot;
}

export async function findExistingCartLine(
  scope: CartScope,
  productId: string,
  variantId: string | null | undefined,
  client: DbClient = supabase
): Promise<CartItem | null> {
  let query = client.from('cart_items').select(CART_ITEM_FIELDS).eq('product_id', productId);

  if (scope.userId) {
    query = query.eq('user_id', scope.userId);
  } else if (scope.sessionId) {
    query = query.eq('session_id', scope.sessionId);
  }

  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] ? (data[0] as CartItem) : null;
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
  client: DbClient = supabase
): Promise<CartItem> {
  const { data, error } = await client
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function insertCartItem(
  item: CartItemInsert,
  client: DbClient = supabase
): Promise<CartItem> {
  const { data, error } = await client.from('cart_items').insert(item).select().single();
  if (error) throw error;
  return data as CartItem;
}

export async function patchCartItem(
  itemId: string,
  updates: CartItemUpdate,
  client: DbClient = supabase
): Promise<CartItem> {
  const { data, error } = await client
    .from('cart_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function deleteCartItemById(
  itemId: string,
  client: DbClient = supabase
): Promise<void> {
  const { error } = await client.from('cart_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function clearCartItems(scope: CartScope, client: DbClient = supabase): Promise<void> {
  let query = client.from('cart_items').delete();
  if (scope.userId) {
    query = query.eq('user_id', scope.userId);
  } else if (scope.sessionId) {
    query = query.eq('session_id', scope.sessionId);
  }
  const { error } = await query;
  if (error) throw error;
}

export type { CartItemInsert, CartItemUpdate, Json };
