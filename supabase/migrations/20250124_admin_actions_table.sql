-- =========================================================
-- Migration : Création table admin_actions
-- Date : 24/10/2025
-- Description : Table pour journaliser toutes les actions administrateurs
-- =========================================================

-- Créer la table admin_actions
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui a effectué l'action
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type d'action effectuée
  action_type TEXT NOT NULL CHECK (action_type IN (
    'SUSPEND_USER',
    'UNSUSPEND_USER',
    'DELETE_USER',
    'UPDATE_USER',
    'DELETE_STORE',
    'SUSPEND_STORE',
    'UNSUSPEND_STORE',
    'DELETE_PRODUCT',
    'ACTIVATE_PRODUCT',
    'DEACTIVATE_PRODUCT',
    'CANCEL_ORDER',
    'REFUND_ORDER',
    'UPDATE_SETTINGS',
    'OTHER'
  )),
  
  -- Type de cible (user, store, product, order, etc.)
  target_type TEXT NOT NULL CHECK (target_type IN (
    'user',
    'store',
    'product',
    'order',
    'payment',
    'settings',
    'other'
  )),
  
  -- ID de la cible (peut être null pour certaines actions globales)
  target_id UUID,
  
  -- Détails supplémentaires (JSON)
  -- Ex: { "reason": "Spam", "old_value": "...", "new_value": "..." }
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Index composite pour recherches complexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_date ON admin_actions(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);

-- Activer RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les admins peuvent lire les actions
CREATE POLICY "Only admins can read admin actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Politique : Seuls les admins peuvent insérer des actions
CREATE POLICY "Only admins can insert admin actions"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    AND admin_id = auth.uid()
  );

-- Politique : Personne ne peut modifier ou supprimer (audit trail immuable)
-- Les actions admin sont en lecture seule après création pour garantir l'intégrité de l'audit

-- Fonction helper pour logger une action admin
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can log actions';
  END IF;
  
  -- Insérer l'action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_target_type,
    p_target_id,
    p_details
  ) RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- Commentaires
COMMENT ON TABLE admin_actions IS 'Journal immuable de toutes les actions administrateurs';
COMMENT ON COLUMN admin_actions.admin_id IS 'ID de l''administrateur qui a effectué l''action';
COMMENT ON COLUMN admin_actions.action_type IS 'Type d''action (SUSPEND_USER, DELETE_STORE, etc.)';
COMMENT ON COLUMN admin_actions.target_type IS 'Type de cible (user, store, product, etc.)';
COMMENT ON COLUMN admin_actions.target_id IS 'ID de la cible de l''action';
COMMENT ON COLUMN admin_actions.details IS 'Détails supplémentaires (raison, anciennes/nouvelles valeurs, etc.)';
COMMENT ON FUNCTION log_admin_action IS 'Fonction helper pour enregistrer une action admin';

-- =========================================================
-- FIN MIGRATION
-- =========================================================

