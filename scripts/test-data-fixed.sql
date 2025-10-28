-- ============================================================
-- Script de test avec UUIDs valides
-- Date: 28 octobre 2025
-- ============================================================

DO $$
DECLARE
  default_store_id UUID;
  physical_product_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  service_product_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  customer_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  order_id UUID := '44444444-4444-4444-4444-444444444444'::uuid;
  physical_prod_details_id UUID;
  service_prod_details_id UUID;
BEGIN
  -- Récupérer le premier store
  SELECT id INTO default_store_id FROM stores LIMIT 1;
  
  IF default_store_id IS NULL THEN
    RAISE EXCEPTION 'Aucun store trouvé. Créez un store d''abord.';
  END IF;

  -- ============================================================
  -- PRODUIT PHYSIQUE
  -- ============================================================
  
  -- Produit
  INSERT INTO products (id, name, slug, description, price, currency, category, store_id, product_type, image_url, images)
  VALUES (
    physical_product_id,
    'T-Shirt Premium Payhuk',
    't-shirt-premium-payhuk-test',
    'Un t-shirt de qualité supérieure en coton bio. 100% coton bio, coupe moderne, résistant au lavage.',
    15000,
    'XOF',
    'Vêtements',
    default_store_id,
    'physical',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    images = EXCLUDED.images;

  -- Physical product details
  INSERT INTO physical_products (id, product_id, weight_kg, dimensions_cm, sku, brand, total_stock)
  VALUES (
    gen_random_uuid(),
    physical_product_id,
    0.25,
    '{"length": 30, "width": 25, "height": 2}',
    'TSH-PRM-001',
    'Premium Wear',
    25
  )
  ON CONFLICT (product_id) DO UPDATE SET
    weight_kg = EXCLUDED.weight_kg,
    total_stock = EXCLUDED.total_stock
  RETURNING id INTO physical_prod_details_id;
  
  -- Si le retour est NULL, récupérer l'ID existant
  IF physical_prod_details_id IS NULL THEN
    SELECT id INTO physical_prod_details_id FROM physical_products WHERE product_id = physical_product_id;
  END IF;

  -- Variantes
  INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
  VALUES 
    (gen_random_uuid(), physical_prod_details_id, 'S - Bleu', 'TSH-PRM-001-S-BL', 0, 10),
    (gen_random_uuid(), physical_prod_details_id, 'M - Rouge', 'TSH-PRM-001-M-RD', 500, 5),
    (gen_random_uuid(), physical_prod_details_id, 'L - Vert', 'TSH-PRM-001-L-GR', 1000, 0)
  ON CONFLICT (physical_product_id, sku) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity;

  -- Inventaire
  INSERT INTO physical_product_inventory (id, physical_product_id, variant_id, quantity, reorder_point)
  SELECT 
    gen_random_uuid(),
    physical_prod_details_id,
    pv.id,
    pv.stock_quantity,
    3
  FROM physical_product_variants pv
  WHERE pv.physical_product_id = physical_prod_details_id
  ON CONFLICT (physical_product_id, variant_id) DO UPDATE SET
    quantity = EXCLUDED.quantity;

  -- ============================================================
  -- SERVICE
  -- ============================================================
  
  -- Produit service
  INSERT INTO products (id, name, slug, description, price, currency, category, store_id, product_type, image_url)
  VALUES (
    service_product_id,
    'Coiffure Professionnelle',
    'coiffure-professionnelle-test',
    'Service de coiffure haut de gamme. Consultation personnalisée, shampoing inclus, coupe professionnelle.',
    25000,
    'XOF',
    'Beauté',
    default_store_id,
    'service',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url;

  -- Service details
  INSERT INTO service_products (id, product_id, duration_minutes, service_type, location, max_participants)
  VALUES (
    gen_random_uuid(),
    service_product_id,
    60,
    'in_person',
    'Salon de beauté downtown - 123 Avenue principale',
    1
  )
  ON CONFLICT (product_id) DO UPDATE SET
    duration_minutes = EXCLUDED.duration_minutes,
    location = EXCLUDED.location
  RETURNING id INTO service_prod_details_id;
  
  -- Si le retour est NULL, récupérer l'ID existant
  IF service_prod_details_id IS NULL THEN
    SELECT id INTO service_prod_details_id FROM service_products WHERE product_id = service_product_id;
  END IF;

  -- Staff
  INSERT INTO service_staff_members (id, service_product_id, name, specialty, bio, photo_url, email)
  VALUES 
    (gen_random_uuid(), service_prod_details_id, 'Marie Dupont', 'Coiffeuse senior', 'Coiffeuse professionnelle avec 10 ans d''expérience.', 'https://i.pravatar.cc/150?img=1', 'marie.dupont@example.com'),
    (gen_random_uuid(), service_prod_details_id, 'Sophie Martin', 'Coiffeuse coloriste', 'Spécialiste de la coloration et du balayage.', 'https://i.pravatar.cc/150?img=5', 'sophie.martin@example.com')
  ON CONFLICT (service_product_id, email) DO NOTHING;

  -- Disponibilités (Lun-Ven 9h-17h)
  INSERT INTO service_availability (id, service_product_id, day_of_week, start_time, end_time, is_available)
  SELECT 
    gen_random_uuid(),
    service_prod_details_id,
    day_num,
    '09:00'::time,
    '17:00'::time,
    true
  FROM generate_series(1, 5) AS day_num
  ON CONFLICT (service_product_id, day_of_week) DO NOTHING;

  -- ============================================================
  -- COMMANDE
  -- ============================================================
  
  -- Client
  INSERT INTO customers (id, email, full_name, phone)
  VALUES (
    customer_id,
    'jean.test@example.com',
    'Jean Test',
    '+22612345678'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Commande
  INSERT INTO orders (id, customer_id, total_amount, payment_type, deposit_percentage, paid_amount, remaining_amount, status)
  VALUES (
    order_id,
    customer_id,
    100000,
    'percentage',
    30,
    30000,
    70000,
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_amount = EXCLUDED.remaining_amount;

  -- Order items
  INSERT INTO order_items (id, order_id, product_id, quantity, price)
  VALUES (
    gen_random_uuid(),
    order_id,
    physical_product_id,
    2,
    50000
  )
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- RÉSULTATS
  -- ============================================================
  
  RAISE NOTICE '✅ Données de test créées avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📍 URLs DE TEST:';
  RAISE NOTICE 'PhysicalProductDetail: /physical/%', physical_product_id;
  RAISE NOTICE 'ServiceDetail: /service/%', service_product_id;
  RAISE NOTICE 'PayBalance: /payments/%/balance', order_id;
  
END $$;

-- Afficher les résultats
SELECT '✅ Script exécuté avec succès!' AS status;

SELECT 
  'PhysicalProductDetail' AS page,
  '/physical/' || id AS url,
  name,
  price || ' ' || currency AS prix
FROM products 
WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

SELECT 
  'ServiceDetail' AS page,
  '/service/' || id AS url,
  name,
  price || ' ' || currency AS prix
FROM products 
WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

SELECT 
  'PayBalance' AS page,
  '/payments/' || id || '/balance' AS url,
  total_amount || ' XOF' AS total,
  paid_amount || ' XOF (' || deposit_percentage || '%)' AS acompte,
  remaining_amount || ' XOF' AS solde
FROM orders 
WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;

