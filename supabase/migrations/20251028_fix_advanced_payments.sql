-- =====================================================================================
-- Migration: Fix Advanced Payment Tables
-- Date: 28 octobre 2025
-- =====================================================================================

-- 1. Create secured_payments table
CREATE TABLE IF NOT EXISTS public.secured_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL,
  held_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  hold_reason TEXT NOT NULL DEFAULT 'delivery_confirmation',
  release_conditions JSONB DEFAULT '{}'::jsonb,
  held_until TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  released_by UUID REFERENCES auth.users(id),
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create indexes for secured_payments
CREATE INDEX IF NOT EXISTS idx_secured_payments_order_id ON public.secured_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_secured_payments_status ON public.secured_payments(status);
CREATE INDEX IF NOT EXISTS idx_secured_payments_payment_id ON public.secured_payments(payment_id);

-- 3. Add columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full',
ADD COLUMN IF NOT EXISTS percentage_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- 4. Add columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full',
ADD COLUMN IF NOT EXISTS percentage_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_held BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS held_until TIMESTAMP WITH TIME ZONE;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON public.orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_is_held ON public.payments(is_held);

-- 6. Enable RLS
ALTER TABLE public.secured_payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
DROP POLICY IF EXISTS "Vendors can view their secured payments" ON public.secured_payments;
CREATE POLICY "Vendors can view their secured payments"
ON public.secured_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = secured_payments.order_id
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Vendors can update their secured payments" ON public.secured_payments;
CREATE POLICY "Vendors can update their secured payments"
ON public.secured_payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = secured_payments.order_id
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service allows insert" ON public.secured_payments;
CREATE POLICY "Service allows insert"
ON public.secured_payments
FOR INSERT
WITH CHECK (true);

-- 8. Trigger
CREATE OR REPLACE FUNCTION update_secured_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_secured_payments_updated_at ON public.secured_payments;
CREATE TRIGGER set_secured_payments_updated_at
  BEFORE UPDATE ON public.secured_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_secured_payments_updated_at();

