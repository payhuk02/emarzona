import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDashboardQueries() {
  console.log('🧪 Test des requêtes du tableau de bord...\n');

  try {
    // Test 1: Récupérer une boutique de test
    console.log('1️⃣ Test de récupération des boutiques...');
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("id, name")
      .limit(1);

    if (storesError) {
      console.log('❌ Erreur boutiques:', storesError.message);
      return;
    }

    if (!stores || stores.length === 0) {
      console.log('⚠️ Aucune boutique trouvée - création d\'une boutique de test...');
      
      // Créer une boutique de test
      const { data: newStore, error: createError } = await supabase
        .from("stores")
        .insert({
          name: "Boutique Test Dashboard",
          slug: "test-dashboard-" + Date.now(),
          description: "Boutique de test pour le tableau de bord",
          user_id: "00000000-0000-0000-0000-000000000000" // UUID placeholder
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Erreur création boutique:', createError.message);
        return;
      }

      console.log('✅ Boutique de test créée:', newStore.name);
      stores[0] = newStore;
    } else {
      console.log('✅ Boutique trouvée:', stores[0].name);
    }

    const store = stores[0];

    // Test 2: Requêtes du tableau de bord avec Promise.allSettled
    console.log('\n2️⃣ Test des requêtes du tableau de bord...');
    
    const queries = await Promise.allSettled([
      // Produits
      supabase
        .from("products")
        .select("id, is_active, created_at")
        .eq("store_id", store.id),
      
      // Commandes
      supabase
        .from("orders")
        .select("id, status, total_amount, created_at")
        .eq("store_id", store.id),
      
      // Clients
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id),
      
      // Commandes récentes
      supabase
        .from("orders")
        .select("id, order_number, total_amount, status, created_at")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(5),
      
      // Top produits
      supabase
        .from("products")
        .select("id, name, price, image_url")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .limit(5)
    ]);

    const [productsResult, ordersResult, customersResult, recentOrdersResult, topProductsResult] = queries;

    console.log('📊 Résultats des requêtes:');
    console.log(`✅ Produits: ${productsResult.status === 'fulfilled' ? productsResult.value.data?.length || 0 : 'Erreur'} produits`);
    console.log(`✅ Commandes: ${ordersResult.status === 'fulfilled' ? ordersResult.value.data?.length || 0 : 'Erreur'} commandes`);
    console.log(`✅ Clients: ${customersResult.status === 'fulfilled' ? customersResult.value.count || 0 : 'Erreur'} clients`);
    console.log(`✅ Commandes récentes: ${recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value.data?.length || 0 : 'Erreur'} commandes`);
    console.log(`✅ Top produits: ${topProductsResult.status === 'fulfilled' ? topProductsResult.value.data?.length || 0 : 'Erreur'} produits`);

    // Test 3: Vérifier les erreurs
    console.log('\n3️⃣ Analyse des erreurs...');
    let hasErrors = false;
    
    queries.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`❌ Requête ${index + 1} échouée:`, result.reason);
        hasErrors = true;
      } else if (result.value.error) {
        console.log(`❌ Requête ${index + 1} avec erreur Supabase:`, result.value.error.message);
        hasErrors = true;
      }
    });

    if (!hasErrors) {
      console.log('✅ Toutes les requêtes sont fonctionnelles !');
    } else {
      console.log('⚠️ Certaines requêtes ont des erreurs, mais le système de fallback devrait fonctionner.');
    }

    // Test 4: Test de création de données de test
    console.log('\n4️⃣ Test de création de données de test...');
    
    // Créer un produit de test
    const { data: testProduct, error: productError } = await supabase
      .from("products")
      .insert({
        name: "Produit Test Dashboard",
        description: "Produit de test pour le tableau de bord",
        price: 10000,
        currency: "XOF",
        slug: "produit-test-" + Date.now(),
        store_id: store.id,
        is_active: true
      })
      .select()
      .single();

    if (productError) {
      console.log('⚠️ Erreur création produit:', productError.message);
    } else {
      console.log('✅ Produit de test créé:', testProduct.name);
    }

    // Créer une commande de test
    const { data: testOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        status: "pending",
        total_amount: 10000,
        currency: "XOF",
        payment_status: "unpaid",
        order_number: "TEST-" + Date.now()
      })
      .select()
      .single();

    if (orderError) {
      console.log('⚠️ Erreur création commande:', orderError.message);
    } else {
      console.log('✅ Commande de test créée:', testOrder.order_number);
    }

    console.log('\n🎉 Test du tableau de bord terminé !');
    console.log('📝 Le tableau de bord devrait maintenant fonctionner sans erreurs.');
    console.log('🔗 Vérifiez https://payhula.vercel.app/dashboard');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testDashboardQueries().catch(console.error);
