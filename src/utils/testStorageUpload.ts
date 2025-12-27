/**
 * Script de test pour diagnostiquer les problèmes d'upload Supabase Storage
 * Date: 1 Février 2025
 * 
 * Utilisation: Copiez ce code dans la console du navigateur pour tester l'upload
 */

import { supabase } from '@/integrations/supabase/client';

export async function testStorageUpload() {

  // Étape 1: Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    console.error('❌ Utilisateur non authentifié:', authError);
    return { success: false, error: 'Non authentifié' };
  }

  // Étape 2: Vérifier le bucket
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
  
    id: attachmentsBucket.id,
    name: attachmentsBucket.name,
    public: attachmentsBucket.public,
    created_at: attachmentsBucket.created_at,
  });
  
  if (!attachmentsBucket.public) {
    console.warn('⚠️ Le bucket n\'est PAS public. Activez "Public bucket" dans Supabase Dashboard.');
  }

  // Étape 3: Créer un fichier de test
  const testContent = 'Test upload - ' + new Date().toISOString();
  const testFile = new File([testContent], 'test-upload.txt', { type: 'text/plain' });
    name: testFile.name,
    type: testFile.type,
    size: testFile.size,
  });

  // Étape 4: Tester l'upload
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
      statusCode: (uploadError as { statusCode?: number }).statusCode,
      error: (uploadError as { error?: string }).error,
    });
    return { success: false, error: uploadError.message, uploadError };
  }

  if (!uploadData?.path) {
    console.error('❌ Upload réussi mais pas de path retourné:', uploadData);
    return { success: false, error: 'Pas de path retourné', uploadData };
  }

    path: uploadData.path,
    id: uploadData.id,
    fullPath: uploadData.fullPath,
  });

  // Étape 5: Vérifier le fichier uploadé
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
  }

  // Étape 6: Tester le téléchargement
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


  // Étape 7: Nettoyer (supprimer le fichier de test)
  const { error: removeError } = await supabase.storage
    .from('attachments')
    .remove([testPath]);

  if (removeError) {
    console.warn('⚠️ Impossible de supprimer le fichier de test:', removeError);
  } else {
  }

  // Résumé

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







