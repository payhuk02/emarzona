-- Créer une fonction pour auto-attribuer le rôle admin au compte admin
CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si c'est l'email admin, attribuer automatiquement le rôle admin
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

-- Ajouter les policies manquantes pour les admins (seulement celles qui n'existent pas)
DO $$
BEGIN
  -- Policies pour profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can delete profiles') THEN
    EXECUTE 'CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;

  -- Policies pour stores
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Admins can view all stores') THEN
    EXECUTE 'CREATE POLICY "Admins can view all stores" ON public.stores FOR SELECT USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Admins can update all stores') THEN
    EXECUTE 'CREATE POLICY "Admins can update all stores" ON public.stores FOR UPDATE USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Admins can delete any store') THEN
    EXECUTE 'CREATE POLICY "Admins can delete any store" ON public.stores FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;

  -- Policies pour products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can update all products') THEN
    EXECUTE 'CREATE POLICY "Admins can update all products" ON public.products FOR UPDATE USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can delete any product') THEN
    EXECUTE 'CREATE POLICY "Admins can delete any product" ON public.products FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;

  -- Policies pour orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can view all orders') THEN
    EXECUTE 'CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can update all orders') THEN
    EXECUTE 'CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can delete any order') THEN
    EXECUTE 'CREATE POLICY "Admins can delete any order" ON public.orders FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;

  -- Policies pour payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can update all payments') THEN
    EXECUTE 'CREATE POLICY "Admins can update all payments" ON public.payments FOR UPDATE USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can delete any payment') THEN
    EXECUTE 'CREATE POLICY "Admins can delete any payment" ON public.payments FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;

  -- Policies pour referrals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can insert referrals') THEN
    EXECUTE 'CREATE POLICY "Admins can insert referrals" ON public.referrals FOR INSERT WITH CHECK (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can update referrals') THEN
    EXECUTE 'CREATE POLICY "Admins can update referrals" ON public.referrals FOR UPDATE USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can delete referrals') THEN
    EXECUTE 'CREATE POLICY "Admins can delete referrals" ON public.referrals FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;

  -- Policies pour referral_commissions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_commissions' AND policyname = 'Admins can insert referral commissions') THEN
    EXECUTE 'CREATE POLICY "Admins can insert referral commissions" ON public.referral_commissions FOR INSERT WITH CHECK (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_commissions' AND policyname = 'Admins can update referral commissions') THEN
    EXECUTE 'CREATE POLICY "Admins can update referral commissions" ON public.referral_commissions FOR UPDATE USING (has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_commissions' AND policyname = 'Admins can delete referral commissions') THEN
    EXECUTE 'CREATE POLICY "Admins can delete referral commissions" ON public.referral_commissions FOR DELETE USING (has_role(auth.uid(), ''admin''))';
  END IF;
END $$;