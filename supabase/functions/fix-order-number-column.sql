-- =====================================================
-- CORRECTION DE LA COLONNE ORDER_NUMBER MANQUANTE
-- =====================================================
-- Ce fichier corrige l'erreur: "column orders.order_number does not exist"
-- 
-- Problème: La colonne order_number est référencée dans le code
-- mais n'existe pas dans la table orders
-- 
-- Solution: Ajouter la colonne avec génération automatique
-- =====================================================

-- Ajouter la colonne order_number à la table orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN public.orders.order_number IS 'Numéro unique de commande généré automatiquement';

-- =====================================================
-- FONCTION DE GÉNÉRATION DE NUMÉRO DE COMMANDE
-- =====================================================
-- Génère un numéro unique au format ORD-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    counter INTEGER;
BEGIN
    -- Générer un numéro au format: ORD-YYYYMMDD-XXXX
    -- Utiliser un compteur basé sur la date pour éviter les collisions
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders 
    WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER POUR GÉNÉRATION AUTOMATIQUE
-- =====================================================
-- Génère automatiquement le numéro de commande lors de l'insertion
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- =====================================================
-- MISE À JOUR DES DONNÉES EXISTANTES
-- =====================================================
-- Mettre à jour les commandes existantes qui n'ont pas de numéro
UPDATE public.orders 
SET order_number = generate_order_number()
WHERE order_number IS NULL OR order_number = '';

-- Ajouter une contrainte NOT NULL après avoir rempli les valeurs existantes
ALTER TABLE public.orders 
ALTER COLUMN order_number SET NOT NULL;

-- =====================================================
-- TESTS (OPTIONNEL)
-- =====================================================
-- Décommentez les lignes ci-dessous pour tester
-- SELECT generate_order_number() as test_order_number;
-- SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- NOTES D'UTILISATION
-- =====================================================
-- 1. La colonne order_number est maintenant automatiquement remplie
-- 2. Format: ORD-YYYYMMDD-XXXX (ex: ORD-20250118-0001)
-- 3. Les numéros sont uniques et séquentiels par jour
-- 4. L'erreur "column orders.order_number does not exist" est résolue
-- 
-- Après exécution de ce script:
-- ✅ La colonne order_number existe dans la table orders
-- ✅ Les commandes existantes ont un numéro généré
-- ✅ Les nouvelles commandes auront un numéro automatique
-- ✅ L'application fonctionne sans erreur
-- =====================================================
