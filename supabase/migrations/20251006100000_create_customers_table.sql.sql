-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.customers IS 'Customers belonging to a store';

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Store owners can view their customers"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = customers.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can insert customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = customers.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their customers"
  ON public.customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = customers.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete their customers"
  ON public.customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = customers.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_customers_store_id ON public.customers(store_id);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Trigger to update updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
