-- ==============================================================================
-- 🌍 Phase 5 - Sprint 3: Caching Invalidation Triggers
-- ==============================================================================
-- Ce fichier crée les triggers PostgreSQL qui notifient automatiquement
-- Vercel/Cloudflare (via l'Edge Function cache-invalidate) dès qu'un produit 
-- ou une boutique est modifié, garantissant une purge immédiate du cache mondial SWR.
-- ==============================================================================

-- 1. Fonction générique pour appeler l'Edge Function d'invalidation
CREATE OR REPLACE FUNCTION public.trigger_cache_invalidation()
RETURNS TRIGGER AS $$
DECLARE
    v_url TEXT;
    v_tag TEXT;
BEGIN
    -- Déterminer le tag de cache à invalider selon la table
    IF TG_TABLE_NAME = 'products' THEN
        -- On invalide la boutique entière et le produit spécifique
        v_tag := 'store-' || NEW.store_id;
    ELSIF TG_TABLE_NAME = 'stores' THEN
        v_tag := 'store-' || NEW.id;
    END IF;

    -- Appel HTTP asynchrone (non-bloquant) à l'Edge Function locale
    -- En production, supabase_url serait la variable d'env. Ici on hardcode le localhost pour le dev.
    v_url := current_setting('custom.supabase_url', true) || '/functions/v1/cache-invalidate';
    IF v_url IS NULL OR v_url = '/functions/v1/cache-invalidate' THEN
        v_url := 'http://localhost:54321/functions/v1/cache-invalidate';
    END IF;

    -- Utilisation de l'extension pg_net (asynchrone)
    -- On suppose que pg_net est activé sur les instances Supabase
    PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('custom.service_role_key', true)),
        body := jsonb_build_object('tag', v_tag, 'table', TG_TABLE_NAME)
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Si pg_net échoue, on ne bloque pas la mise à jour (silent fail)
    RAISE WARNING 'Failed to trigger cache invalidation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger sur les produits
DROP TRIGGER IF EXISTS on_product_update_invalidate_cache ON public.products;
CREATE TRIGGER on_product_update_invalidate_cache
AFTER UPDATE OF price, promotional_price, stock, is_active, name, description
ON public.products
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.trigger_cache_invalidation();

-- 3. Trigger sur les stores
DROP TRIGGER IF EXISTS on_store_update_invalidate_cache ON public.stores;
CREATE TRIGGER on_store_update_invalidate_cache
AFTER UPDATE OF name, slug, custom_domain, is_active, primary_color, logo_url
ON public.stores
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.trigger_cache_invalidation();
