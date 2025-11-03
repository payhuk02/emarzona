-- ================================================================
-- Recurring Bookings System - Système de Réservations Récurrentes
-- Date: 26 Janvier 2025
-- Description: Permet de créer des séries de réservations récurrentes
-- ================================================================

-- Table pour stocker les patterns de récurrence
CREATE TABLE IF NOT EXISTS public.recurring_booking_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES public.service_staff_members(id) ON DELETE SET NULL,
  
  -- Pattern de récurrence
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN (
    'daily',      -- Quotidien
    'weekly',     -- Hebdomadaire
    'biweekly',   -- Bi-hebdomadaire
    'monthly',    -- Mensuel
    'custom'      -- Personnalisé
  )),
  
  -- Configuration récurrence
  interval_days INTEGER DEFAULT 1, -- Pour custom: tous les X jours
  days_of_week INTEGER[], -- Pour weekly: [0=Dim, 1=Lun, ..., 6=Sam]
  day_of_month INTEGER, -- Pour monthly: jour du mois (1-31)
  week_of_month INTEGER, -- Pour monthly: semaine du mois (1-4)
  occurrence_limit INTEGER, -- Nombre max d'occurrences (NULL = illimité)
  date_limit DATE, -- Date limite (NULL = pas de limite)
  
  -- Horaires
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = récurrence infinie
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'active',     -- Active, génère des réservations
    'paused',     -- En pause, ne génère plus de réservations
    'cancelled',  -- Annulée
    'completed'   -- Terminée (atteint la limite)
  )) DEFAULT 'active',
  
  -- Métadonnées
  title TEXT, -- Titre personnalisé pour la série
  notes TEXT,
  customer_notes TEXT,
  
  -- Statistiques
  total_occurrences INTEGER DEFAULT 0,
  created_occurrences INTEGER DEFAULT 0,
  skipped_occurrences INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recurring_booking_patterns
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_product_id ON public.recurring_booking_patterns(product_id);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_user_id ON public.recurring_booking_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_status ON public.recurring_booking_patterns(status);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_start_date ON public.recurring_booking_patterns(start_date);

-- Ajouter colonne à service_bookings pour lier aux patterns
ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS recurring_pattern_id UUID REFERENCES public.recurring_booking_patterns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS occurrence_number INTEGER, -- Numéro dans la série (1, 2, 3, ...)
ADD COLUMN IF NOT EXISTS is_from_recurring BOOLEAN DEFAULT false;

