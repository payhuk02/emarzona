-- Migration de correction : Ajouter la colonne product_type à la table reviews
-- Date: 27 octobre 2025
-- Description: Correction pour les reviews existantes

-- Vérifier si la table reviews existe et ajouter la colonne si nécessaire
DO $$ 
BEGIN
    -- Ajouter la colonne product_type si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews' 
        AND column_name = 'product_type'
    ) THEN
        ALTER TABLE public.reviews 
        ADD COLUMN product_type TEXT NOT NULL DEFAULT 'digital' 
        CHECK (product_type IN ('digital', 'physical', 'service', 'course'));
        
        -- Créer l'index
        CREATE INDEX IF NOT EXISTS idx_reviews_product_type ON public.reviews(product_type);
        
        RAISE NOTICE 'Colonne product_type ajoutée à la table reviews';
    END IF;

    -- Ajouter les colonnes de ratings détaillés si elles n'existent pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'quality_rating'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'value_rating'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'service_rating'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'delivery_rating'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'course_content_rating'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN course_content_rating INTEGER CHECK (course_content_rating >= 1 AND course_content_rating <= 5);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'instructor_rating'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5);
    END IF;

    -- Ajouter reviewer_name et reviewer_avatar si manquants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewer_name'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN reviewer_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewer_avatar'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN reviewer_avatar TEXT;
    END IF;

    -- Mettre à jour product_type basé sur le type réel du produit
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'product_type'
    ) THEN
        UPDATE public.reviews r
        SET product_type = p.product_type
        FROM public.products p
        WHERE r.product_id = p.id
        AND r.product_type = 'digital'; -- Seulement pour ceux qui ont la valeur par défaut
        
        RAISE NOTICE 'product_type mis à jour depuis la table products';
    END IF;

END $$;

-- Créer la table review_replies si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_type TEXT DEFAULT 'seller' CHECK (reply_type IN ('seller', 'admin', 'customer')),
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON public.review_replies(user_id);

-- Créer la table review_votes si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- Créer la table review_media si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.review_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  media_thumbnail_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_media_review_id ON public.review_media(review_id);

-- Créer la table product_review_stats si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.product_review_stats (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  avg_quality_rating DECIMAL(3,2),
  avg_value_rating DECIMAL(3,2),
  avg_service_rating DECIMAL(3,2),
  avg_delivery_rating DECIMAL(3,2),
  avg_course_content_rating DECIMAL(3,2),
  avg_instructor_rating DECIMAL(3,2),
  verified_purchases_count INTEGER DEFAULT 0,
  featured_reviews_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_review_stats_average_rating 
  ON public.product_review_stats(average_rating DESC);

COMMENT ON TABLE public.reviews IS 'Avis et notes des clients pour tous types de produits (v2 - avec product_type)';

