-- Add domain management columns to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS domain_status text DEFAULT 'not_configured' CHECK (domain_status IN ('not_configured', 'pending', 'verified', 'error')),
ADD COLUMN IF NOT EXISTS domain_verification_token text,
ADD COLUMN IF NOT EXISTS domain_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS domain_error_message text;

-- Create index for domain verification
CREATE INDEX IF NOT EXISTS idx_stores_custom_domain ON public.stores(custom_domain) WHERE custom_domain IS NOT NULL;

-- Add unique constraint on custom_domain to prevent conflicts
ALTER TABLE public.stores ADD CONSTRAINT unique_custom_domain UNIQUE (custom_domain);