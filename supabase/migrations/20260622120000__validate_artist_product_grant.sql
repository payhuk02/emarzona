-- Sprint 4 : droits d'exécution RPC validate_artist_product pour les wizards vendeur

GRANT EXECUTE ON FUNCTION public.validate_artist_product(
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  JSONB,
  TEXT,
  INTEGER,
  INTEGER,
  BOOLEAN,
  TEXT,
  INTEGER,
  NUMERIC
) TO authenticated;
