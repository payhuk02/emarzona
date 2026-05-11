-- ================================================================
-- Améliorations Subscriptions : Essais gratuits, Pauses, Upgrades/Downgrades
-- Date: 2025-01-27
-- ================================================================

-- Ajouter colonnes pour essais gratuits
ALTER TABLE public.digital_product_subscriptions
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_in_trial BOOLEAN DEFAULT false;

-- Ajouter colonnes pour pauses
ALTER TABLE public.digital_product_subscriptions
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pause_reason TEXT,
ADD COLUMN IF NOT EXISTS pause_count INTEGER DEFAULT 0;

-- Ajouter colonnes pour upgrades/downgrades
ALTER TABLE public.digital_product_subscriptions
ADD COLUMN IF NOT EXISTS previous_plan_id UUID REFERENCES public.digital_product_subscriptions(id),
ADD COLUMN IF NOT EXISTS upgrade_plan_id UUID, -- Plan vers lequel upgrade
ADD COLUMN IF NOT EXISTS downgrade_plan_id UUID, -- Plan vers lequel downgrade
ADD COLUMN IF NOT EXISTS plan_change_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_change_type TEXT CHECK (plan_change_type IN ('upgrade', 'downgrade', 'switch')),
ADD COLUMN IF NOT EXISTS prorated_amount NUMERIC(10, 2), -- Montant proraté pour changement de plan
ADD COLUMN IF NOT EXISTS plan_history JSONB DEFAULT '[]'::jsonb; -- Historique des changements de plan

-- Ajouter colonnes pour gestion des paiements
ALTER TABLE public.digital_product_subscriptions
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMPTZ, -- Date d'ancrage du cycle de facturation
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ; -- Fin de la période de grâce après échec

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial ON public.digital_product_subscriptions(trial_started_at, trial_ended_at) WHERE trial_days > 0;
CREATE INDEX IF NOT EXISTS idx_subscriptions_paused ON public.digital_product_subscriptions(is_paused, paused_until) WHERE is_paused = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_change ON public.digital_product_subscriptions(plan_change_scheduled_at) WHERE plan_change_scheduled_at IS NOT NULL;

