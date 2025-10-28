-- ============================================================
-- Script de test ULTRA SIMPLE - Products Only
-- Date: 28 octobre 2025
-- ============================================================

DO $$
DECLARE
  v_store_id UUID;
  v_physical_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_service_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
BEGIN
  -- Get first store
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Please create a store first.';
  END IF;

  -- ============================================================
  -- PRODUIT PHYSIQUE (products table only)
  -- ============================================================
  
  INSERT INTO products (
    id, 
    name, 
    slug, 
    description, 
    price, 
    currency, 
    category, 
    store_id, 
    product_type, 
    image_url, 
    images
  )
  VALUES (
    v_physical_id,
    'T-Shirt Premium Payhuk',
    't-shirt-premium-test',
    'Un t-shirt de qualité supérieure',
    15000,
    'XOF',
    'Vêtements',
    v_store_id,
    'physical',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price;

  -- ============================================================
  -- SERVICE (products table only)
  -- ============================================================
  
  INSERT INTO products (
    id,
    name,
    slug,
    description,
    price,
    currency,
    category,
    store_id,
    product_type,
    image_url
  )
  VALUES (
    v_service_id,
    'Coiffure Professionnelle',
    'coiffure-pro-test',
    'Service de coiffure haut de gamme',
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

  RAISE NOTICE '✅ Test products created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📍 TEST URLS:';
  RAISE NOTICE 'Physical: http://localhost:5173/physical/%', v_physical_id;
  RAISE NOTICE 'Service: http://localhost:5173/service/%', v_service_id;
  
END $$;

-- Display results
SELECT 
  '✅ Script executed!' AS status,
  COUNT(*) AS products_created
FROM products 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid
);

SELECT 
  id,
  name,
  product_type,
  price || ' ' || currency AS price,
  '/physical/' || id AS url_physical,
  '/service/' || id AS url_service
FROM products 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid
)
ORDER BY product_type;

