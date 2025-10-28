-- =====================================================
-- PAYHUK SERVICE BOOKINGS SYSTEM
-- Date: 27 Octobre 2025
-- Description: Système de réservation pour produits de type service
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: service_bookings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME NOT NULL,
  scheduled_end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',      -- En attente de confirmation
    'confirmed',    -- Confirmé
    'rescheduled',  -- Replanifié
    'cancelled',    -- Annulé
    'completed',    -- Terminé
    'no_show'       -- Client absent
  )) DEFAULT 'pending',
  
  -- Meeting details (pour services en ligne)
  meeting_url TEXT,
  meeting_id TEXT,
  meeting_password TEXT,
  meeting_platform TEXT, -- 'zoom', 'google-meet', 'teams', etc.
  
  -- Notes
  customer_notes TEXT,
  provider_notes TEXT,
  internal_notes TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Rescheduling
  rescheduled_from UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
  reschedule_count INTEGER DEFAULT 0,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  refund_issued BOOLEAN DEFAULT FALSE,
  refund_amount NUMERIC,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Durée réelle de la session
  
  -- Payment (optionnel, si besoin de lier aux paiements)
  payment_id UUID,
  amount_paid NUMERIC,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour service_bookings
CREATE INDEX IF NOT EXISTS idx_service_bookings_product_id ON public.service_bookings(product_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON public.service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider_id ON public.service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_scheduled_date ON public.service_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_created_at ON public.service_bookings(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.service_bookings IS 'Réservations/sessions pour produits de type service';

-- =====================================================
-- 2. TABLE: service_availability
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Disponibilité récurrente
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Dimanche, 6 = Samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Override pour dates spécifiques (optionnel)
  specific_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(product_id, provider_id, day_of_week, start_time, specific_date)
);

-- Indexes pour service_availability
CREATE INDEX IF NOT EXISTS idx_service_availability_product_id ON public.service_availability(product_id);
CREATE INDEX IF NOT EXISTS idx_service_availability_provider_id ON public.service_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_availability_day_of_week ON public.service_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_service_availability_is_active ON public.service_availability(is_active);

-- Trigger updated_at
CREATE TRIGGER update_service_availability_updated_at
  BEFORE UPDATE ON public.service_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.service_availability IS 'Horaires de disponibilité pour les services';

-- =====================================================
-- 3. TABLE: service_packages
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  package_name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER GENERATED ALWAYS AS (total_sessions - sessions_used) STORED,
  
  -- Pricing
  package_price NUMERIC NOT NULL,
  price_per_session NUMERIC GENERATED ALWAYS AS (package_price / total_sessions) STORED,
  
  -- Validity
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour service_packages
CREATE INDEX IF NOT EXISTS idx_service_packages_product_id ON public.service_packages(product_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_user_id ON public.service_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_is_active ON public.service_packages(is_active);

-- Trigger updated_at
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.service_packages IS 'Packages de sessions pour les services';

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Policies: service_bookings

-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.service_bookings;
CREATE POLICY "Users can view own bookings"
  ON public.service_bookings
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = provider_id);

-- Users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON public.service_bookings;
CREATE POLICY "Users can create bookings"
  ON public.service_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellation, notes)
DROP POLICY IF EXISTS "Users can update own bookings" ON public.service_bookings;
CREATE POLICY "Users can update own bookings"
  ON public.service_bookings
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = provider_id);

-- Providers can view bookings for their products
DROP POLICY IF EXISTS "Providers can view product bookings" ON public.service_bookings;
CREATE POLICY "Providers can view product bookings"
  ON public.service_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = service_bookings.product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: service_availability

-- Anyone can view active availability
DROP POLICY IF EXISTS "Anyone can view active availability" ON public.service_availability;
CREATE POLICY "Anyone can view active availability"
  ON public.service_availability
  FOR SELECT
  USING (is_active = TRUE);

-- Store owners can manage availability for their products
DROP POLICY IF EXISTS "Store owners can manage availability" ON public.service_availability;
CREATE POLICY "Store owners can manage availability"
  ON public.service_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      INNER JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = service_availability.product_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: service_packages

-- Users can view their own packages
DROP POLICY IF EXISTS "Users can view own packages" ON public.service_packages;
CREATE POLICY "Users can view own packages"
  ON public.service_packages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create packages (après achat)
DROP POLICY IF EXISTS "Users can create packages" ON public.service_packages;
CREATE POLICY "Users can create packages"
  ON public.service_packages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir les créneaux disponibles
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_product_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH availability AS (
    SELECT
      sa.start_time,
      sa.end_time
    FROM public.service_availability sa
    WHERE sa.product_id = p_product_id
      AND sa.is_active = TRUE
      AND (
        sa.day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
        OR sa.specific_date = p_date
      )
  ),
  bookings AS (
    SELECT
      sb.scheduled_start_time,
      sb.scheduled_end_time
    FROM public.service_bookings sb
    WHERE sb.product_id = p_product_id
      AND sb.scheduled_date = p_date
      AND sb.status IN ('pending', 'confirmed')
  )
  SELECT
    a.start_time,
    a.end_time,
    NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.scheduled_start_time < a.end_time
        AND b.scheduled_end_time > a.start_time
    ) AS is_available
  FROM availability a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les stats de réservations
CREATE OR REPLACE FUNCTION public.get_service_booking_stats(
  p_product_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_bookings', COUNT(*),
    'pending_bookings', COUNT(*) FILTER (WHERE status = 'pending'),
    'confirmed_bookings', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'completed_bookings', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled_bookings', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'no_show_count', COUNT(*) FILTER (WHERE status = 'no_show'),
    'total_revenue', COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed'), 0)
  )
  INTO result
  FROM public.service_bookings
  WHERE product_id = p_product_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Afficher les tables créées
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('service_bookings', 'service_availability', 'service_packages')
  AND schemaname = 'public';

-- Afficher les indexes
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('service_bookings', 'service_availability', 'service_packages')
  AND schemaname = 'public'
ORDER BY tablename, indexname;


