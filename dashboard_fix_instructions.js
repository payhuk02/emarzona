// Instructions pour corriger le problème dashboard_recent_orders
// Génère les commandes SQL à exécuter dans Supabase SQL Editor

console.log('🔧 CORRECTION DU DASHBOARD - INSTRUCTIONS');
console.log('==========================================\n');

console.log('❌ PROBLÈME:');
console.log('column "dashboard_recent_orders.created_at" must appear in the GROUP BY clause\n');

console.log('✅ SOLUTION:');
console.log('Remplacez la sous-requête ARRAY_AGG par une agrégation directe\n');

console.log('📋 COMMANDES SQL À EXÉCUTER DANS SUPABASE SQL EDITOR:');
console.log('====================================================\n');

const sqlCommands = [
  '-- 1. Supprimer l\'ancienne vue défaillante',
  'DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;',
  '',
  '-- 2. Créer la nouvelle vue corrigée',
  'CREATE MATERIALIZED VIEW dashboard_recent_orders AS',
  'SELECT',
  '  o.id,',
  '  o.order_number,',
  '  o.total_amount,',
  '  o.status,',
  '  o.created_at,',
  '  o.store_id,',
  '  JSON_BUILD_OBJECT(',
  '    \'id\', c.id,',
  '    \'name\', c.name,',
  '    \'email\', c.email',
  '  ) as customer,',
  '  COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types',
  'FROM orders o',
  'LEFT JOIN customers c ON o.customer_id = c.id',
  'LEFT JOIN order_items oi ON o.id = oi.order_id',
  'LEFT JOIN products p ON oi.product_id = p.id',
  'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'90 days\'',
  'GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, o.store_id, c.id, c.name, c.email',
  'ORDER BY o.created_at DESC;',
  '',
  '-- 3. Créer l\'index optimisé',
  'CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created',
  'ON dashboard_recent_orders(store_id, created_at DESC);',
  '',
  '-- 4. Actualiser la vue avec les données actuelles',
  'REFRESH MATERIALIZED VIEW dashboard_recent_orders;',
  '',
  '-- 5. Donner les permissions',
  'GRANT SELECT ON dashboard_recent_orders TO authenticated;',
  '',
  '-- 6. Vérifier que ça fonctionne',
  'SELECT COUNT(*) as total_orders FROM dashboard_recent_orders;'
];

sqlCommands.forEach(cmd => console.log(cmd));

console.log('\n🎯 APRÈS AVOIR EXÉCUTÉ CES COMMANDES:');
console.log('=====================================');
console.log('1. Rafraîchissez votre dashboard');
console.log('2. Les statistiques devraient se charger correctement');
console.log('3. Plus d\'erreur "GROUP BY clause"');

console.log('\n📞 SUPPORT:');
console.log('Si vous avez des problèmes, vérifiez:');
console.log('- Que vous êtes connecté à Supabase');
console.log('- Que vous avez les droits d\'administration');
console.log('- Les logs de Supabase pour les erreurs SQL');

console.log('\n✅ TEST FINAL:');
console.log('Une fois corrigé, le dashboard devrait afficher toutes les statistiques sans erreur.');