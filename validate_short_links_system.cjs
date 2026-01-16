#!/usr/bin/env node

/**
 * Validation complète du système de liens courts affiliés
 * Date: Janvier 2026
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATION COMPLÈTE DU SYSTÈME DE LIENS COURTS AFFILIÉS\n');

// Vérifications des fichiers
console.log('📁 1. VÉRIFICATION DES FICHIERS\n');

// Composants
const components = [
  'src/components/affiliate/ShortLinkManager.tsx',
  'src/pages/affiliate/ShortLinkRedirect.tsx',
  'src/hooks/useAffiliateShortLinks.ts',
  'src/hooks/useAffiliateShortLinksAnalytics.ts'
];

components.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// Migrations
const migrations = [
  'supabase/migrations/20250131_affiliate_short_links.sql',
  'supabase/migrations/20260117_short_links_analytics.sql',
  'supabase/migrations/20260117_short_links_rate_limiting.sql',
  'supabase/migrations/20260117_flexible_expiration.sql'
];

console.log('\n🗃️ 2. VÉRIFICATION DES MIGRATIONS\n');
migrations.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// Tests
const tests = [
  'supabase/tests/generate_short_link_code.test.sql',
  'supabase/tests/track_short_link_click.test.sql',
  'supabase/tests/basic_functionality_test.sql',
  'src/hooks/__tests__/useAffiliateShortLinks.test.tsx'
];

console.log('\n🧪 3. VÉRIFICATION DES TESTS\n');
tests.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// Vérifications du code
console.log('\n💻 4. VÉRIFICATION DU CODE\n');

// Vérifier la route dans App.tsx
try {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  if (appContent.includes('/aff/:code')) {
    console.log('✅ Route /aff/:code configurée');
  } else {
    console.log('❌ Route /aff/:code manquante');
  }

  if (appContent.includes('ShortLinkRedirect')) {
    console.log('✅ ShortLinkRedirect importé');
  } else {
    console.log('❌ ShortLinkRedirect non importé');
  }
} catch (error) {
  console.log('❌ Erreur lecture App.tsx:', error.message);
}

// Vérifier les exports
try {
  const shortLinkManager = fs.readFileSync('src/components/affiliate/ShortLinkManager.tsx', 'utf8');
  if (shortLinkManager.includes('export const ShortLinkManager')) {
    console.log('✅ ShortLinkManager exporté');
  } else {
    console.log('❌ ShortLinkManager non exporté');
  }
} catch (error) {
  console.log('❌ Erreur lecture ShortLinkManager:', error.message);
}

// Vérifier les hooks
try {
  const hooks = fs.readFileSync('src/hooks/useAffiliateShortLinks.ts', 'utf8');
  if (hooks.includes('export const useAffiliateShortLinks')) {
    console.log('✅ useAffiliateShortLinks exporté');
  } else {
    console.log('❌ useAffiliateShortLinks non exporté');
  }
} catch (error) {
  console.log('❌ Erreur lecture hooks:', error.message);
}

// Vérifications fonctionnelles
console.log('\n⚙️ 5. VÉRIFICATIONS FONCTIONNELLES\n');

// Vérifier les dépendances
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = packageJson.dependencies || {};

  const requiredDeps = [
    '@supabase/supabase-js',
    '@tanstack/react-query',
    'react-router-dom'
  ];

  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ Dépendance ${dep} présente`);
    } else {
      console.log(`❌ Dépendance ${dep} manquante`);
    }
  });
} catch (error) {
  console.log('❌ Erreur lecture package.json:', error.message);
}

// Vérifier la configuration TypeScript
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ Configuration TypeScript présente');
} catch (error) {
  console.log('❌ Configuration TypeScript manquante');
}

// Vérifications de sécurité
console.log('\n🔒 6. VÉRIFICATIONS DE SÉCURITÉ\n');

// Vérifier RLS
try {
  const migration = fs.readFileSync('supabase/migrations/20250131_affiliate_short_links.sql', 'utf8');
  if (migration.includes('ENABLE ROW LEVEL SECURITY')) {
    console.log('✅ RLS activé');
  } else {
    console.log('❌ RLS non activé');
  }

  if (migration.includes('POLICY "Affiliates can')) {
    console.log('✅ Politiques RLS définies');
  } else {
    console.log('❌ Politiques RLS manquantes');
  }
} catch (error) {
  console.log('❌ Erreur vérification RLS:', error.message);
}

// Résumé
console.log('\n📊 RÉSUMÉ DE VALIDATION\n');

const totalChecks = 20; // Estimation
let passedChecks = 0;

// Compter les succès (approximation)
const logContent = [];
console.log = (...args) => {
  logContent.push(args.join(' '));
  process.stdout.write(args.join(' ') + '\n');
};

console.log('🔄 Re-exécution pour compter...');

// Re-exécuter les vérifications principales
try {
  if (fs.existsSync('src/components/affiliate/ShortLinkManager.tsx')) passedChecks++;
  if (fs.existsSync('src/pages/affiliate/ShortLinkRedirect.tsx')) passedChecks++;
  if (fs.existsSync('src/hooks/useAffiliateShortLinks.ts')) passedChecks++;
  if (fs.existsSync('supabase/migrations/20250131_affiliate_short_links.sql')) passedChecks++;
} catch (e) {}

// Résultat final
console.log(`\n🎯 SCORE FINAL: ${passedChecks}/${totalChecks} vérifications réussies`);

if (passedChecks >= totalChecks * 0.8) {
  console.log('🎉 SYSTÈME DE LIENS COURTS OPÉRATIONNEL !');
} else {
  console.log('⚠️  PROBLÈMES DÉTECTÉS - Nécessite corrections');
}

console.log('\n✅ Validation terminée !');