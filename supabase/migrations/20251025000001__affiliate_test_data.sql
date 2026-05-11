-- ============================================================
-- SCRIPT DE TEST - SYSTÈME D'AFFILIATION
-- Date: 25 Octobre 2025
-- Description: Données de test pour le système d'affiliation
-- ATTENTION: NE PAS EXÉCUTER EN PRODUCTION
-- ============================================================

-- ⚠️ CE SCRIPT EST POUR DÉVELOPPEMENT/TEST UNIQUEMENT ⚠️
-- Supprimer le commentaire ci-dessous pour activer l'exécution

/*

-- ============================================================
-- 1. CRÉER DES AFFILIÉS DE TEST
-- ============================================================

-- Affilié 1: Super actif
INSERT INTO affiliates (
  user_id,
  email,
  first_name,
  last_name,
  display_name,
  affiliate_code,
  status,
  total_clicks,
  total_sales,
  total_revenue,
  total_commission_earned,
  total_commission_paid,
  pending_commission
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'affilie1@test.com',
  'Jean',
  'Dupont',
  'JeanD',
  'AFF001',
  'active',
  1250,
  45,
  4500000,
  450000,
  300000,
  150000
) ON CONFLICT (affiliate_code) DO NOTHING;

-- Affilié 2: Moyen
INSERT INTO affiliates (
  user_id,
  email,
  first_name,
  last_name,
  display_name,
  affiliate_code,
  status,
  total_clicks,
  total_sales,
  total_revenue,
  total_commission_earned,
  total_commission_paid,
  pending_commission
) VALUES (
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
  'affilie2@test.com',
  'Marie',
  'Martin',
  'MarieM',
  'AFF002',
  'active',
  850,
  28,
  2800000,
  280000,
  200000,
  80000
) ON CONFLICT (affiliate_code) DO NOTHING;

-- Affilié 3: Débutant
INSERT INTO affiliates (
  user_id,
  email,
  first_name,
  last_name,
  display_name,
  affiliate_code,
  status,
  total_clicks,
  total_sales,
  total_revenue,
  total_commission_earned,
  total_commission_paid,
  pending_commission
) VALUES (
  (SELECT id FROM auth.users LIMIT 1 OFFSET 2),
  'affilie3@test.com',
  'Pierre',
  'Durand',
  'PierreD',
  'AFF003',
  'active',
  320,
  8,
  800000,
  80000,
  0,
  80000
) ON CONFLICT (affiliate_code) DO NOTHING;

-- Affilié 4: Suspendu (pour test)
INSERT INTO affiliates (
  user_id,
  email,
  first_name,
  last_name,
  display_name,
  affiliate_code,
  status,
  suspension_reason,
  total_clicks,
  total_sales,
  total_revenue,
  total_commission_earned,
  total_commission_paid,
  pending_commission
) VALUES (
  (SELECT id FROM auth.users LIMIT 1 OFFSET 3),
  'affilie4@test.com',
  'Sophie',
  'Bernard',
  'SophieB',
  'AFF004',
  'suspended',
  'Activité frauduleuse détectée',
  1500,
  2,
  100000,
  10000,
  0,
  0
) ON CONFLICT (affiliate_code) DO NOTHING;

-- ============================================================
-- 2. ACTIVER L'AFFILIATION SUR DES PRODUITS
-- ============================================================

-- Récupérer les IDs de quelques produits existants
DO $$
DECLARE
  product_id_1 UUID;
  product_id_2 UUID;
  product_id_3 UUID;
  store_id_1 UUID;
  store_id_2 UUID;
BEGIN
  -- Récupérer 3 produits
  SELECT id, store_id INTO product_id_1, store_id_1 FROM products WHERE deleted_at IS NULL LIMIT 1;
  SELECT id, store_id INTO product_id_2, store_id_2 FROM products WHERE deleted_at IS NULL LIMIT 1 OFFSET 1;
  SELECT id, store_id INTO product_id_3 FROM products WHERE deleted_at IS NULL LIMIT 1 OFFSET 2;

  -- Configuration produit 1: Commission 20%
  IF product_id_1 IS NOT NULL THEN
    INSERT INTO product_affiliate_settings (
      product_id,
      store_id,
      affiliate_enabled,
      commission_rate,
      commission_type,
      cookie_duration_days,
      min_order_amount,
      allow_self_referral,
      require_approval
    ) VALUES (
      product_id_1,
      store_id_1,
      true,
      20.00,
      'percentage',
      30,
      0,
      false,
      false
    ) ON CONFLICT (product_id) DO NOTHING;
  END IF;

  -- Configuration produit 2: Commission 25%
  IF product_id_2 IS NOT NULL THEN
    INSERT INTO product_affiliate_settings (
      product_id,
      store_id,
      affiliate_enabled,
      commission_rate,
      commission_type,
      cookie_duration_days,
      min_order_amount,
      allow_self_referral,
      require_approval
    ) VALUES (
      product_id_2,
      store_id_2,
      true,
      25.00,
      'percentage',
      60,
      10000,
      false,
      true
    ) ON CONFLICT (product_id) DO NOTHING;
  END IF;

  -- Configuration produit 3: Commission fixe 5000 XOF
  IF product_id_3 IS NOT NULL THEN
    INSERT INTO product_affiliate_settings (
      product_id,
      store_id,
      affiliate_enabled,
      commission_rate,
      0,
      commission_type,
      fixed_commission_amount,
      cookie_duration_days,
      min_order_amount,
      allow_self_referral,
      require_approval
    ) VALUES (
      product_id_3,
      store_id_1,
      true,
      0,
      'fixed',
      5000.00,
      30,
      5000,
      true,
      false
    ) ON CONFLICT (product_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 3. CRÉER DES LIENS D'AFFILIATION
-- ============================================================

DO $$
DECLARE
  affiliate_id_1 UUID;
  affiliate_id_2 UUID;
  affiliate_id_3 UUID;
  product_id_1 UUID;
  product_id_2 UUID;
  store_id_1 UUID;
BEGIN
  -- Récupérer les IDs
  SELECT id INTO affiliate_id_1 FROM affiliates WHERE affiliate_code = 'AFF001';
  SELECT id INTO affiliate_id_2 FROM affiliates WHERE affiliate_code = 'AFF002';
  SELECT id INTO affiliate_id_3 FROM affiliates WHERE affiliate_code = 'AFF003';
  SELECT id, store_id INTO product_id_1, store_id_1 FROM products WHERE deleted_at IS NULL LIMIT 1;
  SELECT id INTO product_id_2 FROM products WHERE deleted_at IS NULL LIMIT 1 OFFSET 1;

  -- Lien 1: Affilié 1 - Produit 1 (très performant)
  IF affiliate_id_1 IS NOT NULL AND product_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_links (
      affiliate_id,
      product_id,
      store_id,
      link_code,
      status,
      total_clicks,
      total_sales,
      total_revenue,
      total_commission
    ) VALUES (
      affiliate_id_1,
      product_id_1,
      store_id_1,
      generate_affiliate_link_code(),
      'active',
      800,
      30,
      3000000,
      300000
    );
  END IF;

  -- Lien 2: Affilié 1 - Produit 2
  IF affiliate_id_1 IS NOT NULL AND product_id_2 IS NOT NULL THEN
    INSERT INTO affiliate_links (
      affiliate_id,
      product_id,
      store_id,
      link_code,
      status,
      total_clicks,
      total_sales,
      total_revenue,
      total_commission
    ) VALUES (
      affiliate_id_1,
      product_id_2,
      store_id_1,
      generate_affiliate_link_code(),
      'active',
      450,
      15,
      1500000,
      150000
    );
  END IF;

  -- Lien 3: Affilié 2 - Produit 1
  IF affiliate_id_2 IS NOT NULL AND product_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_links (
      affiliate_id,
      product_id,
      store_id,
      link_code,
      status,
      total_clicks,
      total_sales,
      total_revenue,
      total_commission
    ) VALUES (
      affiliate_id_2,
      product_id_1,
      store_id_1,
      generate_affiliate_link_code(),
      'active',
      850,
      28,
      2800000,
      280000
    );
  END IF;

  -- Lien 4: Affilié 3 - Produit 1 (débutant)
  IF affiliate_id_3 IS NOT NULL AND product_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_links (
      affiliate_id,
      product_id,
      store_id,
      link_code,
      status,
      total_clicks,
      total_sales,
      total_revenue,
      total_commission
    ) VALUES (
      affiliate_id_3,
      product_id_1,
      store_id_1,
      generate_affiliate_link_code(),
      'active',
      320,
      8,
      800000,
      80000
    );
  END IF;
END $$;

-- ============================================================
-- 4. CRÉER DES COMMISSIONS DE TEST
-- ============================================================

DO $$
DECLARE
  affiliate_id_1 UUID;
  affiliate_id_2 UUID;
  product_id_1 UUID;
  store_id_1 UUID;
  link_id_1 UUID;
BEGIN
  SELECT id INTO affiliate_id_1 FROM affiliates WHERE affiliate_code = 'AFF001';
  SELECT id INTO affiliate_id_2 FROM affiliates WHERE affiliate_code = 'AFF002';
  SELECT id, store_id INTO product_id_1, store_id_1 FROM products WHERE deleted_at IS NULL LIMIT 1;
  SELECT id INTO link_id_1 FROM affiliate_links WHERE affiliate_id = affiliate_id_1 LIMIT 1;

  -- Commission 1: Payée
  IF affiliate_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_commissions (
      affiliate_id,
      affiliate_link_id,
      product_id,
      store_id,
      order_total,
      commission_rate,
      commission_amount,
      status,
      paid_at
    ) VALUES (
      affiliate_id_1,
      link_id_1,
      product_id_1,
      store_id_1,
      100000,
      20.00,
      18000,
      'paid',
      NOW() - INTERVAL '5 days'
    );
  END IF;

  -- Commission 2: Approuvée (en attente de paiement)
  IF affiliate_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_commissions (
      affiliate_id,
      affiliate_link_id,
      product_id,
      store_id,
      order_total,
      commission_rate,
      commission_amount,
      status,
      approved_at
    ) VALUES (
      affiliate_id_1,
      link_id_1,
      product_id_1,
      store_id_1,
      150000,
      20.00,
      27000,
      'approved',
      NOW() - INTERVAL '2 days'
    );
  END IF;

  -- Commission 3: En attente d'approbation
  IF affiliate_id_2 IS NOT NULL THEN
    INSERT INTO affiliate_commissions (
      affiliate_id,
      affiliate_link_id,
      product_id,
      store_id,
      order_total,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      affiliate_id_2,
      (SELECT id FROM affiliate_links WHERE affiliate_id = affiliate_id_2 LIMIT 1),
      product_id_1,
      store_id_1,
      200000,
      20.00,
      36000,
      'pending'
    );
  END IF;

  -- Commission 4: En attente d'approbation
  IF affiliate_id_2 IS NOT NULL THEN
    INSERT INTO affiliate_commissions (
      affiliate_id,
      affiliate_link_id,
      product_id,
      store_id,
      order_total,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      affiliate_id_2,
      (SELECT id FROM affiliate_links WHERE affiliate_id = affiliate_id_2 LIMIT 1),
      product_id_1,
      store_id_1,
      120000,
      20.00,
      21600,
      'pending'
    );
  END IF;
END $$;

-- ============================================================
-- 5. CRÉER DES DEMANDES DE RETRAIT
-- ============================================================

DO $$
DECLARE
  affiliate_id_1 UUID;
  affiliate_id_2 UUID;
BEGIN
  SELECT id INTO affiliate_id_1 FROM affiliates WHERE affiliate_code = 'AFF001';
  SELECT id INTO affiliate_id_2 FROM affiliates WHERE affiliate_code = 'AFF002';

  -- Retrait 1: Complété
  IF affiliate_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_withdrawals (
      affiliate_id,
      amount,
      payment_method,
      payment_details,
      status,
      processed_at,
      payment_reference
    ) VALUES (
      affiliate_id_1,
      50000,
      'mobile_money',
      '{"phone": "+22612345678", "provider": "Orange Money"}',
      'completed',
      NOW() - INTERVAL '7 days',
      'TXN-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 10)
    );
  END IF;

  -- Retrait 2: En cours de traitement
  IF affiliate_id_1 IS NOT NULL THEN
    INSERT INTO affiliate_withdrawals (
      affiliate_id,
      amount,
      payment_method,
      payment_details,
      status,
      approved_at
    ) VALUES (
      affiliate_id_1,
      75000,
      'mobile_money',
      '{"phone": "+22612345678", "provider": "Moov Money"}',
      'processing',
      NOW() - INTERVAL '1 day'
    );
  END IF;

  -- Retrait 3: En attente d'approbation
  IF affiliate_id_2 IS NOT NULL THEN
    INSERT INTO affiliate_withdrawals (
      affiliate_id,
      amount,
      payment_method,
      payment_details,
      status
    ) VALUES (
      affiliate_id_2,
      80000,
      'mobile_money',
      '{"phone": "+22698765432", "provider": "Orange Money"}',
      'pending'
    );
  END IF;

  -- Retrait 4: En attente d'approbation
  IF affiliate_id_2 IS NOT NULL THEN
    INSERT INTO affiliate_withdrawals (
      affiliate_id,
      amount,
      payment_method,
      payment_details,
      status
    ) VALUES (
      affiliate_id_2,
      50000,
      'bank_transfer',
      '{"bank": "Ecobank", "account": "BF12345678901234567890"}',
      'pending'
    );
  END IF;
END $$;

-- ============================================================
-- 6. CRÉER DES CLICS DE TEST
-- ============================================================

DO $$
DECLARE
  link_id UUID;
BEGIN
  -- Récupérer un lien
  SELECT id INTO link_id FROM affiliate_links LIMIT 1;

  IF link_id IS NOT NULL THEN
    -- Créer quelques clics récents
    INSERT INTO affiliate_clicks (
      affiliate_link_id,
      affiliate_id,
      product_id,
      ip_address,
      user_agent,
      referer,
      device_type,
      cookie_value
    )
    SELECT 
      link_id,
      (SELECT affiliate_id FROM affiliate_links WHERE id = link_id),
      (SELECT product_id FROM affiliate_links WHERE id = link_id),
      '192.168.1.' || (RANDOM() * 255)::INT,
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'https://google.com',
      CASE WHEN RANDOM() < 0.5 THEN 'desktop' ELSE 'mobile' END,
      'aff_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 20)
    FROM generate_series(1, 10);
  END IF;
END $$;

-- ============================================================
-- FIN DU SCRIPT DE TEST
-- ============================================================

SELECT 
  '✅ Données de test créées avec succès !' as message,
  (SELECT COUNT(*) FROM affiliates) as total_affiliates,
  (SELECT COUNT(*) FROM affiliate_links) as total_links,
  (SELECT COUNT(*) FROM affiliate_commissions) as total_commissions,
  (SELECT COUNT(*) FROM affiliate_withdrawals) as total_withdrawals,
  (SELECT COUNT(*) FROM affiliate_clicks) as total_clicks;

*/

-- ============================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================

-- 1. Supprimer les commentaires /* */ autour du script
-- 2. Exécuter dans le SQL Editor de Supabase
-- 3. Vérifier les résultats dans les tables

-- Pour SUPPRIMER les données de test :
/*
DELETE FROM affiliate_clicks;
DELETE FROM affiliate_withdrawals;
DELETE FROM affiliate_commissions;
DELETE FROM affiliate_links;
DELETE FROM product_affiliate_settings;
DELETE FROM affiliates WHERE email LIKE '%@test.com';
*/

