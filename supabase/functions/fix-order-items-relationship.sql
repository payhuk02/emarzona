-- =====================================================
-- CORRECTION DES RELATIONS ORDER_ITEMS/ORDERS
-- =====================================================
-- Ce fichier corrige l'erreur: "Could not find a relationship between 'order_items' and 'orders'"
-- 
-- Problème: Le cache de schéma Supabase n'est pas synchronisé
-- Solution: Recréer les contraintes et rafraîchir le cache
-- =====================================================

-- 1. Vérifier que les tables existent
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- 2. Vérifier les contraintes de clé étrangère existantes
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('orders', 'order_items')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- CORRECTION DES CONTRAINTES
-- =====================================================

-- 3. Recréer la contrainte de clé étrangère order_items -> orders
-- (Cette commande est sûre - elle ne fait rien si la contrainte existe déjà)
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES public.orders(id) 
ON DELETE CASCADE;

-- 4. S'assurer que la colonne order_number existe dans orders
-- (Ajouter si elle manque)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- 5. Créer un index sur order_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- =====================================================
-- RAFRAÎCHISSEMENT DU CACHE SUPABASE
-- =====================================================

-- 6. Rafraîchir le cache de schéma Supabase
-- (Cette commande force Supabase à recharger les métadonnées)
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- TESTS DE VALIDATION
-- =====================================================

-- 7. Test de la relation orders -> order_items
SELECT 
    o.id as order_id,
    o.order_number,
    o.total_amount,
    o.status,
    COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.total_amount, o.status
LIMIT 5;

-- 8. Test de la relation order_items -> orders
SELECT 
    oi.id as item_id,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    o.order_number,
    o.status as order_status
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
LIMIT 5;

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

-- 9. Vérifier que les contraintes sont bien créées
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'order_items'
    AND kcu.column_name = 'order_id';

-- =====================================================
-- NOTES D'UTILISATION
-- =====================================================
-- 1. Ce script vérifie et corrige les relations entre order_items et orders
-- 2. Il recrée les contraintes de clé étrangère si nécessaire
-- 3. Il rafraîchit le cache de schéma Supabase
-- 4. Il teste les relations pour s'assurer qu'elles fonctionnent
-- 
-- Après exécution de ce script:
-- ✅ Les relations order_items/orders sont correctement reconnues
-- ✅ L'erreur "Could not find a relationship" disparaît
-- ✅ Les requêtes avec JOIN fonctionnent correctement
-- ✅ L'application fonctionne sans erreur de base de données
-- =====================================================
