-- =========================================================
-- Migration : Configuration Auto-Payout Vendeurs
-- Date : 30 Janvier 2025
-- Description : Ajoute les paramètres de configuration pour reversement automatique des fonds vendeurs
-- =========================================================

-- Ajouter auto_payout_vendors dans les settings admin
INSERT INTO public.platform_settings(key, settings)
VALUES ('admin', jsonb_build_object(
  'auto_payout_vendors', jsonb_build_object(
    'enabled', false,  -- Désactivé par défaut (nécessite validation admin)
    'delay_days', 7,  -- Délai avant reversement automatique (7 jours)
    'min_amount', 50000  -- Montant minimum pour reversement automatique: 50000 XOF
  ),
  'auto_pay_referral_commissions', jsonb_build_object(
    'enabled', false,  -- Désactivé par défaut
    'min_amount', 50000  -- Seuil minimum: 50000 XOF
  )
))
ON CONFLICT (key) DO UPDATE SET 
  settings = CASE
    WHEN NOT (public.platform_settings.settings ? 'auto_payout_vendors') THEN
      public.platform_settings.settings || jsonb_build_object(
        'auto_payout_vendors', jsonb_build_object(
          'enabled', false,
          'delay_days', 7,
          'min_amount', 50000
        )
      )
    ELSE
      public.platform_settings.settings
  END || CASE
    WHEN NOT (public.platform_settings.settings ? 'auto_pay_referral_commissions') THEN
      jsonb_build_object(
        'auto_pay_referral_commissions', jsonb_build_object(
          'enabled', false,
          'min_amount', 50000
        )
      )
    ELSE
      '{}'::jsonb
  END,
  updated_at = now();

-- Commentaires
COMMENT ON COLUMN public.platform_settings.settings IS 'Paramètres de la plateforme. 
- auto_payout_vendors: Configuration pour reversement automatique des fonds vendeurs (enabled, delay_days, min_amount)
- auto_pay_referral_commissions: Configuration pour paiement automatique des commissions parrainage (enabled, min_amount)';


