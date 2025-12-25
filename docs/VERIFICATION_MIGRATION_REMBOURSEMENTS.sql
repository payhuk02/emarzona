-- =========================================================
-- Vérification : Migration Correction store_earnings sur remboursements
-- Date : 30 Janvier 2025
-- Description : Vérifie que la fonction trigger_update_store_earnings_on_order
--               a bien été mise à jour pour gérer les remboursements
-- =========================================================

-- 1. Vérifier que la fonction existe et contient la logique de remboursement
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'trigger_update_store_earnings_on_order';

-- 2. Vérifier que le trigger existe et est actif
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'update_store_earnings_on_order';

-- 3. Vérifier la structure de la table orders pour payment_status
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name = 'payment_status';

-- 4. Vérifier qu'il y a des orders avec payment_status = 'refunded' (si applicable)
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
  COUNT(*) FILTER (WHERE payment_status = 'refunded') as refunded_orders,
  COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_orders
FROM orders;


