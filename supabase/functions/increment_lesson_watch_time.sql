-- Fonction pour incrémenter le temps de visionnage d'une leçon
-- Utilisée pour tracker le temps passé sur chaque vidéo

CREATE OR REPLACE FUNCTION increment_lesson_watch_time(
  p_enrollment_id UUID,
  p_lesson_id UUID,
  p_seconds INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mettre à jour ou créer l'entrée de progression
  INSERT INTO course_lesson_progress (
    enrollment_id,
    lesson_id,
    total_watch_time_seconds,
    updated_at
  )
  VALUES (
    p_enrollment_id,
    p_lesson_id,
    p_seconds,
    NOW()
  )
  ON CONFLICT (enrollment_id, lesson_id) DO UPDATE
  SET
    total_watch_time_seconds = course_lesson_progress.total_watch_time_seconds + p_seconds,
    updated_at = NOW();
END;
$$;

-- Commentaire
COMMENT ON FUNCTION increment_lesson_watch_time(UUID, UUID, INTEGER) IS 
'Incrémente le temps de visionnage total d''une leçon pour un enrollment donné';

