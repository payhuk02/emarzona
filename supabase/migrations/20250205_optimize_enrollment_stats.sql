-- Optimisation des statistiques d'inscriptions
-- Remplace le calcul côté client par une fonction SQL optimisée

CREATE OR REPLACE FUNCTION get_enrollment_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  status_counts JSON;
BEGIN
  -- Calculer les stats par statut
  SELECT json_object_agg(status, count) INTO status_counts
  FROM (
    SELECT status, COUNT(*) as count
    FROM enrollments
    GROUP BY status
  ) status_agg;

  -- Construire le résultat final
  SELECT json_build_object(
    'total_enrollments', COUNT(*),
    'active_enrollments', COUNT(*) FILTER (WHERE status = 'active'),
    'completed_enrollments', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_revenue', COALESCE(SUM(amount_paid), 0),
    'avg_progress', COALESCE(AVG(progress), 0),
    'avg_completion_time', (
      SELECT COALESCE(AVG(
        EXTRACT(EPOCH FROM (completed_at::timestamp - enrolled_at::timestamp)) / 86400
      ), 0)
      FROM enrollments
      WHERE status = 'completed' AND completed_at IS NOT NULL AND enrolled_at IS NOT NULL
    ),
    'by_status', COALESCE(status_counts, '{}'::json)
  ) INTO result
  FROM enrollments;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_enrollment_stats() TO authenticated;

-- Comment
COMMENT ON FUNCTION get_enrollment_stats() IS 'Calcule les statistiques des inscriptions de manière optimisée (évite de charger toutes les inscriptions en mémoire)';

