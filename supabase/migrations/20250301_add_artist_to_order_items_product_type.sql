-- =========================================================
-- Migration : Ajouter 'artist' au product_type de order_items
-- Date : 1 Mars 2025
-- Description : Ajoute la colonne product_type si elle n'existe pas,
--               puis ajoute 'artist' comme valeur valide pour product_type
--               dans la table order_items pour supporter les produits artistes
-- =========================================================

-- 1. Ajouter la colonne product_type si elle n'existe pas (sans CHECK d'abord)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_type'
  ) THEN
    ALTER TABLE public.order_items
    ADD COLUMN product_type TEXT DEFAULT 'generic';
    
    -- Mettre à jour les valeurs existantes basées sur products.product_type
    UPDATE public.order_items oi
    SET product_type = COALESCE(
      (SELECT p.product_type FROM public.products p WHERE p.id = oi.product_id),
      'generic'
    )
    WHERE oi.product_type IS NULL OR oi.product_type = 'generic';
  END IF;
END $$;

-- 2. Supprimer toutes les contraintes CHECK existantes sur product_type
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.order_items'::regclass
    AND contype = 'c'
    AND (
      conname LIKE '%product_type%' 
      OR pg_get_constraintdef(oid) LIKE '%product_type%'
    )
  LOOP
    EXECUTE format('ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

-- 3. Ajouter la nouvelle contrainte CHECK avec 'artist' inclus
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_type_check 
CHECK (product_type IS NULL OR product_type IN (
  'digital', 
  'physical', 
  'service', 
  'course',
  'artist',  -- Nouveau type ajouté
  'generic'
));

-- 4. Créer un index sur product_type pour les performances
CREATE INDEX IF NOT EXISTS idx_order_items_product_type 
ON public.order_items(product_type) 
WHERE product_type IS NOT NULL;

-- 5. Commentaire mis à jour
COMMENT ON COLUMN public.order_items.product_type IS 
  'Type de produit: digital, physical, service, course, artist, ou generic';

