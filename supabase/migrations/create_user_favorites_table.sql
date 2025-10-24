-- ================================================================
-- Table user_favorites : Favoris utilisateurs synchronisés
-- ================================================================
-- Permet aux utilisateurs de sauvegarder leurs produits favoris
-- Synchronisation multi-appareils et multi-navigateurs
-- ================================================================

-- Créer la table user_favorites
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contrainte unique : un utilisateur ne peut ajouter un produit qu'une fois
  CONSTRAINT unique_user_product_favorite UNIQUE (user_id, product_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON public.user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_user_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_user_favorites_updated_at ON public.user_favorites;
CREATE TRIGGER trigger_update_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_favorites_updated_at();

-- ================================================================
-- Row Level Security (RLS)
-- ================================================================

-- Activer RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Politique: Utilisateurs peuvent voir uniquement leurs propres favoris
CREATE POLICY "user_favorites_select_own"
ON public.user_favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politique: Utilisateurs peuvent ajouter uniquement à leurs propres favoris
CREATE POLICY "user_favorites_insert_own"
ON public.user_favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Politique: Utilisateurs peuvent supprimer uniquement de leurs propres favoris
CREATE POLICY "user_favorites_delete_own"
ON public.user_favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Politique: Pas de mise à jour (les favoris sont ajoutés ou supprimés, pas modifiés)
-- Si besoin de mettre à jour à l'avenir, décommenter :
-- CREATE POLICY "user_favorites_update_own"
-- ON public.user_favorites
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- Fonction helper : Compter les favoris d'un utilisateur
-- ================================================================

CREATE OR REPLACE FUNCTION public.count_user_favorites(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.user_favorites
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Fonction helper : Vérifier si un produit est en favori
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_product_favorited(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_favorites
    WHERE user_id = p_user_id AND product_id = p_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Vue pour les produits favoris avec détails
-- ================================================================

CREATE OR REPLACE VIEW public.user_favorites_with_details AS
SELECT 
  uf.id,
  uf.user_id,
  uf.product_id,
  uf.created_at,
  uf.updated_at,
  p.name AS product_name,
  p.slug AS product_slug,
  p.price,
  p.promotional_price,
  p.currency,
  p.image_url,
  p.category,
  p.rating,
  p.reviews_count,
  s.id AS store_id,
  s.name AS store_name,
  s.slug AS store_slug,
  s.logo_url AS store_logo
FROM public.user_favorites uf
INNER JOIN public.products p ON uf.product_id = p.id
INNER JOIN public.stores s ON p.store_id = s.id
WHERE p.is_active = true AND p.is_draft = false;

-- RLS pour la vue (hérite des permissions de la table)
ALTER VIEW public.user_favorites_with_details SET (security_invoker = true);

-- ================================================================
-- Commentaires pour la documentation
-- ================================================================

COMMENT ON TABLE public.user_favorites IS 'Favoris des utilisateurs pour les produits du marketplace';
COMMENT ON COLUMN public.user_favorites.user_id IS 'Référence vers l''utilisateur authentifié';
COMMENT ON COLUMN public.user_favorites.product_id IS 'Référence vers le produit favori';
COMMENT ON FUNCTION public.count_user_favorites(UUID) IS 'Compte le nombre total de favoris d''un utilisateur';
COMMENT ON FUNCTION public.is_product_favorited(UUID, UUID) IS 'Vérifie si un produit est dans les favoris d''un utilisateur';

-- ================================================================
-- Migration des données depuis localStorage (optionnel)
-- ================================================================
-- Cette partie sera gérée côté frontend lors de la première connexion
-- Le frontend détectera les favoris localStorage et les migrera vers la BDD

-- ================================================================
-- Test de la table (à exécuter manuellement pour validation)
-- ================================================================
-- INSERT INTO public.user_favorites (user_id, product_id) VALUES ('USER_UUID_HERE', 'PRODUCT_UUID_HERE');
-- SELECT * FROM public.user_favorites_with_details WHERE user_id = 'USER_UUID_HERE';
-- SELECT public.count_user_favorites('USER_UUID_HERE');
-- SELECT public.is_product_favorited('USER_UUID_HERE', 'PRODUCT_UUID_HERE');

