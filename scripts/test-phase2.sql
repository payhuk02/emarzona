-- =====================================================
-- SCRIPT DE VÉRIFICATION RAPIDE - PHASE 2
-- Date: 28 octobre 2025
-- =====================================================

-- 1. Vérifier que la colonne payment_options existe
SELECT 
  'payment_options column exists' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'payment_options'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- 2. Vérifier les produits avec payment_options configurés
SELECT 
  'Products with payment_options' as test_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has products'
    ELSE '⚠️ No products yet'
  END as status
FROM products
WHERE payment_options IS NOT NULL;

-- 3. Vérifier les types de paiement utilisés
SELECT 
  'Payment types distribution' as test_name,
  payment_options->>'payment_type' as payment_type,
  COUNT(*) as count
FROM products
WHERE payment_options IS NOT NULL
GROUP BY payment_options->>'payment_type';

-- 4. Vérifier les commandes avec payment_type
SELECT 
  'Orders with advanced payments' as test_name,
  payment_type,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue,
  SUM(percentage_paid) as total_deposits,
  SUM(remaining_amount) as total_remaining
FROM orders
WHERE payment_type IS NOT NULL
GROUP BY payment_type;

-- 5. Vérifier les secured_payments
SELECT 
  'Secured payments status' as test_name,
  status,
  COUNT(*) as count,
  SUM(held_amount) as total_held
FROM secured_payments
GROUP BY status;

-- 6. Vérifier les conversations actives
SELECT 
  'Active conversations' as test_name,
  status,
  COUNT(*) as count
FROM conversations
GROUP BY status;

-- 7. Vérifier les messages par type
SELECT 
  'Messages by type' as test_name,
  message_type,
  COUNT(*) as count
FROM messages
GROUP BY message_type;

-- 8. Vérifier les disputes actifs
SELECT 
  'Disputes by status' as test_name,
  status,
  COUNT(*) as count
FROM disputes
GROUP BY status;

-- 9. Top 5 produits avec paiement partiel
SELECT 
  'Top 5 products with partial payment' as test_name,
  p.name,
  p.price,
  p.payment_options->>'payment_type' as payment_type,
  (p.payment_options->>'percentage_rate')::int as percentage_rate,
  COUNT(o.id) as order_count
FROM products p
LEFT JOIN orders o ON o.id IN (
  SELECT order_id FROM order_items WHERE product_id = p.id
)
WHERE p.payment_options->>'payment_type' = 'percentage'
GROUP BY p.id, p.name, p.price, p.payment_options
ORDER BY order_count DESC
LIMIT 5;

-- 10. Vérifier intégrité des données
SELECT 
  'Data integrity check' as test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - No orphaned records'
    ELSE '❌ FAIL - Found orphaned records'
  END as status,
  COUNT(*) as orphaned_count
FROM secured_payments sp
LEFT JOIN orders o ON o.id = sp.order_id
WHERE o.id IS NULL;

-- =====================================================
-- RÉSUMÉ GLOBAL
-- =====================================================
SELECT 
  '=== SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM products WHERE payment_options IS NOT NULL) as products_with_payment_options,
  (SELECT COUNT(*) FROM orders WHERE payment_type != 'full') as advanced_payment_orders,
  (SELECT COUNT(*) FROM secured_payments) as secured_payments_count,
  (SELECT COUNT(*) FROM conversations) as conversations_count,
  (SELECT COUNT(*) FROM messages) as messages_count,
  (SELECT COUNT(*) FROM disputes) as disputes_count;

