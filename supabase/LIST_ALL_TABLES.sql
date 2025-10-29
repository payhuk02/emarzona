-- LISTE COMPLÈTE DE TOUTES LES TABLES E-COMMERCE

SELECT 
  CASE 
    WHEN tablename LIKE 'digital_%' THEN '💻 Digital Products'
    WHEN tablename LIKE 'physical_%' THEN '🏭 Physical Products'
    WHEN tablename LIKE 'service_%' THEN '🛎️ Services'
    WHEN tablename LIKE 'course_%' OR tablename = 'courses' THEN '🎓 Courses'
    ELSE '📦 Autre'
  END as système,
  tablename as nom_table,
  '✅' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'digital_%' OR
    tablename LIKE 'physical_%' OR
    tablename LIKE 'service_%' OR
    tablename LIKE 'course_%' OR
    tablename = 'courses' OR
    tablename IN ('product_variants', 'inventory_items', 'shipping_zones', 'pre_orders', 'backorders', 'size_charts')
  )
ORDER BY 
  CASE 
    WHEN tablename LIKE 'digital_%' THEN 1
    WHEN tablename LIKE 'physical_%' THEN 2
    WHEN tablename LIKE 'service_%' THEN 3
    WHEN tablename LIKE 'course_%' OR tablename = 'courses' THEN 4
    ELSE 5
  END,
  tablename;

