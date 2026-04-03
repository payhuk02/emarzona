-- =========================================================
-- Migration : Ajouter le type 'artist' au système de panier
-- Date : 31/01/2025
-- Description : Permet aux produits de type 'artist' d'être ajoutés au panier
-- =========================================================

-- 1. Modifier la contrainte CHECK sur product_type dans cart_items
DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'cart_items_product_type_check' 
    AND table_name = 'cart_items'
  ) THEN
    ALTER TABLE public.cart_items DROP CONSTRAINT cart_items_product_type_check;
  END IF;
  
  -- Ajouter la nouvelle contrainte avec 'artist'
  ALTER TABLE public.cart_items 
  ADD CONSTRAINT cart_items_product_type_check 
  CHECK (product_type IN ('digital', 'physical', 'service', 'course', 'artist'));
END $$;

-- 2. Vérifier que la modification a bien été appliquée
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'cart_items_product_type_check'
    AND check_clause LIKE '%artist%'
  ) INTO constraint_exists;
  
  IF NOT constraint_exists THEN
    RAISE EXCEPTION 'La contrainte n''a pas été correctement mise à jour avec le type artist';
  END IF;
  
  RAISE NOTICE 'Contrainte cart_items_product_type_check mise à jour avec succès - type artist inclus';
END $$;

