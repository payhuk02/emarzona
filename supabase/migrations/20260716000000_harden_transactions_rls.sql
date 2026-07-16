-- ============================================================
-- RLS Harden Phase : Transactions UPDATE policies
-- Date: 2026-07-16
--
-- Supprimer la politique permettant aux clients de modifier
-- arbitrairement leurs propres transactions (faille critique).
-- ============================================================

BEGIN;

-- 1. DROP la politique insecure
DROP POLICY IF EXISTS "Customers can update their own transactions" ON transactions;

-- Note : Les autres politiques sur les transactions (Admin et Store Owners) restent intactes.
-- Les transactions seront créées par le backend (Service Role) et consultées par les clients.

COMMIT;
