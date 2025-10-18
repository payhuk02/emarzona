-- =====================================================
-- CRÉATION DES FONCTIONS MANQUANTES POUR PAYHUK
-- =====================================================
-- Ce fichier contient les fonctions manquantes détectées
-- lors de la vérification de la base de données Supabase
-- 
-- Fonctions à créer:
-- 1. generate_order_number() - Génère un numéro de commande unique
-- 2. generate_referral_code() - Génère un code de parrainage unique
-- =====================================================

-- Créer une séquence pour les numéros de commande si elle n'existe pas
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- =====================================================
-- FONCTION 1: generate_order_number()
-- =====================================================
-- Génère un numéro de commande unique au format ORD-YYYYMMDD-XXXX
-- Exemple: ORD-20250110-0001, ORD-20250110-0002, etc.
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

-- =====================================================
-- FONCTION 2: generate_referral_code()
-- =====================================================
-- Génère un code de parrainage unique de 8 caractères alphanumériques
-- Vérifie l'unicité dans la table profiles
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

-- =====================================================
-- DOCUMENTATION DES FONCTIONS
-- =====================================================
COMMENT ON FUNCTION generate_order_number() IS 'Génère un numéro de commande unique au format ORD-YYYYMMDD-XXXX';
COMMENT ON FUNCTION generate_referral_code() IS 'Génère un code de parrainage unique de 8 caractères alphanumériques';

-- =====================================================
-- TESTS DES FONCTIONS (OPTIONNEL)
-- =====================================================
-- Décommentez les lignes ci-dessous pour tester les fonctions
-- SELECT generate_order_number() as test_order_number;
-- SELECT generate_referral_code() as test_referral_code;

-- =====================================================
-- NOTES D'UTILISATION
-- =====================================================
-- 1. generate_order_number() peut être utilisée dans les triggers
--    ou lors de la création de nouvelles commandes
-- 
-- 2. generate_referral_code() peut être utilisée lors de la création
--    de nouveaux profils utilisateur pour générer leur code de parrainage
-- 
-- 3. Les deux fonctions garantissent l'unicité des valeurs générées
-- 
-- 4. Après exécution de ce script, relancez le script de vérification
--    pour confirmer que les fonctions sont correctement créées
-- =====================================================
