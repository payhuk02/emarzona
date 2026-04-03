
-- =====================================================
-- MIGRATION 5: TABLES COMPLÉMENTAIRES CRITIQUES
-- =====================================================

-- Favoris utilisateur
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  currency text DEFAULT 'XOF',
  duration_minutes integer DEFAULT 60,
  service_type text DEFAULT 'appointment',
  location_type text DEFAULT 'online',
  location_address text,
  meeting_url text,
  max_participants integer DEFAULT 1,
  assigned_staff jsonb,
  total_slots integer DEFAULT 10,
  is_active boolean DEFAULT true,
  image_url text,
  images jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Réservations
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id uuid,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  status text DEFAULT 'pending',
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  amount numeric DEFAULT 0,
  payment_status text DEFAULT 'unpaid',
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Promotions / Coupons
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text,
  description text,
  discount_type text DEFAULT 'percentage',
  discount_value numeric DEFAULT 0,
  min_order_amount numeric,
  max_discount_amount numeric,
  max_uses integer,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  applicable_products uuid[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

-- Factures
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status text DEFAULT 'draft',
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'XOF',
  due_date date,
  paid_at timestamptz,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Paniers abandonnés
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  customer_email text,
  customer_name text,
  items jsonb DEFAULT '[]',
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'XOF',
  status text DEFAULT 'abandoned',
  recovered_at timestamptz,
  recovery_email_sent boolean DEFAULT false,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vues de produits (analytics)
CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Policies: user_favorites
CREATE POLICY "Users can manage own favorites" ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

-- Policies: services
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage services" ON public.services FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = services.store_id AND stores.user_id = auth.uid()));

-- Policies: bookings
CREATE POLICY "Store owners can manage bookings" ON public.bookings FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = bookings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: promotions
CREATE POLICY "Active promotions viewable" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage promotions" ON public.promotions FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = promotions.store_id AND stores.user_id = auth.uid()));

-- Policies: invoices
CREATE POLICY "Store owners can manage invoices" ON public.invoices FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = invoices.store_id AND stores.user_id = auth.uid()));

-- Policies: abandoned_carts
CREATE POLICY "Store owners can manage abandoned carts" ON public.abandoned_carts FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = abandoned_carts.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can view own carts" ON public.abandoned_carts FOR SELECT USING (auth.uid() = user_id);

-- Policies: product_views
CREATE POLICY "Product views viewable by store owners" ON public.product_views FOR SELECT USING (EXISTS (SELECT 1 FROM products JOIN stores ON stores.id = products.store_id WHERE products.id = product_views.product_id AND stores.user_id = auth.uid()));
CREATE POLICY "Anyone can insert product views" ON public.product_views FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_views.product_id AND products.is_active = true));

-- Index
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON public.user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_services_store_id ON public.services(store_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_store_id ON public.bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_promotions_store_id ON public.promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON public.invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_store_id ON public.abandoned_carts(store_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);

-- Triggers
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
