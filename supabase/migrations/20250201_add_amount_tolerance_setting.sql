-- =========================================================
-- Migration : Ajout paramètre MAX_AMOUNT_TOLERANCE
-- Date : 1 Février 2025
-- Description : Ajoute le paramètre de tolérance pour validation des montants dans webhooks
-- =========================================================

-- Ajouter MAX_AMOUNT_TOLERANCE dans les settings admin
INSERT INTO public.platform_settings(key, settings)
VALUES ('admin', jsonb_build_object(
  'max_amount_tolerance', 1.0  -- Tolérance par défaut: 1 XOF
))
ON CONFLICT (key) DO UPDATE SET 
  settings = CASE
    WHEN NOT (public.platform_settings.settings ? 'max_amount_tolerance') THEN
      public.platform_settings.settings || jsonb_build_object('max_amount_tolerance', 1.0)
    ELSE
      public.platform_settings.settings
  END,
  updated_at = now();

-- Commentaire
COMMENT ON COLUMN public.platform_settings.settings IS 'Paramètres de la plateforme. max_amount_tolerance: tolérance maximale (en XOF) pour les différences de montant dans les webhooks (défaut: 1.0)';

