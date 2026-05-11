-- =====================================================
-- Fix RLS Policy for currency_conversion_logs
-- Date: 2 Février 2025
-- Description: Ajouter la politique INSERT manquante pour currency_conversion_logs
-- =====================================================

-- Ajouter la politique INSERT pour currency_conversion_logs
-- Permet aux utilisateurs authentifiés d'insérer des logs de conversion
DROP POLICY IF EXISTS "Authenticated users can insert conversion logs" ON public.currency_conversion_logs;
CREATE POLICY "Authenticated users can insert conversion logs"
  ON public.currency_conversion_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Modifier la fonction convert_currency pour qu'elle soit SECURITY DEFINER
-- Cela permet à la fonction d'insérer des logs même si l'utilisateur n'a pas directement les droits
-- La fonction s'exécutera avec les privilèges du propriétaire de la fonction (postgres)
DROP FUNCTION IF EXISTS convert_currency(NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT
) RETURNS NUMERIC 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
  v_converted_amount NUMERIC;
BEGIN
  -- Si même devise, retourner le montant tel quel
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;

  -- Récupérer le taux de change
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND is_active = TRUE
  ORDER BY last_updated DESC
  LIMIT 1;

  -- Si pas de taux direct, essayer la conversion inverse
  IF v_rate IS NULL THEN
    SELECT (1.0 / rate) INTO v_rate
    FROM public.exchange_rates
    WHERE from_currency = p_to_currency
      AND to_currency = p_from_currency
      AND is_active = TRUE
    ORDER BY last_updated DESC
    LIMIT 1;
  END IF;

  -- Si toujours pas de taux, lever une erreur
  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'Aucun taux de change trouvé pour % -> %', p_from_currency, p_to_currency;
  END IF;

  -- Calculer le montant converti
  v_converted_amount := p_amount * v_rate;

  -- Logger la conversion (maintenant possible grâce à SECURITY DEFINER)
  BEGIN
    INSERT INTO public.currency_conversion_logs (
      from_currency,
      to_currency,
      from_amount,
      to_amount,
      rate_used,
      context
    ) VALUES (
      p_from_currency,
      p_to_currency,
      p_amount,
      v_converted_amount,
      v_rate,
      'function_call'
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Si l'insertion échoue, on continue quand même (le log n'est pas critique)
      -- On peut logger l'erreur si nécessaire
      NULL;
  END;

  RETURN v_converted_amount;
END;
$$ LANGUAGE plpgsql;

-- Commentaire sur la fonction
COMMENT ON FUNCTION convert_currency IS 'Convertir un montant d''une devise à une autre. La fonction est SECURITY DEFINER pour permettre l''insertion de logs.';

