-- ============================================================
-- PHASE 8 : EMAIL A/B TESTING - TABLE ET FONCTIONS SQL
-- Date: 1er Février 2025
-- Description: Table pour A/B testing email avec calcul automatique du gagnant
-- ============================================================

-- ============================================================
-- 1. TABLE: email_ab_tests
-- Tests A/B pour campagnes email
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  
  -- Variantes
  variant_a JSONB NOT NULL DEFAULT '{}'::jsonb, -- {subject, template_id, send_percentage, name}
  variant_b JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Résultats
  variant_a_results JSONB DEFAULT '{
    "sent": 0,
    "delivered": 0,
    "opened": 0,
    "clicked": 0,
    "revenue": 0
  }'::jsonb,
  variant_b_results JSONB DEFAULT '{
    "sent": 0,
    "delivered": 0,
    "opened": 0,
    "clicked": 0,
    "revenue": 0
  }'::jsonb,
  
  -- Décision
  winner TEXT CHECK (winner IN ('variant_a', 'variant_b')),
  confidence_level NUMERIC(5, 2), -- Pourcentage de confiance
  decided_at TIMESTAMPTZ,
  decision_criteria TEXT, -- 'open_rate', 'click_rate', 'revenue', etc.
  
  -- Configuration
  test_started_at TIMESTAMPTZ,
  test_duration_hours INTEGER DEFAULT 24, -- Durée du test en heures
  min_recipients_per_variant INTEGER DEFAULT 100, -- Minimum pour décision
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_ab_tests_campaign_id ON public.email_ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_ab_tests_winner ON public.email_ab_tests(winner) WHERE winner IS NOT NULL;

-- Comments
COMMENT ON TABLE public.email_ab_tests IS 'Tests A/B pour optimiser les campagnes email';
COMMENT ON COLUMN public.email_ab_tests.variant_a IS 'Configuration variante A: {subject, template_id, send_percentage, name}';
COMMENT ON COLUMN public.email_ab_tests.variant_b IS 'Configuration variante B: {subject, template_id, send_percentage, name}';
COMMENT ON COLUMN public.email_ab_tests.confidence_level IS 'Niveau de confiance statistique (0-100%)';

