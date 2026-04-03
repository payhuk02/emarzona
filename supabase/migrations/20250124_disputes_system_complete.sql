-- =========================================================
-- Migration : Système Complet de Gestion des Litiges
-- Date : 24/10/2025
-- Description : Tables disputes + fonctionnalités complètes
-- =========================================================

-- ============================================
-- 1. TABLE DISPUTES
-- ============================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lié à une commande
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Qui a initié le litige
  initiator_type TEXT NOT NULL CHECK (initiator_type IN ('customer', 'seller', 'admin')),
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sujet et détails
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Statut du litige
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',           -- Ouvert, en attente
    'investigating',  -- En cours d'investigation
    'waiting_customer', -- En attente de réponse client
    'waiting_seller',   -- En attente de réponse vendeur
    'resolved',       -- Résolu
    'closed'          -- Fermé
  )),
  
  -- Priorité
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Admin assigné
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Notes admin (privées)
  admin_notes TEXT,
  
  -- Résolution finale
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator ON disputes(initiator_id, initiator_type);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_admin ON disputes(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- ============================================
-- 2. RLS POLICIES DISPUTES
-- ============================================

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Clients et vendeurs peuvent voir leurs propres litiges
CREATE POLICY "Users can view their own disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    initiator_id = auth.uid() OR
    -- Ou si c'est leur commande
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = disputes.order_id
      AND (orders.customer_id = auth.uid() OR orders.store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      ))
    )
  );

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Clients et vendeurs peuvent créer des litiges
CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    initiator_id = auth.uid() AND
    -- Vérifier qu'ils sont liés à la commande
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND (orders.customer_id = auth.uid() OR orders.store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      ))
    )
  );

-- Admins peuvent tout modifier
CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- 3. FONCTIONS HELPER
-- ============================================

-- Fonction pour obtenir les statistiques des litiges
CREATE OR REPLACE FUNCTION get_disputes_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view dispute stats';
  END IF;
  
  SELECT json_build_object(
    'total', COUNT(*),
    'open', COUNT(*) FILTER (WHERE status = 'open'),
    'investigating', COUNT(*) FILTER (WHERE status = 'investigating'),
    'waiting_response', COUNT(*) FILTER (WHERE status IN ('waiting_customer', 'waiting_seller')),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed', COUNT(*) FILTER (WHERE status = 'closed'),
    'high_priority', COUNT(*) FILTER (WHERE priority IN ('high', 'urgent') AND status NOT IN ('resolved', 'closed')),
    'avg_resolution_time_hours', EXTRACT(EPOCH FROM AVG(resolved_at - created_at)) / 3600 FILTER (WHERE resolved_at IS NOT NULL)
  )
  INTO result
  FROM disputes;
  
  RETURN result;
END;
$$;

-- Fonction pour assigner un admin à un litige
CREATE OR REPLACE FUNCTION assign_dispute_to_admin(
  p_dispute_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign disputes';
  END IF;
  
  -- Vérifier que l'admin assigné est bien admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Invalid admin_id: User is not an admin';
  END IF;
  
  -- Assigner
  UPDATE disputes
  SET 
    assigned_admin_id = p_admin_id,
    status = CASE WHEN status = 'open' THEN 'investigating' ELSE status END,
    updated_at = NOW()
  WHERE id = p_dispute_id;
  
  RETURN TRUE;
END;
$$;

-- Fonction pour résoudre un litige
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_dispute_id UUID,
  p_resolution TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can resolve disputes';
  END IF;
  
  -- Résoudre
  UPDATE disputes
  SET 
    status = 'resolved',
    resolution = p_resolution,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_dispute_id;
  
  RETURN TRUE;
END;
$$;

-- Fonction pour fermer un litige
CREATE OR REPLACE FUNCTION close_dispute(p_dispute_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can close disputes';
  END IF;
  
  UPDATE disputes
  SET 
    status = 'closed',
    updated_at = NOW()
  WHERE id = p_dispute_id;
  
  RETURN TRUE;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_disputes_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_dispute_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_dispute TO authenticated;
GRANT EXECUTE ON FUNCTION close_dispute TO authenticated;

-- ============================================
-- 4. COMMENTAIRES
-- ============================================

COMMENT ON TABLE disputes IS 'Gestion des litiges entre clients et vendeurs';
COMMENT ON COLUMN disputes.status IS 'Statut: open, investigating, waiting_customer, waiting_seller, resolved, closed';
COMMENT ON COLUMN disputes.priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN disputes.admin_notes IS 'Notes privées pour les admins uniquement';
COMMENT ON FUNCTION get_disputes_stats IS 'Récupère les statistiques des litiges (admins seulement)';

-- =========================================================
-- FIN MIGRATION
-- =========================================================

