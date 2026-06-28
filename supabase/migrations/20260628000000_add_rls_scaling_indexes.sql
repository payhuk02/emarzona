-- ==============================================================================
-- 🚀 Phase 4: Database Optimization & RLS Scaling Indexes
-- ==============================================================================
-- En tant que plateforme SaaS Multi-tenant e-commerce, les requêtes sont lourdement 
-- filtrées par les politiques RLS (Row Level Security).
-- Sans index adéquats, PostgreSQL est forcé d'exécuter des requêtes séquentielles
-- (Seq Scan) provoquant un problème "N+1 query" sous charge.
--
-- Cette migration ajoute des B-Tree indexes sur les colonnes les plus sollicitées
-- par les clés étrangères et les filtres RLS afin de ramener le temps d'exécution 
-- P95 sous la barre des 50ms.
-- ==============================================================================

-- 1. Optimisation de la table `orders`
-- Les RLS pour les marchands et clients vérifient systématiquement `store_id` et `customer_id`.
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 2. Optimisation de la table `products`
-- Le catalogue filtre massivement par `store_id` et `is_active`. Un index composite 
-- permet une recherche instantanée pour les storefronts.
CREATE INDEX IF NOT EXISTS idx_products_store_active ON public.products(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 3. Optimisation de la table `stores`
-- Vérification RLS systématique pour s'assurer que le user connecté est propriétaire de la boutique.
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);

-- 4. Optimisation de la table `order_items`
-- Récupération du détail des commandes.
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 5. Optimisation des abonnements et facturation SaaS
-- Filtrage RLS récurrent lors de l'authentification et check de droits de route.
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON public.subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status) WHERE status = 'active';
