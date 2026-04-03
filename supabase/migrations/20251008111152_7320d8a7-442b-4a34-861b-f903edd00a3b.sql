-- Add SEO fields to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Add SEO fields to products table if not exists
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Create SEO pages tracking table
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL, -- 'product', 'store', 'home', etc.
  page_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  seo_score INTEGER DEFAULT 0,
  indexed BOOLEAN DEFAULT true,
  last_crawled TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  position NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on seo_pages
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seo_pages
CREATE POLICY "Admins can manage SEO pages"
ON public.seo_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view indexed SEO pages"
ON public.seo_pages
FOR SELECT
USING (indexed = true);

-- Create updated_at trigger for seo_pages
CREATE TRIGGER update_seo_pages_updated_at
BEFORE UPDATE ON public.seo_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();