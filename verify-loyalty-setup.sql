-- Vérification de l'installation du système de fidélisation
-- Exécutez ce script pour vérifier que tout est correctement configuré

-- 1. Vérifier la structure des tables
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('loyalty_rules', 'loyalty_tiers', 'user_loyalty_profiles', 'loyalty_transactions', 'user_badges')
ORDER BY table_name, ordinal_position;

-- 2. Vérifier que la colonne user_id existe dans loyalty_transactions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'loyalty_transactions'
AND column_name = 'user_id';

-- 3. Vérifier les indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE '%loyalty%'
ORDER BY tablename, indexname;

-- 4. Vérifier RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename LIKE '%loyalty%'
ORDER BY tablename, policyname;

-- 5. Vérifier les données par défaut
SELECT 'loyalty_tiers count' as table_check, COUNT(*) as count FROM loyalty_tiers
UNION ALL
SELECT 'loyalty_rules count' as table_check, COUNT(*) as count FROM loyalty_rules;

-- 6. Test d'insertion basique (remplacer USER_ID par un vrai UUID)
-- SELECT award_loyalty_points('00000000-0000-0000-0000-000000000000'::UUID, 100, 'Test points');

SELECT '✅ Vérification terminée - Vérifiez les résultats ci-dessus' as status;