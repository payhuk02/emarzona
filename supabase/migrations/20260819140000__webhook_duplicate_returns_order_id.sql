-- Duplicate webhook replays must return order_id so post-payment fulfillment
-- can still run if the first attempt wrote payment_webhook_events then died.

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
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_transaction_status text;
    v_has_physical_product boolean;
    v_paid_order_status text;
    v_payment_status text;
    v_remaining numeric;
    v_checkout_method text;
BEGIN
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
        SELECT order_id, status
        INTO v_order_id, v_transaction_status
        FROM transactions
        WHERE id = p_transaction_id;

        RETURN jsonb_build_object(
            'success', false,
            'reason', 'duplicate_webhook',
            'already_completed', v_transaction_status = 'completed',
            'order_id', v_order_id
        );
    END;

    SELECT order_id, status
    INTO v_order_id, v_transaction_status
    FROM transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF v_transaction_status = 'completed' AND p_mapped_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_completed', true,
            'order_id', v_order_id
        );
    END IF;

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

    IF p_mapped_status = 'completed' AND v_order_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM order_items
            WHERE order_id = v_order_id AND product_type = 'physical'
        ) INTO v_has_physical_product;

        SELECT
            COALESCE(remaining_amount, 0),
            COALESCE(metadata->>'checkout_method', '')
        INTO v_remaining, v_checkout_method
        FROM orders
        WHERE id = v_order_id;

        IF v_has_physical_product THEN
            v_paid_order_status := 'confirmed';
        ELSE
            v_paid_order_status := 'completed';
        END IF;

        IF v_checkout_method = 'guarantee' AND COALESCE(v_remaining, 0) > 0 THEN
            v_payment_status := 'deposit_paid';
        ELSE
            v_payment_status := 'paid';
        END IF;

        UPDATE orders SET
            payment_status = v_payment_status,
            status = v_paid_order_status,
            updated_at = now()
        WHERE id = v_order_id;

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

COMMENT ON FUNCTION process_moneroo_webhook_atomic IS
  'Atomic webhook apply. Duplicate events return order_id so fulfillment can retry.';
