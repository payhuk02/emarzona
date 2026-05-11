-- =========================================================
-- Migration : Correction de la sensibilité à la casse des liens courts
-- Date : 20/01/2026
-- Description : Rend la recherche des liens courts insensible à la casse
-- =========================================================

-- Mettre à jour la fonction track_short_link_click pour être insensible à la casse
CREATE OR REPLACE FUNCTION public.track_short_link_click(
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_link affiliate_short_links%ROWTYPE;
  v_target_url TEXT;
BEGIN
  -- Récupérer le lien court (recherche insensible à la casse)
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

  -- Mettre à jour les statistiques
  UPDATE affiliate_short_links
  SET
    total_clicks = total_clicks + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = v_short_link.id;

  -- Retourner l'URL cible
  RETURN jsonb_build_object(
    'success', true,
    'target_url', v_short_link.target_url,
    'affiliate_link_id', v_short_link.affiliate_link_id
  );
END;
$$;

COMMENT ON FUNCTION public.track_short_link_click IS 'Traque un clic sur un lien court et retourne l''URL de redirection (recherche insensible à la casse)';