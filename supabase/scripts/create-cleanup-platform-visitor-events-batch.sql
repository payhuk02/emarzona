-- One-shot batch purge (safe for SQL Editor — single transaction, small limit)
CREATE OR REPLACE FUNCTION public.cleanup_platform_visitor_events_batch(
  p_batch_size INTEGER DEFAULT 500
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch INTEGER;
  v_limit INTEGER;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_batch_size, 500), 100), 2000);

  DELETE FROM public.platform_visitor_events e
  WHERE e.id IN (
    SELECT id
    FROM public.platform_visitor_events
    ORDER BY created_at ASC
    LIMIT v_limit
  );

  GET DIAGNOSTICS v_batch = ROW_COUNT;
  RETURN v_batch;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_platform_visitor_events_batch(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_platform_visitor_events_batch(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_platform_visitor_events_batch(INTEGER) TO postgres;

COMMENT ON FUNCTION public.cleanup_platform_visitor_events_batch(INTEGER) IS
'Supprime un seul lot de platform_visitor_events (défaut 500). Relancer jusqu''à retour 0.';
