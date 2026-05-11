-- Migration: Ajouter le type d'événement webhook pour multi-store groups
-- Date: 2025-01-31
-- Description: Ajoute le type d'événement 'multi_store_group.completed' à l'enum webhook_event_type

-- Ajouter le nouveau type d'événement à l'enum
-- Note: PostgreSQL ne permet pas d'ajouter directement à un ENUM, donc on doit créer un nouveau type et migrer
DO $$ 
BEGIN
  -- Vérifier si le type existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'multi_store_group.completed' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'webhook_event_type')
  ) THEN
    -- Ajouter la nouvelle valeur à l'enum
    ALTER TYPE webhook_event_type ADD VALUE IF NOT EXISTS 'multi_store_group.completed';
  END IF;
END $$;

COMMENT ON TYPE webhook_event_type IS 
'Types d''événements webhook disponibles, incluant maintenant multi_store_group.completed pour les groupes multi-stores';







