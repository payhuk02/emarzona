
-- =============================================
-- BATCH 1: Core missing tables (cart, admin, disputes)
-- =============================================

-- 1. cart_items (15 refs) - Critical for e-commerce
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  product_id uuid NOT NULL,
  product_type text NOT NULL DEFAULT 'digital',
  product_name text NOT NULL,
  product_image_url text,
  variant_id text,
  variant_name text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  discount_amount numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  coupon_code text,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (
  auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Anon can manage session cart" ON public.cart_items FOR ALL TO anon USING (
  user_id IS NULL AND session_id IS NOT NULL
) WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. admin_actions (audit system)
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions" ON public.admin_actions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert admin actions" ON public.admin_actions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- 3. disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  initiator_id text NOT NULL,
  initiator_type text NOT NULL DEFAULT 'customer',
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text DEFAULT 'medium',
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid,
  evidence jsonb DEFAULT '[]',
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage disputes" ON public.disputes FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = disputes.store_id AND stores.user_id = auth.uid())
);

CREATE POLICY "Admins can manage all disputes" ON public.disputes FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. warehouses (12 refs)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  address text,
  city text,
  state text,
  country text,
  zip_code text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  capacity integer,
  current_stock integer DEFAULT 0,
  latitude numeric,
  longitude numeric,
  manager_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage warehouses" ON public.warehouses FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = warehouses.store_id AND stores.user_id = auth.uid())
);

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. webhooks (12 refs)
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  secret text,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  headers jsonb DEFAULT '{}',
  retry_count integer DEFAULT 3,
  timeout_ms integer DEFAULT 5000,
  last_triggered_at timestamptz,
  last_status_code integer,
  failure_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage webhooks" ON public.webhooks FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = webhooks.store_id AND stores.user_id = auth.uid())
);

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. product_returns (18 refs)
CREATE TABLE IF NOT EXISTS public.product_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid,
  user_id uuid,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  type text DEFAULT 'return',
  quantity integer NOT NULL DEFAULT 1,
  refund_amount numeric DEFAULT 0,
  refund_method text,
  refund_processed_at timestamptz,
  return_label_url text,
  tracking_number text,
  shipping_carrier text,
  received_at timestamptz,
  inspected_at timestamptz,
  inspection_notes text,
  photos text[] DEFAULT '{}',
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage returns" ON public.product_returns FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = product_returns.store_id AND stores.user_id = auth.uid())
);

CREATE POLICY "Users can view own returns" ON public.product_returns FOR SELECT USING (
  auth.uid() = user_id
);

CREATE TRIGGER update_product_returns_updated_at BEFORE UPDATE ON public.product_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. shipping_carriers (17 refs)
CREATE TABLE IF NOT EXISTS public.shipping_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  logo_url text,
  tracking_url_template text,
  api_key text,
  api_secret text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  supported_countries text[] DEFAULT '{}',
  max_weight numeric,
  max_dimensions jsonb,
  contact_email text,
  contact_phone text,
  website_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage carriers" ON public.shipping_carriers FOR ALL USING (
  store_id IS NULL OR EXISTS (SELECT 1 FROM stores WHERE stores.id = shipping_carriers.store_id AND stores.user_id = auth.uid())
);

CREATE POLICY "Public carriers viewable" ON public.shipping_carriers FOR SELECT USING (store_id IS NULL);

CREATE TRIGGER update_shipping_carriers_updated_at BEFORE UPDATE ON public.shipping_carriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
