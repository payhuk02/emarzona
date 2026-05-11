-- Correction définitive de la fonction generate_referral_code
-- Cette migration corrige le problème de référence circulaire

-- Supprimer l'ancienne fonction défaillante
DROP FUNCTION IF EXISTS generate_referral_code();

-- Créer la nouvelle fonction corrigée
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        attempts := attempts + 1;
        
        -- Générer un code de 8 caractères alphanumériques en majuscules
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
        
        -- Vérifier si le code existe déjà dans la table profiles
        -- Utiliser une variable locale pour éviter la référence circulaire
        SELECT EXISTS(
            SELECT 1 FROM profiles 
            WHERE profiles.referral_code = new_code
        ) INTO code_exists;
        
        -- Si le code n'existe pas, on peut l'utiliser
        EXIT WHEN NOT code_exists;
        
        -- Sécurité pour éviter les boucles infinies
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Impossible de générer un code de référencement unique après % tentatives', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION generate_referral_code() IS 'Génère un code de parrainage unique de 8 caractères alphanumériques';

-- Tester la fonction (optionnel)
-- SELECT generate_referral_code() as test_code;
