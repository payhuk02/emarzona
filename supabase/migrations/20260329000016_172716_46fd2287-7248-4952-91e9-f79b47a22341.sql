
-- =============================================
-- BATCH 4: Store management, physical product extras, email extras
-- =============================================

-- 1. store_members (used in useStoreMembers)
CREATE TABLE IF NOT EXISTS public.store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  permissions text[] DEFAULT '{}',
  invited_email text,
  invited_at timestamptz,
  accepted_at timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store owners manage members" ON public.store_members;
CREATE POLICY "Store owners manage members" ON public.store_members FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_members.store_id AND stores.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Members view own membership" ON public.store_members;
CREATE POLICY "Members view own membership" ON public.store_members FOR SELECT USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_store_members_updated_at ON public.store_members;
CREATE TRIGGER update_store_members_updated_at BEFORE UPDATE ON public.store_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. store_withdrawals
CREATE TABLE IF NOT EXISTS public.store_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_details jsonb DEFAULT '{}',
  notes text,
  processed_at timestamptz,
  processed_by uuid,
  rejection_reason text,
  reference_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store owners manage withdrawals" ON public.store_withdrawals;
CREATE POLICY "Store owners manage withdrawals" ON public.store_withdrawals FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_withdrawals.store_id AND stores.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage all withdrawals" ON public.store_withdrawals;
CREATE POLICY "Admins manage all withdrawals" ON public.store_withdrawals FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_store_withdrawals_updated_at ON public.store_withdrawals;
CREATE TRIGGER update_store_withdrawals_updated_at BEFORE UPDATE ON public.store_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. store_earnings
CREATE TABLE IF NOT EXISTS public.store_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  currency text DEFAULT 'XOF',
  status text DEFAULT 'pending',
  type text DEFAULT 'sale',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store owners view earnings" ON public.store_earnings;
CREATE POLICY "Store owners view earnings" ON public.store_earnings FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_earnings.store_id AND stores.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage earnings" ON public.store_earnings;
CREATE POLICY "Admins manage earnings" ON public.store_earnings FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_store_earnings_updated_at ON public.store_earnings;
CREATE TRIGGER update_store_earnings_updated_at BEFORE UPDATE ON public.store_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. store_tasks
CREATE TABLE IF NOT EXISTS public.store_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  assigned_to uuid,
  due_date timestamptz,
  completed_at timestamptz,
  tags text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store owners manage tasks" ON public.store_tasks;
CREATE POLICY "Store owners manage tasks" ON public.store_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_tasks.store_id AND stores.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Assigned users view tasks" ON public.store_tasks;
CREATE POLICY "Assigned users view tasks" ON public.store_tasks FOR SELECT USING (auth.uid() = assigned_to);
DROP TRIGGER IF EXISTS update_store_tasks_updated_at ON public.store_tasks;
CREATE TRIGGER update_store_tasks_updated_at BEFORE UPDATE ON public.store_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. store_task_comments
CREATE TABLE IF NOT EXISTS public.store_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.store_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Task comment access" ON public.store_task_comments;
CREATE POLICY "Task comment access" ON public.store_task_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM store_tasks st JOIN stores s ON s.id = st.store_id WHERE st.id = store_task_comments.task_id AND s.user_id = auth.uid())
);
DROP TRIGGER IF EXISTS update_store_task_comments_updated_at ON public.store_task_comments;
CREATE TRIGGER update_store_task_comments_updated_at BEFORE UPDATE ON public.store_task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. store_payment_methods
CREATE TABLE IF NOT EXISTS public.store_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text,
  account_name text,
  account_number text,
  bank_name text,
  routing_number text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store owners manage payment methods" ON public.store_payment_methods;
CREATE POLICY "Store owners manage payment methods" ON public.store_payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_payment_methods.store_id AND stores.user_id = auth.uid())
);
DROP TRIGGER IF EXISTS update_store_payment_methods_updated_at ON public.store_payment_methods;
CREATE TRIGGER update_store_payment_methods_updated_at BEFORE UPDATE ON public.store_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. platform_settings (admin)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  category text DEFAULT 'general',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins manage platform settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;
CREATE POLICY "Public read platform settings" ON public.platform_settings FOR SELECT USING (category = 'public');
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. platform_commissions
CREATE TABLE IF NOT EXISTS public.platform_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  currency text DEFAULT 'XOF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage commissions" ON public.platform_commissions;
CREATE POLICY "Admins manage commissions" ON public.platform_commissions FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Store owners view own commissions" ON public.platform_commissions;
CREATE POLICY "Store owners view own commissions" ON public.platform_commissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = platform_commissions.store_id AND stores.user_id = auth.uid())
);
DROP TRIGGER IF EXISTS update_platform_commissions_updated_at ON public.platform_commissions;
CREATE TRIGGER update_platform_commissions_updated_at BEFORE UPDATE ON public.platform_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. email_sequence_enrollments
CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  current_step integer DEFAULT 0,
  status text DEFAULT 'active',
  completed_at timestamptz,
  unsubscribed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sequence enrollment access" ON public.email_sequence_enrollments;
CREATE POLICY "Sequence enrollment access" ON public.email_sequence_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM email_sequences es JOIN stores s ON s.id = es.store_id WHERE es.id = email_sequence_enrollments.sequence_id AND s.user_id = auth.uid())
);
DROP TRIGGER IF EXISTS update_email_sequence_enrollments_updated_at ON public.email_sequence_enrollments;
CREATE TRIGGER update_email_sequence_enrollments_updated_at BEFORE UPDATE ON public.email_sequence_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. user_favorites (already exists but check)
-- Already exists in DB, skipping

-- 11. physical_product_inventory (19 refs - alias for inventory?)
CREATE TABLE IF NOT EXISTS public.physical_product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id),
  quantity integer NOT NULL DEFAULT 0,
  reserved_quantity integer DEFAULT 0,
  available_quantity integer GENERATED ALWAYS AS (quantity - COALESCE(reserved_quantity, 0)) STORED,
  reorder_point integer DEFAULT 10,
  reorder_quantity integer DEFAULT 50,
  unit_cost numeric DEFAULT 0,
  location text,
  batch_number text,
  expiry_date timestamptz,
  last_counted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.physical_product_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store owners manage physical inventory" ON public.physical_product_inventory;
CREATE POLICY "Store owners manage physical inventory" ON public.physical_product_inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = physical_product_inventory.store_id AND stores.user_id = auth.uid())
);
DROP TRIGGER IF EXISTS update_physical_product_inventory_updated_at ON public.physical_product_inventory;
CREATE TRIGGER update_physical_product_inventory_updated_at BEFORE UPDATE ON public.physical_product_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
