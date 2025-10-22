-- Add SSL and redirect management columns to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS redirect_www BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS redirect_https BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'::jsonb;

-- Add index for SSL status
CREATE INDEX IF NOT EXISTS idx_stores_ssl_enabled ON public.stores(ssl_enabled) WHERE ssl_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN public.stores.ssl_enabled IS 'Whether SSL/TLS is enabled for the custom domain';
COMMENT ON COLUMN public.stores.redirect_www IS 'Whether to redirect www subdomain to main domain';
COMMENT ON COLUMN public.stores.redirect_https IS 'Whether to redirect HTTP to HTTPS';
COMMENT ON COLUMN public.stores.dns_records IS 'JSON array of DNS records for domain verification';
