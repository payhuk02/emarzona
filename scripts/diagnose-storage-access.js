/**
 * Script de diagnostic pour vérifier la configuration du bucket product-images
 * et les politiques RLS
 * 
 * Utilisation: node scripts/diagnose-storage-access.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseStorageAccess() {
  console.log('\n🔍 Diagnostic de l\'accès au Storage Supabase\n');
  console.log('='.repeat(60));

  // 1. Vérifier que le bucket existe
  console.log('\n1️⃣ Vérification du bucket "product-images"...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Erreur lors de la récupération des buckets:', bucketsError.message);
    return;
  }

  const productImagesBucket = buckets?.find(b => b.id === 'product-images');
  
  if (!productImagesBucket) {
    console.error('❌ Le bucket "product-images" n\'existe pas');
    console.log('💡 Créez-le dans le dashboard Supabase: Storage > New bucket');
    return;
  }

  console.log('✅ Bucket "product-images" existe');
  console.log(`   - Public: ${productImagesBucket.public ? '✅ Oui' : '❌ Non (problème potentiel!)'}`);
  console.log(`   - ID: ${productImagesBucket.id}`);
  console.log(`   - Created: ${productImagesBucket.created_at}`);

  // 2. Vérifier les fichiers dans le bucket
  console.log('\n2️⃣ Vérification des fichiers dans artist/...');
  const { data: files, error: filesError } = await supabase.storage
    .from('product-images')
    .list('artist', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (filesError) {
    console.error('❌ Erreur lors de la récupération des fichiers:', filesError.message);
    console.error('   Code:', filesError.statusCode);
  } else if (!files || files.length === 0) {
    console.log('⚠️  Aucun fichier trouvé dans artist/');
  } else {
    console.log(`✅ ${files.length} fichier(s) trouvé(s)`);
    files.slice(0, 3).forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${file.name} (${(file.metadata?.size || 0).toLocaleString()} bytes)`);
    });
  }

  // 3. Tester l'accès public à un fichier (si disponible)
  if (files && files.length > 0) {
    const testFile = files[0];
    const testPath = `artist/${testFile.name}`;
    
    console.log(`\n3️⃣ Test d'accès public au fichier "${testFile.name}"...`);
    
    // Générer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(testPath);
    
    console.log(`   URL publique: ${publicUrl}`);
    
    // Tester l'accès HTTP
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      console.log(`   Status HTTP: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type') || 'N/A'}`);
      
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        console.log('   ✅ Accès public OK');
      } else if (response.ok) {
        console.log('   ⚠️  Réponse OK mais Content-Type suspect (peut être du JSON d\'erreur)');
        const text = await fetch(publicUrl).then(r => r.text());
        console.log(`   Réponse (premiers 200 chars): ${text.substring(0, 200)}`);
      } else {
        console.log('   ❌ Accès public échoué');
        const text = await fetch(publicUrl).then(r => r.text());
        console.log(`   Réponse: ${text.substring(0, 200)}`);
      }
    } catch (fetchError) {
      console.error('   ❌ Erreur lors du test HTTP:', fetchError.message);
    }
  }

  // 4. Vérifier les politiques RLS (nécessite une requête SQL)
  console.log('\n4️⃣ Vérification des politiques RLS (nécessite une connexion admin)...');
  try {
    const { data: policies, error: policiesError } = await supabase
      .from('storage.objects')
      .select('*')
      .limit(0); // Juste pour tester l'accès
    
    // Note: On ne peut pas facilement lister les politiques RLS via l'API client
    // Il faut utiliser le dashboard Supabase ou une requête SQL directe
    console.log('   💡 Pour vérifier les politiques RLS:');
    console.log('      1. Ouvrez le dashboard Supabase');
    console.log('      2. Allez dans Storage > product-images > Policies');
    console.log('      3. Vérifiez qu\'il existe une politique "product-images - Public read access"');
    console.log('      4. Vérifiez que cette politique permet SELECT pour "public"');
  } catch (error) {
    console.log('   ⚠️  Impossible de vérifier les politiques RLS via l\'API client');
  }

  // 5. Recommandations
  console.log('\n📋 Recommandations:');
  if (!productImagesBucket.public) {
    console.log('   ❌ 1. Le bucket doit être public. Exécutez la migration:');
    console.log('      supabase/migrations/20250301_fix_product_images_artist_access.sql');
  }
  
  console.log('   📝 2. Vérifiez les politiques RLS dans le dashboard Supabase');
  console.log('   🔄 3. Si les politiques sont correctes, attendez quelques minutes');
  console.log('      (délai de propagation Supabase) et réessayez');
  console.log('   🔍 4. Testez directement une URL dans votre navigateur pour voir');
  console.log('      le message d\'erreur exact');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic terminé\n');
}

diagnoseStorageAccess().catch(console.error);





