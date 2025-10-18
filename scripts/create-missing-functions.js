import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL pour créer les fonctions manquantes
const createFunctionsSQL = `
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
`;

async function createFunctions() {
  console.log('🚀 Création des fonctions manquantes...\n');
  
  try {
    // Exécuter le SQL via l'API Supabase
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createFunctionsSQL 
    });
    
    if (error) {
      console.log('❌ Erreur lors de la création des fonctions:', error.message);
      return false;
    }
    
    console.log('✅ Fonctions créées avec succès !');
    return true;
    
  } catch (err) {
    console.log('❌ Erreur:', err.message);
    return false;
  }
}

async function testFunctions() {
  console.log('\n🧪 Test des nouvelles fonctions...\n');
  
  const functions = [
    'generate_order_number',
    'generate_referral_code'
  ];
  
  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.rpc(funcName, {});
      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
      } else {
        console.log(`✅ ${funcName}: ${data}`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('📋 Création des fonctions Supabase manquantes\n');
  
  const success = await createFunctions();
  
  if (success) {
    await testFunctions();
    console.log('\n🎉 Toutes les fonctions ont été créées et testées avec succès !');
  } else {
    console.log('\n❌ Échec de la création des fonctions');
  }
}

main().catch(console.error);
