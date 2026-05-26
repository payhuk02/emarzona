-- Vérification KPIs audit œuvre (exécuter en tant qu'admin authentifié dans SQL Editor)
-- SELECT public.get_artist_audit_health(7);

SELECT public.get_artist_audit_health(7) AS health;

-- Certificats publics (backfill)
SELECT
  COUNT(*) FILTER (WHERE verification_code IS NOT NULL) AS with_code,
  COUNT(*) FILTER (WHERE is_public = true) AS public_count
FROM public.artist_product_certificates;

-- Derniers événements erreur
SELECT event_type, message, order_id, created_at
FROM public.artist_fulfillment_events
WHERE severity = 'error'
ORDER BY created_at DESC
LIMIT 10;
