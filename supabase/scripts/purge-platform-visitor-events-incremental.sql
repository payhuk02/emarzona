-- =============================================================================
-- Purge URGENTE platform_visitor_events — lots minuscules (SQL Editor)
-- Exécuter la requête (1) plusieurs fois jusqu'à deleted = 0
-- Si acceptable : requête (2) TRUNCATE = instantané
-- =============================================================================

-- (1) Supprimer 500 lignes les plus anciennes — RELANCER jusqu'à deleted = 0
WITH doomed AS (
  SELECT id
  FROM public.platform_visitor_events
  ORDER BY created_at ASC
  LIMIT 500
)
DELETE FROM public.platform_visitor_events e
USING doomed d
WHERE e.id = d.id
RETURNING e.id;

-- (2) OPTION NUCLÉAIRE — efface TOUT l'historique analytics (1 clic, instantané)
-- TRUNCATE public.platform_visitor_events;

-- (3) Diagnostic après purge
-- SELECT count(*) AS reste,
--        pg_size_pretty(pg_total_relation_size('public.platform_visitor_events')) AS taille
-- FROM public.platform_visitor_events;
