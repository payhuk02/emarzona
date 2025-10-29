-- COMPTAGE RAPIDE DES TABLES PAR SYSTÈME

-- Digital Products
SELECT 
  '💻 Digital Products' as système,
  COUNT(*) as nombre_tables
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'digital_%';

-- Physical Products
SELECT 
  '🏭 Physical Products' as système,
  COUNT(*) as nombre_tables
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'physical_%';

-- Services
SELECT 
  '🛎️ Services' as système,
  COUNT(*) as nombre_tables
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'service_%';

-- Courses
SELECT 
  '🎓 Courses' as système,
  COUNT(*) as nombre_tables
FROM pg_tables
WHERE schemaname = 'public' 
  AND (tablename LIKE 'course_%' OR tablename = 'courses');

-- TOTAL
SELECT 
  '📦 TOTAL E-COMMERCE' as système,
  COUNT(*) as nombre_tables
FROM pg_tables
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'digital_%' OR
    tablename LIKE 'physical_%' OR
    tablename LIKE 'service_%' OR
    tablename LIKE 'course_%' OR
    tablename = 'courses'
  );

