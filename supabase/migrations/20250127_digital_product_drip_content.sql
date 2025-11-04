-- =====================================================
-- PAYHUK DIGITAL PRODUCT DRIP CONTENT SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de libération progressive du contenu (drip content)
-- =====================================================

-- =====================================================
-- 1. TABLE: digital_product_drip_schedule
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_drip_schedule'
  ) THEN
    CREATE TABLE public.digital_product_drip_schedule (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
      file_id UUID REFERENCES public.digital_product_files(id) ON DELETE CASCADE,
      
      -- Release timing
      release_delay_days INTEGER NOT NULL DEFAULT 0 CHECK (release_delay_days >= 0),
      release_delay_hours INTEGER DEFAULT 0 CHECK (release_delay_hours >= 0),
      release_delay_minutes INTEGER DEFAULT 0 CHECK (release_delay_minutes >= 0),
      
      -- Release conditions
      release_type TEXT NOT NULL CHECK (release_type IN (
        'time_based',      -- Basé sur le temps (jours/heures après achat)
        'action_based',    -- Basé sur une action (completion, milestone)
        'date_based'       -- Basé sur une date spécifique
      )) DEFAULT 'time_based',
      
      release_date TIMESTAMPTZ, -- Pour date_based
      release_condition JSONB DEFAULT '{}'::jsonb, -- Pour action_based
      
      -- Notification
      email_notification BOOLEAN DEFAULT TRUE,
      notification_subject TEXT,
      notification_body TEXT,
      
      -- Display
      display_order INTEGER DEFAULT 0,
      release_title TEXT, -- Titre à afficher lors de la libération
      release_message TEXT, -- Message à afficher lors de la libération
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    COMMENT ON TABLE public.digital_product_drip_schedule IS 'Planification de libération progressive du contenu (drip content)';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_drip_schedule'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_drip_schedule_digital_product_id ON public.digital_product_drip_schedule(digital_product_id);
    CREATE INDEX IF NOT EXISTS idx_drip_schedule_file_id ON public.digital_product_drip_schedule(file_id);
    CREATE INDEX IF NOT EXISTS idx_drip_schedule_is_active ON public.digital_product_drip_schedule(is_active);
    CREATE INDEX IF NOT EXISTS idx_drip_schedule_display_order ON public.digital_product_drip_schedule(digital_product_id, display_order);
    CREATE INDEX IF NOT EXISTS idx_drip_schedule_release_date ON public.digital_product_drip_schedule(release_date);
  END IF;
END $$;

-- Trigger updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_drip_schedule'
  ) THEN
    DROP TRIGGER IF EXISTS update_drip_schedule_updated_at ON public.digital_product_drip_schedule;
    CREATE TRIGGER update_drip_schedule_updated_at
      BEFORE UPDATE ON public.digital_product_drip_schedule
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: drip_content_releases (Tracking)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'drip_content_releases'
  ) THEN
    CREATE TABLE public.drip_content_releases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      drip_schedule_id UUID NOT NULL REFERENCES public.digital_product_drip_schedule(id) ON DELETE CASCADE,
      digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
      file_id UUID REFERENCES public.digital_product_files(id) ON DELETE SET NULL,
      customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
      order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      
      -- Release info
      scheduled_release_date TIMESTAMPTZ NOT NULL,
      actual_release_date TIMESTAMPTZ, -- NULL = pas encore libéré
      release_status TEXT NOT NULL CHECK (release_status IN (
        'scheduled',
        'released',
        'cancelled',
        'failed'
      )) DEFAULT 'scheduled',
      
      -- Notification
      email_sent BOOLEAN DEFAULT FALSE,
      email_sent_at TIMESTAMPTZ,
      email_sent_error TEXT,
      
      -- Access tracking
      file_accessed BOOLEAN DEFAULT FALSE,
      first_access_date TIMESTAMPTZ,
      access_count INTEGER DEFAULT 0,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    COMMENT ON TABLE public.drip_content_releases IS 'Historique des libérations de contenu progressif';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'drip_content_releases'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_drip_releases_schedule_id ON public.drip_content_releases(drip_schedule_id);
    CREATE INDEX IF NOT EXISTS idx_drip_releases_digital_product_id ON public.drip_content_releases(digital_product_id);
    CREATE INDEX IF NOT EXISTS idx_drip_releases_customer_id ON public.drip_content_releases(customer_id);
    CREATE INDEX IF NOT EXISTS idx_drip_releases_order_id ON public.drip_content_releases(order_id);
    CREATE INDEX IF NOT EXISTS idx_drip_releases_status ON public.drip_content_releases(release_status);
    CREATE INDEX IF NOT EXISTS idx_drip_releases_scheduled_date ON public.drip_content_releases(scheduled_release_date);
    CREATE INDEX IF NOT EXISTS idx_drip_releases_actual_date ON public.drip_content_releases(actual_release_date);
  END IF;
