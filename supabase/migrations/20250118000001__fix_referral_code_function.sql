-- Correction de la fonction generate_referral_code
-- Le problème était dans la référence à la fonction dans la requête

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
            WHERE profiles.referral_code = generate_referral_code.referral_code
        ) INTO code_exists;
        
        -- Si le code n'existe pas, on peut l'utiliser
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN referral_code;
END;
$$ LANGUAGE plpgsql;

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION generate_referral_code() IS 'Génère un code de parrainage unique de 8 caractères alphanumériques';
