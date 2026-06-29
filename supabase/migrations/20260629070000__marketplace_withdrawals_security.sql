-- ==========================================================
-- Migration: Sécurisation critique des retraits vendeurs
-- Date: 29 Juin 2026
-- ==========================================================

BEGIN;

-- 1. Nettoyage des anciennes politiques permissives (La faille "FOR ALL")
DROP POLICY IF EXISTS "Store owners manage withdrawals" ON public.store_withdrawals;

-- 2. Restauration des politiques RLS strictes et granulaires
-- SELECT : Les vendeurs voient leurs propres retraits
CREATE POLICY "Store owners view own withdrawals" 
  ON public.store_withdrawals 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_withdrawals.store_id AND stores.user_id = auth.uid())
  );

-- UPDATE : Les vendeurs ne peuvent que passer un statut de 'pending' à 'cancelled'
CREATE POLICY "Store owners cancel pending withdrawals" 
  ON public.store_withdrawals 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_withdrawals.store_id AND stores.user_id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_withdrawals.store_id AND stores.user_id = auth.uid())
    AND status = 'cancelled'
  );

-- INSERT : Totalement bloqué depuis l'API directe (REST) pour les vendeurs (géré par la fonction RPC)
-- (Seuls les admins ou les fonctions SECURITY DEFINER peuvent insérer)

-- 3. Fonction RPC sécurisée (Atomicité, Lock, Validation)
CREATE OR REPLACE FUNCTION public.request_store_withdrawal(
  p_store_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_payment_details JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.store_withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earnings RECORD;
  v_pending_amount NUMERIC := 0;
  v_available_after_pending NUMERIC := 0;
  v_min_withdrawal NUMERIC := 10000; -- Seuil minimum (10 000 XOF)
  v_withdrawal public.store_withdrawals;
BEGIN
  -- 1. Validation des droits : Est-ce bien le propriétaire du store ?
  IF NOT EXISTS (
    SELECT 1 FROM public.stores WHERE id = p_store_id AND user_id = auth.uid()
  ) AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès non autorisé au portefeuille de cette boutique.';
  END IF;

  -- 2. Validation du montant minimal
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Le montant minimum de retrait est de % XOF', v_min_withdrawal;
  END IF;

  -- 3. Verrouillage et calcul des revenus (Locking row to prevent race conditions)
  -- Assurons-nous d'abord que les revenus sont à jour
  PERFORM public.update_store_earnings(p_store_id);

  -- Récupérer le solde disponible calculé
  SELECT * INTO v_earnings 
  FROM public.store_earnings 
  WHERE store_id = p_store_id 
  FOR UPDATE; -- Verrou exclusif

  IF v_earnings IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable pour ce store.';
  END IF;

  IF v_earnings.withdrawals_blocked THEN
    RAISE EXCEPTION 'Les retraits sont bloqués pour cette boutique: %', v_earnings.withdrawals_blocked_reason;
  END IF;

  -- 4. Calculer l'argent déjà réservé pour des retraits en cours
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_amount
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status IN ('pending', 'processing');

  v_available_after_pending := v_earnings.available_balance - v_pending_amount;

  -- 5. Validation de solvabilité stricte
  IF p_amount > v_available_after_pending THEN
    RAISE EXCEPTION 'Solde insuffisant. Disponible après retraits en attente : % XOF', v_available_after_pending;
  END IF;

  -- 6. Insertion du retrait validé
  INSERT INTO public.store_withdrawals (
    store_id,
    user_id,
    amount,
    currency,
    payment_method,
    payment_details,
    notes,
    status,
    withdrawal_source
  ) VALUES (
    p_store_id,
    auth.uid(),
    p_amount,
    'XOF',
    p_payment_method,
    COALESCE(p_payment_details, '{}'::jsonb),
    p_notes,
    'pending',
    'manual'
  ) RETURNING * INTO v_withdrawal;

  RETURN v_withdrawal;
END;
$$;

COMMIT;
