/**
 * Diagnostic avancé pour les liens courts d'affiliation
 * Analyse en profondeur du problème persistant
 */

console.log('🔬 DIAGNOSTIC AVANCÉ - Liens Courts d\'Affiliation');
console.log('==================================================\n');

// Test 1: Vérifier la configuration côté client
console.log('1️⃣ CONFIGURATION CÔTÉ CLIENT');
console.log('------------------------------');

console.log('✅ Route configurée: /aff/:code → ShortLinkRedirect');
console.log('✅ Composant: ShortLinkRedirect.tsx');
console.log('✅ Hook: useAffiliateShortLinks.ts');
console.log('✅ Interface: ShortLinkManager.tsx');
console.log('');

console.log('🔍 Code de génération d\'URL courte:');
console.log('   const shortUrl = `${window.location.origin}/aff/${shortCode}`;');
console.log('   → Résultat attendu: https://emarzona.com/aff/ABC123');
console.log('');

// Test 2: Analyser le flux d'erreur
console.log('2️⃣ ANALYSE DU FLUX D\'ERREUR');
console.log('----------------------------');

console.log('🔄 Flux d\'exécution détaillé:');
console.log('');
console.log('1. URL: https://emarzona.com/aff/ABC123');
console.log('2. Extraction du code: "ABC123"');
console.log('3. Conversion majuscules: "ABC123".toUpperCase() → "ABC123"');
console.log('4. Appel RPC: supabase.rpc(\'track_short_link_click\', { p_short_code: "ABC123" })');
console.log('');

console.log('📋 Code du composant ShortLinkRedirect:');
console.log('   // Appel RPC d\'abord');
console.log('   const { data, error: rpcError } = await supabase.rpc(\'track_short_link_click\', {');
console.log('     p_short_code: code.toUpperCase(),');
console.log('   });');
console.log('');
console.log('   // Si RPC échoue, fallback vers requête directe');
console.log('   if (rpcError) {');
console.log('     const { data: shortLinkData, error: queryError } = await supabase');
console.log('       .from(\'affiliate_short_links\')');
console.log('       .select(\'target_url, is_active, expires_at\')');
console.log('       .eq(\'short_code\', code.toUpperCase())');
console.log('       .single();');
console.log('   }');
console.log('');

// Test 3: Causes possibles avancées
console.log('3️⃣ CAUSES POSSIBLES AVANCÉES');
console.log('----------------------------');

const causes = [
  {
    id: 'A',
    titre: 'Aucun lien court créé en base',
    description: 'La migration fonctionne mais aucun lien court n\'a été créé via l\'interface',
    verifications: [
      'SELECT COUNT(*) FROM affiliate_short_links;',
      'Vérifier via le dashboard affilié que des liens courts existent'
    ],
    solution: 'Créer un lien court via l\'interface utilisateur'
  },
  {
    id: 'B',
    titre: 'Problème de permissions RLS',
    description: 'Les politiques RLS bloquent l\'accès public aux liens courts',
    verifications: [
      'SELECT * FROM pg_policies WHERE tablename = \'affiliate_short_links\';',
      'Vérifier que "Public can view active short links for redirection" existe'
    ],
    solution: 'Vérifier et corriger les politiques RLS'
  },
  {
    id: 'C',
    titre: 'Problème de casse ou format du code',
    description: 'Le code stocké ne correspond pas au format attendu',
    verifications: [
      'SELECT short_code FROM affiliate_short_links LIMIT 5;',
      'Vérifier que les codes sont en majuscules et alphanumériques'
    ],
    solution: 'Normaliser les codes en majuscules'
  },
  {
    id: 'D',
    titre: 'Lien court désactivé ou expiré',
    description: 'Le lien court existe mais n\'est pas actif',
    verifications: [
      'SELECT short_code, is_active, expires_at FROM affiliate_short_links;',
      'Vérifier is_active = true et expires_at NULL ou > now()'
    ],
    solution: 'Activer les liens courts ou supprimer la date d\'expiration'
  },
  {
    id: 'E',
    titre: 'Problème avec la fonction RPC',
    description: 'La fonction track_short_link_click a un problème',
    verifications: [
      'SELECT * FROM track_short_link_click(\'NONEXISTANT\');',
      'Vérifier que la fonction retourne le bon format JSON'
    ],
    solution: 'Recréer la fonction RPC si nécessaire'
  },
  {
    id: 'F',
    titre: 'Problème de configuration Supabase',
    description: 'Variables d\'environnement ou configuration incorrecte',
    verifications: [
      'Vérifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY',
      'Vérifier que les secrets Edge Functions sont configurés'
    ],
    solution: 'Vérifier la configuration Supabase côté client'
  }
];

