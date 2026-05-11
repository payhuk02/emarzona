-- 1. Enum des rôles
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');

-- 2. Table user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Fonction security definer pour vérifier un rôle sans récursion RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- 4. Policies user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Migration des données existantes : tous les profils is_seller=true reçoivent le rôle 'seller'
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'seller'::public.app_role FROM public.profiles WHERE is_seller = true
ON CONFLICT DO NOTHING;

-- Tout le monde reçoit le rôle 'buyer' par défaut
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'buyer'::public.app_role FROM public.profiles
ON CONFLICT DO NOTHING;

-- 6. Bloquer la modification de is_seller côté profiles via un trigger
CREATE OR REPLACE FUNCTION public.prevent_is_seller_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalcule is_seller à partir de la table user_roles, ignore toute valeur envoyée par le client
  NEW.is_seller := EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'seller'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_is_seller_on_profiles ON public.profiles;
CREATE TRIGGER sync_is_seller_on_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_is_seller_change();

-- 7. Lorsque un rôle 'seller' est ajouté/retiré, mettre à jour profiles.is_seller
CREATE OR REPLACE FUNCTION public.sync_profile_is_seller()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  _user_id := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE public.profiles
    SET is_seller = EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'seller'
    )
  WHERE id = _user_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_is_seller_after_role_change ON public.user_roles;
CREATE TRIGGER sync_is_seller_after_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_is_seller();

-- 8. Attribuer automatiquement le rôle 'buyer' à chaque nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- (Re)créer le trigger sur auth.users s'il n'existe pas déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();