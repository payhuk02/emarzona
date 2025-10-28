-- ============================================================
-- Compléter les données de test - SANS TRIGGERS
-- Date: 28 octobre 2025
-- Désactive temporairement les triggers pour éviter les erreurs
-- ============================================================

-- Désactiver les triggers temporairement
SET session_replication_role = replica;

DO $$
DECLARE
  v_customer_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  v_order_id UUID := '44444444-4444-4444-4444-444444444444'::uuid;
  v_physical_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
  
  RAISE NOTICE '🔧 Adding test data (triggers disabled)...';
  
  -- ============================================================
  -- CUSTOMER
  -- ============================================================
  
  INSERT INTO customers (id, email, full_name, phone, created_at)
  VALUES (
    v_customer_id,
    'jean.test@example.com',
    'Jean Test',
    '+22612345678',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RAISE NOTICE '✅ Customer created';

  -- ============================================================
  -- ORDER WITH PARTIAL PAYMENT
  -- ============================================================
  
  INSERT INTO orders (
    id,
    customer_id,
    total_amount,
    payment_type,
    deposit_percentage,
    paid_amount,
    remaining_amount,
    status,
    created_at
  )
  VALUES (
    v_order_id,
    v_customer_id,
    100000,
    'percentage',
    30,
    30000,
    70000,
    'pending',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_amount = EXCLUDED.remaining_amount;
  RAISE NOTICE '✅ Order created';

  -- ============================================================
  -- ORDER ITEM
  -- ============================================================
  
  INSERT INTO order_items (
    id,
    order_id,
    product_id,
    quantity,
    price,
    created_at
  )
  SELECT
    gen_random_uuid(),
    v_order_id,
    v_physical_id,
    2,
    50000,
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM order_items 
    WHERE order_id = v_order_id AND product_id = v_physical_id
  );
  RAISE NOTICE '✅ Order item created';

  -- ============================================================
  -- SECURED PAYMENT (pour PayBalance)
  -- ============================================================
  
  INSERT INTO secured_payments (
    id,
    order_id,
    total_amount,
    deposit_percentage,
    deposit_paid,
    balance_due,
    status,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_order_id,
    100000,
    30,
    30000,
    70000,
    'awaiting_balance',
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    deposit_paid = EXCLUDED.deposit_paid,
    balance_due = EXCLUDED.balance_due;
  RAISE NOTICE '✅ Secured payment created';

  -- ============================================================
  -- SUMMARY
  -- ============================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TEST DATA COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📍 TEST URLS:';
  RAISE NOTICE 'Pay Balance: http://localhost:5173/payments/%/balance', v_order_id;
  RAISE NOTICE 'Physical: http://localhost:5173/physical/%', v_physical_id;
  
END $$;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- Afficher les résultats
SELECT '✅ Test Data Created!' AS status;

SELECT 
  'Order #' || SUBSTRING(id::text, 1, 8) AS order_ref,
  total_amount || ' XOF' AS total,
  paid_amount || ' XOF (' || deposit_percentage || '%)' AS deposit,
  remaining_amount || ' XOF' AS balance,
  status
FROM orders 
WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;

SELECT 
  c.full_name AS customer,
  c.email,
  COUNT(oi.id) AS items_count,
  SUM(oi.quantity * oi.price) || ' XOF' AS order_total
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
WHERE c.id = '33333333-3333-3333-3333-333333333333'::uuid
GROUP BY c.full_name, c.email;

