-- Migration: Ajouter une politique RLS pour permettre aux clients de voir leurs propres commandes
-- Date: 2025-02-02
-- Description: Ajoute une politique RLS sur la table orders pour permettre aux utilisateurs authentifiés
--              de voir leurs propres commandes où customer_id correspond à leur auth.uid()

-- Vérifier si la table orders existe et si RLS est activé
DO $$
BEGIN
  -- Vérifier si la table orders existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    -- Vérifier si RLS est activé
    IF (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') IS NOT NULL THEN
      
      -- Supprimer la politique existante si elle existe déjà (pour éviter les doublons)
      DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
      
      -- Créer une nouvelle politique pour permettre aux clients de voir leurs propres commandes
      -- Cette politique vérifie si customer_id correspond à auth.uid()
      -- Note: customer_id peut être soit auth.uid() directement, soit un ID de la table customers
      -- Pour les commandes multi-stores, customer_id est généralement auth.uid()
      CREATE POLICY "Customers can view their own orders"
        ON public.orders
        FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND (
            -- Cas 1: customer_id correspond directement à auth.uid()
            customer_id = auth.uid()
            -- Cas 2: customer_id fait référence à un customer dans la table customers
            -- et l'email du customer correspond à l'email de l'utilisateur authentifié
            OR EXISTS (
              SELECT 1 FROM public.customers
              WHERE customers.id = orders.customer_id
              AND customers.email = (
                SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
              )
            )
            -- Cas 3: customer_id est dans metadata.userId (pour les commandes multi-stores)
            OR (
              metadata IS NOT NULL
              AND metadata::text != 'null'
              AND (
                (metadata->>'userId')::text = auth.uid()::text
                OR (metadata->>'customerId')::text = auth.uid()::text
              )
            )
          )
        );
      
      RAISE NOTICE 'Policy "Customers can view their own orders" created successfully';
    ELSE
      RAISE NOTICE 'RLS is not enabled on orders table';
    END IF;
  ELSE
    RAISE NOTICE 'Table orders does not exist';
  END IF;
END $$;

-- Ajouter également une politique pour order_items afin que les clients puissent voir les items de leurs commandes
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;
    
    CREATE POLICY "Customers can view their own order items"
      ON public.order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.orders
          WHERE orders.id = order_items.order_id
          AND auth.uid() IS NOT NULL
          AND (
            orders.customer_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.customers
              WHERE customers.id = orders.customer_id
              AND customers.email = (
                SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
              )
            )
            OR (
              orders.metadata IS NOT NULL
              AND orders.metadata::text != 'null'
              AND (
                (orders.metadata->>'userId')::text = auth.uid()::text
                OR (orders.metadata->>'customerId')::text = auth.uid()::text
              )
            )
          )
        )
      );
    
    RAISE NOTICE 'Policy "Customers can view their own order items" created successfully';
  END IF;
END $$;



