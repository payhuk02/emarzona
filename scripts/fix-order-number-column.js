// Script pour ajouter la colonne order_number manquante
// Ce script affiche le SQL à exécuter dans Supabase

console.log('🔧 Script de correction de la colonne order_number manquante\n');

console.log('📋 Instructions:');
console.log('1. Ouvrez votre projet Supabase: https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb');
console.log('2. Allez dans SQL Editor');
console.log('3. Copiez et exécutez le SQL ci-dessous\n');

console.log('='.repeat(80));
console.log('SQL À EXÉCUTER DANS SUPABASE:');
console.log('='.repeat(80));

const sql = `
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
`;

console.log(sql);

console.log('='.repeat(80));
console.log('📝 Explication de la correction:');
console.log('='.repeat(80));

console.log(`
🔧 Problème identifié:
   - La colonne 'order_number' manque dans la table 'orders'
   - Cette colonne est référencée dans le code mais n'existe pas en base

✅ Solution appliquée:
   1. Ajout de la colonne 'order_number' avec contrainte UNIQUE
   2. Création d'un index pour les performances
   3. Fonction 'generate_order_number()' pour générer des numéros uniques
   4. Trigger automatique pour remplir la colonne lors des insertions
   5. Mise à jour des commandes existantes

🎯 Format des numéros de commande:
   - Format: ORD-YYYYMMDD-XXXX
   - Exemple: ORD-20250118-0001, ORD-20250118-0002, etc.
   - Génération automatique et unique

📋 Après exécution:
   1. La colonne order_number sera ajoutée à la table orders
   2. Les commandes existantes auront un numéro généré automatiquement
   3. Les nouvelles commandes auront un numéro généré automatiquement
   4. L'erreur "column orders.order_number does not exist" sera résolue
`);

console.log('\n🎉 Une fois le SQL exécuté, l\'erreur sera corrigée !');
