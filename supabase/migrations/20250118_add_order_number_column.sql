-- Migration pour ajouter la colonne order_number à la table orders
-- Cette colonne est nécessaire pour le système de numérotation des commandes

-- Ajouter la colonne order_number à la table orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN public.orders.order_number IS 'Numéro unique de commande généré automatiquement';

-- Fonction pour générer automatiquement le numéro de commande
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

-- Trigger pour générer automatiquement le numéro de commande
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

-- Mettre à jour les commandes existantes qui n'ont pas de numéro
UPDATE public.orders 
SET order_number = generate_order_number()
WHERE order_number IS NULL OR order_number = '';

-- Ajouter une contrainte NOT NULL après avoir rempli les valeurs existantes
ALTER TABLE public.orders 
ALTER COLUMN order_number SET NOT NULL;
