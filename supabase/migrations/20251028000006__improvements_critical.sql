-- =====================================================================================
-- Migration: Critical Improvements for Phase 2
-- Date: 28 octobre 2025
-- Description: Corrections critiques identifiées lors de l'audit
-- =====================================================================================

-- 1. Add RLS policy for customers to view their secured payments
DROP POLICY IF EXISTS "Customers can view their secured payments" ON public.secured_payments;
CREATE POLICY "Customers can view their secured payments"
ON public.secured_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = secured_payments.order_id
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- 2. Add validation for percentage_rate in payment_options
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS check_payment_percentage_rate;

ALTER TABLE public.products 
ADD CONSTRAINT check_payment_percentage_rate 
CHECK (
  (payment_options IS NULL) OR
  (payment_options->>'payment_type' IS NULL) OR
  (payment_options->>'payment_type' != 'percentage') OR
  (
    (payment_options->>'percentage_rate')::numeric >= 10 AND 
    (payment_options->>'percentage_rate')::numeric <= 90
  )
);

-- 3. Add auto-release function for secured payments
CREATE OR REPLACE FUNCTION auto_release_secured_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update secured payments that passed their held_until date
  UPDATE public.secured_payments
  SET 
    status = 'released',
    released_at = now(),
    updated_at = now()
  WHERE 
    status = 'held'
    AND held_until IS NOT NULL
    AND held_until < now();
    
  -- Log the action
  RAISE NOTICE 'Auto-released % secured payments', (SELECT count(*) FROM public.secured_payments WHERE status = 'released' AND released_at >= now() - interval '1 second');
END;
$$;

-- 4. Add index for auto-release query optimization
CREATE INDEX IF NOT EXISTS idx_secured_payments_held_until 
ON public.secured_payments(held_until) 
WHERE status = 'held' AND held_until IS NOT NULL;

-- 5. Add unread message count function
CREATE OR REPLACE FUNCTION get_unread_message_count(conversation_id_param UUID, user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.messages
  WHERE 
    conversation_id = conversation_id_param
    AND sender_id != user_id_param
    AND is_read = FALSE;
    
  RETURN unread_count;
END;
$$;

-- 6. Add column for tracking payment option usage
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS payment_option_usage_count INTEGER DEFAULT 0;

-- 7. Add trigger to track payment option changes
CREATE OR REPLACE FUNCTION track_payment_option_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.payment_options IS DISTINCT FROM OLD.payment_options) THEN
    NEW.payment_option_usage_count = COALESCE(OLD.payment_option_usage_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_payment_option_change ON public.products;
CREATE TRIGGER trg_track_payment_option_change
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION track_payment_option_change();

-- 8. Add comments for documentation
COMMENT ON FUNCTION auto_release_secured_payments() IS 'Automatically releases secured payments that have passed their held_until date. Should be run via cron job every hour.';
COMMENT ON FUNCTION get_unread_message_count(UUID, UUID) IS 'Returns the count of unread messages for a user in a specific conversation.';
COMMENT ON CONSTRAINT check_payment_percentage_rate ON public.products IS 'Ensures percentage_rate is between 10 and 90 when payment type is percentage.';

-- 9. Create view for payment analytics
CREATE OR REPLACE VIEW payment_options_analytics AS
SELECT 
  p.payment_options->>'payment_type' as payment_type,
  COUNT(*) as product_count,
  COUNT(CASE WHEN p.is_active THEN 1 END) as active_products,
  AVG(p.price) as avg_price,
  SUM(COALESCE(p.payment_option_usage_count, 0)) as total_changes
FROM public.products p
WHERE p.payment_options IS NOT NULL
GROUP BY p.payment_options->>'payment_type';

COMMENT ON VIEW payment_options_analytics IS 'Analytics view showing usage distribution of payment options across products.';

-- 10. Grant necessary permissions
GRANT SELECT ON payment_options_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_release_secured_payments() TO postgres;

