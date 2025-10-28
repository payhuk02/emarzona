-- ============================================================
-- Script de création de données de test
-- Date: 28 octobre 2025
-- Objectif: Faciliter les tests visuels des nouvelles pages
-- ============================================================

-- ============================================================
-- TEST 1: Produit Physique avec variantes
-- ============================================================

-- 1.1 Créer un produit physique de test
INSERT INTO products (id, name, description, price, currency, category, store_id, type, image_url, images)
VALUES (
  'test-physical-001',
  'T-Shirt Premium Payhuk',
  '<p>Un t-shirt de <strong>qualité supérieure</strong> en coton bio.</p><ul><li>100% coton bio</li><li>Coupe moderne</li><li>Résistant au lavage</li><li>Disponible en plusieurs couleurs</li></ul>',
  15000,
  'XOF',
  'Vêtements',
  (SELECT id FROM stores LIMIT 1),
  'physical',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images;

-- 1.2 Créer les détails du produit physique
INSERT INTO physical_products (id, product_id, weight_kg, dimensions_cm, sku, brand, total_stock)
VALUES (
  gen_random_uuid(),
  'test-physical-001',
  0.25,
  '{"length": 30, "width": 25, "height": 2}',
  'TSH-PRM-001',
  'Premium Wear',
  25
)
ON CONFLICT (product_id) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  dimensions_cm = EXCLUDED.dimensions_cm,
  sku = EXCLUDED.sku,
  brand = EXCLUDED.brand;

-- 1.3 Créer les variantes
INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'),
  'S - Bleu',
  'TSH-PRM-001-S-BL',
  0,
  10
WHERE NOT EXISTS (
  SELECT 1 FROM physical_product_variants 
  WHERE physical_product_id = (SELECT id FROM physical_products WHERE product_id = 'test-physical-001')
  AND name = 'S - Bleu'
);

INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'),
  'M - Rouge',
  'TSH-PRM-001-M-RD',
  500,
  5
WHERE NOT EXISTS (
  SELECT 1 FROM physical_product_variants 
  WHERE physical_product_id = (SELECT id FROM physical_products WHERE product_id = 'test-physical-001')
  AND name = 'M - Rouge'
);

INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM physical_products WHERE product_id = 'test-physical-001'),
  'L - Vert',
  'TSH-PRM-001-L-GR',
  1000,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM physical_product_variants 
  WHERE physical_product_id = (SELECT id FROM physical_products WHERE product_id = 'test-physical-001')
  AND name = 'L - Vert'
);

-- 1.4 Créer l'inventaire
INSERT INTO physical_product_inventory (id, physical_product_id, variant_id, quantity, reorder_point)
SELECT 
  gen_random_uuid(),
  pp.id,
  pv.id,
  pv.stock_quantity,
  3
FROM physical_products pp
JOIN physical_product_variants pv ON pv.physical_product_id = pp.id
WHERE pp.product_id = 'test-physical-001'
ON CONFLICT (physical_product_id, variant_id) DO UPDATE SET
  quantity = EXCLUDED.quantity;

-- ============================================================
-- TEST 2: Service avec staff
-- ============================================================

-- 2.1 Créer un service de test
INSERT INTO products (id, name, description, price, currency, category, store_id, type, image_url)
VALUES (
  'test-service-001',
  'Coiffure Professionnelle',
  '<p>Service de <strong>coiffure haut de gamme</strong> dans notre salon moderne.</p><ul><li>Consultation personnalisée</li><li>Shampoing inclus</li><li>Coupe professionnelle</li><li>Brushing et coiffage</li></ul>',
  25000,
  'XOF',
  'Beauté',
  (SELECT id FROM stores LIMIT 1),
  'service',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url;

-- 2.2 Créer les détails du service
INSERT INTO service_products (id, product_id, duration_minutes, service_type, location, max_participants)
VALUES (
  gen_random_uuid(),
  'test-service-001',
  60,
  'in_person',
  'Salon de beauté downtown - 123 Avenue principale',
  1
)
ON CONFLICT (product_id) DO UPDATE SET
  duration_minutes = EXCLUDED.duration_minutes,
  service_type = EXCLUDED.service_type,
  location = EXCLUDED.location,
  max_participants = EXCLUDED.max_participants;

-- 2.3 Créer les membres du staff
INSERT INTO service_staff_members (id, service_product_id, name, specialty, bio, photo_url, email)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM service_products WHERE product_id = 'test-service-001'),
  'Marie Dupont',
  'Coiffeuse senior',
  'Coiffeuse professionnelle avec 10 ans d''expérience en coupe, coloration et balayage. Spécialisée dans les coupes modernes et les colorations créatives.',
  'https://i.pravatar.cc/150?img=1',
  'marie.dupont@example.com'
