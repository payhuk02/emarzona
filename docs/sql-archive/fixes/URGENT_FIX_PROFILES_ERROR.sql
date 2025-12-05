-- ============================================================
-- CORRECTION URGENTE - Erreur "column profiles.user_id does not exist"
-- Payhuk - Système de profil avancé
-- ============================================================

-- 1. Créer ou corriger la table profiles avec toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url text,
  display_name text,
  first_name text,
  last_name text,
  bio text,
  phone text,
  location text,
  website text,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_referral_earnings numeric DEFAULT 0,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  suspended_at timestamp with time zone,
  suspended_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_referral_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les politiques existantes pour les recréer proprement
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 5. Créer les nouvelles politiques RLS
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 7. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- 8. Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Générer un code de 8 caractères alphanumériques
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists;
    
    -- Si le code n'existe pas, on peut l'utiliser
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    first_name, 
    last_name, 
    bio, 
    phone, 
    location, 
    website,
    referral_code
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'website',
    public.generate_referral_code()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, do nothing
    RETURN NEW;
END;
$$;

-- 10. Créer le trigger pour la création automatique de profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Créer le bucket de stockage pour les avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 12. Politiques de stockage pour les avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 13. Fonction pour calculer le pourcentage de complétion du profil
CREATE OR REPLACE FUNCTION public.get_profile_completion_percentage(profile_id uuid)
RETURNS integer AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
  completed_fields integer := 0;
  total_fields integer := 8; -- Nombre total de champs à remplir
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = profile_id;
  
  IF profile_record.display_name IS NOT NULL AND profile_record.display_name != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.first_name IS NOT NULL AND profile_record.first_name != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.last_name IS NOT NULL AND profile_record.last_name != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.location IS NOT NULL AND profile_record.location != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.website IS NOT NULL AND profile_record.website != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    completed_fields := completed_fields + 1;
  END IF;
  
  RETURN ROUND((completed_fields::numeric / total_fields::numeric) * 100);
END;
$$ LANGUAGE plpgsql;

-- 14. Fonction pour obtenir les statistiques du profil
CREATE OR REPLACE FUNCTION public.get_profile_stats(profile_user_id uuid)
RETURNS json AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'profile_completion', public.get_profile_completion_percentage(p.id),
    'total_referrals', COALESCE((
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE referred_by = profile_user_id
    ), 0),
    'total_earnings', COALESCE(p.total_referral_earnings, 0),
    'member_since', p.created_at,
    'last_updated', p.updated_at
  ) INTO stats
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
  
  RETURN COALESCE(stats, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- 15. Commentaires pour la documentation
COMMENT ON TABLE public.profiles IS 'Table des profils utilisateur avec informations complètes - CORRECTION URGENTE';
COMMENT ON COLUMN public.profiles.user_id IS 'ID de l\'utilisateur - COLONNE CRITIQUE POUR LE FONCTIONNEMENT';
COMMENT ON COLUMN public.profiles.referral_code IS 'Code de parrainage unique généré automatiquement';
COMMENT ON COLUMN public.profiles.total_referral_earnings IS 'Total des gains de parrainage';
COMMENT ON FUNCTION public.generate_referral_code() IS 'Génère un code de parrainage unique';
COMMENT ON FUNCTION public.get_profile_completion_percentage(uuid) IS 'Calcule le pourcentage de complétion du profil';
COMMENT ON FUNCTION public.get_profile_stats(uuid) IS 'Retourne les statistiques du profil utilisateur';

-- ============================================================
-- FIN DE LA CORRECTION
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Copiez tout ce contenu
-- 2. Allez dans votre dashboard Supabase
-- 3. Ouvrez l'éditeur SQL
-- 4. Collez ce contenu et exécutez-le
-- 5. Rafraîchissez votre application Payhuk
-- 6. L'erreur "column profiles.user_id does not exist" sera corrigée
--
-- ============================================================
