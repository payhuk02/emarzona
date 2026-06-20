-- Migration: Pessimistic Locking for Inventory
-- Ensures stock decrement is atomic and prevents race conditions leading to overselling.

CREATE OR REPLACE FUNCTION decrement_stock_atomic(
    p_variant_id uuid,
    p_quantity int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_quantity int;
BEGIN
    -- Verrouillage pessimiste de la ligne
    SELECT quantity INTO v_current_quantity
    FROM physical_product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'variant_not_found'
        );
    END IF;

    -- Si stock non infini (-1)
    IF v_current_quantity != -1 THEN
        IF v_current_quantity < p_quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'reason', 'insufficient_stock',
                'available', v_current_quantity
            );
        END IF;

        UPDATE physical_product_variants
        SET 
            quantity = quantity - p_quantity,
            updated_at = now()
        WHERE id = p_variant_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'remaining', CASE WHEN v_current_quantity = -1 THEN -1 ELSE v_current_quantity - p_quantity END
    );
END;
$$;
