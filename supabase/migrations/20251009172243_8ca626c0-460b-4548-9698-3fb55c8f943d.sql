-- Créer la table des catégories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut voir les catégories actives
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

-- Politique : Les admins peuvent gérer les catégories
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter une colonne category_id à products (FK vers categories)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Trigger pour updated_at sur categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Activer Realtime sur products pour mise à jour automatique
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Insérer quelques catégories par défaut
INSERT INTO public.categories (name, slug, description) VALUES
  ('Formations', 'formations', 'Cours et formations en ligne'),
  ('Ebooks', 'ebooks', 'Livres numériques et guides'),
  ('Templates', 'templates', 'Templates et modèles prêts à l''emploi'),
  ('Logiciels', 'logiciels', 'Applications et outils digitaux'),
  ('Services', 'services', 'Prestations de services'),
  ('Graphisme', 'graphisme', 'Designs et ressources graphiques')
ON CONFLICT (slug) DO NOTHING;