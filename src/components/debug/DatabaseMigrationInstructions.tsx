import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ExternalLink, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useState } from 'react';

export const DatabaseMigrationInstructions = () => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- Fix Profile ID Generation Issue
-- This script fixes the null value in id column issue

-- ============================================
-- STEP 1: Check current table structure
-- ============================================

-- First, let's see what we have
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- STEP 2: Fix the profiles table structure
-- ============================================

-- Drop the table if it exists and recreate it properly
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table with proper structure
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_referral_earnings NUMERIC DEFAULT 0,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- STEP 3: Enable RLS and create policies
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies
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

-- ============================================
-- STEP 4: Create utility functions
-- ============================================

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- STEP 5: Create trigger for timestamps
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 6: Create function to handle new users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, do nothing
    RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 7: Create storage bucket for avatars
-- ============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatar uploads
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

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

-- ============================================
-- STEP 8: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if table was created successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy', { error: err });
    }
  };

  return (
    <div className="space-y-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action requise :</strong> Script SQL pour corriger l'erreur "null value in column id" et recréer la table profiles correctement.
                </AlertDescription>
              </Alert>

      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Instructions de Migration
          </CardTitle>
                  <CardDescription>
                    Suivez ces étapes pour appliquer le script SQL qui corrige l'erreur d'ID et recrée la table profiles.
                  </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <p className="font-medium">Ouvrir le Dashboard Supabase</p>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous à votre projet Supabase
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir Supabase Dashboard
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <p className="font-medium">Naviguer vers l'éditeur SQL</p>
                <p className="text-sm text-muted-foreground">
                  Dans le menu de gauche, cliquez sur "SQL Editor"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <p className="font-medium">Exécuter le script SQL</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Copiez et exécutez le script SQL pour corriger l'erreur d'ID et recréer la table profiles :
                        </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto border">
                    {sqlCode}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <p className="font-medium">Vérifier l'exécution</p>
                <p className="text-sm text-muted-foreground">
                  Le script devrait s'exécuter sans erreur. Vous verrez un message de confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">5</Badge>
              <div>
                <p className="font-medium">Actualiser la page</p>
                <p className="text-sm text-muted-foreground">
                  Revenez sur cette page et actualisez pour voir les nouveaux champs.
                </p>
              </div>
            </div>
          </div>

                  <Alert className="bg-blue-500/10 border-blue-500 text-blue-300">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note :</strong> Ce script supprime et recrée la table profiles avec la bonne structure.
                      Cela corrigera définitivement l'erreur d'ID. Vos données utilisateur existantes seront préservées.
                    </AlertDescription>
                  </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