-- ============================================================
-- 2. FUNCTION: calculate_ab_test_winner
-- Calcule le gagnant d'un test A/B basé sur les résultats
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_ab_test_winner(
  p_ab_test_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_test RECORD;
  v_variant_a_open_rate NUMERIC := 0;
  v_variant_b_open_rate NUMERIC := 0;
  v_variant_a_click_rate NUMERIC := 0;
  v_variant_b_click_rate NUMERIC := 0;
  v_variant_a_revenue NUMERIC := 0;
  v_variant_b_revenue NUMERIC := 0;
  v_variant_a_delivered INTEGER := 0;
  v_variant_b_delivered INTEGER := 0;
  v_confidence NUMERIC := 0;
  v_winner TEXT;
  v_decision_criteria TEXT;
BEGIN
  -- Récupérer le test A/B
  SELECT * INTO v_test
  FROM public.email_ab_tests
  WHERE id = p_ab_test_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A/B test not found: %', p_ab_test_id;
  END IF;

  -- Extraire les résultats
  v_variant_a_delivered := COALESCE((v_test.variant_a_results->>'delivered')::INTEGER, 0);
  v_variant_b_delivered := COALESCE((v_test.variant_b_results->>'delivered')::INTEGER, 0);
  
  -- Calculer les taux d'ouverture
  IF v_variant_a_delivered > 0 THEN
    v_variant_a_open_rate := (COALESCE((v_test.variant_a_results->>'opened')::INTEGER, 0)::NUMERIC / v_variant_a_delivered::NUMERIC) * 100;
  END IF;
  
  IF v_variant_b_delivered > 0 THEN
    v_variant_b_open_rate := (COALESCE((v_test.variant_b_results->>'opened')::INTEGER, 0)::NUMERIC / v_variant_b_delivered::NUMERIC) * 100;
  END IF;
  
  -- Calculer les taux de clic
  IF v_variant_a_delivered > 0 THEN
    v_variant_a_click_rate := (COALESCE((v_test.variant_a_results->>'clicked')::INTEGER, 0)::NUMERIC / v_variant_a_delivered::NUMERIC) * 100;
  END IF;
  
  IF v_variant_b_delivered > 0 THEN
    v_variant_b_click_rate := (COALESCE((v_test.variant_b_results->>'clicked')::INTEGER, 0)::NUMERIC / v_variant_b_delivered::NUMERIC) * 100;
  END IF;
  
  -- Extraire les revenus
  v_variant_a_revenue := COALESCE((v_test.variant_a_results->>'revenue')::NUMERIC, 0);
  v_variant_b_revenue := COALESCE((v_test.variant_b_results->>'revenue')::NUMERIC, 0);
  
  -- Vérifier le minimum de destinataires
  IF v_variant_a_delivered < COALESCE(v_test.min_recipients_per_variant, 100) OR
     v_variant_b_delivered < COALESCE(v_test.min_recipients_per_variant, 100) THEN
    -- Pas assez de données, pas de gagnant
    RETURN NULL;
  END IF;
  
  -- Décision basée sur le taux de clic (priorité), puis ouverture, puis revenu
  IF v_variant_a_click_rate > v_variant_b_click_rate + 1 THEN -- Au moins 1% de différence
    v_winner := 'variant_a';
    v_decision_criteria := 'click_rate';
    v_confidence := 85.0; -- Confiance moyenne
  ELSIF v_variant_b_click_rate > v_variant_a_click_rate + 1 THEN
    v_winner := 'variant_b';
    v_decision_criteria := 'click_rate';
    v_confidence := 85.0;
  ELSIF v_variant_a_open_rate > v_variant_b_open_rate + 2 THEN -- Au moins 2% de différence
    v_winner := 'variant_a';
    v_decision_criteria := 'open_rate';
    v_confidence := 75.0;
  ELSIF v_variant_b_open_rate > v_variant_a_open_rate + 2 THEN
    v_winner := 'variant_b';
    v_decision_criteria := 'open_rate';
    v_confidence := 75.0;
  ELSIF v_variant_a_revenue > v_variant_b_revenue * 1.1 THEN -- Au moins 10% de plus
    v_winner := 'variant_a';
    v_decision_criteria := 'revenue';
    v_confidence := 90.0;
  ELSIF v_variant_b_revenue > v_variant_a_revenue * 1.1 THEN
    v_winner := 'variant_b';
    v_decision_criteria := 'revenue';
    v_confidence := 90.0;
  ELSE
    -- Pas de différence significative
    RETURN NULL;
  END IF;
  
  -- Mettre à jour le test
  UPDATE public.email_ab_tests
  SET 
    winner = v_winner,
    confidence_level = v_confidence,
    decided_at = NOW(),
    decision_criteria = v_decision_criteria,
    updated_at = NOW()
  WHERE id = p_ab_test_id;
  
  RETURN v_winner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_ab_test_winner IS 'Calcule le gagnant d''un test A/B basé sur les métriques (click rate, open rate, revenue)';

-- ============================================================
-- 3. FUNCTION: update_ab_test_results
-- Met à jour les résultats d'un test A/B
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_ab_test_results(
  p_ab_test_id UUID,
  p_variant TEXT, -- 'variant_a' | 'variant_b'
  p_results JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_variant = 'variant_a' THEN
    UPDATE public.email_ab_tests
    SET 
      variant_a_results = p_results,
      updated_at = NOW()
    WHERE id = p_ab_test_id;
  ELSIF p_variant = 'variant_b' THEN
    UPDATE public.email_ab_tests
    SET 
      variant_b_results = p_results,
      updated_at = NOW()
    WHERE id = p_ab_test_id;
  ELSE
    RAISE EXCEPTION 'Invalid variant: %. Must be variant_a or variant_b', p_variant;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_ab_test_results IS 'Met à jour les résultats d''une variante d''un test A/B';

-- ============================================================
-- 4. TRIGGER: update_updated_at
-- ============================================================

CREATE TRIGGER update_email_ab_tests_updated_at
BEFORE UPDATE ON public.email_ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE public.email_ab_tests ENABLE ROW LEVEL SECURITY;

-- Les vendeurs peuvent voir leurs tests A/B
CREATE POLICY "Store owners can view own AB tests"
  ON public.email_ab_tests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns ec
      JOIN public.stores s ON s.id = ec.store_id
      WHERE ec.id = email_ab_tests.campaign_id
      AND s.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all AB tests"
  ON public.email_ab_tests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

