-- =====================================================
-- RECURRING BOOKINGS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de réservations récurrentes pour services
-- =====================================================

-- =====================================================
-- 1. EXTEND service_bookings TABLE
-- =====================================================

DO $$
BEGIN
  -- Ajouter colonnes pour récurrence
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_pattern TEXT;
    COMMENT ON COLUMN public.service_bookings.recurrence_pattern IS 'Pattern de recurrence: daily, weekly, monthly, custom';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_interval'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
    COMMENT ON COLUMN public.service_bookings.recurrence_interval IS 'Intervalle de recurrence (ex: toutes les 2 semaines = 2)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_end_date DATE;
    COMMENT ON COLUMN public.service_bookings.recurrence_end_date IS 'Date de fin de la serie recurrente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_count'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_count INTEGER;
    COMMENT ON COLUMN public.service_bookings.recurrence_count IS 'Nombre total de reservations dans la serie';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'parent_booking_id'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN parent_booking_id UUID REFERENCES public.service_bookings(id) ON DELETE CASCADE;
    COMMENT ON COLUMN public.service_bookings.parent_booking_id IS 'ID de la reservation parente (premiere de la serie)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.service_bookings.is_recurring IS 'Indique si cette reservation fait partie d''une serie recurrente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_days_of_week'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_days_of_week INTEGER[];
    COMMENT ON COLUMN public.service_bookings.recurrence_days_of_week IS 'Jours de la semaine pour recurrence hebdomadaire (0=Dimanche, 6=Samedi)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_day_of_month'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_day_of_month INTEGER;
    COMMENT ON COLUMN public.service_bookings.recurrence_day_of_month IS 'Jour du mois pour recurrence mensuelle (1-31)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'recurrence_exceptions'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN recurrence_exceptions DATE[];
    COMMENT ON COLUMN public.service_bookings.recurrence_exceptions IS 'Dates exclues de la serie recurrente';
  END IF;
END $$;

-- =====================================================
-- 2. CREATE recurring_bookings_series TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recurring_bookings_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  
  -- Récurrence config
  recurrence_pattern TEXT NOT NULL CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date DATE,
  recurrence_count INTEGER,
  recurrence_days_of_week INTEGER[], -- Pour weekly
  recurrence_day_of_month INTEGER, -- Pour monthly
  
  -- Exceptions
  recurrence_exceptions DATE[] DEFAULT '{}',
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rbs_parent_booking_id ON public.recurring_bookings_series(parent_booking_id);
CREATE INDEX IF NOT EXISTS idx_rbs_store_id ON public.recurring_bookings_series(store_id);
CREATE INDEX IF NOT EXISTS idx_rbs_service_product_id ON public.recurring_bookings_series(service_product_id);
CREATE INDEX IF NOT EXISTS idx_rbs_is_active ON public.recurring_bookings_series(is_active);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Supprimer toutes les anciennes versions des fonctions si elles existent
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Supprimer toutes les variantes de generate_recurring_bookings
  FOR r IN 
    SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc
    WHERE proname = 'generate_recurring_bookings'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.generate_recurring_bookings(' || r.args || ') CASCADE';
  END LOOP;

  -- Supprimer toutes les variantes de cancel_recurring_series
  FOR r IN 
    SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc
    WHERE proname = 'cancel_recurring_series'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.cancel_recurring_series(' || r.args || ') CASCADE';
  END LOOP;
END $$;

-- Fonction pour générer les réservations récurrentes

