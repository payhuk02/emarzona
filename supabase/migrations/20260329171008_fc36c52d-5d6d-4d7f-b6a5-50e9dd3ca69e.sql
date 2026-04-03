
-- =====================================================
-- 2. SERVICE SYSTEM: Create missing tables
-- =====================================================

-- service_products (the hooks query this, not "services")
CREATE TABLE IF NOT EXISTS public.service_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  service_type text DEFAULT 'appointment',
  duration_minutes integer DEFAULT 60,
  location_type text DEFAULT 'on_site',
  location_address text,
  meeting_url text,
  timezone text DEFAULT 'Africa/Abidjan',
  requires_staff boolean DEFAULT false,
  max_participants integer DEFAULT 1,
  pricing_type text DEFAULT 'fixed',
  deposit_required boolean DEFAULT false,
  deposit_amount numeric DEFAULT 0,
  deposit_type text DEFAULT 'fixed',
  allow_booking_cancellation boolean DEFAULT true,
  cancellation_deadline_hours integer DEFAULT 24,
  require_approval boolean DEFAULT false,
  buffer_time_before integer DEFAULT 0,
  buffer_time_after integer DEFAULT 0,
  max_bookings_per_day integer,
  advance_booking_days integer DEFAULT 30,
  total_bookings integer DEFAULT 0,
  total_completed_bookings integer DEFAULT 0,
  total_cancelled_bookings integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service products viewable by everyone" ON public.service_products FOR SELECT USING (true);
CREATE POLICY "Store owners can manage service products" ON public.service_products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = service_products.store_id AND stores.user_id = auth.uid())
);

-- service_availability_slots
CREATE TABLE IF NOT EXISTS public.service_availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id uuid REFERENCES public.service_products(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  staff_member_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability slots viewable by everyone" ON public.service_availability_slots FOR SELECT USING (true);
CREATE POLICY "Store owners can manage availability" ON public.service_availability_slots FOR ALL USING (
  EXISTS (
    SELECT 1 FROM service_products sp JOIN stores s ON s.id = sp.store_id
    WHERE sp.id = service_availability_slots.service_product_id AND s.user_id = auth.uid()
  )
);

-- service_staff_members
CREATE TABLE IF NOT EXISTS public.service_staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id uuid REFERENCES public.service_products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  avatar_url text,
  bio text,
  is_active boolean DEFAULT true,
  total_bookings integer DEFAULT 0,
  total_completed_bookings integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff viewable by everyone" ON public.service_staff_members FOR SELECT USING (true);
CREATE POLICY "Store owners can manage staff" ON public.service_staff_members FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = service_staff_members.store_id AND stores.user_id = auth.uid())
);

-- service_resources
CREATE TABLE IF NOT EXISTS public.service_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id uuid REFERENCES public.service_products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  resource_type text DEFAULT 'room',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources viewable by everyone" ON public.service_resources FOR SELECT USING (true);
CREATE POLICY "Store owners can manage resources" ON public.service_resources FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = service_resources.store_id AND stores.user_id = auth.uid())
);

-- service_bookings
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  user_id uuid,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'pending',
  total_price numeric DEFAULT 0,
  staff_member_id uuid REFERENCES public.service_staff_members(id),
  participants_count integer DEFAULT 1,
  deposit_paid numeric DEFAULT 0,
  cancellation_reason text,
  meeting_url text,
  customer_notes text,
  internal_notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage service bookings" ON public.service_bookings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM products p JOIN stores s ON s.id = p.store_id
    WHERE p.id = service_bookings.product_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own service bookings" ON public.service_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create service bookings" ON public.service_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_service_products_updated_at BEFORE UPDATE ON public.service_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_availability_slots_updated_at BEFORE UPDATE ON public.service_availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_staff_members_updated_at BEFORE UPDATE ON public.service_staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_resources_updated_at BEFORE UPDATE ON public.service_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
