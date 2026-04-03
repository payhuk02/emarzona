-- =========================================================
-- Migration : Configuration Auto-Pay Commissions et Alertes
-- Date : 1 Février 2025
-- Description : Ajoute les paramètres de configuration pour paiement automatique et alertes
-- =========================================================

-- Ajouter auto_pay_commissions dans les settings admin
INSERT INTO public.platform_settings(key, settings)
VALUES ('admin', jsonb_build_object(
  'auto_pay_commissions', jsonb_build_object(
    'enabled', false,  -- Désactivé par défaut (nécessite validation admin)
    'minCommissionAmount', 50000  -- Seuil minimum: 50000 XOF
  ),
  'transaction_alerts', jsonb_build_object(
    'enabled', true,  -- Activé par défaut
    'pendingThresholdHours', 24,  -- Alerte si transaction en attente > 24h
    'failureRateThreshold', 10  -- Alerte si taux d'échec > 10%
  )
))
ON CONFLICT (key) DO UPDATE SET 
  settings = CASE
    WHEN NOT (public.platform_settings.settings ? 'auto_pay_commissions') THEN
      public.platform_settings.settings || jsonb_build_object(
        'auto_pay_commissions', jsonb_build_object(
          'enabled', false,
          'minCommissionAmount', 50000
        )
      )
    ELSE
      public.platform_settings.settings
  END || CASE
    WHEN NOT (public.platform_settings.settings ? 'transaction_alerts') THEN
      jsonb_build_object(
        'transaction_alerts', jsonb_build_object(
          'enabled', true,
          'pendingThresholdHours', 24,
          'failureRateThreshold', 10
        )
      )
    ELSE
      '{}'::jsonb
  END,
  updated_at = now();

-- Commentaires
COMMENT ON COLUMN public.platform_settings.settings IS 'Paramètres de la plateforme. 
- auto_pay_commissions: Configuration pour paiement automatique des commissions (enabled, minCommissionAmount)
- transaction_alerts: Configuration pour alertes transactions (enabled, pendingThresholdHours, failureRateThreshold)';

