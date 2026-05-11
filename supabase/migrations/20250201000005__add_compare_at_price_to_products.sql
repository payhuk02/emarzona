/**
 * Migration: Ajouter colonnes compare_at_price et cost_per_item à products
 * Date: 1 Février 2025
 * 
 * Description: Ajoute les colonnes de prix de comparaison et coût par article
 * à la table products pour permettre la gestion des prix promotionnels et
 * le calcul des marges bénéficiaires.
 */

-- =====================================================
-- AJOUTER compare_at_price (Prix de comparaison)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'compare_at_price'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN compare_at_price NUMERIC(10, 2) DEFAULT NULL
    CHECK (compare_at_price IS NULL OR compare_at_price >= 0);
    
    COMMENT ON COLUMN public.products.compare_at_price IS 'Prix de comparaison (prix barré) pour afficher une réduction. Doit être >= price si renseigné.';
  END IF;
END $$;

-- =====================================================
-- AJOUTER cost_per_item (Coût par article)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'cost_per_item'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN cost_per_item NUMERIC(10, 2) DEFAULT NULL
    CHECK (cost_per_item IS NULL OR cost_per_item >= 0);
    
    COMMENT ON COLUMN public.products.cost_per_item IS 'Coût d''achat/fabrication par article pour calculer la marge bénéficiaire.';
  END IF;
END $$;

-- =====================================================
-- CONTRAINTE: compare_at_price >= price (si renseigné)
-- =====================================================

-- Supprimer la contrainte si elle existe déjà
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS check_compare_at_price_gte_price;

-- Ajouter la contrainte
ALTER TABLE public.products
ADD CONSTRAINT check_compare_at_price_gte_price
CHECK (
  compare_at_price IS NULL 
  OR price IS NULL 
  OR compare_at_price >= price
);

COMMENT ON CONSTRAINT check_compare_at_price_gte_price ON public.products IS 
'Le prix de comparaison doit être supérieur ou égal au prix de vente pour afficher une réduction valide.';

-- =====================================================
-- INDEX pour améliorer les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_compare_at_price 
ON public.products(compare_at_price) 
WHERE compare_at_price IS NOT NULL;

COMMENT ON INDEX idx_products_compare_at_price IS 
'Index pour les produits avec prix de comparaison (recherche de promotions).';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '✅ Colonne compare_at_price ajoutée à products';
  RAISE NOTICE '✅ Colonne cost_per_item ajoutée à products';
  RAISE NOTICE '✅ Contrainte de validation ajoutée';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Rafraîchissez le cache du schéma dans Supabase Dashboard';
  RAISE NOTICE '2. Testez la création de produit avec prix de comparaison';
END $$;

