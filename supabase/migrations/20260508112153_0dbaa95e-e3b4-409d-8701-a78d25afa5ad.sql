
-- Fonction pour vérifier si un slug est réservé
CREATE OR REPLACE FUNCTION public.is_slug_reserved(check_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(check_slug)) = ANY(ARRAY[
    'www', 'admin', 'api', 'app', 'support', 'help', 'my', 'mail', 'ftp',
    'smtp', 'pop', 'imap', 'blog', 'shop', 'store', 'marketplace', 'dashboard',
    'account', 'accounts', 'auth', 'login', 'signup', 'register', 'password',
    'reset', 'verify', 'confirm', 'settings', 'profile', 'billing', 'payment',
    'checkout', 'cart', 'order', 'orders', 'product', 'products', 'category',
    'categories', 'search', 'filter', 'filters', 'about', 'contact', 'terms',
    'privacy', 'legal', 'faq', 'docs', 'documentation', 'status', 'health',
    'ping', 'test', 'staging', 'dev', 'cdn', 'assets', 'static', 'media',
    'images', 'files', 'api-docs', 'swagger', 'graphql', 'webhook', 'webhooks',
    'admin-panel', 'cpanel', 'phpmyadmin', 'wp-admin', 'email', 'mx',
    'ns1', 'ns2', 'dns', 'domain', 'subdomain', 'wildcard', 'catch-all',
    'default', 'fallback'
  ]);
$$;

-- Trigger function pour bloquer les slugs réservés
CREATE OR REPLACE FUNCTION public.check_store_slug_not_reserved()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_slug_reserved(NEW.slug) THEN
    RAISE EXCEPTION 'Le slug "%" est réservé et ne peut pas être utilisé', NEW.slug;
  END IF;
  RETURN NEW;
END;
$$;

-- Attacher le trigger
DROP TRIGGER IF EXISTS trg_check_reserved_slug ON public.stores;
CREATE TRIGGER trg_check_reserved_slug
  BEFORE INSERT OR UPDATE OF slug ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_store_slug_not_reserved();
