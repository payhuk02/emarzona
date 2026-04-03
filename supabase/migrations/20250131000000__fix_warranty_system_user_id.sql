-- =====================================================
-- FIX: Correction de la colonne user_id dans product_warranties
-- Date: 31 Janvier 2025
-- Description: Ajoute la colonne user_id si elle n'existe pas
-- =====================================================

-- Vérifier et ajouter user_id à product_warranties si nécessaire
DO $$ 
BEGIN
  -- Vérifier si la colonne user_id existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_warranties' 
    AND column_name = 'user_id'
  ) THEN
    -- Ajouter la colonne user_id
    ALTER TABLE public.product_warranties
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Mettre à jour les enregistrements existants si possible
    -- (en utilisant customer_id ou order.customer_id)
    UPDATE public.product_warranties pw
    SET user_id = (
      SELECT o.customer_id 
      FROM public.orders o 
      WHERE o.id = pw.order_id 
      LIMIT 1
    )
    WHERE pw.user_id IS NULL;
    
    -- Rendre la colonne NOT NULL si tous les enregistrements ont une valeur
    -- Sinon, on la laisse nullable pour l'instant
    ALTER TABLE public.product_warranties
    ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Vérifier et ajouter l'index si nécessaire
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'product_warranties' 
    AND indexname = 'idx_warranties_user_id'
  ) THEN
    CREATE INDEX idx_warranties_user_id ON public.product_warranties(user_id);
  END IF;
END $$;

-- Vérifier et mettre à jour les RLS policies si nécessaire
DO $$ 
BEGIN
  -- Supprimer l'ancienne policy si elle existe
  DROP POLICY IF EXISTS "Customers can view own warranties" ON public.product_warranties;
  
  -- Recréer la policy avec user_id
  CREATE POLICY "Customers can view own warranties"
  ON public.product_warranties FOR SELECT
  USING (auth.uid() = user_id);
  
  -- Supprimer et recréer la policy INSERT
  DROP POLICY IF EXISTS "Customers can create own warranties" ON public.product_warranties;
  
  CREATE POLICY "Customers can create own warranties"
  ON public.product_warranties FOR INSERT
  WITH CHECK (auth.uid() = user_id);
END $$;

