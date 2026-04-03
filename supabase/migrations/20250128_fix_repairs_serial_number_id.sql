-- =====================================================
-- FIX: Add serial_number_id column to repairs table
-- Date: 28 Janvier 2025
-- Description: Migration corrective pour ajouter la colonne serial_number_id
--              à la table repairs si elle n'existe pas
-- =====================================================

-- Add serial_number_id column to repairs table if it doesn't exist
DO $$ 
BEGIN
  -- Check if repairs table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'repairs'
  ) THEN
    -- Add serial_number_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'repairs' 
      AND column_name = 'serial_number_id'
    ) THEN
      -- Add column without NOT NULL constraint (allows existing rows)
      ALTER TABLE public.repairs
        ADD COLUMN serial_number_id UUID;
      
      -- Add foreign key constraint if serial_numbers table exists
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'serial_numbers'
      ) THEN
        -- Check if constraint doesn't already exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_schema = 'public' 
          AND table_name = 'repairs' 
          AND constraint_name = 'repairs_serial_number_id_fkey'
        ) THEN
          ALTER TABLE public.repairs
            ADD CONSTRAINT repairs_serial_number_id_fkey 
            FOREIGN KEY (serial_number_id) 
            REFERENCES public.serial_numbers(id) 
            ON DELETE CASCADE;
        END IF;
      END IF;
      
      -- Create index if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'repairs' 
        AND indexname = 'idx_repairs_serial_id'
      ) THEN
        CREATE INDEX idx_repairs_serial_id ON public.repairs(serial_number_id) 
        WHERE serial_number_id IS NOT NULL;
      END IF;
    END IF;
  END IF;
END $$;



