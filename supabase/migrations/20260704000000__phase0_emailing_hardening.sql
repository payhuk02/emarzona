-- =====================================================
-- EMAIL SYSTEM HARDENING - PHASE 0
-- Date: 4 Juillet 2026
-- Description: Renomme les colonnes sendgrid_* en provider_*
--              et met en place des triggers pour la compatibilité legacy.
-- =====================================================

DO $$
BEGIN
    -- 1. Traitement de la table email_logs (message ID)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs' 
        AND column_name = 'sendgrid_message_id'
    ) THEN
        -- Renommer en provider_message_id
        ALTER TABLE public.email_logs RENAME COLUMN sendgrid_message_id TO provider_message_id;
        RAISE NOTICE 'Colonne sendgrid_message_id renommée en provider_message_id dans email_logs';
    END IF;

    -- Créer la colonne sendgrid_message_id pour compatibilité
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs' 
        AND column_name = 'sendgrid_message_id'
    ) THEN
        ALTER TABLE public.email_logs ADD COLUMN sendgrid_message_id TEXT;
        RAISE NOTICE 'Colonne sendgrid_message_id créée pour compatibilité dans email_logs';
    END IF;

    -- 2. Traitement de la table email_templates (template ID)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_templates' 
        AND column_name = 'sendgrid_template_id'
    ) THEN
        -- Renommer en provider_template_id
        ALTER TABLE public.email_templates RENAME COLUMN sendgrid_template_id TO provider_template_id;
        RAISE NOTICE 'Colonne sendgrid_template_id renommée en provider_template_id dans email_templates';
    END IF;

    -- Créer la colonne sendgrid_template_id pour compatibilité
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_templates' 
        AND column_name = 'sendgrid_template_id'
    ) THEN
        ALTER TABLE public.email_templates ADD COLUMN sendgrid_template_id TEXT;
        RAISE NOTICE 'Colonne sendgrid_template_id créée pour compatibilité dans email_templates';
    END IF;

    -- 3. Traitement de la table email_logs (status / sendgrid_status)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs' 
        AND column_name = 'sendgrid_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs' 
        AND column_name = 'status'
    ) THEN
        -- Si seul sendgrid_status existe, on le renomme en status
        ALTER TABLE public.email_logs RENAME COLUMN sendgrid_status TO status;
        RAISE NOTICE 'Colonne sendgrid_status renommée en status dans email_logs';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs' 
        AND column_name = 'sendgrid_status'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs' 
        AND column_name = 'status'
    ) THEN
        -- Si les deux existent, on fusionne les données et supprime sendgrid_status
        UPDATE public.email_logs SET status = COALESCE(status, sendgrid_status);
        ALTER TABLE public.email_logs DROP COLUMN sendgrid_status;
        RAISE NOTICE 'Colonne sendgrid_status fusionnée et supprimée dans email_logs (status conservé)';
    END IF;

    -- 4. Assurer que la colonne status a une valeur par défaut
    ALTER TABLE public.email_logs ALTER COLUMN status SET DEFAULT 'queued';

END $$;

-- 5. Création des triggers de synchronisation bidirectionnelle pour compatibilité legacy

-- Pour email_logs (message ID)
CREATE OR REPLACE FUNCTION public.sync_email_logs_message_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.provider_message_id IS NOT NULL AND NEW.sendgrid_message_id IS NULL THEN
            NEW.sendgrid_message_id := NEW.provider_message_id;
        ELSIF NEW.sendgrid_message_id IS NOT NULL AND NEW.provider_message_id IS NULL THEN
            NEW.provider_message_id := NEW.sendgrid_message_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si provider_message_id a changé, on met à jour sendgrid_message_id
        IF NEW.provider_message_id IS DISTINCT FROM OLD.provider_message_id THEN
            NEW.sendgrid_message_id := NEW.provider_message_id;
        -- Si sendgrid_message_id a changé par un appel legacy, on met à jour provider_message_id
        ELSIF NEW.sendgrid_message_id IS DISTINCT FROM OLD.sendgrid_message_id THEN
            NEW.provider_message_id := NEW.sendgrid_message_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_email_logs_message_ids ON public.email_logs;
CREATE TRIGGER trigger_sync_email_logs_message_ids
    BEFORE INSERT OR UPDATE ON public.email_logs
    FOR EACH ROW EXECUTE FUNCTION public.sync_email_logs_message_ids();

-- Pour email_templates (template ID)
CREATE OR REPLACE FUNCTION public.sync_email_templates_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.provider_template_id IS NOT NULL AND NEW.sendgrid_template_id IS NULL THEN
            NEW.sendgrid_template_id := NEW.provider_template_id;
        ELSIF NEW.sendgrid_template_id IS NOT NULL AND NEW.provider_template_id IS NULL THEN
            NEW.provider_template_id := NEW.sendgrid_template_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.provider_template_id IS DISTINCT FROM OLD.provider_template_id THEN
            NEW.sendgrid_template_id := NEW.provider_template_id;
        ELSIF NEW.sendgrid_template_id IS DISTINCT FROM OLD.sendgrid_template_id THEN
            NEW.provider_template_id := NEW.sendgrid_template_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_email_templates_ids ON public.email_templates;
CREATE TRIGGER trigger_sync_email_templates_ids
    BEFORE INSERT OR UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION public.sync_email_templates_ids();

-- 6. Création des index de performance
CREATE INDEX IF NOT EXISTS idx_email_logs_provider_message_id ON public.email_logs(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_provider_template_id ON public.email_templates(provider_template_id);
