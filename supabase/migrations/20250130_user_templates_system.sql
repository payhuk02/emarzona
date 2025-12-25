-- =========================================================
-- Migration: User Templates System
-- Date: 30/01/2025
-- Description: Système complet pour sauvegarder et gérer les templates personnalisés des utilisateurs
-- =========================================================

-- Create user_templates table
CREATE TABLE IF NOT EXISTS public.user_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'physical', 'service', 'course')),
  
  -- Template data (JSONB for flexibility)
  template_data JSONB NOT NULL,
  
  -- Metadata
  thumbnail TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Statistics
  usage_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_templates_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT user_templates_rating_range CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_product_type ON public.user_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_user_templates_category ON public.user_templates(category);
CREATE INDEX IF NOT EXISTS idx_user_templates_is_public ON public.user_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_user_templates_created_at ON public.user_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_templates_usage_count ON public.user_templates(usage_count DESC);

-- GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_user_templates_template_data ON public.user_templates USING GIN (template_data);

-- Enable RLS
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own templates
CREATE POLICY "Users can view their own templates"
ON public.user_templates FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public templates
CREATE POLICY "Users can view public templates"
ON public.user_templates FOR SELECT
USING (is_public = true);

-- Users can insert their own templates
CREATE POLICY "Users can insert their own templates"
ON public.user_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates"
ON public.user_templates FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
ON public.user_templates FOR DELETE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_templates_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_template_download(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_templates
  SET download_count = download_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update template rating
CREATE OR REPLACE FUNCTION public.update_template_rating(
  template_id UUID,
  new_rating NUMERIC
)
RETURNS void AS $$
DECLARE
  current_rating NUMERIC;
  current_count INTEGER;
  new_average NUMERIC;
BEGIN
  SELECT rating, rating_count INTO current_rating, current_count
  FROM public.user_templates
  WHERE id = template_id;
  
  IF current_count = 0 THEN
    new_average := new_rating;
  ELSE
    new_average := ((current_rating * current_count) + new_rating) / (current_count + 1);
  END IF;
  
  UPDATE public.user_templates
  SET 
    rating = new_average,
    rating_count = rating_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_templates TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_download(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_template_rating(UUID, NUMERIC) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_templates IS 'Templates personnalisés créés par les utilisateurs';
COMMENT ON COLUMN public.user_templates.template_data IS 'Données complètes du template au format JSONB (TemplateV2)';
COMMENT ON COLUMN public.user_templates.is_public IS 'Si true, le template est visible par tous les utilisateurs';
COMMENT ON COLUMN public.user_templates.is_premium IS 'Si true, le template est premium et peut être monétisé';





