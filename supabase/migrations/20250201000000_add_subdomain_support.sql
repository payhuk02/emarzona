-- Migration: Ajout du support des sous-domaines pour les boutiques
-- Date: 1 Février 2025
-- Description: Ajoute le champ subdomain et la validation des slugs réservés

-- 1. Ajouter la colonne subdomain à la table stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- 2. Créer un index unique sur subdomain pour les performances
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_subdomain_unique 
ON public.stores(subdomain) 
WHERE subdomain IS NOT NULL;

-- 3. Fonction pour valider si un subdomain est réservé
CREATE OR REPLACE FUNCTION public.is_subdomain_reserved(check_subdomain TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  reserved_subdomains TEXT[] := ARRAY[
    'www', 'admin', 'api', 'app', 'support', 'help', 
    'my', 'mail', 'ftp', 'smtp', 'pop', 'imap',
    'blog', 'shop', 'store', 'marketplace', 'dashboard',
    'account', 'accounts', 'auth', 'login', 'signup',
    'register', 'password', 'reset', 'verify', 'confirm',
    'settings', 'profile', 'billing', 'payment', 'checkout',
    'cart', 'order', 'orders', 'product', 'products',
    'category', 'categories', 'search', 'filter', 'filters',
    'about', 'contact', 'terms', 'privacy', 'legal',
    'faq', 'help', 'support', 'docs', 'documentation',
    'status', 'health', 'ping', 'test', 'staging', 'dev',
    'cdn', 'assets', 'static', 'media', 'images', 'files',
    'api-docs', 'swagger', 'graphql', 'webhook', 'webhooks',
    'admin-panel', 'cpanel', 'phpmyadmin', 'wp-admin',
    'mail', 'email', 'smtp', 'imap', 'pop3', 'mx',
    'ns1', 'ns2', 'dns', 'domain', 'subdomain',
    'wildcard', 'catch-all', 'default', 'fallback'
  ];
BEGIN
  -- Vérifier si le subdomain est dans la liste réservée
  RETURN lower(trim(check_subdomain)) = ANY(reserved_subdomains);
END;
$$;

-- 4. Fonction pour valider le format d'un subdomain
CREATE OR REPLACE FUNCTION public.is_valid_subdomain(check_subdomain TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  subdomain_pattern TEXT := '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$';
BEGIN
  -- Vérifier que le subdomain n'est pas vide
  IF check_subdomain IS NULL OR trim(check_subdomain) = '' THEN
    RETURN false;
  END IF;
  
  -- Vérifier la longueur (max 63 caractères selon RFC 1035)
  IF length(check_subdomain) > 63 THEN
    RETURN false;
  END IF;
  
  -- Vérifier le format (lettres minuscules, chiffres, tirets uniquement)
  -- Ne peut pas commencer ou finir par un tiret
  RETURN check_subdomain ~ subdomain_pattern;
END;
$$;

-- 5. Fonction pour vérifier si un subdomain est disponible
CREATE OR REPLACE FUNCTION public.is_subdomain_available(
  check_subdomain TEXT, 
  exclude_store_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que le subdomain n'est pas réservé
  IF public.is_subdomain_reserved(check_subdomain) THEN
    RETURN false;
  END IF;
  
  -- Vérifier le format
  IF NOT public.is_valid_subdomain(check_subdomain) THEN
    RETURN false;
  END IF;
  
  -- Vérifier qu'il n'existe pas déjà
  IF exclude_store_id IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.stores 
      WHERE subdomain = lower(trim(check_subdomain))
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.stores 
      WHERE subdomain = lower(trim(check_subdomain)) 
      AND id != exclude_store_id
    );
  END IF;
END;
$$;

-- 6. Fonction pour générer automatiquement un subdomain à partir du slug
CREATE OR REPLACE FUNCTION public.generate_subdomain_from_slug(store_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  generated_subdomain TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Utiliser le slug comme base
  generated_subdomain := lower(trim(store_slug));
  
  -- Nettoyer le subdomain (même logique que pour le slug)
  generated_subdomain := regexp_replace(generated_subdomain, '[^a-z0-9-]', '', 'g');
  generated_subdomain := regexp_replace(generated_subdomain, '-+', '-', 'g');
  generated_subdomain := trim(generated_subdomain, '-');
  
  -- Limiter à 63 caractères
  IF length(generated_subdomain) > 63 THEN
    generated_subdomain := substring(generated_subdomain, 1, 63);
    generated_subdomain := trim(generated_subdomain, '-');
  END IF;
  
  -- Si le subdomain est réservé ou invalide, ajouter un suffixe numérique
  WHILE (public.is_subdomain_reserved(generated_subdomain) OR 
         NOT public.is_valid_subdomain(generated_subdomain) OR
         EXISTS (SELECT 1 FROM public.stores WHERE subdomain = generated_subdomain))
    AND counter < max_attempts
  LOOP
    counter := counter + 1;
    generated_subdomain := lower(trim(store_slug)) || '-' || counter::TEXT;
    generated_subdomain := regexp_replace(generated_subdomain, '[^a-z0-9-]', '', 'g');
    generated_subdomain := regexp_replace(generated_subdomain, '-+', '-', 'g');
    generated_subdomain := trim(generated_subdomain, '-');
    
    IF length(generated_subdomain) > 63 THEN
      generated_subdomain := substring(generated_subdomain, 1, 63);
      generated_subdomain := trim(generated_subdomain, '-');
    END IF;
  END LOOP;
  
  -- Si on n'a pas trouvé de subdomain disponible après max_attempts, retourner NULL
  IF counter >= max_attempts THEN
    RETURN NULL;
  END IF;
  
  RETURN generated_subdomain;
END;
$$;

-- 7. Trigger pour générer automatiquement le subdomain lors de la création d'une boutique
CREATE OR REPLACE FUNCTION public.auto_generate_subdomain()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si le subdomain n'est pas fourni, le générer automatiquement depuis le slug
  IF NEW.subdomain IS NULL OR trim(NEW.subdomain) = '' THEN
    NEW.subdomain := public.generate_subdomain_from_slug(NEW.slug);
  ELSE
    -- Normaliser le subdomain (lowercase, trim)
    NEW.subdomain := lower(trim(NEW.subdomain));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_subdomain
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  WHEN (NEW.subdomain IS NULL OR trim(NEW.subdomain) = '')
  EXECUTE FUNCTION public.auto_generate_subdomain();

-- 8. Fonction pour récupérer une boutique par subdomain (pour l'API)
CREATE OR REPLACE FUNCTION public.get_store_by_subdomain(store_subdomain TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  slug TEXT,
  subdomain TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.name,
    s.slug,
    s.subdomain,
    s.description,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM public.stores s
  WHERE s.subdomain = lower(trim(store_subdomain))
    AND s.is_active = true
  LIMIT 1;
END;
$$;

-- 9. Commentaires pour documentation
COMMENT ON COLUMN public.stores.subdomain IS 'Sous-domaine unique pour accéder à la boutique via *.myemarzona.shop';
COMMENT ON FUNCTION public.is_subdomain_reserved IS 'Vérifie si un sous-domaine est dans la liste des réservés (www, admin, api, etc.)';
COMMENT ON FUNCTION public.is_valid_subdomain IS 'Valide le format d''un sous-domaine selon RFC 1035 (max 63 caractères, alphanumériques et tirets)';
COMMENT ON FUNCTION public.is_subdomain_available IS 'Vérifie si un sous-domaine est disponible (non réservé, valide, et non utilisé)';
COMMENT ON FUNCTION public.generate_subdomain_from_slug IS 'Génère automatiquement un sous-domaine à partir du slug de la boutique';
COMMENT ON FUNCTION public.get_store_by_subdomain IS 'Récupère une boutique active par son sous-domaine (pour l''API multi-tenant)';
