-- =========================================================
-- Migration : Activation des Fonctionnalités Auto-Payout
-- Date : 30 Janvier 2025
-- Description : Active les fonctionnalités de reversement automatique et paiement automatique des commissions
-- =========================================================

-- Activer auto_payout_vendors
UPDATE public.platform_settings
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{auto_payout_vendors,enabled}',
  'true'::jsonb
)
WHERE key = 'admin';

-- Activer auto_pay_referral_commissions
UPDATE public.platform_settings
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{auto_pay_referral_commissions,enabled}',
  'true'::jsonb
)
WHERE key = 'admin';

-- Vérifier que les configurations existent, sinon les créer
INSERT INTO public.platform_settings(key, settings)
VALUES ('admin', jsonb_build_object(
  'auto_payout_vendors', jsonb_build_object(
    'enabled', true,
    'delay_days', 7,
    'min_amount', 50000
  ),
  'auto_pay_referral_commissions', jsonb_build_object(
    'enabled', true,
    'min_amount', 50000
  )
))
ON CONFLICT (key) DO UPDATE SET 
  settings = COALESCE(platform_settings.settings, '{}'::jsonb) || jsonb_build_object(
    'auto_payout_vendors', COALESCE(
      platform_settings.settings->'auto_payout_vendors',
      jsonb_build_object('enabled', true, 'delay_days', 7, 'min_amount', 50000)
    ) || jsonb_build_object('enabled', true),
    'auto_pay_referral_commissions', COALESCE(
      platform_settings.settings->'auto_pay_referral_commissions',
      jsonb_build_object('enabled', true, 'min_amount', 50000)
    ) || jsonb_build_object('enabled', true)
  ),
  updated_at = now();

-- Commentaires
COMMENT ON COLUMN public.platform_settings.settings IS 'Paramètres de la plateforme. 
- auto_payout_vendors: Configuration pour reversement automatique des fonds vendeurs (enabled: true, delay_days: 7, min_amount: 50000)
- auto_pay_referral_commissions: Configuration pour paiement automatique des commissions parrainage (enabled: true, min_amount: 50000)';


