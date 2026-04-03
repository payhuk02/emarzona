-- =====================================================
-- FIX: Table cookie_preferences
-- Date: 28 Janvier 2025
-- Description: Créer la table cookie_preferences si elle n'existe pas
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cookie_preferences'
  ) THEN
    CREATE TABLE public.cookie_preferences (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      necessary BOOLEAN DEFAULT TRUE, -- Toujours true (obligatoire)
      functional BOOLEAN DEFAULT FALSE,
      analytics BOOLEAN DEFAULT FALSE,
      marketing BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_cookie_preferences_user_id ON public.cookie_preferences(user_id);

    -- Trigger pour updated_at
    DROP TRIGGER IF EXISTS update_cookie_preferences_updated_at ON public.cookie_preferences;
    CREATE TRIGGER update_cookie_preferences_updated_at
      BEFORE UPDATE ON public.cookie_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- RLS
    ALTER TABLE public.cookie_preferences ENABLE ROW LEVEL SECURITY;

    -- Policies
    DROP POLICY IF EXISTS "Users can view their own cookie preferences" ON public.cookie_preferences;
    CREATE POLICY "Users can view their own cookie preferences"
      ON public.cookie_preferences FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their own cookie preferences" ON public.cookie_preferences;
    CREATE POLICY "Users can manage their own cookie preferences"
      ON public.cookie_preferences FOR ALL
      USING (auth.uid() = user_id);

    COMMENT ON TABLE public.cookie_preferences IS 'Préférences cookies des utilisateurs pour conformité RGPD';
  END IF;
END $$;

