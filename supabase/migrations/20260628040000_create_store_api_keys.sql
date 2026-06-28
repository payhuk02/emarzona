-- ==============================================================================
-- 🔑 Phase 5 - Sprint 4: Headless API (Developer Keys)
-- ==============================================================================
-- Permet aux marchands de générer des clés d'API privées pour leurs développeurs,
-- afin de créer des applications tierces (React Native, POS) connectées à Emarzona.
-- ==============================================================================

-- 1. Table des clés d'API
CREATE TABLE IF NOT EXISTS public.store_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    key_name text NOT NULL,
    api_key_hash text NOT NULL UNIQUE, -- On stocke un hash (ex: pgcrypto) de la clé, jamais la clé en clair.
    api_key_prefix text NOT NULL, -- Ex: 'sk_live_1234...' pour affichage partiel dans l'UI.
    scopes text[] DEFAULT ARRAY['read_catalog']::text[], -- ex: 'read_catalog', 'write_orders', 'read_customers'
    is_active boolean DEFAULT true,
    last_used_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: Seul le propriétaire de la boutique peut voir/révoquer ses clés
ALTER TABLE public.store_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage API keys" ON public.store_api_keys;
CREATE POLICY "Store owners can manage API keys" ON public.store_api_keys 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

-- 2. Fonction RPC pour valider une clé depuis l'Edge Function Gateway
-- L'Edge Function enverra le hash de la clé fournie par le client.
CREATE OR REPLACE FUNCTION public.verify_store_api_key(p_api_key_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key_record RECORD;
BEGIN
    SELECT * INTO v_key_record 
    FROM public.store_api_keys 
    WHERE api_key_hash = p_api_key_hash AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_valid', false, 'error', 'Invalid or inactive API key');
    END IF;

    IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
        RETURN jsonb_build_object('is_valid', false, 'error', 'API key has expired');
    END IF;

    -- Update last used timestamp (asynchronous in theory, but fine here)
    UPDATE public.store_api_keys SET last_used_at = now() WHERE id = v_key_record.id;

    RETURN jsonb_build_object(
        'is_valid', true, 
        'store_id', v_key_record.store_id,
        'scopes', v_key_record.scopes
    );
END;
$$;
