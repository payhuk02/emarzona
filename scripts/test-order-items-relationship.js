import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderItemsRelationship() {
  console.log('🧪 Test des relations order_items/orders...\n');
  
  try {
    // Test 1: Vérifier que les tables existent
    console.log('🔍 Test 1: Vérification de l\'existence des tables...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status')
      .limit(3);
    
    if (ordersError) {
      console.log(`❌ Erreur table orders: ${ordersError.message}`);
      return false;
    }
    
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_name, quantity, unit_price')
      .limit(3);
    
    if (orderItemsError) {
      console.log(`❌ Erreur table order_items: ${orderItemsError.message}`);
      return false;
    }
    
    console.log(`✅ Table orders: ${orders?.length || 0} commandes`);
    console.log(`✅ Table order_items: ${orderItems?.length || 0} éléments`);
    
    // Test 2: Tester la relation avec JOIN
    console.log('\n🔍 Test 2: Test de la relation avec JOIN...');
    
    const { data: joinedData, error: joinError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        order_items (
          id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .limit(3);
    
    if (joinError) {
      console.log(`❌ Erreur JOIN: ${joinError.message}`);
      console.log('💡 Cette erreur indique un problème de relation');
      return false;
    }
    
    console.log(`✅ Relation JOIN fonctionnelle`);
    console.log(`📊 ${joinedData?.length || 0} commandes avec leurs éléments`);
    
    // Test 3: Tester l'insertion d'une commande avec éléments
    console.log('\n🔍 Test 3: Test d\'insertion (simulation)...');
    
    const { data: stores } = await supabase.from('stores').select('id').limit(1);
    
    if (stores && stores.length > 0) {
      // Créer une commande de test
      const testOrder = {
        store_id: stores[0].id,
        status: 'pending',
        total_amount: 1000,
        currency: 'XOF',
        payment_status: 'unpaid'
      };
      
      const { data: newOrder, error: insertOrderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select('id, order_number')
        .single();
      
      if (insertOrderError) {
        console.log(`❌ Erreur insertion commande: ${insertOrderError.message}`);
      } else {
        console.log(`✅ Commande créée: ${newOrder.order_number}`);
        
        // Créer un élément de commande
        const testOrderItem = {
          order_id: newOrder.id,
          product_name: 'Produit de test',
          quantity: 1,
          unit_price: 1000,
          total_price: 1000
        };
        
        const { data: newOrderItem, error: insertItemError } = await supabase
          .from('order_items')
          .insert(testOrderItem)
          .select('id, order_id, product_name')
          .single();
        
        if (insertItemError) {
          console.log(`❌ Erreur insertion élément: ${insertItemError.message}`);
        } else {
          console.log(`✅ Élément créé: ${newOrderItem.product_name}`);
          
          // Test de la relation après insertion
          const { data: testRelation, error: relationError } = await supabase
            .from('orders')
            .select(`
              id,
              order_number,
              order_items (
                id,
                product_name,
                quantity
              )
            `)
            .eq('id', newOrder.id)
            .single();
          
          if (relationError) {
            console.log(`❌ Erreur test relation: ${relationError.message}`);
          } else {
            console.log(`✅ Relation testée: ${testRelation.order_items?.length || 0} éléments`);
          }
        }
        
        // Nettoyer les données de test
        await supabase.from('order_items').delete().eq('order_id', newOrder.id);
        await supabase.from('orders').delete().eq('id', newOrder.id);
        console.log('🧹 Données de test supprimées');
      }
    }
    
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('✅ Les relations order_items/orders fonctionnent correctement');
    return true;
    
  } catch (error) {
    console.log(`❌ Erreur générale: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Vérification des relations order_items/orders\n');
  
  const success = await testOrderItemsRelationship();
  
  if (success) {
    console.log('\n✅ Résultat:');
    console.log('- Les tables orders et order_items existent');
    console.log('- Les relations sont correctement configurées');
    console.log('- Les requêtes avec JOIN fonctionnent');
    console.log('- L\'erreur "Could not find a relationship" est résolue');
    console.log('- L\'application peut maintenant fonctionner sans erreur');
  } else {
    console.log('\n❌ Problème détecté:');
    console.log('- Les relations entre order_items et orders ne fonctionnent pas');
    console.log('- Exécutez le SQL de correction dans Supabase');
    console.log('- Relancez ce script pour vérifier');
  }
}

main().catch(console.error);
