// Script de test pour vérifier le chargement des produits
import { supabase } from './src/integrations/supabase/client';

async function testProductLoading() {
  console.log('🔍 Test du chargement des produits...');
  
  try {
    // Test 1: Vérifier la connexion Supabase
    console.log('1. Test de connexion Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError);
      return;
    }
    console.log('✅ Connexion Supabase OK');

    // Test 2: Compter tous les produits
    console.log('2. Comptage des produits...');
    const { count: totalProducts, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erreur de comptage:', countError);
      return;
    }
    console.log(`✅ Total des produits: ${totalProducts}`);

    // Test 3: Charger les produits actifs
    console.log('3. Chargement des produits actifs...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('products')
      .select(`
        *,
        stores!inner (
          id,
          name,
          slug,
          logo_url,
          created_at
        )
      `)
      .eq('is_active', true)
      .eq('is_draft', false)
      .limit(10);
    
    if (activeError) {
      console.error('❌ Erreur de chargement:', activeError);
      return;
    }
    console.log(`✅ Produits actifs chargés: ${activeProducts?.length || 0}`);
    
    if (activeProducts && activeProducts.length > 0) {
      console.log('📦 Premier produit:', {
        id: activeProducts[0].id,
        name: activeProducts[0].name,
        price: activeProducts[0].price,
        currency: activeProducts[0].currency,
        store: activeProducts[0].stores?.name
      });
    }

    // Test 4: Vérifier les boutiques
    console.log('4. Test des boutiques...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .limit(5);
    
    if (storesError) {
      console.error('❌ Erreur boutiques:', storesError);
      return;
    }
    console.log(`✅ Boutiques trouvées: ${stores?.length || 0}`);
    
    if (stores && stores.length > 0) {
      console.log('🏪 Première boutique:', stores[0]);
    }

    // Test 5: Vérifier les catégories
    console.log('5. Test des catégories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .limit(10);
    
    if (categoriesError) {
      console.error('❌ Erreur catégories:', categoriesError);
      return;
    }
    
    const uniqueCategories = [...new Set(categories?.map(p => p.category))];
    console.log(`✅ Catégories trouvées: ${uniqueCategories.length}`);
    console.log('📂 Catégories:', uniqueCategories);

    console.log('🎉 Tous les tests sont passés avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Exécuter le test
testProductLoading();