WHERE NOT EXISTS (
  SELECT 1 FROM service_staff_members 
  WHERE service_product_id = (SELECT id FROM service_products WHERE product_id = 'test-service-001')
  AND name = 'Marie Dupont'
);

INSERT INTO service_staff_members (id, service_product_id, name, specialty, bio, photo_url, email)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM service_products WHERE product_id = 'test-service-001'),
  'Sophie Martin',
  'Coiffeuse coloriste',
  'Spécialiste de la coloration et du balayage, formée aux dernières techniques internationales. 5 ans d''expérience.',
  'https://i.pravatar.cc/150?img=5',
  'sophie.martin@example.com'
WHERE NOT EXISTS (
  SELECT 1 FROM service_staff_members 
  WHERE service_product_id = (SELECT id FROM service_products WHERE product_id = 'test-service-001')
  AND name = 'Sophie Martin'
);

-- 2.4 Créer les disponibilités (Lun-Ven 9h-17h)
INSERT INTO service_availability (id, service_product_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM service_products WHERE product_id = 'test-service-001'),
  day,
  '09:00'::time,
  '17:00'::time,
  true
FROM generate_series(1, 5) AS day
WHERE NOT EXISTS (
  SELECT 1 FROM service_availability 
  WHERE service_product_id = (SELECT id FROM service_products WHERE product_id = 'test-service-001')
  AND day_of_week = day
);

-- ============================================================
-- TEST 3: Commande avec paiement partiel
-- ============================================================

-- 3.1 Créer un client de test
INSERT INTO customers (id, email, full_name, phone)
VALUES (
  'test-customer-001',
  'jean.test@example.com',
  'Jean Test',
  '+22612345678'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- 3.2 Créer une commande avec paiement partiel
INSERT INTO orders (id, customer_id, total_amount, payment_type, deposit_percentage, paid_amount, remaining_amount, status)
VALUES (
  'test-order-001',
  'test-customer-001',
  100000,
  'percentage',
  30,
  30000,
  70000,
  'pending'
)
ON CONFLICT (id) DO UPDATE SET
  total_amount = EXCLUDED.total_amount,
  payment_type = EXCLUDED.payment_type,
  deposit_percentage = EXCLUDED.deposit_percentage,
  paid_amount = EXCLUDED.paid_amount,
  remaining_amount = EXCLUDED.remaining_amount;

-- 3.3 Créer les articles de la commande
INSERT INTO order_items (id, order_id, product_id, quantity, price)
SELECT 
  gen_random_uuid(),
  'test-order-001',
  'test-physical-001',
  2,
  50000
WHERE NOT EXISTS (
  SELECT 1 FROM order_items 
  WHERE order_id = 'test-order-001'
  AND product_id = 'test-physical-001'
);

-- ============================================================
-- Afficher les résultats
-- ============================================================

SELECT '✅ Données de test créées avec succès !' AS status;

SELECT 
  'TEST 1: Produit Physique' AS test,
  p.id,
  p.name,
  p.price,
  (SELECT COUNT(*) FROM physical_product_variants WHERE physical_product_id = pp.id) AS variants_count,
  array_length(p.images, 1) AS images_count
FROM products p
JOIN physical_products pp ON pp.product_id = p.id
WHERE p.id = 'test-physical-001';

SELECT 
  'TEST 2: Service' AS test,
  p.id,
  p.name,
  p.price,
  (SELECT COUNT(*) FROM service_staff_members WHERE service_product_id = sp.id) AS staff_count,
  (SELECT COUNT(*) FROM service_availability WHERE service_product_id = sp.id) AS availability_count
FROM products p
JOIN service_products sp ON sp.product_id = p.id
WHERE p.id = 'test-service-001';

SELECT 
  'TEST 3: Commande paiement partiel' AS test,
  o.id,
  o.total_amount,
  o.paid_amount,
  o.remaining_amount,
  o.deposit_percentage || '%' AS deposit,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
FROM orders o
WHERE o.id = 'test-order-001';

-- ============================================================
-- URLs de test à utiliser
-- ============================================================

SELECT '📍 URLs DE TEST' AS info;
SELECT 'PhysicalProductDetail' AS page, 'http://localhost:5173/physical/test-physical-001' AS url;
SELECT 'ServiceDetail' AS page, 'http://localhost:5173/service/test-service-001' AS url;
SELECT 'PayBalance' AS page, 'http://localhost:5173/payments/test-order-001/balance' AS url;

