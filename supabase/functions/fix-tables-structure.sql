-- =====================================================
-- CORRECTION DE LA STRUCTURE DES TABLES ORDERS/ORDER_ITEMS
-- =====================================================
-- Ce fichier corrige l'erreur: "column oi.product_name does not exist"
-- 
-- Problème: Les colonnes attendues n'existent pas dans les tables
-- Solution: Ajouter toutes les colonnes manquantes
-- =====================================================

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

-- =====================================================
-- AJOUT DES COLONNES MANQUANTES
-- =====================================================

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

-- =====================================================
-- RECRÉATION DES CONTRAINTES ET INDEX
-- =====================================================

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

-- =====================================================
-- SYNCHRONISATION DU CACHE SUPABASE
-- =====================================================

-- 7. Rafraîchir le cache de schéma Supabase
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- TESTS DE VALIDATION
-- =====================================================

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

-- 9. Vérifier que toutes les colonnes existent maintenant
SELECT 
    'order_items' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'order_items' 
    AND table_schema = 'public'
    AND column_name IN ('product_name', 'quantity', 'unit_price', 'total_price', 'created_at')

UNION ALL

SELECT 
    'orders' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
    AND column_name IN ('order_number', 'total_amount', 'currency', 'status', 'payment_status', 'created_at', 'updated_at')

ORDER BY table_name, column_name;

-- =====================================================
-- NOTES D'UTILISATION
-- =====================================================
-- 1. Ce script ajoute toutes les colonnes manquantes aux tables orders et order_items
-- 2. Il recrée les contraintes de clé étrangère
-- 3. Il crée les index pour optimiser les performances
-- 4. Il rafraîchit le cache de schéma Supabase
-- 5. Il teste la structure corrigée
-- 
-- Après exécution de ce script:
-- ✅ Toutes les colonnes nécessaires existent
-- ✅ Les relations entre tables fonctionnent
-- ✅ L'erreur "column does not exist" disparaît
-- ✅ L'application fonctionne sans erreur de base de données
-- ✅ Les requêtes avec JOIN fonctionnent correctement
-- =====================================================
