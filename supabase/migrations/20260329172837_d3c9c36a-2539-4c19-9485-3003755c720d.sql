
-- =============================================
-- BATCH 5: High-frequency missing tables
-- =============================================

-- 1. enrollments (21 refs) - probably alias for course_enrollments, create as view
CREATE OR REPLACE VIEW public.enrollments AS
  SELECT * FROM public.course_enrollments;

-- 2. suppliers (8 refs)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  address text,
  city text,
  country text,
  website text,
  contact_person text,
  payment_terms text,
  lead_time_days integer DEFAULT 7,
  minimum_order_amount numeric DEFAULT 0,
  currency text DEFAULT 'XOF',
  rating numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage suppliers" ON public.suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = suppliers.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. digital_alerts (10 refs)
CREATE TABLE IF NOT EXISTS public.digital_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL,
  priority text DEFAULT 'medium',
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage digital alerts" ON public.digital_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_alerts.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_digital_alerts_updated_at BEFORE UPDATE ON public.digital_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. backorders (10 refs)
CREATE TABLE IF NOT EXISTS public.backorders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid,
  user_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  status text DEFAULT 'pending',
  expected_date timestamptz,
  fulfilled_at timestamptz,
  notified_at timestamptz,
  order_id uuid REFERENCES public.orders(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage backorders" ON public.backorders FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = backorders.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users view own backorders" ON public.backorders FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_backorders_updated_at BEFORE UPDATE ON public.backorders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. tax_configurations (9 refs)
CREATE TABLE IF NOT EXISTS public.tax_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate numeric NOT NULL DEFAULT 0,
  country text,
  region text,
  tax_type text DEFAULT 'vat',
  is_inclusive boolean DEFAULT true,
  is_active boolean DEFAULT true,
  applies_to text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage taxes" ON public.tax_configurations FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = tax_configurations.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_tax_configurations_updated_at BEFORE UPDATE ON public.tax_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. serial_numbers (9 refs)
CREATE TABLE IF NOT EXISTS public.serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  serial_number text NOT NULL,
  status text DEFAULT 'available',
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid,
  assigned_at timestamptz,
  warranty_expires_at timestamptz,
  batch_number text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, serial_number)
);

ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage serials" ON public.serial_numbers FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = serial_numbers.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_serial_numbers_updated_at BEFORE UPDATE ON public.serial_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. product_warranties (9 refs)
CREATE TABLE IF NOT EXISTS public.product_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_months integer NOT NULL DEFAULT 12,
  coverage_type text DEFAULT 'standard',
  terms text,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage warranties" ON public.product_warranties FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = product_warranties.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Warranties publicly viewable" ON public.product_warranties FOR SELECT USING (is_active = true);
CREATE TRIGGER update_product_warranties_updated_at BEFORE UPDATE ON public.product_warranties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. warranty_claims (7 refs)
CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id uuid NOT NULL REFERENCES public.product_warranties(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  serial_number text,
  issue_description text NOT NULL,
  status text DEFAULT 'submitted',
  resolution text,
  resolved_at timestamptz,
  photos text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own claims" ON public.warranty_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create claims" ON public.warranty_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Store owners manage claims" ON public.warranty_claims FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = warranty_claims.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_warranty_claims_updated_at BEFORE UPDATE ON public.warranty_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. pre_orders (7 refs)
CREATE TABLE IF NOT EXISTS public.pre_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  customer_email text,
  customer_name text,
  quantity integer DEFAULT 1,
  deposit_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  expected_date timestamptz,
  fulfilled_at timestamptz,
  order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage pre-orders" ON public.pre_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = pre_orders.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users view own pre-orders" ON public.pre_orders FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_pre_orders_updated_at BEFORE UPDATE ON public.pre_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. product_lots (7 refs)
CREATE TABLE IF NOT EXISTS public.product_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  lot_number text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  remaining_quantity integer NOT NULL DEFAULT 0,
  cost_per_unit numeric DEFAULT 0,
  supplier_id uuid REFERENCES public.suppliers(id),
  manufactured_at timestamptz,
  expires_at timestamptz,
  received_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage lots" ON public.product_lots FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = product_lots.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_product_lots_updated_at BEFORE UPDATE ON public.product_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. affiliate_short_links (7 refs)
CREATE TABLE IF NOT EXISTS public.affiliate_short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  store_id uuid REFERENCES public.stores(id),
  short_code text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_short_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates manage own short links" ON public.affiliate_short_links FOR ALL USING (
  EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_short_links.affiliate_id AND affiliates.user_id = auth.uid())
);
CREATE POLICY "Active short links viewable" ON public.affiliate_short_links FOR SELECT USING (is_active = true);
CREATE TRIGGER update_affiliate_short_links_updated_at BEFORE UPDATE ON public.affiliate_short_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. service_waitlist (8 refs)
CREATE TABLE IF NOT EXISTS public.service_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  customer_email text,
  customer_name text,
  customer_phone text,
  preferred_date timestamptz,
  preferred_time text,
  status text DEFAULT 'waiting',
  notified_at timestamptz,
  booked_at timestamptz,
  booking_id uuid,
  position integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage waitlist" ON public.service_waitlist FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = service_waitlist.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users view own waitlist" ON public.service_waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_service_waitlist_updated_at BEFORE UPDATE ON public.service_waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
