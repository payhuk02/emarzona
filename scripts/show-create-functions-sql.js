// Script pour créer les fonctions manquantes dans Supabase
// Ce script affiche le SQL à exécuter dans l'interface Supabase

console.log('🚀 Script de création des fonctions Supabase manquantes\n');

console.log('📋 Instructions:');
console.log('1. Ouvrez votre projet Supabase: https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb');
console.log('2. Allez dans SQL Editor');
console.log('3. Copiez et exécutez le SQL ci-dessous\n');

console.log('='.repeat(80));
console.log('SQL À EXÉCUTER DANS SUPABASE:');
console.log('='.repeat(80));

const sql = `
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

-- Test des fonctions (optionnel)
SELECT generate_order_number() as test_order_number;
SELECT generate_referral_code() as test_referral_code;
`;

console.log(sql);

console.log('='.repeat(80));
console.log('📝 Explication des fonctions:');
console.log('='.repeat(80));

console.log(`
🔢 generate_order_number():
   - Génère un numéro de commande unique
   - Format: ORD-YYYYMMDD-XXXX (ex: ORD-20250110-0001)
   - Utilise une séquence pour garantir l'unicité

🎯 generate_referral_code():
   - Génère un code de parrainage unique de 8 caractères
   - Format: 8 caractères alphanumériques en majuscules (ex: A1B2C3D4)
   - Vérifie l'unicité dans la table profiles
   - Génère un nouveau code si collision détectée

📋 Après exécution:
   1. Les fonctions seront disponibles dans votre base de données
   2. Vous pourrez les utiliser dans vos requêtes SQL
   3. Elles seront automatiquement détectées par le script de vérification
`);

console.log('\n🎉 Une fois le SQL exécuté, relancez le script de vérification pour confirmer !');
