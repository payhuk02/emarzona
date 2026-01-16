#!/usr/bin/env node

/**
 * Test de la fonction formatCurrency avec XOF
 * Date: Janvier 2026
 */

const { formatCurrency } = require('./src/lib/utils.ts');

console.log('🧪 TEST DE FORMATAGE MONÉTAIRE AVEC XOF\n');

// Test avec différentes valeurs
const testValues = [100, 1000, 5000, 10000, 50000, 100000, 1500000];

console.log('Formatage avec devise par défaut (XOF):');
testValues.forEach(value => {
  try {
    const formatted = formatCurrency(value);
    console.log(`${value} → ${formatted}`);
  } catch (error) {
    console.log(`${value} → ERREUR: ${error.message}`);
  }
});

console.log('\nFormatage avec devise explicite XOF:');
testValues.forEach(value => {
  try {
    const formatted = formatCurrency(value, 'XOF');
    console.log(`${value} → ${formatted}`);
  } catch (error) {
    console.log(`${value} → ERREUR: ${error.message}`);
  }
});

console.log('\nFormatage avec devise EUR (pour comparaison):');
testValues.forEach(value => {
  try {
    const formatted = formatCurrency(value, 'EUR');
    console.log(`${value} → ${formatted}`);
  } catch (error) {
    console.log(`${value} → ERREUR: ${error.message}`);
  }
});

console.log('\n✅ TEST TERMINÉ');