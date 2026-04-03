-- Migration: Fonctions pour incrémenter les stats d'affiliation
-- Date: 31 Janvier 2025
-- Description: Crée les fonctions RPC pour mettre à jour les statistiques d'affiliation

-- Fonction pour incrémenter les clics d'un lien d'affiliation
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks(p_link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links
  SET 
    total_clicks = total_clicks + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour incrémenter les ventes d'un lien d'affiliation
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_sales(
  p_link_id UUID,
  p_revenue NUMERIC,
  p_commission NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links
  SET 
    total_sales = total_sales + 1,
    total_revenue = total_revenue + p_revenue,
    total_commission = total_commission + p_commission,
    updated_at = NOW()
  WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Commentaires
COMMENT ON FUNCTION public.increment_affiliate_link_clicks(UUID) IS 'Incrémente le compteur de clics d''un lien d''affiliation';
COMMENT ON FUNCTION public.increment_affiliate_link_sales(UUID, NUMERIC, NUMERIC) IS 'Incrémente les statistiques de ventes d''un lien d''affiliation';







