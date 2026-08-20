-- ============================================================
-- P0 Services: taxonomie Catégorie → Sous-catégorie + fulfillment_mode
-- Idempotent seed of 12 service families (slugs svc-*)
-- ============================================================

-- 1) Extend categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS product_types text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE INDEX IF NOT EXISTS idx_categories_product_types_gin
  ON public.categories USING GIN (product_types);

CREATE INDEX IF NOT EXISTS idx_categories_parent_sort
  ON public.categories (parent_id, sort_order NULLS LAST);

-- 2) fulfillment_mode on service_products (hybrid foundation; default appointment)
ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS fulfillment_mode text NOT NULL DEFAULT 'appointment';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'service_products_fulfillment_mode_check'
  ) THEN
    ALTER TABLE public.service_products
      ADD CONSTRAINT service_products_fulfillment_mode_check
      CHECK (fulfillment_mode IN ('appointment', 'project', 'both'));
  END IF;
END $$;

-- 3) Seed helpers: upsert parent then children
CREATE OR REPLACE FUNCTION public._seed_svc_category(
  p_slug text,
  p_name text,
  p_description text,
  p_icon text,
  p_parent_slug text,
  p_sort_order integer
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_parent_id uuid;
BEGIN
  IF p_parent_slug IS NOT NULL THEN
    SELECT id INTO v_parent_id FROM public.categories WHERE slug = p_parent_slug;
  END IF;

  INSERT INTO public.categories (
    name, slug, description, icon, parent_id, sort_order, is_active, product_types
  ) VALUES (
    p_name, p_slug, p_description, p_icon, v_parent_id, p_sort_order, true, ARRAY['service']::text[]
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    parent_id = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order,
    is_active = true,
    product_types = ARRAY['service']::text[],
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Parents (12)
SELECT public._seed_svc_category('svc-informatique-technologie', 'Informatique & Technologie', 'Développement, IT, cybersécurité et automatisation', 'Code', NULL, 1);
SELECT public._seed_svc_category('svc-design-creation', 'Design & Création', 'Identité visuelle, UI/UX et création graphique', 'Palette', NULL, 2);
SELECT public._seed_svc_category('svc-marketing-communication', 'Marketing & Communication', 'Ads, SEO, contenu et stratégie marketing', 'TrendingUp', NULL, 3);
SELECT public._seed_svc_category('svc-formation-coaching', 'Formation & Coaching', 'Coaching, mentorat et formations professionnelles', 'GraduationCap', NULL, 4);
SELECT public._seed_svc_category('svc-redaction-traduction', 'Rédaction & Traduction', 'Rédaction, copywriting et traduction', 'FileText', NULL, 5);
SELECT public._seed_svc_category('svc-photo-video-audiovisuel', 'Photo, Vidéo & Audiovisuel', 'Photo, vidéo, motion et production', 'Camera', NULL, 6);
SELECT public._seed_svc_category('svc-services-entreprises', 'Services aux entreprises', 'Administration, assistance et externalisation', 'Briefcase', NULL, 7);
SELECT public._seed_svc_category('svc-maison-services-locaux', 'Maison & Services locaux', 'Entretien, réparation et services à domicile', 'Home', NULL, 8);
SELECT public._seed_svc_category('svc-beaute-bien-etre', 'Beauté & Bien-être', 'Beauté, spa, sport et bien-être', 'Heart', NULL, 9);
SELECT public._seed_svc_category('svc-transport-automobile', 'Transport & Automobile', 'Transport, livraison et services auto', 'Truck', NULL, 10);
SELECT public._seed_svc_category('svc-evenementiel', 'Événementiel', 'Organisation, animation et production d''événements', 'Sparkles', NULL, 11);
SELECT public._seed_svc_category('svc-juridique-administratif', 'Juridique & Administratif', 'Conseil juridique et formalités', 'Scale', NULL, 12);

-- 1. Informatique & Technologie
SELECT public._seed_svc_category('svc-developpement-web', 'Développement web', NULL, 'Globe', 'svc-informatique-technologie', 1);
SELECT public._seed_svc_category('svc-developpement-mobile', 'Développement mobile', NULL, 'Smartphone', 'svc-informatique-technologie', 2);
SELECT public._seed_svc_category('svc-creation-logiciels', 'Création de logiciels', NULL, 'Code', 'svc-informatique-technologie', 3);
SELECT public._seed_svc_category('svc-maintenance-informatique', 'Maintenance informatique', NULL, 'Wrench', 'svc-informatique-technologie', 4);
SELECT public._seed_svc_category('svc-cybersecurite', 'Cybersécurité', NULL, 'Shield', 'svc-informatique-technologie', 5);
SELECT public._seed_svc_category('svc-bases-de-donnees', 'Bases de données', NULL, 'Database', 'svc-informatique-technologie', 6);
SELECT public._seed_svc_category('svc-ia-automatisation', 'Intelligence artificielle & automatisation', NULL, 'Zap', 'svc-informatique-technologie', 7);
SELECT public._seed_svc_category('svc-support-technique', 'Support technique', NULL, 'Headphones', 'svc-informatique-technologie', 8);
SELECT public._seed_svc_category('svc-installation-configuration', 'Installation & configuration', NULL, 'Settings', 'svc-informatique-technologie', 9);
SELECT public._seed_svc_category('svc-hebergement-serveurs', 'Hébergement & serveurs', NULL, 'Cloud', 'svc-informatique-technologie', 10);

-- 2. Design & Création
SELECT public._seed_svc_category('svc-creation-logos', 'Création de logos', NULL, 'PenTool', 'svc-design-creation', 1);
SELECT public._seed_svc_category('svc-identite-visuelle', 'Identité visuelle', NULL, 'Palette', 'svc-design-creation', 2);
SELECT public._seed_svc_category('svc-design-graphique', 'Design graphique', NULL, 'Image', 'svc-design-creation', 3);
SELECT public._seed_svc_category('svc-ui-ux-design', 'UI/UX Design', NULL, 'Layers', 'svc-design-creation', 4);
SELECT public._seed_svc_category('svc-design-sites-web', 'Design de sites web', NULL, 'Layout', 'svc-design-creation', 5);
SELECT public._seed_svc_category('svc-flyers-affiches', 'Flyers & affiches', NULL, 'FileText', 'svc-design-creation', 6);
SELECT public._seed_svc_category('svc-presentations-pro', 'Présentations professionnelles', NULL, 'Presentation', 'svc-design-creation', 7);
SELECT public._seed_svc_category('svc-packaging', 'Packaging', NULL, 'Package', 'svc-design-creation', 8);
SELECT public._seed_svc_category('svc-retouche-photo', 'Retouche photo', NULL, 'Camera', 'svc-design-creation', 9);
SELECT public._seed_svc_category('svc-illustration', 'Illustration', NULL, 'Brush', 'svc-design-creation', 10);

-- 3. Marketing & Communication
SELECT public._seed_svc_category('svc-marketing-digital', 'Marketing digital', NULL, 'TrendingUp', 'svc-marketing-communication', 1);
SELECT public._seed_svc_category('svc-community-management', 'Community management', NULL, 'Users', 'svc-marketing-communication', 2);
SELECT public._seed_svc_category('svc-gestion-reseaux-sociaux', 'Gestion des réseaux sociaux', NULL, 'MessageSquare', 'svc-marketing-communication', 3);
SELECT public._seed_svc_category('svc-facebook-instagram-ads', 'Facebook & Instagram Ads', NULL, 'Target', 'svc-marketing-communication', 4);
SELECT public._seed_svc_category('svc-google-ads', 'Google Ads', NULL, 'Search', 'svc-marketing-communication', 5);
SELECT public._seed_svc_category('svc-tiktok-ads', 'TikTok Ads', NULL, 'Video', 'svc-marketing-communication', 6);
SELECT public._seed_svc_category('svc-seo', 'SEO', NULL, 'BarChart3', 'svc-marketing-communication', 7);
SELECT public._seed_svc_category('svc-email-marketing', 'Email marketing', NULL, 'Mail', 'svc-marketing-communication', 8);
SELECT public._seed_svc_category('svc-copywriting-marketing', 'Copywriting', NULL, 'PenTool', 'svc-marketing-communication', 9);
SELECT public._seed_svc_category('svc-creation-contenu', 'Création de contenu', NULL, 'Sparkles', 'svc-marketing-communication', 10);
SELECT public._seed_svc_category('svc-strategie-marketing', 'Stratégie marketing', NULL, 'Compass', 'svc-marketing-communication', 11);
SELECT public._seed_svc_category('svc-influence-rp', 'Influence & relations publiques', NULL, 'Megaphone', 'svc-marketing-communication', 12);

-- 4. Formation & Coaching
SELECT public._seed_svc_category('svc-coaching-professionnel', 'Coaching professionnel', NULL, 'Briefcase', 'svc-formation-coaching', 1);
SELECT public._seed_svc_category('svc-coaching-business', 'Coaching business', NULL, 'TrendingUp', 'svc-formation-coaching', 2);
SELECT public._seed_svc_category('svc-coaching-marketing', 'Coaching marketing', NULL, 'Target', 'svc-formation-coaching', 3);
SELECT public._seed_svc_category('svc-formation-informatique', 'Formation informatique', NULL, 'Code', 'svc-formation-coaching', 4);
SELECT public._seed_svc_category('svc-formation-ecommerce', 'Formation e-commerce', NULL, 'ShoppingBag', 'svc-formation-coaching', 5);
SELECT public._seed_svc_category('svc-formation-langues', 'Formation langues', NULL, 'Globe', 'svc-formation-coaching', 6);
SELECT public._seed_svc_category('svc-tutorat', 'Tutorat', NULL, 'BookOpen', 'svc-formation-coaching', 7);
SELECT public._seed_svc_category('svc-mentorat', 'Mentorat', NULL, 'Users', 'svc-formation-coaching', 8);
SELECT public._seed_svc_category('svc-orientation-pro', 'Orientation professionnelle', NULL, 'Compass', 'svc-formation-coaching', 9);
SELECT public._seed_svc_category('svc-accompagnement-perso', 'Accompagnement personnalisé', NULL, 'Heart', 'svc-formation-coaching', 10);

-- 5. Rédaction & Traduction
SELECT public._seed_svc_category('svc-redaction-web', 'Rédaction web', NULL, 'FileText', 'svc-redaction-traduction', 1);
SELECT public._seed_svc_category('svc-copywriting-redaction', 'Copywriting', NULL, 'PenTool', 'svc-redaction-traduction', 2);
SELECT public._seed_svc_category('svc-correction-relecture', 'Correction & relecture', NULL, 'CheckCircle', 'svc-redaction-traduction', 3);
SELECT public._seed_svc_category('svc-traduction', 'Traduction', NULL, 'Globe', 'svc-redaction-traduction', 4);
SELECT public._seed_svc_category('svc-transcription', 'Transcription audio/vidéo', NULL, 'Mic', 'svc-redaction-traduction', 5);
SELECT public._seed_svc_category('svc-redaction-cv', 'Rédaction de CV', NULL, 'FileText', 'svc-redaction-traduction', 6);
SELECT public._seed_svc_category('svc-lettres-motivation', 'Lettres de motivation', NULL, 'Mail', 'svc-redaction-traduction', 7);
SELECT public._seed_svc_category('svc-redaction-rapports', 'Rédaction de rapports', NULL, 'FileText', 'svc-redaction-traduction', 8);
SELECT public._seed_svc_category('svc-redaction-academique', 'Rédaction académique', NULL, 'GraduationCap', 'svc-redaction-traduction', 9);

-- 6. Photo, Vidéo & Audiovisuel
SELECT public._seed_svc_category('svc-photographie', 'Photographie', NULL, 'Camera', 'svc-photo-video-audiovisuel', 1);
SELECT public._seed_svc_category('svc-videographie', 'Vidéographie', NULL, 'Video', 'svc-photo-video-audiovisuel', 2);
SELECT public._seed_svc_category('svc-montage-video', 'Montage vidéo', NULL, 'Film', 'svc-photo-video-audiovisuel', 3);
SELECT public._seed_svc_category('svc-motion-design', 'Motion design', NULL, 'Sparkles', 'svc-photo-video-audiovisuel', 4);
SELECT public._seed_svc_category('svc-animation-2d-3d', 'Animation 2D/3D', NULL, 'Box', 'svc-photo-video-audiovisuel', 5);
SELECT public._seed_svc_category('svc-voix-off', 'Voix off', NULL, 'Mic', 'svc-photo-video-audiovisuel', 6);
SELECT public._seed_svc_category('svc-production-audiovisuelle', 'Production audiovisuelle', NULL, 'Clapperboard', 'svc-photo-video-audiovisuel', 7);
SELECT public._seed_svc_category('svc-creation-reels', 'Création de Reels', NULL, 'Smartphone', 'svc-photo-video-audiovisuel', 8);
SELECT public._seed_svc_category('svc-contenu-tiktok', 'Création de contenus TikTok', NULL, 'Video', 'svc-photo-video-audiovisuel', 9);
SELECT public._seed_svc_category('svc-production-evenementielle', 'Production événementielle', NULL, 'Sparkles', 'svc-photo-video-audiovisuel', 10);

-- 7. Services aux entreprises
SELECT public._seed_svc_category('svc-creation-entreprise', 'Création d''entreprise', NULL, 'Building2', 'svc-services-entreprises', 1);
SELECT public._seed_svc_category('svc-domiciliation', 'Domiciliation', NULL, 'Home', 'svc-services-entreprises', 2);
SELECT public._seed_svc_category('svc-gestion-administrative', 'Gestion administrative', NULL, 'Folder', 'svc-services-entreprises', 3);
SELECT public._seed_svc_category('svc-secretariat-externalise', 'Secrétariat externalisé', NULL, 'Briefcase', 'svc-services-entreprises', 4);
SELECT public._seed_svc_category('svc-assistance-virtuelle', 'Assistance virtuelle', NULL, 'Laptop', 'svc-services-entreprises', 5);
SELECT public._seed_svc_category('svc-centres-appels', 'Centres d''appels', NULL, 'Phone', 'svc-services-entreprises', 6);
SELECT public._seed_svc_category('svc-prospection-commerciale', 'Prospection commerciale', NULL, 'Target', 'svc-services-entreprises', 7);
SELECT public._seed_svc_category('svc-televiente', 'Télévente', NULL, 'Phone', 'svc-services-entreprises', 8);
SELECT public._seed_svc_category('svc-gestion-projets', 'Gestion de projets', NULL, 'Kanban', 'svc-services-entreprises', 9);
SELECT public._seed_svc_category('svc-externalisation-services', 'Externalisation de services', NULL, 'Layers', 'svc-services-entreprises', 10);

-- 8. Maison & Services locaux
SELECT public._seed_svc_category('svc-nettoyage', 'Nettoyage', NULL, 'Sparkles', 'svc-maison-services-locaux', 1);
SELECT public._seed_svc_category('svc-entretien', 'Entretien', NULL, 'Wrench', 'svc-maison-services-locaux', 2);
SELECT public._seed_svc_category('svc-jardinage', 'Jardinage', NULL, 'Flower2', 'svc-maison-services-locaux', 3);
SELECT public._seed_svc_category('svc-plomberie', 'Plomberie', NULL, 'Droplets', 'svc-maison-services-locaux', 4);
SELECT public._seed_svc_category('svc-electricite', 'Électricité', NULL, 'Zap', 'svc-maison-services-locaux', 5);
SELECT public._seed_svc_category('svc-climatisation', 'Climatisation', NULL, 'Wind', 'svc-maison-services-locaux', 6);
SELECT public._seed_svc_category('svc-peinture', 'Peinture', NULL, 'Paintbrush', 'svc-maison-services-locaux', 7);
SELECT public._seed_svc_category('svc-menuiserie', 'Menuiserie', NULL, 'Hammer', 'svc-maison-services-locaux', 8);
SELECT public._seed_svc_category('svc-reparation', 'Réparation', NULL, 'Wrench', 'svc-maison-services-locaux', 9);
SELECT public._seed_svc_category('svc-decoration-interieure', 'Décoration intérieure', NULL, 'Home', 'svc-maison-services-locaux', 10);

-- 9. Beauté & Bien-être
SELECT public._seed_svc_category('svc-coiffure', 'Coiffure', NULL, 'Scissors', 'svc-beaute-bien-etre', 1);
SELECT public._seed_svc_category('svc-maquillage', 'Maquillage', NULL, 'Sparkles', 'svc-beaute-bien-etre', 2);
SELECT public._seed_svc_category('svc-onglerie', 'Onglerie', NULL, 'Hand', 'svc-beaute-bien-etre', 3);
SELECT public._seed_svc_category('svc-esthetique', 'Esthétique', NULL, 'Heart', 'svc-beaute-bien-etre', 4);
SELECT public._seed_svc_category('svc-massage', 'Massage', NULL, 'Heart', 'svc-beaute-bien-etre', 5);
SELECT public._seed_svc_category('svc-spa', 'Spa', NULL, 'Droplets', 'svc-beaute-bien-etre', 6);
SELECT public._seed_svc_category('svc-coaching-sportif', 'Coaching sportif', NULL, 'Dumbbell', 'svc-beaute-bien-etre', 7);
SELECT public._seed_svc_category('svc-nutrition-bien-etre', 'Nutrition & bien-être', NULL, 'Apple', 'svc-beaute-bien-etre', 8);
SELECT public._seed_svc_category('svc-beaute-domicile', 'Services beauté à domicile', NULL, 'Home', 'svc-beaute-bien-etre', 9);

-- 10. Transport & Automobile
SELECT public._seed_svc_category('svc-livraison', 'Livraison', NULL, 'Package', 'svc-transport-automobile', 1);
SELECT public._seed_svc_category('svc-transport-personnes', 'Transport de personnes', NULL, 'Users', 'svc-transport-automobile', 2);
SELECT public._seed_svc_category('svc-location-vehicules', 'Location de véhicules', NULL, 'Car', 'svc-transport-automobile', 3);
SELECT public._seed_svc_category('svc-chauffeur-prive', 'Chauffeur privé', NULL, 'Car', 'svc-transport-automobile', 4);
SELECT public._seed_svc_category('svc-entretien-automobile', 'Entretien automobile', NULL, 'Wrench', 'svc-transport-automobile', 5);
SELECT public._seed_svc_category('svc-reparation-automobile', 'Réparation automobile', NULL, 'Wrench', 'svc-transport-automobile', 6);
SELECT public._seed_svc_category('svc-diagnostic-automobile', 'Diagnostic automobile', NULL, 'Search', 'svc-transport-automobile', 7);
SELECT public._seed_svc_category('svc-lavage-automobile', 'Lavage automobile', NULL, 'Droplets', 'svc-transport-automobile', 8);
SELECT public._seed_svc_category('svc-assistance-routiere', 'Assistance routière', NULL, 'LifeBuoy', 'svc-transport-automobile', 9);

-- 11. Événementiel
SELECT public._seed_svc_category('svc-organisation-evenements', 'Organisation d''événements', NULL, 'Calendar', 'svc-evenementiel', 1);
SELECT public._seed_svc_category('svc-decoration-evenementielle', 'Décoration', NULL, 'Sparkles', 'svc-evenementiel', 2);
SELECT public._seed_svc_category('svc-traiteur', 'Traiteur', NULL, 'Utensils', 'svc-evenementiel', 3);
SELECT public._seed_svc_category('svc-photo-evenementielle', 'Photographie événementielle', NULL, 'Camera', 'svc-evenementiel', 4);
SELECT public._seed_svc_category('svc-video-evenementielle', 'Vidéo événementielle', NULL, 'Video', 'svc-evenementiel', 5);
SELECT public._seed_svc_category('svc-dj-animation', 'DJ & animation', NULL, 'Music', 'svc-evenementiel', 6);
SELECT public._seed_svc_category('svc-location-materiel', 'Location de matériel', NULL, 'Package', 'svc-evenementiel', 7);
SELECT public._seed_svc_category('svc-sonorisation', 'Sonorisation', NULL, 'Volume2', 'svc-evenementiel', 8);
SELECT public._seed_svc_category('svc-invitations-papeterie', 'Invitations & papeterie', NULL, 'Mail', 'svc-evenementiel', 9);

-- 12. Juridique & Administratif
SELECT public._seed_svc_category('svc-consultation-juridique', 'Consultation juridique', NULL, 'Scale', 'svc-juridique-administratif', 1);
SELECT public._seed_svc_category('svc-redaction-contrats', 'Rédaction de contrats', NULL, 'FileText', 'svc-juridique-administratif', 2);
SELECT public._seed_svc_category('svc-creation-societes', 'Création de sociétés', NULL, 'Building2', 'svc-juridique-administratif', 3);
SELECT public._seed_svc_category('svc-formalites-administratives', 'Formalités administratives', NULL, 'Folder', 'svc-juridique-administratif', 4);
SELECT public._seed_svc_category('svc-propriete-intellectuelle', 'Propriété intellectuelle', NULL, 'Shield', 'svc-juridique-administratif', 5);
SELECT public._seed_svc_category('svc-droit-affaires', 'Droit des affaires', NULL, 'Briefcase', 'svc-juridique-administratif', 6);
SELECT public._seed_svc_category('svc-mediation', 'Médiation', NULL, 'Users', 'svc-juridique-administratif', 7);
SELECT public._seed_svc_category('svc-assistance-juridique', 'Assistance juridique', NULL, 'Scale', 'svc-juridique-administratif', 8);

DROP FUNCTION IF EXISTS public._seed_svc_category(text, text, text, text, text, integer);

-- 4) Soft-map legacy products.category text → leaf category_id (no overwrite)
WITH legacy_map(old_value, new_slug) AS (
  VALUES
    ('consultation', 'svc-consultation-juridique'),
    ('coaching', 'svc-coaching-professionnel'),
    ('design', 'svc-design-graphique'),
    ('developpement', 'svc-developpement-web'),
    ('marketing', 'svc-marketing-digital'),
    ('redaction', 'svc-redaction-web'),
    ('traduction', 'svc-traduction'),
    ('maintenance', 'svc-maintenance-informatique'),
    ('formation', 'svc-formation-informatique'),
    ('conseil', 'svc-consultation-juridique'),
    ('graphisme', 'svc-design-graphique'),
    ('ui-ux', 'svc-ui-ux-design'),
    ('illustration', 'svc-illustration'),
    ('animation', 'svc-animation-2d-3d'),
    ('video', 'svc-montage-video'),
    ('photographie', 'svc-photographie'),
    ('audio', 'svc-voix-off'),
    ('voix-off', 'svc-voix-off'),
    ('podcast', 'svc-voix-off'),
    ('social', 'svc-gestion-reseaux-sociaux'),
    ('seo', 'svc-seo'),
    ('data', 'svc-bases-de-donnees'),
    ('cloud', 'svc-hebergement-serveurs'),
    ('securite', 'svc-cybersecurite'),
    ('support', 'svc-support-technique')
)
UPDATE public.products p
SET
  category_id = c.id,
  category = c.slug,
  updated_at = now()
FROM legacy_map m
JOIN public.categories c ON c.slug = m.new_slug
WHERE p.product_type = 'service'
  AND p.category_id IS NULL
  AND p.category IS NOT NULL
  AND lower(trim(p.category)) = m.old_value;

-- 5) Patch create_service_product_tx: persist category text + fulfillment_mode
CREATE OR REPLACE FUNCTION public.create_service_product_tx(
  p_store_id UUID,
  p_product JSONB,
  p_service JSONB,
  p_staff JSONB DEFAULT '[]'::jsonb,
  p_slots JSONB DEFAULT '[]'::jsonb,
  p_resources JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_service_id UUID;
  v_item JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  INSERT INTO public.products (
    store_id, name, slug, description, price, currency, promotional_price,
    pricing_model, product_type, category, category_id, image_url, images,
    meta_title, meta_description, og_image, faqs, payment_options,
    tags, is_draft, is_active
  ) VALUES (
    p_store_id,
    p_product->>'name',
    p_product->>'slug',
    COALESCE(p_product->>'description', ''),
    COALESCE((p_product->>'price')::NUMERIC, 0),
    COALESCE(p_product->>'currency', 'XOF'),
    NULLIF(p_product->>'promotional_price', '')::NUMERIC,
    COALESCE(p_product->>'pricing_model', 'one-time')::pricing_model,
    'service',
    p_product->>'category',
    NULLIF(p_product->>'category_id', '')::UUID,
    p_product->>'image_url',
    COALESCE(p_product->'images', '[]'::jsonb),
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'og_image',
    COALESCE(p_product->'faqs', '[]'::jsonb),
    COALESCE(p_product->'payment_options', '{"payment_type":"full","percentage_rate":30}'::jsonb),
    CASE
      WHEN jsonb_typeof(p_product->'tags') = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(p_product->'tags'))
      ELSE '{}'::text[]
    END,
    COALESCE((p_product->>'is_draft')::BOOLEAN, false),
    COALESCE((p_product->>'is_active')::BOOLEAN, true)
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.service_products (
    product_id, service_type, duration_minutes, location_type, location_address,
    meeting_url, timezone, requires_staff, max_participants, pricing_type,
    deposit_required, deposit_amount, deposit_type, allow_booking_cancellation,
    cancellation_deadline_hours, require_approval, buffer_time_before,
    buffer_time_after, max_bookings_per_day, advance_booking_days,
    fulfillment_mode
  ) VALUES (
    v_product_id,
    COALESCE(p_service->>'service_type', 'appointment'),
    COALESCE((p_service->>'duration_minutes')::INTEGER, 60),
    COALESCE(p_service->>'location_type', 'on_site'),
    p_service->>'location_address',
    p_service->>'meeting_url',
    COALESCE(p_service->>'timezone', 'UTC'),
    COALESCE((p_service->>'requires_staff')::BOOLEAN, true),
    COALESCE((p_service->>'max_participants')::INTEGER, 1),
    COALESCE(p_service->>'pricing_type', 'fixed'),
    COALESCE((p_service->>'deposit_required')::BOOLEAN, false),
    NULLIF(p_service->>'deposit_amount', '')::NUMERIC,
    p_service->>'deposit_type',
    COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, true),
    COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, 24),
    COALESCE((p_service->>'require_approval')::BOOLEAN, false),
    COALESCE((p_service->>'buffer_time_before')::INTEGER, 0),
    COALESCE((p_service->>'buffer_time_after')::INTEGER, 0),
    NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER,
    COALESCE((p_service->>'advance_booking_days')::INTEGER, 30),
    COALESCE(NULLIF(p_service->>'fulfillment_mode', ''), 'appointment')
  )
  RETURNING id INTO v_service_id;

  IF jsonb_array_length(COALESCE(p_staff, '[]'::jsonb)) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_staff)
    LOOP
      INSERT INTO public.service_staff_members (
        service_product_id, store_id, name, role, bio, email, phone, avatar_url, is_active
      ) VALUES (
        v_service_id,
        p_store_id,
        v_item->>'name',
        v_item->>'role',
        v_item->>'bio',
        v_item->>'email',
        v_item->>'phone',
        v_item->>'avatar_url',
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  IF jsonb_array_length(COALESCE(p_slots, '[]'::jsonb)) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots)
    LOOP
      INSERT INTO public.service_availability_slots (
        service_product_id, day_of_week, start_time, end_time
      ) VALUES (
        v_service_id,
        COALESCE((v_item->>'day')::INTEGER, (v_item->>'day_of_week')::INTEGER),
        (v_item->>'start_time')::time,
        (v_item->>'end_time')::time
      );
    END LOOP;
  END IF;

  IF jsonb_array_length(COALESCE(p_resources, '[]'::jsonb)) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_resources)
    LOOP
      INSERT INTO public.service_resources (
        service_product_id, name, resource_type, quantity, is_required
      ) VALUES (
        v_service_id,
        v_item->>'name',
        COALESCE(v_item->>'resource_type', 'other'),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE((v_item->>'is_required')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'service_product_id', v_service_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_product_tx(UUID, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;

-- 6) Patch update_service_product_tx: category text + fulfillment_mode
CREATE OR REPLACE FUNCTION public.update_service_product_tx(
  p_store_id UUID,
  p_product_id UUID,
  p_product JSONB,
  p_service JSONB,
  p_staff JSONB DEFAULT '[]'::jsonb,
  p_slots JSONB DEFAULT '[]'::jsonb,
  p_resources JSONB DEFAULT '[]'::jsonb,
  p_affiliate JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_id UUID;
  v_item JSONB;
BEGIN
  IF NOT public.user_owns_store(p_store_id) THEN
    RAISE EXCEPTION 'Accès refusé à cette boutique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND product_type = 'service'
  ) THEN
    RAISE EXCEPTION 'Service introuvable';
  END IF;

  UPDATE public.products SET
    name = COALESCE(p_product->>'name', name),
    slug = COALESCE(p_product->>'slug', slug),
    description = COALESCE(p_product->>'description', description),
    short_description = COALESCE(p_product->>'short_description', short_description),
    price = COALESCE((p_product->>'price')::NUMERIC, price),
    promotional_price = CASE WHEN p_product ? 'promotional_price' THEN NULLIF(p_product->>'promotional_price', '')::NUMERIC ELSE promotional_price END,
    currency = COALESCE(p_product->>'currency', currency),
    pricing_model = COALESCE(p_product->>'pricing_model', pricing_model::text)::pricing_model,
    category = CASE WHEN p_product ? 'category' THEN p_product->>'category' ELSE category END,
    category_id = CASE WHEN p_product ? 'category_id' THEN NULLIF(p_product->>'category_id', '')::UUID ELSE category_id END,
    image_url = COALESCE(p_product->>'image_url', image_url),
    images = COALESCE(p_product->'images', images),
    tags = CASE
      WHEN p_product ? 'tags' AND jsonb_typeof(p_product->'tags') = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(p_product->'tags'))
      ELSE tags
    END,
    meta_title = COALESCE(p_product->>'meta_title', meta_title),
    meta_description = COALESCE(p_product->>'meta_description', meta_description),
    og_image = COALESCE(p_product->>'og_image', og_image),
    faqs = COALESCE(p_product->'faqs', faqs),
    payment_options = COALESCE(p_product->'payment_options', payment_options),
    hide_purchase_count = COALESCE((p_product->>'hide_purchase_count')::BOOLEAN, hide_purchase_count),
    hide_likes_count = COALESCE((p_product->>'hide_likes_count')::BOOLEAN, hide_likes_count),
    hide_recommendations_count = COALESCE((p_product->>'hide_recommendations_count')::BOOLEAN, hide_recommendations_count),
    hide_downloads_count = COALESCE((p_product->>'hide_downloads_count')::BOOLEAN, hide_downloads_count),
    hide_reviews_count = COALESCE((p_product->>'hide_reviews_count')::BOOLEAN, hide_reviews_count),
    hide_rating = COALESCE((p_product->>'hide_rating')::BOOLEAN, hide_rating),
    is_active = COALESCE((p_product->>'is_active')::BOOLEAN, is_active),
    updated_at = now()
  WHERE id = p_product_id;

  SELECT id INTO v_service_id FROM public.service_products WHERE product_id = p_product_id LIMIT 1;

  IF v_service_id IS NULL THEN
    INSERT INTO public.service_products (
      product_id, service_type, duration_minutes, location_type, location_address,
      meeting_url, timezone, requires_staff, max_participants, pricing_type,
      deposit_required, deposit_amount, deposit_type, allow_booking_cancellation,
      cancellation_deadline_hours, require_approval, buffer_time_before,
      buffer_time_after, max_bookings_per_day, advance_booking_days,
      fulfillment_mode
    ) VALUES (
      p_product_id,
      COALESCE(p_service->>'service_type', 'appointment'),
      COALESCE((p_service->>'duration_minutes')::INTEGER, 60),
      COALESCE(p_service->>'location_type', 'on_site'),
      p_service->>'location_address',
      p_service->>'meeting_url',
      COALESCE(p_service->>'timezone', 'UTC'),
      COALESCE((p_service->>'requires_staff')::BOOLEAN, true),
      COALESCE((p_service->>'max_participants')::INTEGER, 1),
      COALESCE(p_service->>'pricing_type', 'fixed'),
      COALESCE((p_service->>'deposit_required')::BOOLEAN, false),
      NULLIF(p_service->>'deposit_amount', '')::NUMERIC,
      p_service->>'deposit_type',
      COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, true),
      COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, 24),
      COALESCE((p_service->>'require_approval')::BOOLEAN, false),
      COALESCE((p_service->>'buffer_time_before')::INTEGER, 0),
      COALESCE((p_service->>'buffer_time_after')::INTEGER, 0),
      NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER,
      COALESCE((p_service->>'advance_booking_days')::INTEGER, 30),
      COALESCE(NULLIF(p_service->>'fulfillment_mode', ''), 'appointment')
    )
    RETURNING id INTO v_service_id;
  ELSE
    UPDATE public.service_products SET
      service_type = COALESCE(p_service->>'service_type', service_type),
      duration_minutes = COALESCE((p_service->>'duration_minutes')::INTEGER, duration_minutes),
      location_type = COALESCE(p_service->>'location_type', location_type),
      location_address = COALESCE(p_service->>'location_address', location_address),
      meeting_url = COALESCE(p_service->>'meeting_url', meeting_url),
      timezone = COALESCE(p_service->>'timezone', timezone),
      requires_staff = COALESCE((p_service->>'requires_staff')::BOOLEAN, requires_staff),
      max_participants = COALESCE((p_service->>'max_participants')::INTEGER, max_participants),
      pricing_type = COALESCE(p_service->>'pricing_type', pricing_type),
      deposit_required = COALESCE((p_service->>'deposit_required')::BOOLEAN, deposit_required),
      deposit_amount = CASE WHEN p_service ? 'deposit_amount' THEN NULLIF(p_service->>'deposit_amount', '')::NUMERIC ELSE deposit_amount END,
      deposit_type = COALESCE(p_service->>'deposit_type', deposit_type),
      allow_booking_cancellation = COALESCE((p_service->>'allow_booking_cancellation')::BOOLEAN, allow_booking_cancellation),
      cancellation_deadline_hours = COALESCE((p_service->>'cancellation_deadline_hours')::INTEGER, cancellation_deadline_hours),
      require_approval = COALESCE((p_service->>'require_approval')::BOOLEAN, require_approval),
      buffer_time_before = COALESCE((p_service->>'buffer_time_before')::INTEGER, buffer_time_before),
      buffer_time_after = COALESCE((p_service->>'buffer_time_after')::INTEGER, buffer_time_after),
      max_bookings_per_day = CASE WHEN p_service ? 'max_bookings_per_day' THEN NULLIF(p_service->>'max_bookings_per_day', '')::INTEGER ELSE max_bookings_per_day END,
      advance_booking_days = COALESCE((p_service->>'advance_booking_days')::INTEGER, advance_booking_days),
      fulfillment_mode = COALESCE(NULLIF(p_service->>'fulfillment_mode', ''), fulfillment_mode),
      updated_at = now()
    WHERE id = v_service_id;
  END IF;

  -- Replace staff/slots/resources when arrays provided (same behavior as prior migration)
  IF p_staff IS NOT NULL AND jsonb_typeof(p_staff) = 'array' THEN
    DELETE FROM public.service_staff_members WHERE service_product_id = v_service_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_staff)
    LOOP
      INSERT INTO public.service_staff_members (
        service_product_id, store_id, name, role, bio, email, phone, avatar_url, is_active
      ) VALUES (
        v_service_id, p_store_id, v_item->>'name', v_item->>'role', v_item->>'bio',
        v_item->>'email', v_item->>'phone', v_item->>'avatar_url',
        COALESCE((v_item->>'is_active')::BOOLEAN, true)
      );
    END LOOP;
  END IF;

  IF p_slots IS NOT NULL AND jsonb_typeof(p_slots) = 'array' THEN
    DELETE FROM public.service_availability_slots WHERE service_product_id = v_service_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots)
    LOOP
      INSERT INTO public.service_availability_slots (
        service_product_id, day_of_week, start_time, end_time
      ) VALUES (
        v_service_id,
        COALESCE((v_item->>'day')::INTEGER, (v_item->>'day_of_week')::INTEGER),
        (v_item->>'start_time')::time,
        (v_item->>'end_time')::time
      );
    END LOOP;
  END IF;

  IF p_resources IS NOT NULL AND jsonb_typeof(p_resources) = 'array' THEN
    DELETE FROM public.service_resources WHERE service_product_id = v_service_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_resources)
    LOOP
      INSERT INTO public.service_resources (
        service_product_id, name, resource_type, quantity, is_required
      ) VALUES (
        v_service_id,
        v_item->>'name',
        COALESCE(v_item->>'resource_type', 'other'),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE((v_item->>'is_required')::BOOLEAN, false)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'service_product_id', v_service_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_service_product_tx(UUID, UUID, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;

-- 7) filter_service_products: category_id / parent_category_id + safe column mapping
DROP FUNCTION IF EXISTS public.filter_service_products(
  integer, integer, text, numeric, numeric, numeric, text, text, boolean, text, text
);

CREATE OR REPLACE FUNCTION public.filter_service_products(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_location_type TEXT DEFAULT NULL,
  p_calendar_available BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_category_id UUID DEFAULT NULL,
  p_parent_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  store_id UUID,
  is_active BOOLEAN,
  is_draft BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  service_type TEXT,
  location_type TEXT,
  calendar_available BOOLEAN,
  booking_required BOOLEAN,
  duration INTEGER,
  duration_unit TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.image_url,
    p.price,
    p.promotional_price,
    p.currency,
    p.category,
    p.product_type,
    p.rating,
    p.reviews_count,
    0::integer AS purchases_count,
    p.store_id,
    p.is_active,
    p.is_draft,
    p.created_at,
    p.updated_at,
    p.tags,
    s.name AS store_name,
    s.slug AS store_slug,
    sa.logo_url AS store_logo_url,
    sp.service_type,
    sp.location_type,
    EXISTS (
      SELECT 1 FROM public.service_availability_slots sas
      WHERE sas.service_product_id = sp.id
    ) AS calendar_available,
    true AS booking_required,
    sp.duration_minutes AS duration,
    'minutes'::text AS duration_unit
  FROM public.products p
  INNER JOIN public.stores s ON s.id = p.store_id
  LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
  LEFT JOIN public.service_products sp ON sp.product_id = p.id
  LEFT JOIN public.categories cat ON cat.id = p.category_id
  WHERE p.is_active = true
    AND p.is_draft = false
    AND p.product_type = 'service'
    AND (
      p_category IS NULL
      OR p.category = p_category
      OR cat.slug = p_category
    )
    AND (
      p_category_id IS NULL
      OR p.category_id = p_category_id
    )
    AND (
      p_parent_category_id IS NULL
      OR cat.parent_id = p_parent_category_id
      OR p.category_id = p_parent_category_id
    )
    AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
    AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (p_service_type IS NULL OR sp.service_type = p_service_type)
    AND (p_location_type IS NULL OR sp.location_type = p_location_type)
    AND (
      p_calendar_available IS NULL
      OR (
        p_calendar_available = EXISTS (
          SELECT 1 FROM public.service_availability_slots sas2
          WHERE sas2.service_product_id = sp.id
        )
      )
    )
  ORDER BY
    CASE
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN -p.price
    END NULLS LAST,
    CASE
      WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN p.rating
      WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN -p.rating
    END NULLS LAST,
    CASE
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM p.created_at)
    END NULLS LAST,
    CASE
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'asc' THEN 0
      WHEN p_sort_by = 'purchases' AND p_sort_order = 'desc' THEN 0
    END NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.filter_service_products(
  integer, integer, text, numeric, numeric, numeric, text, text, boolean, text, text, uuid, uuid
) TO anon, authenticated, service_role;
