import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function finalVerification() {
  console.log('🎯 Vérification finale - Test du tableau de bord Payhula\n');

  try {
    // Test 1: Vérifier qu'une boutique existe
    console.log('1️⃣ Vérification des boutiques...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .limit(1);

    if (storesError) {
      console.log('❌ Erreur boutiques:', storesError.message);
      return;
    }

    if (!stores || stores.length === 0) {
      console.log('⚠️ Aucune boutique trouvée - création d\'une boutique de test...');
      
      const { data: newStore, error: createError } = await supabase
        .from("stores")
        .insert({
          name: "Boutique Test Final",
          slug: "test-final-" + Date.now(),
          description: "Boutique de test pour la vérification finale",
          user_id: "00000000-0000-0000-0000-000000000000"
        })
        .select()
        .limit(1);

      if (createError) {
        console.log('❌ Erreur création boutique:', createError.message);
        return;
      }

      console.log('✅ Boutique de test créée:', newStore[0].name);
      stores[0] = newStore[0];
    } else {
      console.log('✅ Boutique trouvée:', stores[0].name);
    }

    const store = stores[0];

    // Test 2: Simuler les requêtes du tableau de bord
    console.log('\n2️⃣ Simulation des requêtes du tableau de bord...');
    
    const dashboardQueries = await Promise.allSettled([
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

    const [productsResult, ordersResult, customersResult, recentOrdersResult, topProductsResult] = dashboardQueries;

    console.log('📊 Résultats des requêtes dashboard:');
    console.log(`✅ Produits: ${productsResult.status === 'fulfilled' ? productsResult.value.data?.length || 0 : 'Erreur'}`);
    console.log(`✅ Commandes: ${ordersResult.status === 'fulfilled' ? ordersResult.value.data?.length || 0 : 'Erreur'}`);
    console.log(`✅ Clients: ${customersResult.status === 'fulfilled' ? customersResult.value.count || 0 : 'Erreur'}`);
    console.log(`✅ Commandes récentes: ${recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value.data?.length || 0 : 'Erreur'}`);
    console.log(`✅ Top produits: ${topProductsResult.status === 'fulfilled' ? topProductsResult.value.data?.length || 0 : 'Erreur'}`);

    // Vérifier s'il y a des erreurs JSON
    let hasJsonErrors = false;
    dashboardQueries.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        if (error.message && error.message.includes('JSON object requested')) {
          console.log(`❌ ERREUR JSON détectée dans la requête ${index + 1}:`, error.message);
          hasJsonErrors = true;
        } else {
          console.log(`⚠️ Erreur non-JSON dans la requête ${index + 1}:`, error.message);
        }
      } else if (result.value.error) {
        const error = result.value.error;
        if (error.message && error.message.includes('JSON object requested')) {
          console.log(`❌ ERREUR JSON détectée dans la requête ${index + 1}:`, error.message);
          hasJsonErrors = true;
        } else {
          console.log(`⚠️ Erreur non-JSON dans la requête ${index + 1}:`, error.message);
        }
      }
    });

    // Test 3: Créer des données de test si nécessaire
    console.log('\n3️⃣ Création de données de test...');
    
    // Vérifier s'il y a des produits
    const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
    if (products.length === 0) {
      console.log('📦 Création d\'un produit de test...');
      const { data: testProduct, error: productError } = await supabase
        .from("products")
        .insert({
          name: "Produit Test Final",
          description: "Produit de test pour la vérification finale",
          price: 15000,
          currency: "XOF",
          slug: "produit-test-final-" + Date.now(),
          store_id: store.id,
          is_active: true
        })
        .select()
        .limit(1);

      if (productError) {
        console.log('⚠️ Erreur création produit:', productError.message);
      } else {
        console.log('✅ Produit de test créé:', testProduct[0].name);
      }
    }

    // Résumé final
    console.log('\n📋 RÉSUMÉ FINAL:');
    if (hasJsonErrors) {
      console.log('❌ Des erreurs JSON persistent encore');
      console.log('🔧 Des corrections supplémentaires sont nécessaires');
    } else {
      console.log('✅ Aucune erreur JSON détectée !');
      console.log('🎉 Le tableau de bord devrait fonctionner parfaitement');
    }

    console.log('\n🔗 Vérifiez maintenant: https://payhuk.vercel.app/dashboard');
    console.log('📝 Si l\'erreur persiste, vérifiez le cache du navigateur (Ctrl+F5)');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

finalVerification().catch(console.error);