-- Index pour la colonne ajoutée
CREATE INDEX IF NOT EXISTS idx_service_bookings_recurring_pattern ON public.service_bookings(recurring_pattern_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_occurrence_number ON public.service_bookings(recurring_pattern_id, occurrence_number);

-- Fonction pour générer les occurrences d'un pattern
CREATE OR REPLACE FUNCTION generate_recurring_bookings(
  p_pattern_id UUID,
  p_generate_count INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
  v_pattern RECORD;
  v_current_date DATE;
  v_end_date DATE;
  v_occurrence_count INTEGER := 0;
  v_booking_date DATE;
  v_is_valid BOOLEAN;
  v_day_of_week INTEGER;
  v_week_number INTEGER;
  v_day_of_month INTEGER;
BEGIN
  -- Récupérer le pattern
  SELECT * INTO v_pattern
  FROM public.recurring_booking_patterns
  WHERE id = p_pattern_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pattern not found or not active';
  END IF;
  
  v_current_date := v_pattern.start_date;
  v_end_date := COALESCE(v_pattern.end_date, v_pattern.date_limit, CURRENT_DATE + INTERVAL '1 year');
  
  -- Générer les occurrences
  WHILE v_current_date <= v_end_date AND 
        (v_pattern.occurrence_limit IS NULL OR v_pattern.created_occurrences < v_pattern.occurrence_limit) AND
        v_occurrence_count < p_generate_count LOOP
    
    -- Vérifier si cette date est valide selon le pattern
    v_is_valid := false;
    
    CASE v_pattern.recurrence_type
      WHEN 'daily' THEN
        v_is_valid := true;
        
      WHEN 'weekly' THEN
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        v_is_valid := v_day_of_week = ANY(v_pattern.days_of_week);
        
      WHEN 'biweekly' THEN
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        -- Vérifier si on est à 2 semaines d'intervalle depuis start_date
        IF (v_current_date - v_pattern.start_date) % 14 = 0 THEN
          v_is_valid := v_day_of_week = ANY(ARRAY[EXTRACT(DOW FROM v_pattern.start_date)]);
        END IF;
        
      WHEN 'monthly' THEN
        IF v_pattern.day_of_month IS NOT NULL THEN
          v_day_of_month := EXTRACT(DAY FROM v_current_date);
          v_is_valid := v_day_of_month = v_pattern.day_of_month;
        ELSIF v_pattern.week_of_month IS NOT NULL AND v_pattern.days_of_week IS NOT NULL THEN
          v_day_of_week := EXTRACT(DOW FROM v_current_date);
          v_week_number := EXTRACT(WEEK FROM v_current_date) - EXTRACT(WEEK FROM DATE_TRUNC('month', v_current_date)) + 1;
          v_is_valid := v_day_of_week = ANY(v_pattern.days_of_week) AND v_week_number = v_pattern.week_of_month;
        END IF;
        
      WHEN 'custom' THEN
        -- Vérifier interval_days
        IF (v_current_date - v_pattern.start_date) % v_pattern.interval_days = 0 THEN
          v_is_valid := true;
        END IF;
    END CASE;
    
    -- Si la date est valide, créer la réservation
    IF v_is_valid THEN
      INSERT INTO public.service_bookings (
        product_id,
        user_id,
        provider_id,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        timezone,
        status,
        customer_notes,
        recurring_pattern_id,
        occurrence_number,
        is_from_recurring,
        created_at
      )
      VALUES (
        v_pattern.product_id,
        v_pattern.user_id,
        (SELECT provider_id FROM public.service_staff_members WHERE id = v_pattern.staff_member_id LIMIT 1),
        v_current_date,
        v_pattern.start_time,
        (v_pattern.start_time + (v_pattern.duration_minutes || ' minutes')::INTERVAL)::TIME,
        v_pattern.timezone,
        'pending',
        v_pattern.customer_notes,
        p_pattern_id,
        v_pattern.created_occurrences + 1,
        true,
        NOW()
      );
      
      v_occurrence_count := v_occurrence_count + 1;
      
      -- Mettre à jour le compteur
      UPDATE public.recurring_booking_patterns
      SET created_occurrences = created_occurrences + 1,
          updated_at = NOW()
      WHERE id = p_pattern_id;
    END IF;
    
    -- Passer à la date suivante
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_occurrence_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour annuler toutes les occurrences futures d'un pattern
CREATE OR REPLACE FUNCTION cancel_future_recurring_bookings(
  p_pattern_id UUID,
  p_cancel_from_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  UPDATE public.service_bookings
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancelled_by = (SELECT user_id FROM public.recurring_booking_patterns WHERE id = p_pattern_id),
      cancellation_reason = 'Cancelled from recurring pattern',
      updated_at = NOW()
  WHERE recurring_pattern_id = p_pattern_id
    AND scheduled_date >= p_cancel_from_date
    AND status NOT IN ('completed', 'cancelled');
  
  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  
  -- Mettre à jour le pattern
  UPDATE public.recurring_booking_patterns
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_pattern_id;
  
  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour replanifier toutes les occurrences futures
CREATE OR REPLACE FUNCTION reschedule_recurring_bookings(
  p_pattern_id UUID,
  p_new_start_date DATE,
  p_reschedule_from_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_pattern RECORD;
  v_date_offset INTEGER;
  v_rescheduled_count INTEGER := 0;
  v_booking RECORD;
BEGIN
  -- Récupérer le pattern
  SELECT * INTO v_pattern
  FROM public.recurring_booking_patterns
  WHERE id = p_pattern_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pattern not found';
  END IF;
  
  -- Calculer l'offset de date
  v_date_offset := p_new_start_date - v_pattern.start_date;
  
  -- Mettre à jour les réservations futures
  FOR v_booking IN
    SELECT * FROM public.service_bookings
    WHERE recurring_pattern_id = p_pattern_id
      AND scheduled_date >= p_reschedule_from_date
      AND status NOT IN ('completed', 'cancelled')
  LOOP
    UPDATE public.service_bookings
    SET scheduled_date = scheduled_date + (v_date_offset || ' days')::INTERVAL,
        status = 'rescheduled',
        reschedule_count = reschedule_count + 1,
        updated_at = NOW()
    WHERE id = v_booking.id;
    
    v_rescheduled_count := v_rescheduled_count + 1;
  END LOOP;
  
  -- Mettre à jour le pattern
  UPDATE public.recurring_booking_patterns
  SET start_date = p_new_start_date,
      updated_at = NOW()
  WHERE id = p_pattern_id;
  
  RETURN v_rescheduled_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_recurring_patterns_updated_at
  BEFORE UPDATE ON public.recurring_booking_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.recurring_booking_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own recurring patterns
CREATE POLICY "Users can view own recurring patterns"
ON public.recurring_booking_patterns FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own recurring patterns
CREATE POLICY "Users can create own recurring patterns"
ON public.recurring_booking_patterns FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own recurring patterns
CREATE POLICY "Users can update own recurring patterns"
ON public.recurring_booking_patterns FOR UPDATE
USING (auth.uid() = user_id);

-- Service providers can view patterns for their services
CREATE POLICY "Providers can view patterns for their services"
ON public.recurring_booking_patterns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = recurring_booking_patterns.product_id
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  )
);

-- Commentaires
COMMENT ON TABLE public.recurring_booking_patterns IS 'Patterns de récurrence pour les réservations de services';
COMMENT ON FUNCTION generate_recurring_bookings IS 'Génère automatiquement les réservations selon un pattern de récurrence';
COMMENT ON FUNCTION cancel_future_recurring_bookings IS 'Annule toutes les réservations futures d''un pattern';
COMMENT ON FUNCTION reschedule_recurring_bookings IS 'Replanifie toutes les réservations futures d''un pattern';

