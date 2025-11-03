-- ============================================================================
-- VÉRIFICATION : Système Gift Cards
-- Exécutez ce script pour vérifier que tout est en place
-- ============================================================================

-- Vérifier les tables
SELECT 
  'Tables créées' as verification,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('gift_cards', 'gift_card_transactions');

-- Vérifier les types ENUM
SELECT 
  'Types ENUM créés' as verification,
  COUNT(*) as count
FROM pg_type 
WHERE typname IN ('gift_card_status', 'gift_card_transaction_type');

-- Vérifier les fonctions RPC
SELECT 
  'Fonctions RPC créées' as verification,
  COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('generate_gift_card_code', 'validate_gift_card', 'redeem_gift_card', 'get_gift_card_balance');

-- Vérifier les triggers
SELECT 
  'Triggers créés' as verification,
  COUNT(*) as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'gift_cards' 
AND t.tgname = 'update_gift_card_updated_at';

-- Vérifier les index
SELECT 
  'Index créés' as verification,
  COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('gift_cards', 'gift_card_transactions');

-- Vérifier les policies RLS
SELECT 
  'Policies RLS créées' as verification,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('gift_cards', 'gift_card_transactions');

-- Test de génération d'un code (ne crée pas de carte, juste teste la fonction)
SELECT 
  'Test fonction generate_gift_card_code' as verification,
  public.generate_gift_card_code() as code_genere;

