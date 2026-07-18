import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve the return policy explicitly assigned to a product via specific_product_ids.
 */
export async function loadProductReturnPolicyId(
  storeId: string,
  productId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('return_policies')
    .select('id')
    .eq('store_id', storeId)
    .contains('specific_product_ids', [productId])
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Assign or clear a product-specific return policy by updating return_policies.specific_product_ids.
 */
export async function syncProductReturnPolicy(
  storeId: string,
  productId: string,
  policyId: string | null | undefined
): Promise<void> {
  const { data: linkedPolicies, error: fetchError } = await supabase
    .from('return_policies')
    .select('id, specific_product_ids')
    .eq('store_id', storeId)
    .contains('specific_product_ids', [productId]);

  if (fetchError) throw fetchError;

  for (const policy of linkedPolicies ?? []) {
    const nextIds = (policy.specific_product_ids ?? []).filter(id => id !== productId);
    const { error } = await supabase
      .from('return_policies')
      .update({ specific_product_ids: nextIds, applies_to_all_products: false })
      .eq('id', policy.id);
    if (error) throw error;
  }

  if (!policyId) return;

  const { data: targetPolicy, error: targetError } = await supabase
    .from('return_policies')
    .select('specific_product_ids')
    .eq('id', policyId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (targetError) throw targetError;
  if (!targetPolicy) throw new Error('Politique de retour introuvable');

  const currentIds = targetPolicy.specific_product_ids ?? [];
  if (currentIds.includes(productId)) return;

  const { error: assignError } = await supabase
    .from('return_policies')
    .update({
      specific_product_ids: [...currentIds, productId],
      applies_to_all_products: false,
    })
    .eq('id', policyId);

  if (assignError) throw assignError;
}
