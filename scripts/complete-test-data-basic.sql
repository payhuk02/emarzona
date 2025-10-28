-- ============================================================
-- Compléter les données de test - VERSION BASIQUE
-- Date: 28 octobre 2025
-- Utilise UNIQUEMENT les tables de base qui existent
-- ============================================================

DO $$
DECLARE
  v_customer_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  v_order_id UUID := '44444444-4444-4444-4444-444444444444'::uuid;
  v_physical_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
  
  RAISE NOTICE '🔧 Adding basic test data...';
  
  -- ============================================================
  -- CUSTOMER
  -- ============================================================
  
  INSERT INTO customers (id, email, full_name, phone)
  VALUES (
    v_customer_id,
    'jean.test@example.com',
    'Jean Test',
    '+22612345678'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RAISE NOTICE '✅ Customer created';

  -- ============================================================
  -- ORDER WITH PARTIAL PAYMENT (30% deposit)
  -- ============================================================
  
  INSERT INTO orders (
    id,
    customer_id,
    total_amount,
    payment_type,
    deposit_percentage,
    paid_amount,
    remaining_amount,
    status
  )
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
  ON CONFLICT (id) DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_amount = EXCLUDED.remaining_amount;
  RAISE NOTICE '✅ Order created (Total: 100,000 XOF, Paid: 30,000 XOF, Balance: 70,000 XOF)';

  -- ============================================================
  -- ORDER ITEM
  -- ============================================================
  
  INSERT INTO order_items (
    id,
    order_id,
    product_id,
    quantity,
    price
  )
  VALUES (
    gen_random_uuid(),
    v_order_id,
    v_physical_id,
    2,
    50000
  )
  ON CONFLICT (order_id, product_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    price = EXCLUDED.price;
  RAISE NOTICE '✅ Order item created (2x T-Shirts @ 50,000 XOF)';

  -- ============================================================
  -- SUMMARY
  -- ============================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 BASIC TEST DATA COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📍 IMPORTANT - Limitations:';
  RAISE NOTICE '⚠️  Variantes: Non disponibles (migration non exécutée)';
  RAISE NOTICE '⚠️  Staff: Non disponible (migration non exécutée)';
  RAISE NOTICE '⚠️  Calendrier: Non disponible (migration non exécutée)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ FONCTIONNEL:';
  RAISE NOTICE '   - Pages produits (layout, images, prix)';
  RAISE NOTICE '   - Page paiement balance';
  RAISE NOTICE '';
  RAISE NOTICE '📍 TEST URLS:';
  RAISE NOTICE 'Physical Product: http://localhost:5173/physical/11111111-1111-1111-1111-111111111111';
  RAISE NOTICE 'Service: http://localhost:5173/service/22222222-2222-2222-2222-222222222222';
  RAISE NOTICE 'Pay Balance: http://localhost:5173/payments/44444444-4444-4444-4444-444444444444/balance';
  
END $$;

-- Display results
SELECT '✅ Test Data Created!' AS status;

SELECT 
  'Customer' AS entity,
  full_name AS name,
  email,
  phone
FROM customers 
WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;

SELECT 
  'Order' AS entity,
  id,
  total_amount || ' XOF' AS total,
  paid_amount || ' XOF' AS paid,
  remaining_amount || ' XOF' AS balance,
  deposit_percentage || '%' AS deposit_pct,
  status
FROM orders 
WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;

SELECT 
  'Order Items' AS entity,
  p.name AS product_name,
  oi.quantity,
  oi.price || ' XOF' AS unit_price,
  (oi.quantity * oi.price) || ' XOF' AS total
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = '44444444-4444-4444-4444-444444444444'::uuid;

