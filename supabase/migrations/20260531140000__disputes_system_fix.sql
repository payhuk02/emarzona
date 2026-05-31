-- Fix disputes system migration (syntax error in get_disputes_stats)
BEGIN;

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  initiator_type TEXT NOT NULL CHECK (initiator_type IN ('customer', 'seller', 'admin')),
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'waiting_customer', 'waiting_seller', 'resolved', 'closed'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator ON disputes(initiator_id, initiator_type);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_admin ON disputes(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_disputes_updated_at ON disputes;
CREATE TRIGGER trigger_update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own disputes" ON disputes;
CREATE POLICY "Users can view their own disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    initiator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = disputes.order_id
      AND (orders.customer_id = auth.uid() OR orders.store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Admins can view all disputes" ON disputes;
CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create disputes" ON disputes;
CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    initiator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND (orders.customer_id = auth.uid() OR orders.store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Admins can update disputes" ON disputes;
CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION get_disputes_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
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
    'avg_resolution_time_hours', AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL)
  )
  INTO result
  FROM disputes;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION assign_dispute_to_admin(p_dispute_id UUID, p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign disputes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Invalid admin_id: User is not an admin';
  END IF;
  UPDATE disputes
  SET assigned_admin_id = p_admin_id,
      status = CASE WHEN status = 'open' THEN 'investigating' ELSE status END,
      updated_at = NOW()
  WHERE id = p_dispute_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION resolve_dispute(p_dispute_id UUID, p_resolution TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can resolve disputes';
  END IF;
  UPDATE disputes
  SET status = 'resolved', resolution = p_resolution, resolved_at = NOW(), updated_at = NOW()
  WHERE id = p_dispute_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION close_dispute(p_dispute_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can close disputes';
  END IF;
  UPDATE disputes SET status = 'closed', updated_at = NOW() WHERE id = p_dispute_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION get_disputes_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_dispute_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_dispute TO authenticated;
GRANT EXECUTE ON FUNCTION close_dispute TO authenticated;

COMMIT;
