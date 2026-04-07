-- Table pour les domaines personnalisés des boutiques
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'active', 'error', 'removed')),
  verification_token text NOT NULL DEFAULT 'emarzona-verify-' || substr(gen_random_uuid()::text, 1, 12),
  verification_method text NOT NULL DEFAULT 'dns_txt' CHECK (verification_method IN ('dns_txt', 'dns_cname', 'file')),
  ssl_status text NOT NULL DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'provisioning', 'active', 'error', 'expired')),
  ssl_expires_at timestamptz,
  dns_records jsonb DEFAULT '[]'::jsonb,
  is_primary boolean DEFAULT false,
  error_message text,
  verified_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

-- Index pour recherche rapide par domaine
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_store_id ON public.custom_domains(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON public.custom_domains(status);

-- RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Policy: les utilisateurs ne voient que les domaines de leurs propres boutiques
DROP POLICY IF EXISTS "Users can view own store domains" ON public.custom_domains;
CREATE POLICY "Users can view own store domains"
  ON public.custom_domains FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert domains for own stores" ON public.custom_domains;
CREATE POLICY "Users can insert domains for own stores"
  ON public.custom_domains FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own store domains" ON public.custom_domains;
CREATE POLICY "Users can update own store domains"
  ON public.custom_domains FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own store domains" ON public.custom_domains;
CREATE POLICY "Users can delete own store domains"
  ON public.custom_domains FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Function pour récupérer un store par domaine personnalisé
CREATE OR REPLACE FUNCTION public.get_store_by_custom_domain(p_domain text)
RETURNS SETOF public.stores
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.stores s
  INNER JOIN public.custom_domains cd ON cd.store_id = s.id
  WHERE cd.domain = lower(p_domain)
    AND cd.status = 'active'
    AND s.is_active = true
  LIMIT 1;
$$;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_domains_updated_at ON public.custom_domains;
CREATE TRIGGER custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_domains_updated_at();
