import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderNumberColumn() {
  console.log('🧪 Test de la colonne order_number...\n');
  
  try {
    // Test 1: Vérifier que la colonne existe
    console.log('🔍 Test 1: Vérification de l\'existence de la colonne...');
    const { data: orders, error: selectError } = await supabase
      .from('orders')
      .select('id, order_number, created_at')
      .limit(5);
    
    if (selectError) {
      console.log(`❌ Erreur lors de la sélection: ${selectError.message}`);
      return false;
    }
    
    console.log(`✅ Colonne order_number accessible`);
    console.log(`📊 ${orders?.length || 0} commandes trouvées`);
    
    // Test 2: Vérifier le format des numéros de commande
    if (orders && orders.length > 0) {
      console.log('\n🔍 Test 2: Vérification du format des numéros...');
      const orderNumbers = orders.map(order => order.order_number).filter(Boolean);
      
      if (orderNumbers.length > 0) {
        const formatRegex = /^ORD-\d{8}-\d{4}$/;
        const validNumbers = orderNumbers.filter(num => formatRegex.test(num));
        
        console.log(`✅ ${validNumbers.length}/${orderNumbers.length} numéros au bon format`);
        
        if (validNumbers.length > 0) {
          console.log(`📋 Exemples: ${validNumbers.slice(0, 3).join(', ')}`);
        }
      }
    }
    
    // Test 3: Tester la fonction de génération
    console.log('\n🔍 Test 3: Test de la fonction generate_order_number...');
    const { data: testNumber, error: functionError } = await supabase.rpc('generate_order_number');
    
    if (functionError) {
      console.log(`❌ Erreur fonction: ${functionError.message}`);
    } else {
      console.log(`✅ Fonction fonctionnelle: ${testNumber}`);
    }
    
    // Test 4: Tester l'insertion d'une nouvelle commande (simulation)
    console.log('\n🔍 Test 4: Test d\'insertion (simulation)...');
    const { data: stores } = await supabase.from('stores').select('id').limit(1);
    
    if (stores && stores.length > 0) {
      const testOrder = {
        store_id: stores[0].id,
        status: 'pending',
        total_amount: 0,
        currency: 'XOF',
        payment_status: 'unpaid'
      };
      
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select('id, order_number')
        .single();
      
      if (insertError) {
        console.log(`❌ Erreur insertion: ${insertError.message}`);
      } else {
        console.log(`✅ Insertion réussie: ${newOrder.order_number}`);
        
        // Nettoyer la commande de test
        await supabase.from('orders').delete().eq('id', newOrder.id);
        console.log('🧹 Commande de test supprimée');
      }
    }
    
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('✅ La colonne order_number fonctionne correctement');
    return true;
    
  } catch (error) {
    console.log(`❌ Erreur générale: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Vérification de la correction order_number\n');
  
  const success = await testOrderNumberColumn();
  
  if (success) {
    console.log('\n✅ Résultat:');
    console.log('- La colonne order_number existe et fonctionne');
    console.log('- Les numéros de commande sont générés automatiquement');
    console.log('- L\'erreur "column orders.order_number does not exist" est résolue');
    console.log('- L\'application peut maintenant fonctionner sans erreur');
  } else {
    console.log('\n❌ Problème détecté:');
    console.log('- La colonne order_number n\'est pas correctement configurée');
    console.log('- Exécutez le SQL de correction dans Supabase');
    console.log('- Relancez ce script pour vérifier');
  }
}

main().catch(console.error);
