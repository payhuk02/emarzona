-- =========================================================
-- Migration : Correction de l'index problématique
-- Date : 28/01/2025
-- Description : Supprime l'index avec fonction non-IMMUTABLE et le recrée correctement
-- =========================================================

-- Supprimer l'index problématique s'il existe
DROP INDEX IF EXISTS public.idx_affiliate_clicks_affiliate_date;

-- Créer l'index corrigé (sans fonction dans l'expression)
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_date 
ON public.affiliate_clicks(affiliate_id, clicked_at DESC);

COMMENT ON INDEX public.idx_affiliate_clicks_affiliate_date IS 'Index pour les statistiques journalières par affilié - optimisé pour les requêtes de date';

