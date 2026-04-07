-- =====================================================
-- Migration : Ajouter contrainte UNIQUE sur product_id dans product_analytics
-- Date: 1er Février 2025
-- Description: Ajoute une contrainte UNIQUE pour garantir un seul enregistrement par produit
-- =====================================================

-- Vérifier si la table existe avant d'ajouter la contrainte
DO $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_analytics'
  ) THEN
    -- Supprimer les doublons s'il y en a (garder le plus récent)
    DELETE FROM public.product_analytics pa1
    WHERE EXISTS (
      SELECT 1 
      FROM public.product_analytics pa2 
      WHERE pa2.product_id = pa1.product_id 
      AND pa2.created_at > pa1.created_at
    );
    
    -- Ajouter la contrainte UNIQUE si elle n'existe pas déjà
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'product_analytics' 
      AND constraint_name = 'product_analytics_product_id_key'
    ) THEN
      ALTER TABLE public.product_analytics
      ADD CONSTRAINT product_analytics_product_id_key UNIQUE (product_id);
    END IF;
  END IF;
END $$;

-- Commentaire (seulement si la contrainte existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'product_analytics' 
    AND constraint_name = 'product_analytics_product_id_key'
  ) THEN
    COMMENT ON CONSTRAINT product_analytics_product_id_key ON public.product_analytics IS 'Garantit un seul enregistrement d''analytics par produit';
  END IF;
END $$;

