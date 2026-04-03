-- =====================================================
-- Migration : Ajouter colonne meta_keywords à products
-- Date: 1er Février 2025 (00:00:00 - doit être exécutée AVANT create_full_course)
-- Description: Ajoute la colonne meta_keywords manquante pour le SEO
-- =====================================================

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'meta_keywords'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN meta_keywords TEXT;
    
    COMMENT ON COLUMN public.products.meta_keywords IS 'Mots-clés SEO pour le référencement du produit';
  END IF;
END $$;

