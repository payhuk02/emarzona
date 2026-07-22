-- Hotfix prod: expand reserved store slugs (apply in SQL Editor if needed).
-- Mirror of migration 20260722105000__expand_reserved_store_slugs.sql

CREATE OR REPLACE FUNCTION public.is_slug_reserved(check_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(check_slug)) = ANY(ARRAY[
    'www', 'web', 'admin', 'api', 'app', 'apps', 'support', 'help', 'helps', 'my',
    'mail', 'email', 'ftp', 'smtp', 'pop', 'pop3', 'imap', 'blog', 'shop', 'store',
    'stores', 'marketplace', 'dashboard', 'account', 'accounts', 'auth', 'login',
    'logout', 'signup', 'register', 'password', 'reset', 'verify', 'confirm',
    'settings', 'profile', 'billing', 'payment', 'payments', 'checkout', 'cart',
    'order', 'orders', 'product', 'products', 'category', 'categories', 'search',
    'filter', 'filters', 'about', 'contact', 'terms', 'privacy', 'legal', 'faq',
    'docs', 'documentation', 'status', 'health', 'ping', 'test', 'testing',
    'staging', 'dev', 'development', 'cdn', 'assets', 'static', 'media', 'images',
    'files', 'api-docs', 'swagger', 'graphql', 'webhook', 'webhooks', 'admin-panel',
    'cpanel', 'phpmyadmin', 'wp-admin', 'mx', 'ns1', 'ns2', 'dns', 'domain',
    'domains', 'subdomain', 'wildcard', 'catch-all', 'default', 'fallback', 'root',
    'null', 'undefined', 'system', 'sys', 'internal', 'private', 'public', 'secure',
    'security', 'ssl', 'oauth', 'sso', 'backend', 'frontend', 'server', 'servers',
    'client', 'clients', 'portal', 'console', 'ops', 'monitoring', 'metrics', 'logs',
    'log', 'beta', 'demo', 'preview', 'localhost', 'local', 'prod', 'production',
    'staging-api', 'cdn-assets',
    'emarzona', 'emarzona-admin', 'emarzona-api', 'emarzona-app', 'myemarzona',
    'geniuspay', 'genius-pay', 'protect', 'emarzona-protect',
    'whatsapp', 'whats-app', 'facebook', 'fb', 'instagram', 'insta', 'twitter', 'x',
    'tiktok', 'youtube', 'telegram', 'snapchat', 'discord', 'linkedin', 'pinterest',
    'messenger', 'gmail', 'outlook', 'hotmail', 'yahoo',
    'google', 'apple', 'amazon', 'microsoft', 'meta', 'paypal', 'stripe', 'visa',
    'mastercard', 'orange-money', 'orangemoney', 'moov', 'moov-money', 'wave', 'mtn',
    'mtn-momo', 'momo',
    'police', 'gendarmerie', 'gouvernement', 'government', 'etat', 'state', 'justice',
    'tribunal', 'armee', 'army', 'militaire', 'military', 'douane', 'customs',
    'ministere', 'ministry', 'mairie', 'prefecture', 'prefectoral', 'ambassade',
    'embassy', 'onu', 'un', 'oms', 'who', 'impots', 'taxes', 'fiscal', 'securite',
    'urgence', 'emergency', 'sos',
    'scam', 'phishing', 'fraud', 'fraude', 'hack', 'hacker', 'virus', 'malware', 'spam'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.is_subdomain_reserved(check_subdomain text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.is_slug_reserved(check_subdomain);
$$;

CREATE OR REPLACE FUNCTION public.is_store_slug_available(
  check_slug text,
  exclude_store_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_slug text;
BEGIN
  normalized_slug := lower(trim(check_slug));

  IF normalized_slug IS NULL OR normalized_slug = '' THEN
    RETURN false;
  END IF;

  IF public.is_slug_reserved(normalized_slug) THEN
    RETURN false;
  END IF;

  IF exclude_store_id IS NOT NULL THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.stores
      WHERE lower(slug) = normalized_slug
        AND id != exclude_store_id
    );
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.stores
    WHERE lower(slug) = normalized_slug
  );
END;
$$;
