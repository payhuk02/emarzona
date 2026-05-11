-- =====================================================
-- VÉRIFICATION : Migration des Promotions
-- Date: 28 Janvier 2025
-- Description: Script pour vérifier que la migration s'est bien passée
-- =====================================================

-- =====================================================
-- 1. VÉRIFIER LES COLONNES AJOUTÉES
-- =====================================================

SELECT 
  'Vérification des colonnes' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'product_promotions' 
        AND column_name = 'original_promotion_id'
    ) THEN '✅ Colonne original_promotion_id existe'
    ELSE '❌ Colonne original_promotion_id manquante'
  END as result
UNION ALL
SELECT 
  'Vérification des colonnes',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'product_promotions' 
        AND column_name = 'original_digital_coupon_id'
    ) THEN '✅ Colonne original_digital_coupon_id existe'
    ELSE '❌ Colonne original_digital_coupon_id manquante'
  END
UNION ALL
SELECT 
  'Vérification des colonnes',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'product_promotions' 
        AND column_name = 'migration_source'
    ) THEN '✅ Colonne migration_source existe'
    ELSE '❌ Colonne migration_source manquante'
  END;

-- =====================================================
-- 2. VÉRIFIER LES FONCTIONS DE MIGRATION
-- =====================================================

SELECT 
  'Vérification des fonctions' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'migrate_promotions_to_product_promotions'
        AND routine_schema = 'public'
    ) THEN '✅ Fonction migrate_promotions_to_product_promotions existe'
    ELSE '❌ Fonction migrate_promotions_to_product_promotions manquante'
  END as result
UNION ALL
SELECT 
  'Vérification des fonctions',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'migrate_digital_coupons_to_product_promotions'
        AND routine_schema = 'public'
    ) THEN '✅ Fonction migrate_digital_coupons_to_product_promotions existe'
    ELSE '❌ Fonction migrate_digital_coupons_to_product_promotions manquante'
  END
UNION ALL
SELECT 
  'Vérification des fonctions',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'migrate_coupon_usages_to_promotion_usage'
        AND routine_schema = 'public'
    ) THEN '✅ Fonction migrate_coupon_usages_to_promotion_usage existe'
    ELSE '❌ Fonction migrate_coupon_usages_to_promotion_usage manquante'
  END;

-- =====================================================
-- 3. STATISTIQUES DES DONNÉES
-- =====================================================

SELECT 
  'Statistiques' as test,
  'Total promotions (ancien système): ' || COUNT(*)::TEXT as result
FROM public.promotions
UNION ALL
SELECT 
  'Statistiques',
  'Total digital coupons (ancien système): ' || COUNT(*)::TEXT
FROM public.digital_product_coupons
WHERE COALESCE(is_archived, FALSE) = FALSE
UNION ALL
SELECT 
  'Statistiques',
  'Total product_promotions (nouveau système): ' || COUNT(*)::TEXT
FROM public.product_promotions
UNION ALL
SELECT 
  'Statistiques',
  'Migrées depuis promotions: ' || COUNT(*)::TEXT
FROM public.product_promotions
WHERE migration_source = 'promotions'
UNION ALL
SELECT 
  'Statistiques',
  'Migrées depuis digital_product_coupons: ' || COUNT(*)::TEXT
FROM public.product_promotions
WHERE migration_source = 'digital_product_coupons';

-- =====================================================
-- 4. VÉRIFIER LES DONNÉES MIGRÉES (Exemples)
-- =====================================================

-- Voir quelques promotions migrées depuis promotions
SELECT 
  'Exemples de données migrées' as test,
  'Promotion migrée: ' || name || ' (Code: ' || COALESCE(code, 'N/A') || ')' as result
FROM public.product_promotions
WHERE migration_source = 'promotions'
LIMIT 5;

-- Voir quelques coupons migrés depuis digital_product_coupons
SELECT 
  'Exemples de données migrées',
  'Coupon migré: ' || name || ' (Code: ' || COALESCE(code, 'N/A') || ')' as result
FROM public.product_promotions
WHERE migration_source = 'digital_product_coupons'
LIMIT 5;

-- =====================================================
-- 5. RÉSUMÉ FINAL
-- =====================================================

SELECT 
  'RÉSUMÉ' as test,
  'Migration des promotions: ' || 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::TEXT || ' promotions migrées'
    ELSE '⚠️ Aucune promotion migrée'
  END as result
FROM public.product_promotions
WHERE migration_source = 'promotions'
UNION ALL
SELECT 
  'RÉSUMÉ',
  'Migration des coupons digitaux: ' || 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::TEXT || ' coupons migrés'
    ELSE '⚠️ Aucun coupon migré'
  END
FROM public.product_promotions
WHERE migration_source = 'digital_product_coupons'
UNION ALL
SELECT 
  'RÉSUMÉ',
  'Total dans product_promotions: ' || COUNT(*)::TEXT || ' promotions'
FROM public.product_promotions;

