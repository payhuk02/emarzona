-- Create transactions table to track all Moneroo payments
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  
  -- Moneroo specific fields
  moneroo_transaction_id TEXT UNIQUE,
  moneroo_checkout_url TEXT,
  moneroo_payment_method TEXT,
  
  -- Transaction details
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  
  -- Customer info (duplicated for historical records)
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  moneroo_response JSONB, -- Full response from Moneroo API
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Create transaction_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- created, payment_initiated, webhook_received, status_updated, completed, failed
  status TEXT NOT NULL,
  
  -- Event data
  request_data JSONB,
  response_data JSONB,
  error_data JSONB,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Store owners can view their transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = transactions.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = transactions.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their transactions"
  ON public.transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = transactions.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for transaction_logs
CREATE POLICY "Store owners can view their transaction logs"
  ON public.transaction_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      JOIN public.stores s ON s.id = t.store_id
      WHERE t.id = transaction_logs.transaction_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transaction logs"
  ON public.transaction_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_transactions_store_id ON public.transactions(store_id);
CREATE INDEX idx_transactions_moneroo_id ON public.transactions(moneroo_transaction_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transaction_logs_transaction_id ON public.transaction_logs(transaction_id);
CREATE INDEX idx_transaction_logs_created_at ON public.transaction_logs(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log transaction events
CREATE OR REPLACE FUNCTION public.log_transaction_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.transaction_logs (
    transaction_id,
    event_type,
    status,
    response_data
  ) VALUES (
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN OLD.status != NEW.status THEN 'status_updated'
      ELSE 'updated'
    END,
    NEW.status,
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'amount', NEW.amount,
      'currency', NEW.currency
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-log transaction changes
CREATE TRIGGER log_transaction_changes
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_event();