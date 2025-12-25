-- =========================================================
-- Migration : Fix platform_settings - Ajout colonne 'key'
-- Date : 31/01/2025
-- Description : Corrige le problème de colonne 'key' manquante
-- =========================================================

DO $$
BEGIN
  -- ÉTAPE 1 : Supprimer les contraintes problématiques de l'ancienne structure
  -- Supprimer la contrainte CHECK 'only_one_settings' qui bloque les insertions
  ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS only_one_settings;
  
  -- Supprimer l'ancienne contrainte de clé primaire si elle existe sur 'id'
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'p'
    AND n.nspname = 'public'
    AND t.relname = 'platform_settings'
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = t.oid
      AND a.attname = 'id'
      AND a.attnum = ANY(c.conkey)
    )
  ) THEN
    ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_pkey;
  END IF;
  
  -- ÉTAPE 2 : Ajouter la colonne 'key' si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings' 
    AND column_name = 'key'
  ) THEN
    ALTER TABLE public.platform_settings 
    ADD COLUMN "key" TEXT;
    
      -- Migrer les données existantes
      -- Si la table a un enregistrement avec 'id', lui donner key='customization'
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'platform_settings' 
        AND column_name = 'id'
      ) THEN
        -- Mettre à jour l'enregistrement existant avec key='customization'
        -- Utiliser une sous-requête pour limiter à un seul enregistrement
        UPDATE public.platform_settings 
        SET "key" = 'customization' 
        WHERE "key" IS NULL
        AND ctid = (
          SELECT ctid FROM public.platform_settings 
          WHERE "key" IS NULL 
          LIMIT 1
        );
    ELSE
      -- Si pas de colonne id, mettre key='customization' pour tous les enregistrements NULL
      UPDATE public.platform_settings 
      SET "key" = 'customization' 
      WHERE "key" IS NULL;
    END IF;
    
    -- Supprimer les doublons avec key NULL avant d'ajouter la PK
    DELETE FROM public.platform_settings ps1
    USING public.platform_settings ps2
    WHERE ps1.ctid < ps2.ctid 
    AND COALESCE(ps1."key", '') = COALESCE(ps2."key", '');
    
    -- Rendre la colonne 'key' NOT NULL
    ALTER TABLE public.platform_settings
    ALTER COLUMN "key" SET NOT NULL;
    
    -- Ajouter la contrainte de clé primaire sur 'key'
    ALTER TABLE public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY ("key");
  ELSE
    -- La colonne 'key' existe déjà, s'assurer qu'elle est PRIMARY KEY
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'p'
      AND n.nspname = 'public'
      AND t.relname = 'platform_settings'
      AND a.attname = 'key'
    ) THEN
      -- La PK n'est pas sur 'key', la recréer
      ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_pkey;
      
      -- Supprimer les doublons d'abord
      DELETE FROM public.platform_settings ps1
      USING public.platform_settings ps2
      WHERE ps1.ctid < ps2.ctid 
      AND COALESCE(ps1."key", '') = COALESCE(ps2."key", '');
      
      ALTER TABLE public.platform_settings
      ADD CONSTRAINT platform_settings_pkey PRIMARY KEY ("key");
    END IF;
    
    -- S'assurer que 'key' est NOT NULL
    ALTER TABLE public.platform_settings
    ALTER COLUMN "key" SET NOT NULL;
  END IF;
  
  -- ÉTAPE 3 : S'assurer que les colonnes nécessaires existent
  -- Colonne 'settings' (jsonb)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.platform_settings
    ADD COLUMN settings JSONB;
    
    UPDATE public.platform_settings 
    SET settings = '{}'::jsonb 
    WHERE settings IS NULL;
    
    ALTER TABLE public.platform_settings
    ALTER COLUMN settings SET DEFAULT '{}'::jsonb;
    
    ALTER TABLE public.platform_settings
    ALTER COLUMN settings SET NOT NULL;
  END IF;
  
  -- Colonne 'updated_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.platform_settings
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  
  -- ÉTAPE 4 : Insérer l'enregistrement 'customization' s'il n'existe pas
  -- (Seulement si la colonne 'key' existe et est PRIMARY KEY)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings' 
    AND column_name = 'key'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'p'
    AND n.nspname = 'public'
    AND t.relname = 'platform_settings'
    AND a.attname = 'key'
  ) THEN
    INSERT INTO public.platform_settings ("key", settings, updated_at)
    VALUES ('customization', '{}'::jsonb, NOW())
    ON CONFLICT ("key") DO NOTHING;
  END IF;
  
  -- ÉTAPE 5 : Activer RLS et créer les politiques
  ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
  
  -- Politique SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'platform_settings' 
    AND policyname = 'Allow select to authenticated'
  ) THEN
    CREATE POLICY "Allow select to authenticated" 
    ON public.platform_settings 
    FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Politique UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'platform_settings' 
    AND policyname = 'Allow update to admins'
  ) THEN
    CREATE POLICY "Allow update to admins" 
    ON public.platform_settings 
    FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND (p.is_super_admin = true OR p.role = 'admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND (p.is_super_admin = true OR p.role = 'admin')
      )
    );
  END IF;
  
  -- Politique INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'platform_settings' 
    AND policyname = 'Allow insert to admins'
  ) THEN
    CREATE POLICY "Allow insert to admins" 
    ON public.platform_settings 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND (p.is_super_admin = true OR p.role = 'admin')
      )
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on continue
    RAISE NOTICE 'Erreur lors de la migration: %', SQLERRM;
END $$;

-- Rafraîchir le cache du schéma Supabase
NOTIFY pgrst, 'reload schema';

-- =========================================================
-- FIN MIGRATION
-- =========================================================