END $$;

-- Trigger updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'drip_content_releases'
  ) THEN
    DROP TRIGGER IF EXISTS update_drip_releases_updated_at ON public.drip_content_releases;
    CREATE TRIGGER update_drip_releases_updated_at
      BEFORE UPDATE ON public.drip_content_releases
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. FUNCTION: Calculate release date
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_drip_release_date(
  p_purchase_date TIMESTAMPTZ,
  p_delay_days INTEGER,
  p_delay_hours INTEGER DEFAULT 0,
  p_delay_minutes INTEGER DEFAULT 0
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN p_purchase_date 
    + (p_delay_days || ' days')::INTERVAL
    + (p_delay_hours || ' hours')::INTERVAL
    + (p_delay_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 4. FUNCTION: Create drip releases for order
-- =====================================================

CREATE OR REPLACE FUNCTION create_drip_releases_for_order(
  p_order_id UUID,
  p_customer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_order_item RECORD;
  v_digital_product RECORD;
  v_drip_schedule RECORD;
  v_release_date TIMESTAMPTZ;
  v_release_id UUID;
  v_created_count INTEGER := 0;
BEGIN
  -- Récupérer la commande
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND payment_status = 'paid'
    AND status = 'completed';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_not_found',
      'message', 'Commande non trouvée ou non payée'
    );
  END IF;
  
  -- Récupérer les order_items de type digital
  FOR v_order_item IN
    SELECT * FROM public.order_items
    WHERE order_id = p_order_id
      AND product_type = 'digital'
  LOOP
    -- Récupérer le produit digital
    SELECT dp.* INTO v_digital_product
    FROM public.digital_products dp
    WHERE dp.product_id = v_order_item.product_id;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    -- Récupérer les schedules de drip content pour ce produit
    FOR v_drip_schedule IN
      SELECT * FROM public.digital_product_drip_schedule
      WHERE digital_product_id = v_digital_product.id
        AND is_active = TRUE
      ORDER BY display_order, release_delay_days, release_delay_hours
    LOOP
      -- Calculer la date de libération
      IF v_drip_schedule.release_type = 'date_based' AND v_drip_schedule.release_date IS NOT NULL THEN
        v_release_date := v_drip_schedule.release_date;
      ELSE
        v_release_date := calculate_drip_release_date(
          v_order.created_at,
          v_drip_schedule.release_delay_days,
          v_drip_schedule.release_delay_hours,
          v_drip_schedule.release_delay_minutes
        );
      END IF;
      
      -- Créer le release
      INSERT INTO public.drip_content_releases (
        drip_schedule_id,
        digital_product_id,
        file_id,
        customer_id,
        order_id,
        scheduled_release_date,
        release_status
      ) VALUES (
        v_drip_schedule.id,
        v_digital_product.id,
        v_drip_schedule.file_id,
        p_customer_id,
        p_order_id,
        v_release_date,
        'scheduled'
      ) RETURNING id INTO v_release_id;
      
      v_created_count := v_created_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'releases_created', v_created_count,
    'order_id', p_order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNCTION: Release drip content
-- =====================================================

CREATE OR REPLACE FUNCTION release_drip_content(
  p_release_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_release RECORD;
  v_customer RECORD;
  v_drip_schedule RECORD;
BEGIN
  -- Récupérer le release
  SELECT * INTO v_release
  FROM public.drip_content_releases
  WHERE id = p_release_id
    AND release_status = 'scheduled';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'release_not_found',
      'message', 'Release non trouvé ou déjà libéré'
    );
  END IF;
  
  -- Vérifier que la date de libération est passée
  IF v_release.scheduled_release_date > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_yet_released',
      'message', 'La date de libération n''est pas encore atteinte'
    );
  END IF;
  
  -- Récupérer le customer
  SELECT * INTO v_customer
  FROM public.customers
  WHERE id = v_release.customer_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'customer_not_found'
    );
  END IF;
  
  -- Récupérer le schedule pour les notifications
  SELECT * INTO v_drip_schedule
  FROM public.digital_product_drip_schedule
  WHERE id = v_release.drip_schedule_id;
  
  -- Mettre à jour le release
  UPDATE public.drip_content_releases
  SET
    actual_release_date = now(),
    release_status = 'released'
  WHERE id = p_release_id;
  
  -- Envoyer email si configuré (à implémenter avec un webhook ou service email)
  IF v_drip_schedule.email_notification THEN
    -- TODO: Déclencher webhook pour envoi email
    -- Pour l'instant, on marque juste comme envoyé
    UPDATE public.drip_content_releases
    SET email_sent = TRUE,
        email_sent_at = now()
    WHERE id = p_release_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'release_id', p_release_id,
    'released_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCTION: Get available drip content for customer
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_drip_content(
  p_customer_id UUID,
  p_digital_product_id UUID DEFAULT NULL
) RETURNS TABLE (
  release_id UUID,
  drip_schedule_id UUID,
  digital_product_id UUID,
  file_id UUID,
  file_name TEXT,
  file_url TEXT,
  release_title TEXT,
  release_message TEXT,
  scheduled_release_date TIMESTAMPTZ,
  actual_release_date TIMESTAMPTZ,
  is_released BOOLEAN,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dr.id AS release_id,
    dr.drip_schedule_id,
    dr.digital_product_id,
    dr.file_id,
    dpf.name AS file_name,
    dpf.file_url,
    ds.release_title,
    ds.release_message,
    dr.scheduled_release_date,
    dr.actual_release_date,
    (dr.release_status = 'released') AS is_released,
    (dr.release_status = 'released' OR dr.scheduled_release_date <= now()) AS is_available
  FROM public.drip_content_releases dr
  INNER JOIN public.digital_product_drip_schedule ds ON dr.drip_schedule_id = ds.id
  LEFT JOIN public.digital_product_files dpf ON dr.file_id = dpf.id
  WHERE dr.customer_id = p_customer_id
    AND dr.release_status IN ('scheduled', 'released')
    AND (p_digital_product_id IS NULL OR dr.digital_product_id = p_digital_product_id)
  ORDER BY dr.scheduled_release_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_drip_schedule'
  ) THEN
    ALTER TABLE public.digital_product_drip_schedule ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can manage drip schedules
    DROP POLICY IF EXISTS "Store owners manage drip schedules" ON public.digital_product_drip_schedule;
    CREATE POLICY "Store owners manage drip schedules"
      ON public.digital_product_drip_schedule
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.digital_products dp
          INNER JOIN public.products p ON dp.product_id = p.id
          INNER JOIN public.stores s ON p.store_id = s.id
          WHERE dp.id = digital_product_drip_schedule.digital_product_id
            AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS pour drip_content_releases
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'drip_content_releases'
  ) THEN
    ALTER TABLE public.drip_content_releases ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can view releases
    DROP POLICY IF EXISTS "Store owners view drip releases" ON public.drip_content_releases;
    CREATE POLICY "Store owners view drip releases"
      ON public.drip_content_releases
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.digital_products dp
          INNER JOIN public.products p ON dp.product_id = p.id
          INNER JOIN public.stores s ON p.store_id = s.id
          WHERE dp.id = drip_content_releases.digital_product_id
            AND s.user_id = auth.uid()
        )
      );
    
    -- Customers can view their own releases
    DROP POLICY IF EXISTS "Customers view own drip releases" ON public.drip_content_releases;
    CREATE POLICY "Customers view own drip releases"
      ON public.drip_content_releases
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND email = (
            SELECT email FROM public.customers
            WHERE id = drip_content_releases.customer_id
          )
        )
      );
  END IF;
END $$;

-- =====================================================
-- 8. VÉRIFICATION
-- =====================================================

SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE '%drip%'
  AND schemaname = 'public'
ORDER BY tablename;