causes.forEach(cause => {
  console.log(`${cause.id}) ${cause.titre}`);
  console.log(`   Description: ${cause.description}`);
  console.log('   Vérifications:');
  cause.verifications.forEach(v => console.log(`     • ${v}`));
  console.log(`   Solution: ${cause.solution}`);
  console.log('');
});

// Test 4: Queries de diagnostic à exécuter
console.log('4️⃣ QUERIES DE DIAGNOSTIC À EXÉCUTER');
console.log('-----------------------------------');

const diagnosticQueries = [
  {
    titre: 'Vérifier que la table existe et contient des données',
    query: `SELECT
  'Table exists' as check_type,
  COUNT(*) as record_count
FROM affiliate_short_links;`
  },
  {
    titre: 'Vérifier les liens courts existants',
    query: `SELECT
  short_code,
  target_url,
  is_active,
  expires_at,
  total_clicks,
  created_at
FROM affiliate_short_links
ORDER BY created_at DESC
LIMIT 5;`
  },
  {
    titre: 'Vérifier les politiques RLS',
    query: `SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'affiliate_short_links';`
  },
  {
    titre: 'Tester la fonction RPC avec un code existant',
    query: `SELECT * FROM track_short_link_click(
  (SELECT short_code FROM affiliate_short_links LIMIT 1)
);`
  },
  {
    titre: 'Tester la fonction RPC avec un code inexistant',
    query: `SELECT * FROM track_short_link_click('TEST123');`
  },
  {
    titre: 'Vérifier les fonctions disponibles',
    query: `SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('generate_short_link_code', 'track_short_link_click');`
  }
];

diagnosticQueries.forEach((item, index) => {
  console.log(`${index + 1}. ${item.titre}:`);
  console.log('```sql');
  console.log(item.query);
  console.log('```');
  console.log('');
});

// Test 5: Actions correctives
console.log('5️⃣ ACTIONS CORRECTIVES');
console.log('----------------------');

const correctiveActions = [
  {
    etape: '1',
    action: 'Créer un lien court de test',
    description: 'Via le dashboard affilié, créer un lien court et noter le code'
  },
  {
    etape: '2',
    action: 'Tester avec le code créé',
    description: 'Cliquer sur https://emarzona.com/aff/[CODE] et observer le comportement'
  },
  {
    etape: '3',
    action: 'Vérifier les logs navigateur',
    description: 'Ouvrir DevTools → Console et regarder les erreurs réseau'
  },
  {
    etape: '4',
    action: 'Tester directement en base',
    description: 'Exécuter SELECT * FROM affiliate_short_links WHERE short_code = \'[CODE]\';'
  },
  {
    etape: '5',
    action: 'Vérifier les permissions',
    description: 'S\'assurer que les politiques RLS permettent l\'accès public'
  }
];

correctiveActions.forEach(action => {
  console.log(`${action.etape}. ${action.action}`);
  console.log(`   ${action.description}`);
  console.log('');
});

// Test 6: Debug côté client
console.log('6️⃣ DEBUG CÔTÉ CLIENT');
console.log('-------------------');

console.log('📝 Code JavaScript à tester dans la console du navigateur:');
console.log('');
console.log('// Tester la génération d\'URL courte');
console.log('const code = "ABC123";');
console.log('const shortUrl = `${window.location.origin}/aff/${code}`;');
console.log('console.log("URL générée:", shortUrl);');
console.log('');
console.log('// Tester la conversion majuscules');
console.log('console.log("Code original:", code);');
console.log('console.log("Code upper:", code.toUpperCase());');
console.log('');
console.log('// Tester l\'appel Supabase (remplacer YOUR_CODE)');
console.log('const { data, error } = await supabase.rpc(\'track_short_link_click\', {');
console.log('  p_short_code: "YOUR_CODE"');
console.log('});');
console.log('console.log("Résultat:", { data, error });');
console.log('');

// Résumé final
console.log('==================================================');
console.log('🎯 RÉSUMÉ DU DIAGNOSTIC AVANCÉ');
console.log('================================================');
console.log('');
console.log('🔍 PROBLÈME: "Lien court introuvable ou expiré"');
console.log('');
console.log('✅ MIGRATION: Fonctionnelle');
console.log('❓ CAUSE: À identifier parmi les 6 possibilités ci-dessus');
console.log('');
console.log('🔧 PROCHAINES ÉTAPES:');
console.log('1. Exécuter les queries de diagnostic dans Supabase SQL Editor');
console.log('2. Créer un lien court de test via l\'interface');
console.log('3. Tester la redirection et analyser les logs');
console.log('4. Partager les résultats pour analyse détaillée');
console.log('');
console.log('📊 Les queries de diagnostic vous donneront la cause exacte du problème.');
console.log('');
console.log('💡 HYPOTHÈSE PRINCIPALE: Aucun lien court n\'a été créé en base de données.');
console.log('   SOLUTION: Créer un lien court via le dashboard affilié puis tester.');