-- Fonction pour mettre à jour is_in_trial
CREATE OR REPLACE FUNCTION update_subscription_trial_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer is_in_trial basé sur les conditions
  NEW.is_in_trial := (
    NEW.trial_days > 0 
    AND NEW.trial_started_at IS NOT NULL 
    AND (NEW.trial_ended_at IS NULL OR NEW.trial_ended_at > now())
    AND NEW.status = 'trialing'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour is_in_trial
DROP TRIGGER IF EXISTS update_subscription_trial_status_trigger ON public.digital_product_subscriptions;
CREATE TRIGGER update_subscription_trial_status_trigger
  BEFORE INSERT OR UPDATE OF trial_days, trial_started_at, trial_ended_at, status ON public.digital_product_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_trial_status();

-- Fonction pour démarrer un essai gratuit
CREATE OR REPLACE FUNCTION start_subscription_trial(
  p_subscription_id UUID,
  p_trial_days INTEGER
)
RETURNS void AS $$
DECLARE
  v_trial_start TIMESTAMPTZ;
  v_trial_end TIMESTAMPTZ;
BEGIN
  v_trial_start := now();
  v_trial_end := v_trial_start + (p_trial_days || ' days')::INTERVAL;
  
  UPDATE public.digital_product_subscriptions
  SET 
    trial_days = p_trial_days,
    trial_started_at = v_trial_start,
    trial_ended_at = v_trial_end,
    status = 'trialing',
    current_period_start = v_trial_start,
    current_period_end = v_trial_end
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre en pause une subscription
CREATE OR REPLACE FUNCTION pause_subscription(
  p_subscription_id UUID,
  p_paused_until TIMESTAMPTZ,
  p_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.digital_product_subscriptions
  SET 
    is_paused = true,
    paused_at = now(),
    paused_until = p_paused_until,
    pause_reason = p_reason,
    pause_count = pause_count + 1,
    status = CASE 
      WHEN status = 'active' THEN 'paused'
      ELSE status
    END
  WHERE id = p_subscription_id AND status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour reprendre une subscription en pause
CREATE OR REPLACE FUNCTION resume_subscription(
  p_subscription_id UUID
)
RETURNS void AS $$
DECLARE
  v_period_end TIMESTAMPTZ;
  v_days_paused INTEGER;
BEGIN
  -- Calculer les jours en pause pour ajuster la période
  SELECT 
    EXTRACT(DAY FROM (now() - paused_at))::INTEGER,
    current_period_end
  INTO v_days_paused, v_period_end
  FROM public.digital_product_subscriptions
  WHERE id = p_subscription_id;
  
  -- Ajuster la fin de période en ajoutant les jours en pause
  UPDATE public.digital_product_subscriptions
  SET 
    is_paused = false,
    paused_at = NULL,
    paused_until = NULL,
    pause_reason = NULL,
    status = 'active',
    current_period_end = COALESCE(v_period_end, now()) + (v_days_paused || ' days')::INTERVAL
  WHERE id = p_subscription_id AND is_paused = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour planifier un upgrade/downgrade
CREATE OR REPLACE FUNCTION schedule_plan_change(
  p_subscription_id UUID,
  p_new_subscription_id UUID,
  p_change_type TEXT, -- 'upgrade' ou 'downgrade'
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_prorated_amount NUMERIC DEFAULT 0
)
RETURNS void AS $$
DECLARE
  v_old_price NUMERIC;
  v_new_price NUMERIC;
  v_old_plan_id UUID;
  v_prorated NUMERIC;
BEGIN
  -- Récupérer le prix de l'ancien plan
  SELECT subscription_price INTO v_old_price
  FROM public.digital_product_subscriptions
  WHERE id = p_subscription_id;
  
  -- Récupérer le prix du nouveau plan
  SELECT subscription_price INTO v_new_price
  FROM public.digital_product_subscriptions
  WHERE id = p_new_subscription_id;
  
  v_old_plan_id := p_subscription_id;
  v_prorated := COALESCE(p_prorated_amount, 0);
  
  -- Si pas de montant proraté fourni, calculer automatiquement
  IF v_prorated = 0 THEN
    -- Calcul basique de proratation (basé sur les jours restants)
    DECLARE
      v_days_remaining INTEGER;
      v_days_in_period INTEGER;
    BEGIN
      SELECT 
        EXTRACT(DAY FROM (current_period_end - now()))::INTEGER,
        EXTRACT(DAY FROM (current_period_end - current_period_start))::INTEGER
      INTO v_days_remaining, v_days_in_period
      FROM public.digital_product_subscriptions
      WHERE id = p_subscription_id;
      
      IF v_days_in_period > 0 THEN
        -- Calculer le crédit pour l'ancien plan et le débit pour le nouveau
        v_prorated := (v_new_price - v_old_price) * (v_days_remaining::NUMERIC / v_days_in_period::NUMERIC);
      END IF;
    END;
  END IF;
  
  -- Mettre à jour la subscription
  UPDATE public.digital_product_subscriptions
  SET 
    previous_plan_id = v_old_plan_id,
    upgrade_plan_id = CASE WHEN p_change_type = 'upgrade' THEN p_new_subscription_id ELSE NULL END,
    downgrade_plan_id = CASE WHEN p_change_type = 'downgrade' THEN p_new_subscription_id ELSE NULL END,
    plan_change_scheduled_at = COALESCE(p_scheduled_at, now()),
    plan_change_type = p_change_type,
    prorated_amount = v_prorated,
    plan_history = plan_history || jsonb_build_object(
      'change_type', p_change_type,
      'from_plan', v_old_plan_id,
      'to_plan', p_new_subscription_id,
      'prorated_amount', v_prorated,
      'scheduled_at', COALESCE(p_scheduled_at, now())
    )
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour appliquer un changement de plan
CREATE OR REPLACE FUNCTION apply_plan_change(
  p_subscription_id UUID
)
RETURNS void AS $$
DECLARE
  v_new_plan_id UUID;
  v_change_type TEXT;
  v_new_subscription_data RECORD;
BEGIN
  -- Récupérer les infos du changement planifié
  SELECT 
    upgrade_plan_id,
    downgrade_plan_id,
    plan_change_type
  INTO v_new_plan_id, v_change_type
  FROM public.digital_product_subscriptions
  WHERE id = p_subscription_id;
  
  IF v_new_plan_id IS NULL THEN
    v_new_plan_id := (
      SELECT COALESCE(upgrade_plan_id, downgrade_plan_id)
      FROM public.digital_product_subscriptions
      WHERE id = p_subscription_id
    );
  END IF;
  
  IF v_new_plan_id IS NULL THEN
    RAISE EXCEPTION 'No plan change scheduled for this subscription';
  END IF;
  
  -- Récupérer les données du nouveau plan
  SELECT * INTO v_new_subscription_data
  FROM public.digital_product_subscriptions
  WHERE id = v_new_plan_id;
  
  -- Appliquer le changement
  UPDATE public.digital_product_subscriptions
  SET 
    subscription_interval = v_new_subscription_data.subscription_interval,
    subscription_price = v_new_subscription_data.subscription_price,
    previous_plan_id = id,
    upgrade_plan_id = NULL,
    downgrade_plan_id = NULL,
    plan_change_scheduled_at = NULL,
    plan_change_type = NULL,
    prorated_amount = 0,
    current_period_start = now(),
    current_period_end = CASE 
      WHEN subscription_interval = 'monthly' THEN now() + INTERVAL '1 month'
      WHEN subscription_interval = 'yearly' THEN now() + INTERVAL '1 year'
      WHEN subscription_interval = 'quarterly' THEN now() + INTERVAL '3 months'
      WHEN subscription_interval = 'weekly' THEN now() + INTERVAL '1 week'
      WHEN subscription_interval = 'daily' THEN now() + INTERVAL '1 day'
      ELSE now() + INTERVAL '1 month'
    END
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON COLUMN public.digital_product_subscriptions.trial_days IS 'Nombre de jours d''essai gratuit';
COMMENT ON COLUMN public.digital_product_subscriptions.is_paused IS 'Indique si la subscription est en pause';
COMMENT ON COLUMN public.digital_product_subscriptions.plan_change_type IS 'Type de changement de plan planifié (upgrade, downgrade, switch)';

