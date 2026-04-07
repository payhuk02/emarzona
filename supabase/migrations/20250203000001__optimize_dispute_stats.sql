-- ============================================================
-- OPTIMISATION: Fonction SQL pour calculer les stats des disputes
-- Évite de charger tous les disputes en mémoire
-- ============================================================

CREATE OR REPLACE FUNCTION get_dispute_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'open', COUNT(*) FILTER (WHERE status = 'open'),
    'investigating', COUNT(*) FILTER (WHERE status = 'investigating'),
    'waiting_customer', COUNT(*) FILTER (WHERE status = 'waiting_customer'),
    'waiting_seller', COUNT(*) FILTER (WHERE status = 'waiting_seller'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed', COUNT(*) FILTER (WHERE status = 'closed'),
    'unassigned', COUNT(*) FILTER (WHERE assigned_admin_id IS NULL),
    'avgResolutionTime', COALESCE(
      EXTRACT(EPOCH FROM AVG(resolved_at - created_at)) / 3600,
      0
    )::INTEGER
  ) INTO stats
  FROM disputes
  WHERE resolved_at IS NOT NULL OR status != 'resolved';

  RETURN stats;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION get_dispute_stats() IS 'Calcule les statistiques des disputes en une seule requête SQL optimisée';

