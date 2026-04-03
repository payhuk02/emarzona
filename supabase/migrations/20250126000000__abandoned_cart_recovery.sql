-- Migration: Système Abandoned Cart Recovery
-- Date: 26 Janvier 2025
-- Description: Fonction Edge Function pour envoyer emails automatiques de récupération paniers abandonnés

-- ============================================================
-- FUNCTION: track_abandoned_cart
-- Crée un enregistrement dans abandoned_carts quand panier inactif 1h
-- ============================================================

CREATE OR REPLACE FUNCTION public.track_abandoned_cart()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_items JSONB;
  v_total_amount NUMERIC;
  v_currency TEXT;
  v_customer_email TEXT;
BEGIN
  -- Ne créer que si panier non vidé (dernière modif > 1h)
  IF NEW.updated_at < now() - INTERVAL '1 hour' THEN
    -- Récupérer tous les items du panier
    SELECT 
      COALESCE(json_agg(row_to_json(cart_items.*)), '[]'::jsonb),
      COALESCE(SUM((unit_price - COALESCE(discount_amount, 0)) * quantity), 0),
      MAX(currency),
      -- Récupérer email utilisateur ou null
      (SELECT email FROM auth.users WHERE id = NEW.user_id)
    INTO v_cart_items, v_total_amount, v_currency, v_customer_email
    FROM cart_items
    WHERE (user_id = NEW.user_id AND NEW.user_id IS NOT NULL)
       OR (session_id = (SELECT session_id FROM cart_items WHERE id = NEW.id LIMIT 1));

    -- Vérifier si déjà tracké (pour éviter doublons)
    IF NOT EXISTS (
      SELECT 1 FROM abandoned_carts
      WHERE (user_id = NEW.user_id AND NEW.user_id IS NOT NULL)
         OR (session_id = (SELECT session_id FROM cart_items WHERE id = NEW.id LIMIT 1))
         AND recovered_at IS NULL
    ) THEN
      -- Créer abandoned cart
      INSERT INTO abandoned_carts (
        user_id,
        session_id,
        customer_email,
        cart_items,
        total_amount,
        currency
      )
      VALUES (
        NEW.user_id,
        (SELECT session_id FROM cart_items WHERE id = NEW.id LIMIT 1),
        v_customer_email,
        v_cart_items,
        v_total_amount,
        v_currency
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour détecter paniers abandonnés (après 1h d'inactivité)
-- Note: Ce trigger s'exécute sur UPDATE de cart_items
-- Pour un vrai système temps réel, utiliser Supabase Edge Function + Cron

COMMENT ON FUNCTION public.track_abandoned_cart IS 'Tracke automatiquement les paniers abandonnés après 1h d''inactivité';

-- ============================================================
-- FUNCTION: get_abandoned_carts_for_recovery
-- Récupère les paniers à récupérer (pour Edge Function)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_abandoned_carts_for_recovery(
  p_hours_ago INTEGER DEFAULT 1,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  session_id TEXT,
  customer_email TEXT,
  cart_items JSONB,
  total_amount NUMERIC,
  currency TEXT,
  recovery_attempts INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.user_id,
    ac.session_id,
    ac.customer_email,
    ac.cart_items,
    ac.total_amount,
    ac.currency,
    ac.recovery_attempts,
    ac.created_at
  FROM abandoned_carts ac
  WHERE ac.recovered_at IS NULL
    AND ac.recovery_attempts < p_max_attempts
    AND ac.created_at < now() - (p_hours_ago || ' hours')::INTERVAL
    AND (
      -- Vérifier que le panier n'a pas été récupéré (items toujours dans cart_items)
      EXISTS (
        SELECT 1 FROM cart_items ci
        WHERE (ci.user_id = ac.user_id AND ac.user_id IS NOT NULL)
           OR (ci.session_id = ac.session_id AND ac.session_id IS NOT NULL)
      )
    )
  ORDER BY ac.created_at ASC
  LIMIT 100; -- Limiter pour éviter surcharge
END;
$$;

COMMENT ON FUNCTION public.get_abandoned_carts_for_recovery IS 'Récupère les paniers abandonnés à notifier pour Edge Function de récupération';

-- ============================================================
-- FUNCTION: mark_recovery_email_sent
-- Marque qu'un email de récupération a été envoyé
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_recovery_email_sent(
  p_abandoned_cart_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE abandoned_carts
  SET 
    reminder_sent_at = COALESCE(reminder_sent_at, ARRAY[]::TIMESTAMPTZ[]) || now(),
    recovery_attempts = recovery_attempts + 1,
    updated_at = now()
  WHERE id = p_abandoned_cart_id;
END;
$$;

COMMENT ON FUNCTION public.mark_recovery_email_sent IS 'Marque qu''un email de récupération a été envoyé pour un panier abandonné';

-- ============================================================
-- FUNCTION: mark_cart_recovered
-- Marque qu'un panier a été récupéré (commande créée)
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_cart_recovered(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE abandoned_carts
  SET 
    recovered_at = now(),
    updated_at = now()
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_session_id IS NOT NULL AND session_id = p_session_id)
    AND recovered_at IS NULL;
END;
$$;

COMMENT ON FUNCTION public.mark_cart_recovered IS 'Marque qu''un panier abandonné a été récupéré (commande créée)';

