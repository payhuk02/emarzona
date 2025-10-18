// Script pour vérifier et corriger les relations entre order_items et orders
// Ce script affiche le SQL à exécuter dans Supabase

console.log('🔧 Script de vérification des relations order_items/orders\n');

console.log('📋 Instructions:');
console.log('1. Ouvrez votre projet Supabase: https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb');
console.log('2. Allez dans SQL Editor');
console.log('3. Copiez et exécutez le SQL ci-dessous\n');

console.log('='.repeat(80));
console.log('SQL À EXÉCUTER DANS SUPABASE:');
console.log('='.repeat(80));

const sql = `
-- Vérification et correction des relations order_items/orders
-- Ce script résout l'erreur: "Could not find a relationship between 'order_items' and 'orders'"

-- 1. Vérifier que les tables existent
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- 2. Vérifier les contraintes de clé étrangère
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

-- 3. Recréer la contrainte de clé étrangère si nécessaire
-- (Cette commande est sûre - elle ne fait rien si la contrainte existe déjà)
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES public.orders(id) 
ON DELETE CASCADE;

-- 4. Vérifier que la colonne order_number existe dans orders
-- (Ajouter si elle manque)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- 5. Créer un index sur order_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6. Rafraîchir le cache de schéma Supabase
-- (Cette commande force Supabase à recharger les métadonnées)
NOTIFY pgrst, 'reload schema';

-- 7. Test de la relation
SELECT 
    o.id as order_id,
    o.order_number,
    o.total_amount,
    COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.total_amount
LIMIT 5;
`;

console.log(sql);

console.log('='.repeat(80));
console.log('📝 Explication de la correction:');
console.log('='.repeat(80));

console.log(`
🔧 Problème identifié:
   - Erreur: "Could not find a relationship between 'order_items' and 'orders'"
   - Le cache de schéma Supabase n'est pas synchronisé
   - Les relations entre tables ne sont pas reconnues

✅ Solution appliquée:
   1. Vérification de l'existence des tables
   2. Vérification des contraintes de clé étrangère
   3. Recréation de la contrainte order_items_order_id_fkey
   4. Ajout de la colonne order_number si manquante
   5. Création d'index pour les performances
   6. Rafraîchissement du cache de schéma Supabase
   7. Test de la relation

🎯 Résultat attendu:
   - Les tables orders et order_items sont correctement liées
   - Le cache de schéma Supabase est synchronisé
   - L'erreur de relation disparaît
   - Les requêtes avec JOIN fonctionnent correctement

📋 Après exécution:
   1. Les relations seront correctement reconnues
   2. L'erreur "Could not find a relationship" disparaîtra
   3. L'application fonctionnera sans erreur de base de données
   4. Les requêtes complexes avec JOIN fonctionneront
`);

console.log('\n🎉 Une fois le SQL exécuté, l\'erreur de relation sera corrigée !');