CREATE OR REPLACE FUNCTION public.generate_recurring_bookings(
  p_parent_booking_id UUID,
  p_recurrence_pattern TEXT,
  p_recurrence_interval INTEGER DEFAULT 1,
  p_recurrence_end_date DATE DEFAULT NULL,
  p_recurrence_count INTEGER DEFAULT NULL,
  p_recurrence_days_of_week INTEGER[] DEFAULT NULL,
  p_recurrence_day_of_month INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_booking RECORD;
  v_current_date DATE;
  v_end_date DATE;
  v_count INTEGER := 0;
  v_generated_count INTEGER := 0;
  v_day_of_week INTEGER;
  v_is_valid_day BOOLEAN;
BEGIN
  -- Récupérer la réservation parente
  SELECT * INTO v_parent_booking
  FROM public.service_bookings
  WHERE id = p_parent_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent booking not found';
  END IF;

  -- Déterminer la date de fin
  IF p_recurrence_end_date IS NOT NULL THEN
    v_end_date := p_recurrence_end_date;
  ELSIF p_recurrence_count IS NOT NULL THEN
    -- Calculer la date de fin basée sur le nombre
    v_current_date := v_parent_booking.scheduled_date;
    CASE p_recurrence_pattern
      WHEN 'daily' THEN
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' months')::INTERVAL;
      ELSE
        v_end_date := v_current_date + (p_recurrence_count - 1) * (p_recurrence_interval || ' days')::INTERVAL;
    END CASE;
  ELSE
    -- Par défaut, 30 jours
    v_end_date := v_parent_booking.scheduled_date + INTERVAL '30 days';
  END IF;

  -- Générer les réservations
  v_current_date := v_parent_booking.scheduled_date;

  WHILE v_current_date <= v_end_date AND (p_recurrence_count IS NULL OR v_generated_count < p_recurrence_count - 1) LOOP
    -- Calculer la prochaine date selon le pattern
    CASE p_recurrence_pattern
      WHEN 'daily' THEN
        v_current_date := v_current_date + (p_recurrence_interval || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        -- Trouver le prochain jour valide
        LOOP
          v_current_date := v_current_date + INTERVAL '1 day';
          v_day_of_week := EXTRACT(DOW FROM v_current_date);
          
          IF p_recurrence_days_of_week IS NULL OR v_day_of_week = ANY(p_recurrence_days_of_week) THEN
            EXIT;
          END IF;
          
          -- Si on dépasse la date de fin, sortir
          IF v_current_date > v_end_date THEN
            EXIT;
          END IF;
        END LOOP;
        
        -- Si on a atteint la date de fin, sortir de la boucle principale
        IF v_current_date > v_end_date THEN
          EXIT;
        END IF;
        
        -- Avancer de l'intervalle de semaines
        v_current_date := v_current_date + (p_recurrence_interval - 1 || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        -- Trouver le jour du mois suivant
        IF p_recurrence_day_of_month IS NOT NULL THEN
          v_current_date := DATE_TRUNC('month', v_current_date) + INTERVAL '1 month' + (p_recurrence_day_of_month - 1 || ' days')::INTERVAL;
        ELSE
          v_current_date := v_current_date + (p_recurrence_interval || ' months')::INTERVAL;
        END IF;
      ELSE
        v_current_date := v_current_date + (p_recurrence_interval || ' days')::INTERVAL;
    END CASE;

    -- Vérifier si la date est dans les exceptions
    IF v_parent_booking.recurrence_exceptions IS NOT NULL AND v_current_date = ANY(v_parent_booking.recurrence_exceptions) THEN
      CONTINUE;
    END IF;

    -- Vérifier si on ne dépasse pas la date de fin
    IF v_current_date > v_end_date THEN
      EXIT;
    END IF;

    -- Créer la réservation
    INSERT INTO public.service_bookings (
      product_id,
      user_id,
      provider_id,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      timezone,
      status,
      meeting_url,
      meeting_id,
      meeting_password,
      meeting_platform,
      customer_notes,
      provider_notes,
      internal_notes,
      payment_id,
      amount_paid,
      parent_booking_id,
      is_recurring,
      recurrence_pattern,
      recurrence_interval,
      recurrence_end_date,
      recurrence_count,
      recurrence_days_of_week,
      recurrence_day_of_month,
      recurrence_exceptions,
      staff_member_id,
      participants_count
    ) VALUES (
      v_parent_booking.product_id,
      v_parent_booking.user_id,
      v_parent_booking.provider_id,
      v_current_date,
      v_parent_booking.scheduled_start_time,
      v_parent_booking.scheduled_end_time,
      v_parent_booking.timezone,
      'pending',
      v_parent_booking.meeting_url,
      v_parent_booking.meeting_id,
      v_parent_booking.meeting_password,
      v_parent_booking.meeting_platform,
      v_parent_booking.customer_notes,
      v_parent_booking.provider_notes,
      v_parent_booking.internal_notes,
      v_parent_booking.payment_id,
      v_parent_booking.amount_paid,
      p_parent_booking_id,
      TRUE,
      p_recurrence_pattern,
      p_recurrence_interval,
      p_recurrence_end_date,
      p_recurrence_count,
      p_recurrence_days_of_week,
      p_recurrence_day_of_month,
      v_parent_booking.recurrence_exceptions,
      v_parent_booking.staff_member_id,
      v_parent_booking.participants_count
    );

    v_generated_count := v_generated_count + 1;
  END LOOP;

  -- Mettre à jour la série
  UPDATE public.recurring_bookings_series
  SET 
    total_bookings = v_generated_count + 1,
    updated_at = NOW()
  WHERE parent_booking_id = p_parent_booking_id;

  RETURN v_generated_count;
END;
$$;

-- Fonction pour annuler une série complète
-- Supprimer toutes les anciennes versions de la fonction si elles existent
DROP FUNCTION IF EXISTS public.cancel_recurring_series CASCADE;

CREATE OR REPLACE FUNCTION public.cancel_recurring_series(
  p_series_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Annuler toutes les réservations de la série
  UPDATE public.service_bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE parent_booking_id = (
    SELECT parent_booking_id FROM public.recurring_bookings_series WHERE id = p_series_id
  )
  AND status NOT IN ('completed', 'cancelled');

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

  -- Désactiver la série
  UPDATE public.recurring_bookings_series
  SET 
    is_active = FALSE,
    cancelled_bookings = cancelled_bookings + v_cancelled_count,
    updated_at = NOW()
  WHERE id = p_series_id;

  RETURN v_cancelled_count;
END;
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_recurring_bookings_series_updated_at
  BEFORE UPDATE ON public.recurring_bookings_series
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE public.recurring_bookings_series ENABLE ROW LEVEL SECURITY;

-- Policy pour les store owners
DROP POLICY IF EXISTS "store_owners_manage_recurring_series" ON public.recurring_bookings_series;
CREATE POLICY "store_owners_manage_recurring_series" ON public.recurring_bookings_series
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = recurring_bookings_series.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy pour les clients (lecture seule)
DROP POLICY IF EXISTS "customers_view_recurring_series" ON public.recurring_bookings_series;
CREATE POLICY "customers_view_recurring_series" ON public.recurring_bookings_series
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_bookings sb
      WHERE sb.id = recurring_bookings_series.parent_booking_id
      AND sb.user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE public.recurring_bookings_series IS 'Series de reservations recurrentes';
COMMENT ON FUNCTION public.generate_recurring_bookings IS 'Genere les reservations recurrentes a partir d''une reservation parente';
COMMENT ON FUNCTION public.cancel_recurring_series IS 'Annule toutes les reservations d''une serie recurrente';

