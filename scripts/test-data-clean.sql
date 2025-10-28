-- ============================================================
-- Script de test - Version Clean
-- Date: 28 octobre 2025
-- ============================================================

DO $$
DECLARE
  v_store_id UUID;
  v_physical_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_service_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_customer_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  v_order_id UUID := '44444444-4444-4444-4444-444444444444'::uuid;
  v_physical_details_id UUID;
  v_service_details_id UUID;
BEGIN
  -- Get first store
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Please create a store first.';
  END IF;

  -- ============================================================
  -- PHYSICAL PRODUCT
  -- ============================================================
  
  INSERT INTO products (id, name, slug, description, price, currency, category, store_id, product_type, image_url, images)
  VALUES (
    v_physical_id,
    'T-Shirt Premium Payhuk',
    't-shirt-premium-test',
    'Un t-shirt de qualité supérieure en coton bio.',
    15000,
    'XOF',
    'Vêtements',
    v_store_id,
    'physical',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price;

  INSERT INTO physical_products (id, product_id, weight_kg, dimensions_cm, sku, brand, total_stock)
  VALUES (
    gen_random_uuid(),
    v_physical_id,
    0.25,
    '{"length": 30, "width": 25, "height": 2}',
    'TSH-001',
    'Premium',
    25
  )
  ON CONFLICT (product_id) DO UPDATE SET total_stock = 25
  RETURNING id INTO v_physical_details_id;
  
  IF v_physical_details_id IS NULL THEN
    SELECT id INTO v_physical_details_id FROM physical_products WHERE product_id = v_physical_id;
  END IF;

  INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
  VALUES 
    (gen_random_uuid(), v_physical_details_id, 'S - Bleu', 'TSH-001-S', 0, 10),
    (gen_random_uuid(), v_physical_details_id, 'M - Rouge', 'TSH-001-M', 500, 5),
    (gen_random_uuid(), v_physical_details_id, 'L - Vert', 'TSH-001-L', 1000, 0)
  ON CONFLICT (physical_product_id, sku) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;

  INSERT INTO physical_product_inventory (id, physical_product_id, variant_id, quantity, reorder_point)
  SELECT 
    gen_random_uuid(),
    v_physical_details_id,
    pv.id,
    pv.stock_quantity,
    3
  FROM physical_product_variants pv
  WHERE pv.physical_product_id = v_physical_details_id
  ON CONFLICT (physical_product_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity;

  -- ============================================================
  -- SERVICE
  -- ============================================================
  
  INSERT INTO products (id, name, slug, description, price, currency, category, store_id, product_type, image_url)
  VALUES (
    v_service_id,
    'Coiffure Professionnelle',
    'coiffure-pro-test',
    'Service de coiffure haut de gamme.',
    25000,
    'XOF',
    'Beauté',
    v_store_id,
    'service',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price;

  INSERT INTO service_products (id, product_id, duration_minutes, service_type, location, max_participants)
  VALUES (
    gen_random_uuid(),
    v_service_id,
    60,
    'in_person',
    'Salon downtown',
    1
  )
  ON CONFLICT (product_id) DO UPDATE SET duration_minutes = 60
  RETURNING id INTO v_service_details_id;
  
  IF v_service_details_id IS NULL THEN
    SELECT id INTO v_service_details_id FROM service_products WHERE product_id = v_service_id;
  END IF;

  INSERT INTO service_staff_members (id, service_product_id, name, specialty, bio, photo_url, email)
  VALUES 
    (gen_random_uuid(), v_service_details_id, 'Marie Dupont', 'Coiffeuse senior', 'Professionnelle avec 10 ans d''expérience', 'https://i.pravatar.cc/150?img=1', 'marie@example.com'),
    (gen_random_uuid(), v_service_details_id, 'Sophie Martin', 'Coloriste', 'Spécialiste coloration', 'https://i.pravatar.cc/150?img=5', 'sophie@example.com')
  ON CONFLICT (service_product_id, email) DO NOTHING;

  INSERT INTO service_availability (id, service_product_id, day_of_week, start_time, end_time, is_available)
  SELECT 
    gen_random_uuid(),
    v_service_details_id,
    d,
    '09:00'::time,
    '17:00'::time,
    true
  FROM generate_series(1, 5) AS d
  ON CONFLICT (service_product_id, day_of_week) DO NOTHING;

  -- ============================================================
  -- ORDER
  -- ============================================================
  
  INSERT INTO customers (id, email, full_name, phone)
  VALUES (
    v_customer_id,
    'jean.test@example.com',
    'Jean Test',
    '+22612345678'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO orders (id, customer_id, total_amount, payment_type, deposit_percentage, paid_amount, remaining_amount, status)
  VALUES (
    v_order_id,
    v_customer_id,
    100000,
    'percentage',
    30,
    30000,
    70000,
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET total_amount = 100000;

  INSERT INTO order_items (id, order_id, product_id, quantity, price)
  VALUES (gen_random_uuid(), v_order_id, v_physical_id, 2, 50000)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Test data created successfully!';
  RAISE NOTICE 'Physical: /physical/%', v_physical_id;
  RAISE NOTICE 'Service: /service/%', v_service_id;
  RAISE NOTICE 'Payment: /payments/%/balance', v_order_id;
  
END $$;

SELECT '✅ Done!' AS status;

