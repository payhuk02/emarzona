-- =========================================================
-- Migration : Ajout d'une fonction insensible à la casse pour les liens courts
-- Date : 20/01/2026
-- Description : Crée une nouvelle fonction qui gère la casse correctement
-- =========================================================

-- Nouvelle fonction insensible à la casse
CREATE OR REPLACE FUNCTION public.track_short_link_click_case_insensitive(
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_link affiliate_short_links%ROWTYPE;
BEGIN
  -- Recherche insensible à la casse
  SELECT * INTO v_short_link
  FROM affiliate_short_links
  WHERE upper(short_code) = upper(p_short_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  IF v_short_link IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lien court introuvable ou expiré'
    );
  END IF;

  -- Mise à jour des statistiques
  UPDATE affiliate_short_links
  SET total_clicks = total_clicks + 1,
      last_used_at = now(),
      updated_at = now()
  WHERE id = v_short_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'target_url', v_short_link.target_url,
    'affiliate_link_id', v_short_link.affiliate_link_id
  );
END;
$$;

-- Remplacer l'ancienne fonction par la nouvelle
CREATE OR REPLACE FUNCTION public.track_short_link_click(
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Déléguer à la nouvelle fonction
  RETURN track_short_link_click_case_insensitive(p_short_code);
END;
$$;

COMMENT ON FUNCTION public.track_short_link_click IS 'Traque un clic sur un lien court et retourne l''URL de redirection (insensible à la casse)';
COMMENT ON FUNCTION public.track_short_link_click_case_insensitive IS 'Fonction interne pour la gestion insensible à la casse des liens courts';