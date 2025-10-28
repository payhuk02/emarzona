-- ============================================================
-- Script de test simplifié - Données de test
-- Date: 28 octobre 2025
-- Version: CORRECTED
-- ============================================================

-- Nettoyer d'abord (optionnel)
-- DELETE FROM service_staff_members WHERE service_product_id IN (SELECT id FROM service_products WHERE product_id = 'test-service-001');
-- DELETE FROM service_availability WHERE service_product_id IN (SELECT id FROM service_products WHERE product_id = 'test-service-001');
-- DELETE FROM service_products WHERE product_id = 'test-service-001';
-- DELETE FROM physical_product_inventory WHERE physical_product_id IN (SELECT id FROM physical_products WHERE product_id = 'test-physical-001');
-- DELETE FROM physical_product_variants WHERE physical_product_id IN (SELECT id FROM physical_products WHERE product_id = 'test-physical-001');
-- DELETE FROM physical_products WHERE product_id = 'test-physical-001';
-- DELETE FROM order_items WHERE order_id = 'test-order-001';
-- DELETE FROM orders WHERE id = 'test-order-001';
-- DELETE FROM customers WHERE id = 'test-customer-001';
-- DELETE FROM products WHERE id IN ('test-physical-001', 'test-service-001');

-- ============================================================
-- TEST 1: Produit Physique
-- ============================================================

-- 1.1 Produit
INSERT INTO products (id, name, description, price, currency, category, store_id, product_type, image_url, images)
VALUES (
  'test-physical-001',
  'T-Shirt Premium Payhuk',
  'Un t-shirt de qualité supérieure en coton bio. 100% coton bio, coupe moderne, résistant au lavage.',
  15000,
  'XOF',
  'Vêtements',
  (SELECT id FROM stores LIMIT 1),
  'physical',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;

-- 1.2 Physical product details
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
  weight_kg = EXCLUDED.weight_kg;

-- 1.3 Variantes
DO $$
DECLARE
  physical_prod_id UUID;
BEGIN
  SELECT id INTO physical_prod_id FROM physical_products WHERE product_id = 'test-physical-001';
  
  -- Variante S - Bleu
  INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
  VALUES (gen_random_uuid(), physical_prod_id, 'S - Bleu', 'TSH-PRM-001-S-BL', 0, 10)
  ON CONFLICT DO NOTHING;
  
  -- Variante M - Rouge
  INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
  VALUES (gen_random_uuid(), physical_prod_id, 'M - Rouge', 'TSH-PRM-001-M-RD', 500, 5)
  ON CONFLICT DO NOTHING;
  
  -- Variante L - Vert
  INSERT INTO physical_product_variants (id, physical_product_id, name, sku, price_modifier, stock_quantity)
  VALUES (gen_random_uuid(), physical_prod_id, 'L - Vert', 'TSH-PRM-001-L-GR', 1000, 0)
  ON CONFLICT DO NOTHING;
END $$;

-- 1.4 Inventaire
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
-- TEST 2: Service
-- ============================================================

-- 2.1 Produit service
INSERT INTO products (id, name, description, price, currency, category, store_id, product_type, image_url)
VALUES (
  'test-service-001',
  'Coiffure Professionnelle',
  'Service de coiffure haut de gamme. Consultation personnalisée, shampoing inclus, coupe professionnelle.',
  25000,
  'XOF',
  'Beauté',
  (SELECT id FROM stores LIMIT 1),
  'service',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;

-- 2.2 Service details
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
  duration_minutes = EXCLUDED.duration_minutes;

-- 2.3 Staff
DO $$
DECLARE
  service_prod_id UUID;
BEGIN
  SELECT id INTO service_prod_id FROM service_products WHERE product_id = 'test-service-001';
  
  -- Marie Dupont
  IF NOT EXISTS (SELECT 1 FROM service_staff_members WHERE service_product_id = service_prod_id AND name = 'Marie Dupont') THEN
    INSERT INTO service_staff_members (id, service_product_id, name, specialty, bio, photo_url, email)
    VALUES (
      gen_random_uuid(),
      service_prod_id,
      'Marie Dupont',
      'Coiffeuse senior',
      'Coiffeuse professionnelle avec 10 ans d''expérience.',
      'https://i.pravatar.cc/150?img=1',
      'marie.dupont@example.com'
    );
  END IF;
  
  -- Sophie Martin
  IF NOT EXISTS (SELECT 1 FROM service_staff_members WHERE service_product_id = service_prod_id AND name = 'Sophie Martin') THEN
    INSERT INTO service_staff_members (id, service_product_id, name, specialty, bio, photo_url, email)
    VALUES (
      gen_random_uuid(),
      service_prod_id,
      'Sophie Martin',
      'Coiffeuse coloriste',
      'Spécialiste de la coloration et du balayage.',
      'https://i.pravatar.cc/150?img=5',
      'sophie.martin@example.com'
    );
  END IF;
END $$;

-- 2.4 Disponibilités (Lun-Ven 9h-17h)
DO $$
DECLARE
  service_prod_id UUID;
  day_num INT;
BEGIN
  SELECT id INTO service_prod_id FROM service_products WHERE product_id = 'test-service-001';
  
  FOR day_num IN 1..5 LOOP
    IF NOT EXISTS (SELECT 1 FROM service_availability WHERE service_product_id = service_prod_id AND day_of_week = day_num) THEN
      INSERT INTO service_availability (id, service_product_id, day_of_week, start_time, end_time, is_available)
      VALUES (
        gen_random_uuid(),
        service_prod_id,
        day_num,
        '09:00'::time,
        '17:00'::time,
        true
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- TEST 3: Commande avec paiement partiel
-- ============================================================

-- 3.1 Client
INSERT INTO customers (id, email, full_name, phone)
VALUES (
  'test-customer-001',
  'jean.test@example.com',
  'Jean Test',
  '+22612345678'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email;

-- 3.2 Commande
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
  total_amount = EXCLUDED.total_amount;

-- 3.3 Order items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 'test-order-001' AND product_id = 'test-physical-001') THEN
    INSERT INTO order_items (id, order_id, product_id, quantity, price)
    VALUES (
      gen_random_uuid(),
      'test-order-001',
      'test-physical-001',
      2,
      50000
    );
  END IF;
END $$;

-- ============================================================
-- Résultats
-- ============================================================

SELECT '✅ Données de test créées avec succès!' AS status;

-- URLs de test
SELECT 'PhysicalProductDetail' AS page, '/physical/test-physical-001' AS url
UNION ALL
SELECT 'ServiceDetail', '/service/test-service-001'
UNION ALL
SELECT 'PayBalance', '/payments/test-order-001/balance';

