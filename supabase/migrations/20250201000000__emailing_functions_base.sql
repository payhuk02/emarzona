-- ============================================================
-- EMAILING AVANCÉ - FONCTIONS SQL DE BASE (Phase 1)
-- Date: 1er Février 2025
-- Description: Fonctions SQL essentielles pour le système d'emailing
-- ============================================================

-- ============================================================
-- 1. FUNCTION: calculate_dynamic_segment_members
-- Calcule les membres d'un segment dynamique
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_dynamic_segment_members(
  p_segment_id UUID
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  calculated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_criteria JSONB;
  v_type TEXT;
  v_store_id UUID;
BEGIN
  -- Récupérer les critères du segment
  SELECT criteria, type, store_id
  INTO v_criteria, v_type, v_store_id
  FROM public.email_segments
  WHERE id = p_segment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segment not found: %', p_segment_id;
  END IF;
  
  -- Pour l'instant, retourner une structure de base
  -- La logique complète sera implémentée selon les critères
  -- Cette fonction sera étendue dans les phases suivantes
  
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.email::TEXT AS email,
    NOW() AS calculated_at
  FROM auth.users u
  WHERE EXISTS (
    -- Logique de segmentation basique
    -- À étendre selon les critères
    SELECT 1
    FROM public.profiles p
    WHERE p.id = u.id
  )
  LIMIT 0; -- Placeholder, sera implémenté complètement plus tard
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_dynamic_segment_members IS 'Calcule les membres d''un segment dynamique basé sur les critères';

-- ============================================================
-- 2. FUNCTION: update_segment_member_count
-- Met à jour le nombre de membres d'un segment
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_segment_member_count(
  p_segment_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_type TEXT;
BEGIN
  -- Vérifier le type de segment
  SELECT type INTO v_type
  FROM public.email_segments
  WHERE id = p_segment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segment not found: %', p_segment_id;
  END IF;
  
  -- Pour les segments statiques, le count est géré manuellement
  -- Pour les segments dynamiques, on calculera plus tard
  -- Pour l'instant, on retourne 0
  
  -- Mettre à jour le segment
  UPDATE public.email_segments
  SET 
    member_count = COALESCE(v_count, 0),
    last_calculated_at = NOW()
  WHERE id = p_segment_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_segment_member_count IS 'Met à jour le nombre de membres d''un segment';

-- ============================================================
-- 3. FUNCTION: enroll_user_in_sequence
-- Inscrit un utilisateur dans une séquence d'emails
-- ============================================================

CREATE OR REPLACE FUNCTION public.enroll_user_in_sequence(
  p_sequence_id UUID,
  p_user_id UUID,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_first_step INTEGER;
  v_first_step_delay INTEGER;
  v_first_step_delay_type TEXT;
  v_next_email_at TIMESTAMPTZ;
BEGIN
  -- Vérifier que la séquence existe et est active
  IF NOT EXISTS (
    SELECT 1 FROM public.email_sequences
    WHERE id = p_sequence_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sequence not found or not active: %', p_sequence_id;
  END IF;
  
  -- Vérifier que l'utilisateur n'est pas déjà inscrit
  SELECT id INTO v_enrollment_id
  FROM public.email_sequence_enrollments
  WHERE sequence_id = p_sequence_id
  AND user_id = p_user_id
  AND status != 'cancelled';
  
  IF v_enrollment_id IS NOT NULL THEN
    -- Mettre à jour l'enrollment existant si nécessaire
    UPDATE public.email_sequence_enrollments
    SET 
      status = 'active',
      context = p_context,
      enrolled_at = NOW()
    WHERE id = v_enrollment_id
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
  END IF;
  
  -- Trouver la première étape de la séquence
  SELECT step_order, delay_value, delay_type
  INTO v_first_step, v_first_step_delay, v_first_step_delay_type
  FROM public.email_sequence_steps
  WHERE sequence_id = p_sequence_id
  ORDER BY step_order ASC
  LIMIT 1;
  
  -- Calculer la date du prochain email
  IF v_first_step_delay_type = 'immediate' THEN
    v_next_email_at := NOW();
  ELSIF v_first_step_delay_type = 'minutes' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' minutes')::INTERVAL;
  ELSIF v_first_step_delay_type = 'hours' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' hours')::INTERVAL;
  ELSIF v_first_step_delay_type = 'days' THEN
    v_next_email_at := NOW() + (v_first_step_delay || ' days')::INTERVAL;
  ELSE
    v_next_email_at := NOW();
  END IF;
  
  -- Créer l'enrollment
  INSERT INTO public.email_sequence_enrollments (
    sequence_id,
    user_id,
    status,
    current_step,
    next_email_at,
    context
  )
  VALUES (
    p_sequence_id,
    p_user_id,
    'active',
    COALESCE(v_first_step, 1),
    v_next_email_at,
    p_context
  )
  ON CONFLICT (sequence_id, user_id) DO UPDATE
  SET 
    status = 'active',
    current_step = COALESCE(v_first_step, 1),
    next_email_at = v_next_email_at,
    context = p_context,
    enrolled_at = NOW()
  RETURNING id INTO v_enrollment_id;
  
  -- Incrémenter le compteur de la séquence
  UPDATE public.email_sequences
  SET enrolled_count = enrolled_count + 1
  WHERE id = p_sequence_id
  AND NOT EXISTS (
    SELECT 1 FROM public.email_sequence_enrollments
    WHERE sequence_id = p_sequence_id
    AND user_id = p_user_id
    AND id != v_enrollment_id
  );
  
  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.enroll_user_in_sequence IS 'Inscrit un utilisateur dans une séquence d''emails';

-- ============================================================
-- 4. FUNCTION: get_next_sequence_emails_to_send
-- Récupère les prochains emails de séquence à envoyer
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_next_sequence_emails_to_send(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  enrollment_id UUID,
  sequence_id UUID,
  user_id UUID,
  step_id UUID,
  template_id UUID,
  recipient_email TEXT,
  context JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS enrollment_id,
    e.sequence_id,
    e.user_id,
    s.id AS step_id,
    s.template_id,
    u.email::TEXT AS recipient_email,
    e.context
  FROM public.email_sequence_enrollments e
  JOIN auth.users u ON u.id = e.user_id
  JOIN public.email_sequence_steps s ON s.sequence_id = e.sequence_id 
    AND s.step_order = e.current_step
  JOIN public.email_sequences seq ON seq.id = e.sequence_id
  WHERE e.status = 'active'
    AND e.next_email_at <= NOW()
    AND seq.status = 'active'
    AND NOT EXISTS (
      -- Vérifier que l'utilisateur n'a pas désabonné
      SELECT 1 FROM public.email_unsubscribes
      WHERE email = u.email
      AND unsubscribe_type IN ('all', 'marketing', 'newsletter')
    )
  ORDER BY e.next_email_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_next_sequence_emails_to_send IS 'Récupère les prochains emails de séquence à envoyer';

-- ============================================================
-- 5. FUNCTION: advance_sequence_enrollment
-- Fait avancer un enrollment à l'étape suivante
-- ============================================================

CREATE OR REPLACE FUNCTION public.advance_sequence_enrollment(
  p_enrollment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sequence_id UUID;
  v_current_step INTEGER;
  v_next_step INTEGER;
  v_next_step_delay INTEGER;
  v_next_step_delay_type TEXT;
  v_next_email_at TIMESTAMPTZ;
  v_total_steps INTEGER;
BEGIN
  -- Récupérer l'enrollment
  SELECT sequence_id, current_step
  INTO v_sequence_id, v_current_step
  FROM public.email_sequence_enrollments
  WHERE id = p_enrollment_id
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Trouver l'étape suivante
  SELECT step_order, delay_value, delay_type
  INTO v_next_step, v_next_step_delay, v_next_step_delay_type
  FROM public.email_sequence_steps
  WHERE sequence_id = v_sequence_id
  AND step_order > v_current_step
  ORDER BY step_order ASC
  LIMIT 1;
  
  -- Compter le nombre total d'étapes
  SELECT COUNT(*) INTO v_total_steps
  FROM public.email_sequence_steps
  WHERE sequence_id = v_sequence_id;
  
  -- Si pas d'étape suivante, marquer comme complété
  IF v_next_step IS NULL THEN
    UPDATE public.email_sequence_enrollments
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = p_enrollment_id;
    
    -- Incrémenter le compteur de complétion
    UPDATE public.email_sequences
    SET completed_count = completed_count + 1
    WHERE id = v_sequence_id;
    
    RETURN TRUE;
  END IF;
  
  -- Calculer la date du prochain email
  IF v_next_step_delay_type = 'immediate' THEN
    v_next_email_at := NOW();
  ELSIF v_next_step_delay_type = 'minutes' THEN
    v_next_email_at := NOW() + (v_next_step_delay || ' minutes')::INTERVAL;
  ELSIF v_next_step_delay_type = 'hours' THEN
    v_next_email_at := NOW() + (v_next_step_delay || ' hours')::INTERVAL;
  ELSIF v_next_step_delay_type = 'days' THEN
    v_next_email_at := NOW() + (v_next_step_delay || ' days')::INTERVAL;
  ELSE
    v_next_email_at := NOW();
  END IF;
  
  -- Mettre à jour l'enrollment
  UPDATE public.email_sequence_enrollments
  SET 
    current_step = v_next_step,
    completed_steps = array_append(completed_steps, v_current_step),
    next_email_at = v_next_email_at
  WHERE id = p_enrollment_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.advance_sequence_enrollment IS 'Fait avancer un enrollment à l''étape suivante de la séquence';

-- ============================================================
-- 6. FUNCTION: check_user_unsubscribed
-- Vérifie si un utilisateur a désabonné
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_user_unsubscribed(
  p_email TEXT,
  p_type TEXT DEFAULT 'marketing'
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_unsubscribes
    WHERE email = p_email
    AND (
      unsubscribe_type = 'all'
      OR unsubscribe_type = p_type
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_user_unsubscribed IS 'Vérifie si un utilisateur a désabonné des emails';

-- ============================================================
-- 7. FUNCTION: add_user_tag
-- Ajoute un tag à un utilisateur
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_user_tag(
  p_user_id UUID,
  p_store_id UUID,
  p_tag TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
BEGIN
  INSERT INTO public.email_user_tags (
    user_id,
    store_id,
    tag,
    context
  )
  VALUES (
    p_user_id,
    p_store_id,
    p_tag,
    p_context
  )
  ON CONFLICT (user_id, store_id, tag) DO UPDATE
  SET 
    added_at = NOW(),
    context = p_context
  RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_user_tag IS 'Ajoute un tag à un utilisateur pour segmentation';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

