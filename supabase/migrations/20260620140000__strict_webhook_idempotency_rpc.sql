-- Migration: Strict Webhook Idempotency RPC
-- Ensures webhook payload recording and transaction updates happen atomically to prevent race conditions.

CREATE OR REPLACE FUNCTION process_moneroo_webhook_atomic(
    p_provider text,
    p_external_event_id text,
    p_event_type text,
    p_transaction_id uuid,
    p_payload jsonb,
    p_mapped_status text,
    p_provider_session_id text DEFAULT NULL,
    p_provider_payment_intent_id text DEFAULT NULL,
    p_connected_account_id text DEFAULT NULL,
    p_application_fee_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_transaction_status text;
    v_has_physical_product boolean;
    v_paid_order_status text;
BEGIN
    -- 1. Tentative d'insertion du webhook (bloque si duplicata)
    BEGIN
        INSERT INTO payment_webhook_events (
            provider,
            external_event_id,
            event_type,
            transaction_id,
            payload,
            processed_at
        ) VALUES (
            p_provider,
            p_external_event_id,
            p_event_type,
            p_transaction_id,
            p_payload,
            now()
        );
    EXCEPTION WHEN unique_violation THEN
        -- Le webhook a déjà été traité
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'duplicate_webhook'
        );
    END;

    -- 2. Verrouillage et récupération de la transaction
    SELECT order_id, status 
    INTO v_order_id, v_transaction_status
    FROM transactions 
    WHERE id = p_transaction_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    -- Si déjà complétée, on ignore silencieusement
    IF v_transaction_status = 'completed' AND p_mapped_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_completed', true,
            'order_id', v_order_id
        );
    END IF;

    -- 3. Mise à jour de la transaction
    UPDATE transactions SET
        status = p_mapped_status,
        completed_at = CASE WHEN p_mapped_status = 'completed' THEN now() ELSE completed_at END,
        updated_at = now(),
        webhook_processed_at = now(),
        last_webhook_payload = p_payload,
        provider_session_id = COALESCE(p_provider_session_id, provider_session_id),
        provider_payment_intent_id = COALESCE(p_provider_payment_intent_id, provider_payment_intent_id),
        connected_account_id = COALESCE(p_connected_account_id, connected_account_id),
        application_fee_amount = COALESCE(p_application_fee_amount, application_fee_amount),
        webhook_attempts = COALESCE(webhook_attempts, 0) + 1
    WHERE id = p_transaction_id;

    -- 4. Si la transaction est complétée et liée à une commande, on met à jour la commande
    IF p_mapped_status = 'completed' AND v_order_id IS NOT NULL THEN
        
        -- Déterminer le statut de la commande en fonction du type de produit
        SELECT EXISTS (
            SELECT 1 FROM order_items 
            WHERE order_id = v_order_id AND product_type = 'physical'
        ) INTO v_has_physical_product;

        IF v_has_physical_product THEN
            v_paid_order_status := 'confirmed';
        ELSE
            v_paid_order_status := 'completed';
        END IF;

        UPDATE orders SET
            payment_status = 'paid',
            status = v_paid_order_status,
            updated_at = now()
        WHERE id = v_order_id;
        
        -- Lier le order_id dans l'event de webhook pour le reporting
        UPDATE payment_webhook_events 
        SET order_id = v_order_id 
        WHERE provider = p_provider AND external_event_id = p_external_event_id;

    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_completed', false,
        'order_id', v_order_id
    );
END;
$$;
