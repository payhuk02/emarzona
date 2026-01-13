/**
 * Script de validation de sous-domaine
 *
 * Valide qu'un sous-domaine respecte les règles :
 * - Format valide (RFC 1035)
 * - Non réservé
 * - Disponible dans la base de données
 *
 * Usage:
 *   tsx scripts/validate-subdomain.ts <subdomain>
 *
 * Date: 1 Février 2025
 */

import {
  validateSubdomain,
  isSubdomainReserved,
  isValidSubdomainFormat,
} from '../src/lib/subdomain-detector';

const subdomain = process.argv[2];

if (!subdomain) {
  console.error('❌ Erreur: Veuillez fournir un sous-domaine à valider');
  console.log('\nUsage:');
  console.log('  tsx scripts/validate-subdomain.ts <subdomain>');
  console.log('\nExemple:');
  console.log('  tsx scripts/validate-subdomain.ts ma-boutique');
  process.exit(1);
}

console.log(`\n🔍 Validation du sous-domaine: "${subdomain}"\n`);

// 1. Vérifier le format
console.log('1️⃣  Vérification du format...');
if (!isValidSubdomainFormat(subdomain)) {
  console.error('   ❌ Format invalide');
  console.error('   Le sous-domaine doit:');
  console.error('   - Contenir uniquement des lettres minuscules, chiffres et tirets');
  console.error('   - Ne pas commencer ou finir par un tiret');
  console.error('   - Faire maximum 63 caractères');
  process.exit(1);
}
console.log('   ✅ Format valide');

// 2. Vérifier si réservé
console.log('\n2️⃣  Vérification des sous-domaines réservés...');
if (isSubdomainReserved(subdomain)) {
  console.error(`   ❌ Le sous-domaine "${subdomain}" est réservé`);
  console.error('   Il ne peut pas être utilisé pour une boutique');
  process.exit(1);
}
console.log('   ✅ Non réservé');

// 3. Validation complète
console.log('\n3️⃣  Validation complète...');
const validation = validateSubdomain(subdomain);
if (!validation.valid) {
  console.error(`   ❌ ${validation.error}`);
  process.exit(1);
}
console.log('   ✅ Validation réussie');

// 4. Résumé
console.log('\n✅ Le sous-domaine est valide et peut être utilisé !\n');
console.log(`   Sous-domaine: ${subdomain}`);
console.log(`   URL complète: https://${subdomain}.myemarzona.shop\n`);

process.exit(0);
