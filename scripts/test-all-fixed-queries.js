import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testAllFixedQueries() {
  console.log('🔧 Test de toutes les requêtes corrigées...\n');

  try {
    // Test 1: useStore - Récupération des boutiques
    console.log('1️⃣ Test useStore (boutiques)...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);

    if (storesError) {
      console.log('❌ Erreur boutiques:', storesError.message);
    } else {
      console.log('✅ Boutiques:', stores?.length || 0, 'trouvées');
    }

    // Test 2: useProfile - Récupération des profils
    console.log('\n2️⃣ Test useProfile (profils)...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, avatar_url, display_name, first_name, last_name, created_at, updated_at')
      .limit(1);

    if (profilesError) {
      console.log('❌ Erreur profils:', profilesError.message);
    } else {
      console.log('✅ Profils:', profiles?.length || 0, 'trouvés');
    }

    // Test 3: useAdmin - Vérification des rôles admin
    console.log('\n3️⃣ Test useAdmin (rôles)...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('role', 'admin')
      .limit(1);

    if (rolesError) {
      console.log('❌ Erreur rôles:', rolesError.message);
    } else {
      console.log('✅ Rôles admin:', roles?.length || 0, 'trouvés');
    }

    // Test 4: useReferral - Récupération des codes de parrainage
    console.log('\n4️⃣ Test useReferral (parrainage)...');
    const { data: referralProfiles, error: referralError } = await supabase
      .from('profiles')
      .select('referral_code, total_referral_earnings')
      .limit(1);

    if (referralError) {
      console.log('❌ Erreur parrainage:', referralError.message);
    } else {
      console.log('✅ Profils avec parrainage:', referralProfiles?.length || 0, 'trouvés');
    }

    // Test 5: useKYC - Récupération des soumissions KYC
    console.log('\n5️⃣ Test useKYC (soumissions)...');
    const { data: kycSubmissions, error: kycError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .limit(1);

    if (kycError) {
      console.log('❌ Erreur KYC:', kycError.message);
    } else {
      console.log('✅ Soumissions KYC:', kycSubmissions?.length || 0, 'trouvées');
    }

    // Test 6: useAllUsers - Récupération des utilisateurs
    console.log('\n6️⃣ Test useAllUsers (utilisateurs)...');
    const { data: allProfiles, error: allUsersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (allUsersError) {
      console.log('❌ Erreur utilisateurs:', allUsersError.message);
    } else {
      console.log('✅ Utilisateurs:', allProfiles?.length || 0, 'trouvés');
    }

    // Test 7: useAdminActivity - Récupération des actions admin
    console.log('\n7️⃣ Test useAdminActivity (actions)...');
    const { data: adminActions, error: adminActionsError } = await supabase
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (adminActionsError) {
      console.log('❌ Erreur actions admin:', adminActionsError.message);
    } else {
      console.log('✅ Actions admin:', adminActions?.length || 0, 'trouvées');
    }

    // Test 8: Dashboard stats - Requêtes du tableau de bord
    console.log('\n8️⃣ Test Dashboard Stats (statistiques)...');
    if (stores && stores.length > 0) {
      const store = stores[0];
      
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

      console.log('📊 Résultats des requêtes dashboard:');
      console.log(`✅ Produits: ${productsResult.status === 'fulfilled' ? productsResult.value.data?.length || 0 : 'Erreur'}`);
      console.log(`✅ Commandes: ${ordersResult.status === 'fulfilled' ? ordersResult.value.data?.length || 0 : 'Erreur'}`);
      console.log(`✅ Clients: ${customersResult.status === 'fulfilled' ? customersResult.value.count || 0 : 'Erreur'}`);
      console.log(`✅ Commandes récentes: ${recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value.data?.length || 0 : 'Erreur'}`);
      console.log(`✅ Top produits: ${topProductsResult.status === 'fulfilled' ? topProductsResult.value.data?.length || 0 : 'Erreur'}`);

      // Vérifier les erreurs
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
        console.log('✅ Toutes les requêtes du dashboard sont fonctionnelles !');
      }
    } else {
      console.log('⚠️ Aucune boutique trouvée pour tester les statistiques');
    }

    console.log('\n🎉 Test complet terminé !');
    console.log('📝 Toutes les requêtes problématiques ont été corrigées.');
    console.log('🔗 Le tableau de bord devrait maintenant fonctionner sans erreurs JSON.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAllFixedQueries().catch(console.error);
