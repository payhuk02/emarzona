-- ==============================================================================
-- 🧠 Phase 5 - Sprint 1: AI-Powered Commerce Foundations
-- ==============================================================================
-- Architecture de données pour la génération IA (LLMs) dans les vitrines.
-- ==============================================================================

-- 1. Table de gestion des Crédits IA par marchand
CREATE TABLE IF NOT EXISTS public.ai_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
    available_credits INTEGER NOT NULL DEFAULT 50, -- Crédits gratuits initiaux
    total_used INTEGER NOT NULL DEFAULT 0,
    last_replenished_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can read their own credits" ON public.ai_credits
    FOR SELECT TO authenticated
    USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- Trigger pour updated_at
CREATE TRIGGER set_ai_credits_updated_at
BEFORE UPDATE ON public.ai_credits
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Log des générations (AI Product Generations)
CREATE TABLE IF NOT EXISTS public.ai_product_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- Peut être null si produit abandonné
    model_used TEXT NOT NULL DEFAULT 'gpt-4o',
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('description', 'seo', 'title', 'translation', 'full')),
    input_prompt TEXT,
    generated_content JSONB NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_generations_store_id ON public.ai_product_generations(store_id);

ALTER TABLE public.ai_product_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can read their generations" ON public.ai_product_generations
    FOR SELECT TO authenticated
    USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- 3. RPC pour consommer un crédit en transaction
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_store_id UUID, p_cost INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available INTEGER;
BEGIN
    -- S'assurer que le user est owner du store
    IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    -- Récupérer les crédits avec FOR UPDATE pour empêcher la race condition
    SELECT available_credits INTO v_available 
    FROM public.ai_credits 
    WHERE store_id = p_store_id 
    FOR UPDATE;

    IF v_available IS NULL THEN
        -- Initialiser si non existant
        INSERT INTO public.ai_credits (store_id, available_credits)
        VALUES (p_store_id, 50 - p_cost);
        RETURN TRUE;
    END IF;

    IF v_available < p_cost THEN
        RETURN FALSE; -- Pas assez de crédits
    END IF;

    UPDATE public.ai_credits
    SET 
        available_credits = available_credits - p_cost,
        total_used = total_used + p_cost
    WHERE store_id = p_store_id;

    RETURN TRUE;
END;
$$;
