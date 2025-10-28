-- ============================================================
-- Compléter les données de test
-- Date: 28 octobre 2025
-- Ajoute : variantes, inventaire, staff, disponibilités, commande
-- ============================================================

DO $$
DECLARE
  v_physical_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_service_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_customer_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  v_order_id UUID := '44444444-4444-4444-4444-444444444444'::uuid;
  v_physical_details_id UUID;
  v_service_details_id UUID;
BEGIN
  
  RAISE NOTICE '🔧 Completing test data...';
  
  -- ============================================================
  -- PHYSICAL PRODUCT DETAILS
  -- ============================================================
  
  -- Check if physical_products entry exists
  IF NOT EXISTS (SELECT 1 FROM physical_products WHERE product_id = v_physical_id) THEN
    INSERT INTO physical_products (
      id,
      product_id,
      sku,
      weight,
      weight_unit,
      length,
      width,
      height,
      dimensions_unit,
      has_variants
    )
    VALUES (
      gen_random_uuid(),
      v_physical_id,
      'TSH-PREM-001',
      0.25,
      'kg',
      30,
      25,
      2,
      'cm',
      true
    )
    RETURNING id INTO v_physical_details_id;
    RAISE NOTICE '✅ Physical product details created';
  ELSE
    SELECT id INTO v_physical_details_id FROM physical_products WHERE product_id = v_physical_id;
    RAISE NOTICE '✅ Physical product details already exist';
  END IF;

  -- Add variants if not exist
  IF NOT EXISTS (SELECT 1 FROM product_variants WHERE physical_product_id = v_physical_details_id) THEN
    INSERT INTO product_variants (
      id,
      physical_product_id,
      option1_value,
      option2_value,
      price,
      sku,
      inventory_quantity,
      barcode
    )
    VALUES 
      (gen_random_uuid(), v_physical_details_id, 'Bleu', 'S', 15000, 'TSH-PREM-001-BL-S', 10, 'BL-S-001'),
      (gen_random_uuid(), v_physical_details_id, 'Rouge', 'M', 15500, 'TSH-PREM-001-RD-M', 5, 'RD-M-001'),
      (gen_random_uuid(), v_physical_details_id, 'Vert', 'L', 16000, 'TSH-PREM-001-VT-L', 0, 'VT-L-001');
    RAISE NOTICE '✅ Product variants created (3)';
  ELSE
    RAISE NOTICE '✅ Product variants already exist';
  END IF;

  -- Add inventory for each variant
  INSERT INTO inventory_items (
    id,
    variant_id,
    location,
    quantity,
    reorder_point,
    reorder_quantity
  )
  SELECT 
    gen_random_uuid(),
    pv.id,
    'Entrepôt Principal',
    pv.inventory_quantity,
    3,
    10
  FROM product_variants pv
  WHERE pv.physical_product_id = v_physical_details_id
  ON CONFLICT (variant_id, location) DO UPDATE SET
    quantity = EXCLUDED.quantity;
  RAISE NOTICE '✅ Inventory items synced';

  -- ============================================================
  -- SERVICE DETAILS
  -- ============================================================
  
  -- Check if service_products entry exists
  IF NOT EXISTS (SELECT 1 FROM service_products WHERE product_id = v_service_id) THEN
    INSERT INTO service_products (
      id,
      product_id,
      duration_minutes,
      service_type,
      location,
      max_participants
    )
    VALUES (
      gen_random_uuid(),
      v_service_id,
      60,
      'in_person',
      'Salon de beauté downtown - 123 Avenue principale',
      1
    )
    RETURNING id INTO v_service_details_id;
    RAISE NOTICE '✅ Service details created';
  ELSE
    SELECT id INTO v_service_details_id FROM service_products WHERE product_id = v_service_id;
    RAISE NOTICE '✅ Service details already exist';
  END IF;

  -- Add staff members
  IF NOT EXISTS (SELECT 1 FROM service_staff_members WHERE service_product_id = v_service_details_id) THEN
    INSERT INTO service_staff_members (
      id,
      service_product_id,
      name,
      specialty,
      bio,
      photo_url,
      email
    )
    VALUES 
      (gen_random_uuid(), v_service_details_id, 'Marie Dupont', 'Coiffeuse senior', 'Professionnelle avec 10 ans d''expérience en coupe et coloration.', 'https://i.pravatar.cc/150?img=1', 'marie.dupont@example.com'),
      (gen_random_uuid(), v_service_details_id, 'Sophie Martin', 'Coloriste', 'Spécialiste de la coloration et du balayage.', 'https://i.pravatar.cc/150?img=5', 'sophie.martin@example.com');
    RAISE NOTICE '✅ Staff members created (2)';
  ELSE
    RAISE NOTICE '✅ Staff members already exist';
  END IF;

  -- Add availability (Mon-Fri 9h-17h)
  IF NOT EXISTS (SELECT 1 FROM service_availability WHERE service_product_id = v_service_details_id) THEN
    INSERT INTO service_availability (
      id,
      service_product_id,
      day_of_week,
      start_time,
      end_time,
      is_available
    )
    SELECT 
      gen_random_uuid(),
      v_service_details_id,
      d,
      '09:00'::time,
      '17:00'::time,
      true
    FROM generate_series(1, 5) AS d;
    RAISE NOTICE '✅ Service availability created (Mon-Fri)';
  ELSE
    RAISE NOTICE '✅ Service availability already exists';
  END IF;

  -- ============================================================
  -- ORDER WITH PARTIAL PAYMENT
  -- ============================================================
  
  -- Create customer
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
  RAISE NOTICE '✅ Customer created/updated';

  -- Create order with 30% deposit
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
  RAISE NOTICE '✅ Order created/updated';

  -- Add order item
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = v_order_id AND product_id = v_physical_id) THEN
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
    );
    RAISE NOTICE '✅ Order item created';
  ELSE
    RAISE NOTICE '✅ Order item already exists';
  END IF;

  -- ============================================================
  -- SUMMARY
  -- ============================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TEST DATA COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📍 TEST URLS:';
  RAISE NOTICE 'Physical Product: http://localhost:5173/physical/%', v_physical_id;
  RAISE NOTICE 'Service: http://localhost:5173/service/%', v_service_id;
  RAISE NOTICE 'Pay Balance: http://localhost:5173/payments/%/balance', v_order_id;
  
END $$;

-- Display summary
SELECT 
  '✅ Test Data Summary' AS status,
  (SELECT COUNT(*) FROM product_variants WHERE physical_product_id IN (SELECT id FROM physical_products WHERE product_id = '11111111-1111-1111-1111-111111111111')) AS variants_count,
  (SELECT COUNT(*) FROM service_staff_members WHERE service_product_id IN (SELECT id FROM service_products WHERE product_id = '22222222-2222-2222-2222-222222222222')) AS staff_count,
  (SELECT COUNT(*) FROM service_availability WHERE service_product_id IN (SELECT id FROM service_products WHERE product_id = '22222222-2222-2222-2222-222222222222')) AS availability_count,
  (SELECT COUNT(*) FROM orders WHERE id = '44444444-4444-4444-4444-444444444444') AS orders_count;

