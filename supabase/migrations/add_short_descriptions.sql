-- ============================================================
-- Migration: Générer short_description pour produits existants
-- Date: 2025-10-24
-- Description: Crée des descriptions courtes depuis descriptions complètes
-- ============================================================

-- Mise à jour des produits avec description mais sans short_description
UPDATE products 
SET short_description = CASE
  WHEN description IS NOT NULL AND LENGTH(description) > 0 THEN
    CASE
      WHEN LENGTH(description) > 120 
      THEN SUBSTRING(description, 1, 117) || '...'
      ELSE description
    END
  ELSE
    name || ' - Découvrez ce produit sur Payhuk.'
END
WHERE 
  (short_description IS NULL OR short_description = '' OR LENGTH(TRIM(short_description)) = 0)
  AND is_active = true;

-- Vérification
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM products 
  WHERE short_description IS NOT NULL 
    AND short_description != '' 
    AND LENGTH(TRIM(short_description)) > 0;
  
  RAISE NOTICE 'Migration terminée: % produits ont maintenant une short_description', updated_count;
END $$;

-- Ajouter une contrainte pour les nouveaux produits (optionnel)
-- Décommenter si vous voulez forcer short_description pour tous les nouveaux produits
-- ALTER TABLE products 
-- ADD CONSTRAINT check_short_description_not_empty 
-- CHECK (short_description IS NOT NULL AND LENGTH(TRIM(short_description)) > 0);

