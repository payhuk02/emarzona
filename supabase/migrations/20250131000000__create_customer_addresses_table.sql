-- =====================================================
-- CUSTOMER ADDRESSES TABLE
-- Date: 31 Janvier 2025
-- Description: Table pour stocker les adresses de livraison des clients
-- =====================================================

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Address information
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'BF',
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  address_type TEXT DEFAULT 'shipping', -- 'shipping', 'billing', 'both'
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_address_type CHECK (address_type IN ('shipping', 'billing', 'both'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON public.customer_addresses(user_id, is_default) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own addresses
CREATE POLICY "Users can view their own addresses"
  ON public.customer_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
  ON public.customer_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
  ON public.customer_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
  ON public.customer_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If this address is being set as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE public.customer_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single default address
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- Trigger to update updated_at
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.customer_addresses IS 'Adresses de livraison et facturation des clients';
COMMENT ON COLUMN public.customer_addresses.user_id IS 'ID de l''utilisateur (auth.users)';
COMMENT ON COLUMN public.customer_addresses.is_default IS 'Adresse par défaut (une seule par utilisateur)';
COMMENT ON COLUMN public.customer_addresses.address_type IS 'Type d''adresse: shipping, billing, ou both';

