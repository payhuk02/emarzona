-- Créer le compte administrateur par défaut et son profil
-- Note: Le mot de passe sera défini lors de la création via l'interface

-- Fonction pour créer l'admin si non existant
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Vérifier si l'utilisateur admin existe déjà
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'contact@edigit-agence.com';

  -- Si l'utilisateur n'existe pas, on crée juste le rôle admin
  -- L'utilisateur devra être créé via signup avec ce email
  IF admin_user_id IS NULL THEN
    -- On ne peut pas créer directement dans auth.users, on va créer une policy pour permettre l'auto-attribution du rôle admin
    RAISE NOTICE 'Admin user will be created via signup';
  ELSE
    -- Si l'utilisateur existe, on s'assure qu'il a le rôle admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to existing user';
  END IF;
END $$;

-- Créer une fonction pour auto-attribuer le rôle admin au premier utilisateur
CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si c'est l'email admin et qu'il n'y a pas encore d'admin
  IF NEW.email = 'contact@edigit-agence.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour auto-attribuer le rôle admin
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'contact@edigit-agence.com')
  EXECUTE FUNCTION public.assign_admin_to_first_user();

-- Ajouter des policies pour que les admins puissent tout gérer
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Policies pour gérer tous les stores
CREATE POLICY "Admins can view all stores" ON public.stores
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all stores" ON public.stores
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any store" ON public.stores
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Policies pour gérer tous les produits
CREATE POLICY "Admins can view all products" ON public.products
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all products" ON public.products
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any product" ON public.products
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Policies pour gérer toutes les commandes
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders" ON public.orders
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any order" ON public.orders
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Policies pour gérer tous les paiements
CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all payments" ON public.payments
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any payment" ON public.payments
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Policies pour gérer tous les parrainages
CREATE POLICY "Admins can insert referrals" ON public.referrals
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update referrals" ON public.referrals
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete referrals" ON public.referrals
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Policies pour gérer toutes les commissions de parrainage
CREATE POLICY "Admins can insert referral commissions" ON public.referral_commissions
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update referral commissions" ON public.referral_commissions
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete referral commissions" ON public.referral_commissions
FOR DELETE USING (has_role(auth.uid(), 'admin'));