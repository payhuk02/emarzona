-- Migration: Renforcement RLS pour empêcher le croisement des types de produits
-- Empêche l'insertion d'un produit physique dans une boutique digitale (et inversement).

-- 1. Sécuriser l'INSERT sur la table products
DROP POLICY IF EXISTS "Store owners can insert products" ON public.products;
CREATE POLICY "Store owners can insert products" ON public.products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = store_id AND user_id = auth.uid()
  )
  AND (
    -- Le product_type doit correspondre au commerce_type de la boutique
    product_type = public.store_commerce_type(store_id)
  )
);

-- 2. Sécuriser l'UPDATE sur la table products
DROP POLICY IF EXISTS "Store owners can update products" ON public.products;
CREATE POLICY "Store owners can update products" ON public.products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = store_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = store_id AND user_id = auth.uid()
  )
  AND (
    -- On empêche la modification vers un type non autorisé
    product_type = public.store_commerce_type(store_id)
  )
);
