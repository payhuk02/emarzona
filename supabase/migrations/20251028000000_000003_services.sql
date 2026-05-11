-- Services System
-- Professional service products architecture

-- Table 1: Service Products
CREATE TABLE IF NOT EXISTS public.service_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL DEFAULT 'appointment',
  duration_minutes INTEGER NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'on_site',
  location_address TEXT,
  meeting_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  requires_staff BOOLEAN DEFAULT TRUE,
  max_participants INTEGER DEFAULT 1,
  pricing_type TEXT NOT NULL DEFAULT 'fixed',
  deposit_required BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10, 2),
  deposit_type TEXT,
  allow_booking_cancellation BOOLEAN DEFAULT TRUE,
  cancellation_deadline_hours INTEGER DEFAULT 24,
  require_approval BOOLEAN DEFAULT FALSE,
  buffer_time_before INTEGER DEFAULT 0,
  buffer_time_after INTEGER DEFAULT 0,
  max_bookings_per_day INTEGER,
  advance_booking_days INTEGER DEFAULT 30,
  total_bookings INTEGER DEFAULT 0,
  total_completed_bookings INTEGER DEFAULT 0,
  total_cancelled_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Staff Members
CREATE TABLE IF NOT EXISTS public.service_staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  total_bookings INTEGER DEFAULT 0,
  total_completed_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Availability Slots
CREATE TABLE IF NOT EXISTS public.service_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  staff_member_id UUID REFERENCES public.service_staff_members(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Resources
CREATE TABLE IF NOT EXISTS public.service_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT DEFAULT 'other',
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: Booking Participants
CREATE TABLE IF NOT EXISTS public.service_booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend service_bookings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'staff_member_id') THEN
    ALTER TABLE public.service_bookings ADD COLUMN staff_member_id UUID REFERENCES public.service_staff_members(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'participants_count') THEN
    ALTER TABLE public.service_bookings ADD COLUMN participants_count INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'deposit_paid') THEN
    ALTER TABLE public.service_bookings ADD COLUMN deposit_paid DECIMAL(10, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE public.service_bookings ADD COLUMN cancellation_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'meeting_url') THEN
    ALTER TABLE public.service_bookings ADD COLUMN meeting_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'customer_notes') THEN
    ALTER TABLE public.service_bookings ADD COLUMN customer_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'internal_notes') THEN
    ALTER TABLE public.service_bookings ADD COLUMN internal_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'reminder_sent_at') THEN
    ALTER TABLE public.service_bookings ADD COLUMN reminder_sent_at TIMESTAMPTZ;
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sp_product_id ON public.service_products(product_id);
CREATE INDEX IF NOT EXISTS idx_sas_service_id ON public.service_availability_slots(service_product_id);
CREATE INDEX IF NOT EXISTS idx_ssm_service_id ON public.service_staff_members(service_product_id);
CREATE INDEX IF NOT EXISTS idx_sr_service_id ON public.service_resources(service_product_id);
CREATE INDEX IF NOT EXISTS idx_sbp_booking_id ON public.service_booking_participants(booking_id);

-- Enable RLS
ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_booking_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "public_view_sp" ON public.service_products;
CREATE POLICY "public_view_sp" ON public.service_products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = service_products.product_id AND p.is_active = TRUE)
);

DROP POLICY IF EXISTS "users_manage_sp" ON public.service_products;
CREATE POLICY "users_manage_sp" ON public.service_products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.products p
    INNER JOIN public.stores s ON p.store_id = s.id
    WHERE p.id = service_products.product_id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "public_view_slots" ON public.service_availability_slots;
CREATE POLICY "public_view_slots" ON public.service_availability_slots FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "users_manage_slots" ON public.service_availability_slots;
CREATE POLICY "users_manage_slots" ON public.service_availability_slots FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.service_products sp
    INNER JOIN public.products p ON sp.product_id = p.id
    INNER JOIN public.stores s ON p.store_id = s.id
    WHERE sp.id = service_availability_slots.service_product_id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "public_view_staff" ON public.service_staff_members;
CREATE POLICY "public_view_staff" ON public.service_staff_members FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "users_manage_staff" ON public.service_staff_members;
CREATE POLICY "users_manage_staff" ON public.service_staff_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = service_staff_members.store_id AND s.user_id = auth.uid())
);

DROP POLICY IF EXISTS "public_view_res" ON public.service_resources;
CREATE POLICY "public_view_res" ON public.service_resources FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "users_manage_res" ON public.service_resources;
CREATE POLICY "users_manage_res" ON public.service_resources FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.service_products sp
    INNER JOIN public.products p ON sp.product_id = p.id
    INNER JOIN public.stores s ON p.store_id = s.id
    WHERE sp.id = service_resources.service_product_id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "users_view_parts" ON public.service_booking_participants;
CREATE POLICY "users_view_parts" ON public.service_booking_participants FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.service_bookings sb
    INNER JOIN public.products p ON sb.product_id = p.id
    INNER JOIN public.stores s ON p.store_id = s.id
    WHERE sb.id = service_booking_participants.booking_id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "users_manage_parts" ON public.service_booking_participants;
CREATE POLICY "users_manage_parts" ON public.service_booking_participants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.service_bookings sb
    INNER JOIN public.products p ON sb.product_id = p.id
    INNER JOIN public.stores s ON p.store_id = s.id
    WHERE sb.id = service_booking_participants.booking_id AND s.user_id = auth.uid()
  )
);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sp_updated_at ON public.service_products;
CREATE TRIGGER tr_sp_updated_at BEFORE UPDATE ON public.service_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_sas_updated_at ON public.service_availability_slots;
CREATE TRIGGER tr_sas_updated_at BEFORE UPDATE ON public.service_availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_ssm_updated_at ON public.service_staff_members;
CREATE TRIGGER tr_ssm_updated_at BEFORE UPDATE ON public.service_staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

