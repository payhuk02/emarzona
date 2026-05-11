-- Migration pour créer les fonctions manquantes
-- generate_order_number et generate_referral_code

-- Créer une séquence pour les numéros de commande si elle n'existe pas
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    -- Générer un numéro au format: ORD-YYYYMMDD-XXXX
    order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    referral_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code de 8 caractères alphanumériques en majuscules
        referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
        
        -- Vérifier si le code existe déjà dans la table profiles
        SELECT EXISTS(
            SELECT 1 FROM profiles 
            WHERE referral_code = generate_referral_code.referral_code
        ) INTO code_exists;
        
        -- Si le code n'existe pas, on peut l'utiliser
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN referral_code;
END;
$$ LANGUAGE plpgsql;

-- Ajouter des commentaires pour la documentation
COMMENT ON FUNCTION generate_order_number() IS 'Génère un numéro de commande unique au format ORD-YYYYMMDD-XXXX';
COMMENT ON FUNCTION generate_referral_code() IS 'Génère un code de parrainage unique de 8 caractères alphanumériques';

-- Tester les fonctions (optionnel - peut être supprimé après vérification)
-- SELECT generate_order_number() as test_order_number;
-- SELECT generate_referral_code() as test_referral_code;
