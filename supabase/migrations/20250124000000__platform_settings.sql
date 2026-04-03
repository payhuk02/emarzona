-- =========================================================
-- Migration : Création table platform_settings
-- Date : 24/10/2025
-- Description : Table pour stocker les paramètres globaux de la plateforme
-- =========================================================

-- Créer la table platform_settings (singleton pattern)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Commissions
  platform_commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00 CHECK (platform_commission_rate >= 0 AND platform_commission_rate <= 100),
  referral_commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 2.00 CHECK (referral_commission_rate >= 0 AND referral_commission_rate <= 100),
  
  -- Retraits
  min_withdrawal_amount INTEGER NOT NULL DEFAULT 10000 CHECK (min_withdrawal_amount >= 0),
  auto_approve_withdrawals BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Notifications
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Contrainte pour garantir un seul enregistrement (singleton)
  CONSTRAINT only_one_settings CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insérer l'enregistrement unique avec valeurs par défaut
INSERT INTO platform_settings (
  id,
  platform_commission_rate,
  referral_commission_rate,
  min_withdrawal_amount,
  auto_approve_withdrawals,
  email_notifications,
  sms_notifications
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  10.00,
  2.00,
  10000,
  FALSE,
  TRUE,
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_updated_at();

-- Row Level Security (RLS)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can read settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Seuls les admins peuvent modifier
CREATE POLICY "Only admins can update settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_at ON platform_settings(updated_at DESC);

-- Commentaires
COMMENT ON TABLE platform_settings IS 'Configuration globale de la plateforme (singleton)';
COMMENT ON COLUMN platform_settings.platform_commission_rate IS 'Taux de commission prélevé par la plateforme (%)';
COMMENT ON COLUMN platform_settings.referral_commission_rate IS 'Taux de commission versé au parrain (%)';
COMMENT ON COLUMN platform_settings.min_withdrawal_amount IS 'Montant minimum pour effectuer un retrait (en XOF)';
COMMENT ON COLUMN platform_settings.auto_approve_withdrawals IS 'Approbation automatique des demandes de retrait';
COMMENT ON COLUMN platform_settings.email_notifications IS 'Activer les notifications email';
COMMENT ON COLUMN platform_settings.sms_notifications IS 'Activer les notifications SMS';

-- =========================================================
-- FIN MIGRATION
-- =========================================================

