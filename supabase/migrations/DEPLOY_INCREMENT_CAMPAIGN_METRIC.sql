-- ============================================================
-- DEPLOY: increment_campaign_metric Function
-- Date: 2 Décembre 2025
-- 
-- Instructions:
-- 1. Copier tout le contenu de ce fichier
-- 2. Aller dans Supabase Dashboard > SQL Editor
-- 3. Coller et exécuter
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_campaign_metric(
  p_campaign_id UUID,
  p_metric_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_metrics JSONB;
  v_new_value INTEGER;
BEGIN
  -- Récupérer les métriques actuelles
  SELECT metrics INTO v_current_metrics
  FROM public.email_campaigns
  WHERE id = p_campaign_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;
  
  -- Initialiser les métriques si null
  IF v_current_metrics IS NULL THEN
    v_current_metrics := '{
      "sent": 0,
      "delivered": 0,
      "opened": 0,
      "clicked": 0,
      "bounced": 0,
      "unsubscribed": 0,
      "revenue": 0
    }'::jsonb;
  END IF;
  
  -- Extraire la clé de métrique (enlever le préfixe "metrics." si présent)
  DECLARE
    v_key TEXT := REPLACE(p_metric_key, 'metrics.', '');
  BEGIN
    -- Récupérer la valeur actuelle
    v_new_value := COALESCE((v_current_metrics->>v_key)::INTEGER, 0) + p_increment;
    
    -- Mettre à jour la métrique
    v_current_metrics := jsonb_set(
      v_current_metrics,
      ARRAY[v_key],
      to_jsonb(v_new_value)
    );
  END;
  
  -- Mettre à jour la campagne
  UPDATE public.email_campaigns
  SET 
    metrics = v_current_metrics,
    updated_at = NOW()
  WHERE id = p_campaign_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_campaign_metric IS 
'Incrémente atomiquement une métrique spécifique d''une campagne email. 
Utilisé par les webhooks SendGrid pour mettre à jour les métriques en temps réel.';

-- Permettre à authenticated users d'utiliser cette fonction via RPC
GRANT EXECUTE ON FUNCTION public.increment_campaign_metric(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_campaign_metric(UUID, TEXT, INTEGER) TO service_role;

