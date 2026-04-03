-- =====================================================
-- FIX FINAL: Correction de la colonne user_id dans product_warranties
-- Date: 31 Janvier 2025
-- Description: Vérifie et corrige la structure de la table product_warranties
-- Version corrigée avec syntaxe valide
-- =====================================================

-- Étape 1: Vérifier et ajouter user_id si nécessaire
DO $$ 
DECLARE
  v_user_id_exists BOOLEAN;
  v_customer_id_exists BOOLEAN;
BEGIN
  -- Vérifier si user_id existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_warranties' 
    AND column_name = 'user_id'
  ) INTO v_user_id_exists;

  -- Si la table existe mais sans user_id, l'ajouter
  IF NOT v_user_id_exists THEN
    -- Ajouter user_id
    ALTER TABLE public.product_warranties
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Vérifier si customer_id existe
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_warranties' 
      AND column_name = 'customer_id'
    ) INTO v_customer_id_exists;

    -- Vérifier si order_id existe pour pouvoir faire la migration
    DECLARE
      v_order_id_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_warranties' 
        AND column_name = 'order_id'
      ) INTO v_order_id_exists;

      -- Si customer_id existe et order_id existe, utiliser customer_id pour remplir user_id
      IF v_customer_id_exists AND v_order_id_exists THEN
        -- Mettre à jour user_id depuis customer_id via orders
        UPDATE public.product_warranties pw
        SET user_id = (
          SELECT o.customer_id 
          FROM public.orders o 
          WHERE o.id = pw.order_id 
          LIMIT 1
        )
        WHERE pw.user_id IS NULL;
      END IF;
    END;
  END IF;
END $$;

-- Étape 2: Rendre NOT NULL si tous les enregistrements ont une valeur
DO $$ 
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM public.product_warranties
  WHERE user_id IS NULL;

  IF v_null_count = 0 THEN
    ALTER TABLE public.product_warranties
    ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Étape 3: Vérifier et créer l'index si nécessaire
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

-- Étape 4: Corriger les RLS policies pour utiliser user_id de manière sécurisée
DO $$ 
DECLARE
  v_order_id_exists BOOLEAN;
BEGIN
  -- Vérifier si order_id existe dans product_warranties
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_warranties' 
    AND column_name = 'order_id'
  ) INTO v_order_id_exists;

  -- Supprimer les anciennes policies si elles existent
  DROP POLICY IF EXISTS "Customers can view own warranties" ON public.product_warranties;
  DROP POLICY IF EXISTS "Customers can create own warranties" ON public.product_warranties;
  
  -- Recréer les policies avec vérification de nullité
  IF v_order_id_exists THEN
    CREATE POLICY "Customers can view own warranties"
    ON public.product_warranties FOR SELECT
    USING (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = product_warranties.order_id
        AND o.customer_id = auth.uid()
      )
    );

    CREATE POLICY "Customers can create own warranties"
    ON public.product_warranties FOR INSERT
    WITH CHECK (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = product_warranties.order_id
        AND o.customer_id = auth.uid()
      )
    );
  ELSE
    -- Si order_id n'existe pas, utiliser seulement user_id
    CREATE POLICY "Customers can view own warranties"
    ON public.product_warranties FOR SELECT
    USING (user_id IS NOT NULL AND auth.uid() = user_id);

    CREATE POLICY "Customers can create own warranties"
    ON public.product_warranties FOR INSERT
    WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
  END IF;
END $$;

-- Étape 5: Corriger la policy d'historique
DO $$ 
DECLARE
  v_order_id_exists BOOLEAN;
  v_warranty_history_exists BOOLEAN;
BEGIN
  -- Vérifier si warranty_history existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'warranty_history'
  ) INTO v_warranty_history_exists;

  -- Si la table n'existe pas, on ne fait rien
  IF NOT v_warranty_history_exists THEN
    RETURN;
  END IF;

  -- Vérifier si order_id existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_warranties' 
    AND column_name = 'order_id'
  ) INTO v_order_id_exists;

  -- Supprimer l'ancienne politique seulement si la table existe
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view warranty history" ON public.warranty_history';
  EXCEPTION
    WHEN undefined_table THEN
      -- Table n'existe pas, on continue
      NULL;
  END;
  
  IF v_order_id_exists THEN
    CREATE POLICY "Users can view warranty history"
    ON public.warranty_history FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.product_warranties pw
        WHERE pw.id = warranty_history.warranty_id
        AND (
          (pw.user_id IS NOT NULL AND pw.user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = pw.order_id
            AND o.customer_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = pw.store_id
            AND s.user_id = auth.uid()
          )
        )
      )
    );
  ELSE
    CREATE POLICY "Users can view warranty history"
    ON public.warranty_history FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.product_warranties pw
        WHERE pw.id = warranty_history.warranty_id
        AND (
          (pw.user_id IS NOT NULL AND pw.user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = pw.store_id
            AND s.user_id = auth.uid()
          )
        )
      )
    );
  END IF;
END $$;

-- Étape 6: Corriger la fonction create_warranty_history pour gérer user_id null
CREATE OR REPLACE FUNCTION create_warranty_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.warranty_history (
    warranty_id,
    action,
    description,
    performed_by,
    metadata
  )
  VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN NEW.status = 'expired' THEN 'expired'
      WHEN NEW.status = 'voided' THEN 'voided'
      WHEN NEW.status = 'transferred' THEN 'transferred'
      ELSE 'activated'
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Garantie créée'
      WHEN NEW.status = 'expired' THEN 'Garantie expirée'
      WHEN NEW.status = 'voided' THEN 'Garantie annulée'
      WHEN NEW.status = 'transferred' THEN 'Garantie transférée'
      ELSE 'Garantie activée'
    END,
    COALESCE(auth.uid(), NEW.user_id),
    jsonb_build_object(
      'warranty_number', NEW.warranty_number,
      'status', NEW.status,
      'duration_months', NEW.duration_months,
      'user_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

