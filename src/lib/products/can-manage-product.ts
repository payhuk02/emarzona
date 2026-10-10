/**
 * Accès produit pour propriétaire + membres équipe avec products.manage.
 */
import { supabase } from '@/integrations/supabase/client';

export async function userCanManageStoreProducts(
  storeId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_store_permission', {
    _store_id: storeId,
    _user_id: userId,
    _permission: 'products.manage',
  });

  return !error && data === true;
}

/** Vérifie qu’un utilisateur peut gérer le produit (owner ou products.manage). */
export async function assertUserCanManageProduct(
  productId: string,
  userId: string
): Promise<{ productId: string; storeId: string }> {
  const { data: product, error } = await supabase
    .from('products')
    .select('id, store_id')
    .eq('id', productId)
    .single();

  if (error || !product?.store_id) {
    throw new Error('Accès non autorisé à ce produit');
  }

  const allowed = await userCanManageStoreProducts(product.store_id, userId);
  if (!allowed) {
    throw new Error("Vous n'avez pas les permissions pour modifier ce produit");
  }

  return { productId: product.id, storeId: product.store_id };
}

export async function userCanManageProduct(productId: string, userId: string): Promise<boolean> {
  try {
    await assertUserCanManageProduct(productId, userId);
    return true;
  } catch {
    return false;
  }
}
