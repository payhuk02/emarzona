// Script pour créer des produits de test
import { supabase } from './src/integrations/supabase/client';

async function createTestProducts() {
  console.log('🔧 Création de produits de test...');
  
  try {
    // Vérifier s'il y a déjà des produits
    const { count: existingProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (existingProducts && existingProducts > 0) {
      console.log(`✅ ${existingProducts} produits existent déjà. Pas besoin de créer des produits de test.`);
      return;
    }

    // Vérifier s'il y a des boutiques
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .limit(1);
    
    if (storesError || !stores || stores.length === 0) {
      console.log('⚠️ Aucune boutique trouvée. Création d\'une boutique de test...');
      
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: 'Boutique Test Payhuk',
          slug: 'boutique-test-payhuk',
          description: 'Boutique de test pour le marketplace',
          default_currency: 'XOF',
          user_id: '00000000-0000-0000-0000-000000000000' // UUID fictif
        })
        .select()
        .single();
      
      if (storeError) {
        console.error('❌ Erreur création boutique:', storeError);
        return;
      }
      
      console.log('✅ Boutique de test créée:', newStore);
      stores = [newStore];
    }

    const storeId = stores[0].id;
    console.log('🏪 Utilisation de la boutique:', stores[0].name);

    // Créer des produits de test
    const testProducts = [
      {
        name: 'Formation Excel Complète',
        slug: 'formation-excel-complete',
        description: 'Apprenez Excel de A à Z avec cette formation complète incluant toutes les fonctionnalités avancées.',
        price: 15000,
        promotional_price: 12000,
        currency: 'XOF',
        category: 'Formation',
        product_type: 'digital',
        is_active: true,
        is_draft: false,
        store_id: storeId,
        rating: 4.5,
        reviews_count: 25
      },
      {
        name: 'Ebook Marketing Digital',
        slug: 'ebook-marketing-digital',
        description: 'Guide complet du marketing digital pour les entrepreneurs africains.',
        price: 8000,
        currency: 'XOF',
        category: 'Ebook',
        product_type: 'digital',
        is_active: true,
        is_draft: false,
        store_id: storeId,
        rating: 4.2,
        reviews_count: 18
      },
      {
        name: 'Template Site Web Professionnel',
        slug: 'template-site-web-professionnel',
        description: 'Template HTML/CSS responsive pour créer un site web professionnel rapidement.',
        price: 25000,
        promotional_price: 20000,
        currency: 'XOF',
        category: 'Template',
        product_type: 'digital',
        is_active: true,
        is_draft: false,
        store_id: storeId,
        rating: 4.8,
        reviews_count: 32
      },
      {
        name: 'Logiciel de Gestion de Stock',
        slug: 'logiciel-gestion-stock',
        description: 'Application web complète pour gérer votre inventaire et vos ventes.',
        price: 50000,
        currency: 'XOF',
        category: 'Logiciel',
        product_type: 'digital',
        is_active: true,
        is_draft: false,
        store_id: storeId,
        rating: 4.6,
        reviews_count: 15
      },
      {
        name: 'Service de Design Graphique',
        slug: 'service-design-graphique',
        description: 'Service de création de logos, cartes de visite et supports de communication.',
        price: 30000,
        currency: 'XOF',
        category: 'Service',
        product_type: 'service',
        is_active: true,
        is_draft: false,
        store_id: storeId,
        rating: 4.7,
        reviews_count: 22
      }
    ];

    console.log('📦 Création des produits de test...');
    
    for (const product of testProducts) {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (productError) {
        console.error(`❌ Erreur création produit "${product.name}":`, productError);
      } else {
        console.log(`✅ Produit créé: ${newProduct.name} (${newProduct.price} ${newProduct.currency})`);
      }
    }

    console.log('🎉 Produits de test créés avec succès !');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Exécuter le script
createTestProducts();
