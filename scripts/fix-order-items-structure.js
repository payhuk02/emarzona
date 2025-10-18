// Script pour vérifier et corriger la structure de la table order_items
// Ce script affiche le SQL à exécuter dans Supabase

console.log('🔧 Script de vérification de la structure order_items\n');

console.log('📋 Instructions:');
console.log('1. Ouvrez votre projet Supabase: https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb');
console.log('2. Allez dans SQL Editor');
console.log('3. Copiez et exécutez le SQL ci-dessous\n');

console.log('='.repeat(80));
console.log('SQL À EXÉCUTER DANS SUPABASE:');
console.log('='.repeat(80));

const sql = `
-- Vérification et correction de la structure de la table order_items
-- Ce script résout l'erreur: "column oi.product_name does not exist"

-- 1. Vérifier la structure actuelle de la table order_items
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ajouter les colonnes manquantes à order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_name TEXT;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS unit_price NUMERIC;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS total_price NUMERIC;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 4. Ajouter les colonnes manquantes à orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Recréer la contrainte de clé étrangère
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES public.orders(id) 
ON DELETE CASCADE;

-- 6. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 7. Rafraîchir le cache de schéma Supabase
NOTIFY pgrst, 'reload schema';

-- 8. Test de la structure corrigée
SELECT 
    o.id as order_id,
    o.order_number,
    o.total_amount,
    o.status,
    oi.id as item_id,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LIMIT 5;
`;

console.log(sql);

console.log('='.repeat(80));
console.log('📝 Explication de la correction:');
console.log('='.repeat(80));

console.log(`
🔧 Problème identifié:
   - Erreur: "column oi.product_name does not exist"
   - La table order_items n'a pas toutes les colonnes attendues
   - Les migrations n'ont pas été appliquées correctement

✅ Solution appliquée:
   1. Vérification de la structure actuelle des tables
   2. Ajout des colonnes manquantes avec ALTER TABLE
   3. Recréation des contraintes de clé étrangère
   4. Création des index pour les performances
   5. Rafraîchissement du cache de schéma Supabase
   6. Test de la structure corrigée

🎯 Colonnes ajoutées à order_items:
   - product_name TEXT
   - quantity INTEGER DEFAULT 1
   - unit_price NUMERIC
   - total_price NUMERIC
   - created_at TIMESTAMPTZ DEFAULT now()

🎯 Colonnes ajoutées à orders:
   - order_number TEXT UNIQUE
   - total_amount NUMERIC DEFAULT 0
   - currency TEXT DEFAULT 'XOF'
   - status TEXT DEFAULT 'pending'
   - payment_status TEXT DEFAULT 'unpaid'
   - created_at TIMESTAMPTZ DEFAULT now()
   - updated_at TIMESTAMPTZ DEFAULT now()

📋 Après exécution:
   1. Toutes les colonnes nécessaires existeront
   2. Les relations entre tables fonctionneront
   3. L'erreur "column does not exist" disparaîtra
   4. L'application fonctionnera sans erreur de base de données
`);

console.log('\n🎉 Une fois le SQL exécuté, toutes les colonnes manquantes seront ajoutées !');
