-- =====================================================
-- PAYHUK COURSES DRIP CONTENT LOGIC
-- Date: 27 Janvier 2025
-- Description: Logique de déverrouillage automatique pour drip content
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. FUNCTION: Check if section/lesson is unlocked
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_drip_unlock(
  p_course_id UUID,
  p_section_id UUID,
  p_enrollment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course RECORD;
  v_section RECORD;
  v_enrollment RECORD;
  v_days_since_enrollment INTEGER;
  v_unlock_after_days INTEGER;
  v_drip_enabled BOOLEAN;
  v_drip_type TEXT;
  v_drip_interval INTEGER;
BEGIN
  -- Récupérer infos cours
  SELECT drip_enabled, drip_type, drip_interval
  INTO v_drip_enabled, v_drip_type, v_drip_interval
  FROM public.courses
  WHERE id = p_course_id;
  
  -- Si drip désactivé, tout est déverrouillé
  IF NOT v_drip_enabled OR v_drip_type = 'none' THEN
    RETURN true;
  END IF;
  
  -- Récupérer infos section
  SELECT is_locked, unlock_after_days
  INTO v_section
  FROM public.course_sections
  WHERE id = p_section_id;
  
  -- Si section pas verrouillée, déverrouillée
  IF NOT v_section.is_locked THEN
    RETURN true;
  END IF;
  
  -- Récupérer infos enrollment
  SELECT enrollment_date
  INTO v_enrollment
  FROM public.course_enrollments
  WHERE id = p_enrollment_id;
  
  -- Calculer jours depuis inscription
  v_days_since_enrollment := EXTRACT(DAY FROM (now() - v_enrollment.enrollment_date));
  
  -- Vérifier déverrouillage basé sur jours
  IF v_section.unlock_after_days IS NOT NULL THEN
    RETURN v_days_since_enrollment >= v_section.unlock_after_days;
  END IF;
  
  -- Déverrouillage basé sur drip_type et drip_interval
  IF v_drip_type = 'daily' THEN
    -- Déverrouiller chaque jour selon drip_interval
    RETURN v_days_since_enrollment >= (v_drip_interval * (
      SELECT order_index FROM public.course_sections WHERE id = p_section_id
    ));
  ELSIF v_drip_type = 'weekly' THEN
    -- Déverrouiller chaque semaine selon drip_interval
    RETURN v_days_since_enrollment >= (v_drip_interval * 7 * (
      SELECT order_index FROM public.course_sections WHERE id = p_section_id
    ));
  END IF;
  
  RETURN false;
END;
$$;

-- =====================================================
-- 2. FUNCTION: Get unlocked sections for enrollment
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_unlocked_sections(
  p_course_id UUID,
  p_enrollment_id UUID
)
RETURNS TABLE(section_id UUID, is_unlocked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id as section_id,
    public.check_drip_unlock(p_course_id, cs.id, p_enrollment_id) as is_unlocked
  FROM public.course_sections cs
  WHERE cs.course_id = p_course_id
  ORDER BY cs.order_index;
END;
$$;

-- =====================================================
-- 3. FUNCTION: Auto-unlock sections (cron job)
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_unlock_drip_sections()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_section RECORD;
  v_is_unlocked BOOLEAN;
BEGIN
  -- Parcourir tous les enrollments actifs avec drip enabled
  FOR v_enrollment IN
    SELECT ce.id, ce.course_id, ce.enrollment_date
    FROM public.course_enrollments ce
    JOIN public.courses c ON c.id = ce.course_id
    WHERE ce.status = 'active'
    AND c.drip_enabled = true
    AND c.drip_type != 'none'
  LOOP
    -- Parcourir toutes les sections du cours
    FOR v_section IN
      SELECT id, is_locked, unlock_after_days, order_index
      FROM public.course_sections
      WHERE course_id = v_enrollment.course_id
      AND is_locked = true
    LOOP
      -- Vérifier si section doit être déverrouillée
      v_is_unlocked := public.check_drip_unlock(
        v_enrollment.course_id,
        v_section.id,
        v_enrollment.id
      );
      
      -- Déverrouiller si nécessaire
      IF v_is_unlocked THEN
        UPDATE public.course_sections
        SET is_locked = false
        WHERE id = v_section.id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- =====================================================
-- 4. FUNCTION: Get next unlock date for section
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_next_unlock_date(
  p_course_id UUID,
  p_section_id UUID,
  p_enrollment_id UUID
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course RECORD;
  v_section RECORD;
  v_enrollment RECORD;
  v_days_until_unlock INTEGER;
  v_unlock_date TIMESTAMPTZ;
BEGIN
  -- Récupérer infos
  SELECT drip_enabled, drip_type, drip_interval
  INTO v_course
  FROM public.courses
  WHERE id = p_course_id;
  
  SELECT is_locked, unlock_after_days, order_index
  INTO v_section
  FROM public.course_sections
  WHERE id = p_section_id;
  
  SELECT enrollment_date
  INTO v_enrollment
  FROM public.course_enrollments
  WHERE id = p_enrollment_id;
  
  -- Si déjà déverrouillé, retourner null
  IF NOT v_section.is_locked THEN
    RETURN NULL;
  END IF;
  
  -- Si drip désactivé, retourner null
  IF NOT v_course.drip_enabled OR v_course.drip_type = 'none' THEN
    RETURN NULL;
  END IF;
  
  -- Calculer jours jusqu'au déverrouillage
  IF v_section.unlock_after_days IS NOT NULL THEN
    v_days_until_unlock := v_section.unlock_after_days;
  ELSIF v_course.drip_type = 'daily' THEN
    v_days_until_unlock := v_course.drip_interval * v_section.order_index;
  ELSIF v_course.drip_type = 'weekly' THEN
    v_days_until_unlock := v_course.drip_interval * 7 * v_section.order_index;
  ELSE
    RETURN NULL;
  END IF;
  
  -- Calculer date de déverrouillage
  v_unlock_date := v_enrollment.enrollment_date + (v_days_until_unlock || ' days')::INTERVAL;
  
  RETURN v_unlock_date;
END;
$$;

-- =====================================================
-- 5. VIEW: Section unlock status for enrollment
-- =====================================================
CREATE OR REPLACE VIEW public.course_section_unlock_status AS
SELECT
  cs.id as section_id,
  cs.course_id,
  cs.title as section_title,
  cs.order_index,
  ce.id as enrollment_id,
  ce.user_id,
  cs.is_locked,
  cs.unlock_after_days,
  public.check_drip_unlock(cs.course_id, cs.id, ce.id) as is_unlocked,
  public.get_next_unlock_date(cs.course_id, cs.id, ce.id) as unlock_date,
  c.drip_enabled,
  c.drip_type,
  c.drip_interval
FROM public.course_sections cs
CROSS JOIN public.course_enrollments ce
JOIN public.courses c ON c.id = cs.course_id
WHERE cs.course_id = ce.course_id;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.check_drip_unlock IS 'Vérifie si une section est déverrouillée pour un enrollment';
COMMENT ON FUNCTION public.get_unlocked_sections IS 'Récupère toutes les sections déverrouillées pour un enrollment';
COMMENT ON FUNCTION public.auto_unlock_drip_sections IS 'Déverrouille automatiquement les sections selon le drip schedule';
COMMENT ON FUNCTION public.get_next_unlock_date IS 'Calcule la date de déverrouillage d''une section';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

