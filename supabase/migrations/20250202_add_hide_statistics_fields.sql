-- ================================================================
-- Migration: Ajout des champs pour masquer les statistiques
-- Date: 2 Février 2025
-- Description: Ajoute les champs pour permettre aux vendeurs de 
--              contrôler l'affichage des statistiques sur les cartes produits
-- ================================================================

-- Ajouter les champs pour masquer les statistiques
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hide_likes_count BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_recommendations_count BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_downloads_count BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_reviews_count BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_rating BOOLEAN DEFAULT FALSE;

-- Commentaires pour documentation
COMMENT ON COLUMN public.products.hide_likes_count IS 'Masquer le nombre de likes sur les cartes produits';
COMMENT ON COLUMN public.products.hide_recommendations_count IS 'Masquer le nombre de recommandations sur les cartes produits';
COMMENT ON COLUMN public.products.hide_downloads_count IS 'Masquer le nombre de téléchargements sur les cartes produits (produits digitaux)';
COMMENT ON COLUMN public.products.hide_reviews_count IS 'Masquer le nombre d''avis sur les cartes produits';
COMMENT ON COLUMN public.products.hide_rating IS 'Masquer la note moyenne sur les cartes produits';

-- Index pour améliorer les performances des requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_products_hide_statistics 
  ON public.products(hide_purchase_count, hide_likes_count, hide_recommendations_count, hide_downloads_count, hide_reviews_count, hide_rating)
  WHERE hide_purchase_count = TRUE 
     OR hide_likes_count = TRUE 
     OR hide_recommendations_count = TRUE 
     OR hide_downloads_count = TRUE 
     OR hide_reviews_count = TRUE 
     OR hide_rating = TRUE;

-- ================================================================
-- Vérification
-- ================================================================
DO $$
BEGIN
  -- Vérifier que les colonnes existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'hide_likes_count'
  ) THEN
    RAISE EXCEPTION 'La colonne hide_likes_count n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'hide_recommendations_count'
  ) THEN
    RAISE EXCEPTION 'La colonne hide_recommendations_count n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'hide_downloads_count'
  ) THEN
    RAISE EXCEPTION 'La colonne hide_downloads_count n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'hide_reviews_count'
  ) THEN
    RAISE EXCEPTION 'La colonne hide_reviews_count n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'hide_rating'
  ) THEN
    RAISE EXCEPTION 'La colonne hide_rating n''a pas été créée';
  END IF;
  
  RAISE NOTICE '✅ Toutes les colonnes ont été créées avec succès';
END $$;

