-- =====================================================
-- Migration: Ajout d'Index Manquants
-- Date: 1 Février 2025
-- Description: Ajout d'index sur les colonnes fréquemment utilisées pour améliorer les performances
-- =====================================================

-- =====================================================
-- 1. INDEXES POUR PRODUCTS ET RELATIONS
-- =====================================================

-- Index sur store_id dans products (déjà présent dans la plupart des cas, mais on s'assure)
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id) WHERE store_id IS NOT NULL;

-- Index composite sur products pour les requêtes fréquentes (store + status)
CREATE INDEX IF NOT EXISTS idx_products_store_status ON public.products(store_id, is_active) 
  WHERE is_active = TRUE;

-- Index sur category dans products
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category) 
  WHERE category IS NOT NULL;

-- =====================================================
-- 2. INDEXES POUR ORDERS ET ORDER_ITEMS
-- =====================================================

-- Index composite sur orders pour les requêtes fréquentes (store + status)
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders(store_id, status) 
  WHERE store_id IS NOT NULL;

-- Index sur customer_id dans orders (si pas déjà présent)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id) 
  WHERE customer_id IS NOT NULL;

-- Index sur created_at dans orders pour les requêtes de date
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Index composite sur order_items (order + product)
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON public.order_items(order_id, product_id);

-- =====================================================
-- 3. INDEXES POUR DIGITAL PRODUCTS
-- =====================================================

