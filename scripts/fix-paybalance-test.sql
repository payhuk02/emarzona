-- ============================================================
-- FIX PayBalance - Données de test correctes
-- ============================================================

DO $$
DECLARE
  v_store_id UUID := '55555555-5555-5555-5555-555555555555';
  v_customer_id UUID := '33333333-3333-3333-3333-333333333333';
  v_order_id UUID := '44444444-4444-4444-4444-444444444444';
  v_product_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN

  -- 1. Insérer/Update customer
  INSERT INTO customers (id, name, email, phone, created_at)
  VALUES (
    v_customer_id,
    'Jean Test',
    'jean.test@example.com',
    '+22612345678',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  RAISE NOTICE '✅ Customer created/updated';

  -- 2. Insérer/Update order
  INSERT INTO orders (
    id,
    customer_id,
    store_id,
    order_number,
    total_amount,
    percentage_paid,
    remaining_amount,
    status,
    payment_status,
    currency,
    created_at
  )
  VALUES (
    v_order_id,
    v_customer_id,
    v_store_id,
    'ORD-2025-001',
    100000,
    30000,  -- Acompte payé
    70000,  -- Solde restant
    'pending',
    'partial',
    'XOF',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    percentage_paid = EXCLUDED.percentage_paid,
    remaining_amount = EXCLUDED.remaining_amount,
    payment_status = EXCLUDED.payment_status;

  RAISE NOTICE '✅ Order created/updated';

  -- 3. Insérer order_items
  INSERT INTO order_items (
    id,
    order_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    total_price,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_order_id,
    v_product_id,
    'T-Shirt Premium Payhuk',
    2,
    50000,
    100000,
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Order item created';

END $$;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

SELECT 
  '✅ Order créée' AS status,
  order_number,
  total_amount || ' XOF' AS total,
  percentage_paid || ' XOF (30%)' AS acompte,
  remaining_amount || ' XOF' AS solde,
  status,
  payment_status
FROM orders 
WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;

SELECT 
  '✅ Customer créé' AS status,
  name,
  email,
  phone
FROM customers
WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;

