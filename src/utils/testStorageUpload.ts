/**
 * Script de test pour diagnostiquer les problèmes d'upload Supabase Storage
 * Date: 1 Février 2025
 * 
 * Utilisation: Copiez ce code dans la console du navigateur pour tester l'upload
 */

import { supabase } from '@/integrations/supabase/client';

export async function testStorageUpload() {
  console.log('🧪 Début du test d\'upload Supabase Storage');
  console.log('==========================================\n');

  // Étape 1: Vérifier l'authentification
  console.log('1️⃣ Vérification de l\'authentification...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    console.error('❌ Utilisateur non authentifié:', authError);
    return { success: false, error: 'Non authentifié' };
  }
  console.log('✅ Utilisateur authentifié:', { id: user.id, email: user.email });
  console.log('');

  // Étape 2: Vérifier le bucket
  console.log('2️⃣ Vérification du bucket "attachments"...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
    return { success: false, error: bucketsError.message };
  }
  
  const attachmentsBucket = buckets?.find(b => b.id === 'attachments');
  if (!attachmentsBucket) {
    console.error('❌ Le bucket "attachments" n\'existe pas');
    return { success: false, error: 'Bucket "attachments" introuvable' };
  }
  
  console.log('✅ Bucket trouvé:', {
    id: attachmentsBucket.id,
    name: attachmentsBucket.name,
    public: attachmentsBucket.public,
    created_at: attachmentsBucket.created_at,
  });
  
  if (!attachmentsBucket.public) {
    console.warn('⚠️ Le bucket n\'est PAS public. Activez "Public bucket" dans Supabase Dashboard.');
  }
  console.log('');

  // Étape 3: Créer un fichier de test
  console.log('3️⃣ Création d\'un fichier de test...');
  const testContent = 'Test upload - ' + new Date().toISOString();
  const testFile = new File([testContent], 'test-upload.txt', { type: 'text/plain' });
  console.log('✅ Fichier de test créé:', {
    name: testFile.name,
    type: testFile.type,
    size: testFile.size,
  });
  console.log('');

  // Étape 4: Tester l'upload
  console.log('4️⃣ Test de l\'upload...');
  const testPath = `test/${Date.now()}-test-upload.txt`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(testPath, testFile, {
      contentType: 'text/plain',
      upsert: false,
    });

  if (uploadError) {
    console.error('❌ Erreur lors de l\'upload:', uploadError);
    console.error('Détails:', {
      message: uploadError.message,
      statusCode: (uploadError as any).statusCode,
      error: (uploadError as any).error,
    });
    return { success: false, error: uploadError.message, uploadError };
  }

  if (!uploadData?.path) {
    console.error('❌ Upload réussi mais pas de path retourné:', uploadData);
    return { success: false, error: 'Pas de path retourné', uploadData };
  }

  console.log('✅ Upload réussi:', {
    path: uploadData.path,
    id: uploadData.id,
    fullPath: uploadData.fullPath,
  });
  console.log('');

  // Étape 5: Vérifier le fichier uploadé
  console.log('5️⃣ Vérification du fichier uploadé...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde

  const folderPath = testPath.split('/').slice(0, -1).join('/');
  const fileName = testPath.split('/').pop();
  const { data: fileList, error: listError } = await supabase.storage
    .from('attachments')
    .list(folderPath, {
      limit: 10,
      search: fileName,
    });

  if (listError) {
    console.error('❌ Erreur lors de la liste des fichiers:', listError);
    return { success: false, error: listError.message, uploadData };
  }

  const foundFile = fileList?.find(f => f.name === fileName);
  if (!foundFile) {
    console.error('❌ Fichier non trouvé dans la liste:', { folderPath, fileName, fileList });
    return { success: false, error: 'Fichier non trouvé après upload', uploadData };
  }

  console.log('✅ Fichier trouvé:', {
    name: foundFile.name,
    id: foundFile.id,
    updated_at: foundFile.updated_at,
    created_at: foundFile.created_at,
    last_accessed_at: foundFile.last_accessed_at,
    metadata: foundFile.metadata,
  });

  // Vérifier le Content-Type
  const contentType = foundFile.metadata?.mimetype || foundFile.metadata?.contentType;
  if (contentType === 'application/json') {
    console.error('❌ CRITICAL: Le fichier est enregistré comme JSON!', {
      expected: 'text/plain',
      actual: contentType,
      metadata: foundFile.metadata,
    });
    return { success: false, error: 'Fichier enregistré comme JSON', uploadData, foundFile };
  }

  if (contentType !== 'text/plain') {
    console.warn('⚠️ Content-Type inattendu:', {
      expected: 'text/plain',
      actual: contentType,
    });
  } else {
    console.log('✅ Content-Type correct:', contentType);
  }
  console.log('');

  // Étape 6: Tester le téléchargement
  console.log('6️⃣ Test du téléchargement...');
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from('attachments')
    .download(testPath);

  if (downloadError) {
    console.error('❌ Erreur lors du téléchargement:', downloadError);
    return { success: false, error: downloadError.message, uploadData, foundFile };
  }

  const downloadText = await downloadData.text();
  if (downloadText !== testContent) {
    console.error('❌ Contenu du fichier incorrect:', {
      expected: testContent,
      actual: downloadText,
    });
    return { success: false, error: 'Contenu incorrect', uploadData, foundFile };
  }

  console.log('✅ Téléchargement réussi, contenu correct');
  console.log('');

  // Étape 7: Nettoyer (supprimer le fichier de test)
  console.log('7️⃣ Nettoyage (suppression du fichier de test)...');
  const { error: removeError } = await supabase.storage
    .from('attachments')
    .remove([testPath]);

  if (removeError) {
    console.warn('⚠️ Impossible de supprimer le fichier de test:', removeError);
  } else {
    console.log('✅ Fichier de test supprimé');
  }
  console.log('');

  // Résumé
  console.log('==========================================');
  console.log('✅ TEST RÉUSSI !');
  console.log('Le système d\'upload fonctionne correctement.');
  console.log('Si vous avez toujours des problèmes avec les images,');
  console.log('vérifiez les options d\'upload dans useFileUpload.ts');
  console.log('==========================================\n');

  return {
    success: true,
    uploadData,
    foundFile,
    contentType,
  };
}

// Pour utiliser dans la console du navigateur :
// import { testStorageUpload } from '@/utils/testStorageUpload';
// await testStorageUpload();