-- Index sur product_id dans digital_products (si pas déjà présent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_products'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_digital_products_product_id ON public.digital_products(product_id) 
      WHERE product_id IS NOT NULL;
  END IF;
END $$;

-- Index composite sur digital_product_downloads (user + product)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_product_downloads'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_digital_downloads_user_product ON public.digital_product_downloads(user_id, digital_product_id);
    
    -- Index sur download_date pour les requêtes de date
    CREATE INDEX IF NOT EXISTS idx_digital_downloads_date ON public.digital_product_downloads(download_date DESC);
  END IF;
END $$;

-- =====================================================
-- 4. INDEXES POUR PHYSICAL PRODUCTS
-- =====================================================

-- Index sur physical_product_id dans physical_products (si pas déjà présent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'physical_products'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_physical_products_product_id ON public.physical_products(product_id) 
      WHERE product_id IS NOT NULL;
  END IF;
END $$;

-- Index sur quantity dans product_variants pour les requêtes de stock
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_variants'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_product_variants_quantity ON public.product_variants(quantity) 
      WHERE quantity IS NOT NULL;
    
    -- Index composite sur product_variants (physical_product + quantity)
    CREATE INDEX IF NOT EXISTS idx_product_variants_product_quantity ON public.product_variants(physical_product_id, quantity) 
      WHERE physical_product_id IS NOT NULL;
  END IF;
END $$;

-- Index sur quantity_available dans inventory_items pour les requêtes de stock
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_items'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity_available ON public.inventory_items(quantity_available) 
      WHERE quantity_available IS NOT NULL;
    
    -- Index composite sur inventory_items (product + quantity_available)
    CREATE INDEX IF NOT EXISTS idx_inventory_items_product_quantity ON public.inventory_items(physical_product_id, quantity_available) 
      WHERE physical_product_id IS NOT NULL;
  END IF;
END $$;

-- Index composite sur serial_numbers (physical_product + status) - seulement si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'serial_numbers'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_serial_numbers_physical_product_status ON public.serial_numbers(physical_product_id, status);
  END IF;
END $$;

-- =====================================================
-- 5. INDEXES POUR SERVICES
-- =====================================================

-- Index sur service_product_id dans service_products (si pas déjà présent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_products'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_service_products_product_id ON public.service_products(product_id) 
      WHERE product_id IS NOT NULL;
  END IF;
END $$;

-- Index composite sur service_bookings (product + status + scheduled_date)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_bookings'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_service_bookings_product_status_date ON public.service_bookings(product_id, status, scheduled_date);
  END IF;
END $$;

-- Index sur service_product_id dans service_bookings (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_bookings' 
    AND column_name = 'service_product_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_service_bookings_service_status_date ON public.service_bookings(service_product_id, status, scheduled_date);
  END IF;
END $$;

-- Index sur user_id dans service_bookings (service_bookings utilise user_id, pas customer_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_bookings'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_service_bookings_user ON public.service_bookings(user_id) 
      WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- Index sur customer_id dans service_bookings (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_bookings' 
    AND column_name = 'customer_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_service_bookings_customer ON public.service_bookings(customer_id) 
      WHERE customer_id IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 6. INDEXES POUR COURSES
-- =====================================================

-- Index sur course_id dans course_enrollments (si pas déjà présent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'course_enrollments'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id);
    
    -- Index composite sur course_enrollments (user + course + status)
    -- Note: course_enrollments utilise 'status' et non 'enrollment_status'
    CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course_status ON public.course_enrollments(user_id, course_id, status);
  END IF;
END $$;

-- Index sur lesson_id dans course_lesson_progress
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'course_lesson_progress'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.course_lesson_progress(lesson_id);
    
    -- Index composite sur course_lesson_progress (enrollment + lesson)
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_lesson ON public.course_lesson_progress(enrollment_id, lesson_id);
  END IF;
END $$;

-- =====================================================
-- 7. INDEXES POUR ARTIST PRODUCTS
-- =====================================================

-- Index sur artist_product_id dans artist_products (si pas déjà présent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_products'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_artist_products_product_id ON public.artist_products(product_id) 
      WHERE product_id IS NOT NULL;
  END IF;
END $$;

-- Index composite sur artist_product_auctions (product + status + end_date)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_product_auctions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_auctions_product_status_end ON public.artist_product_auctions(artist_product_id, status, end_date);
  END IF;
END $$;

-- Index sur auction_id dans auction_bids
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auction_bids'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON public.auction_bids(auction_id);
    
    -- Index composite sur auction_bids (auction + amount DESC pour les meilleures offres)
    CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_amount ON public.auction_bids(auction_id, bid_amount DESC);
  END IF;
END $$;

-- =====================================================
-- 8. INDEXES POUR WARRANTIES
-- =====================================================

-- Index composite sur product_warranties (user + status)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_warranties'
  ) THEN
    -- Vérifier que les colonnes user_id et status existent
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_warranties' 
      AND column_name = 'user_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_warranties' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_warranties_user_status ON public.product_warranties(user_id, status) 
        WHERE user_id IS NOT NULL;
    END IF;
    
    -- Index sur end_date pour les requêtes d'expiration (si status existe)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_warranties' 
      AND column_name = 'end_date'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_warranties' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_warranties_end_date_active ON public.product_warranties(end_date) 
        WHERE status = 'active';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 9. INDEXES POUR STORES
-- =====================================================

-- Index sur user_id dans stores (si pas déjà présent)
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id) 
  WHERE user_id IS NOT NULL;

-- Index sur is_active dans stores
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(is_active) 
  WHERE is_active = TRUE;

-- =====================================================
-- 10. INDEXES POUR CUSTOMERS
-- =====================================================

-- Index composite sur customers (store + email) pour les recherches
CREATE INDEX IF NOT EXISTS idx_customers_store_email ON public.customers(store_id, email) 
  WHERE email IS NOT NULL;

-- =====================================================
-- 11. INDEXES POUR TIMESTAMPS (requêtes fréquentes)
-- =====================================================

-- Index sur updated_at dans les tables principales pour les requêtes de mise à jour récente
-- (Ces index sont généralement déjà présents, mais on s'assure)

-- Index sur created_at dans products
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Index sur updated_at dans products
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON INDEX idx_products_store_status IS 'Index composite pour les requêtes fréquentes de produits actifs par store';
COMMENT ON INDEX idx_orders_store_status IS 'Index composite pour les requêtes fréquentes de commandes par store et statut';
COMMENT ON INDEX idx_service_bookings_product_status_date IS 'Index composite pour les requêtes de réservations par produit, statut et date';
COMMENT ON INDEX idx_course_enrollments_user_course_status IS 'Index composite pour les requêtes d''enrollments par utilisateur, cours et statut';
COMMENT ON INDEX idx_auction_bids_auction_amount IS 'Index composite pour récupérer rapidement les meilleures offres par enchère';

