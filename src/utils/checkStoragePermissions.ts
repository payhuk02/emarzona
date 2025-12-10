/**
 * Utilitaire pour vérifier les permissions de stockage Supabase
 * Date: 1 Février 2025
 * 
 * Vérifie que le bucket est public et que les politiques RLS sont correctes
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface StoragePermissionCheck {
  bucketExists: boolean;
  bucketPublic: boolean;
  userAuthenticated: boolean;
  userId: string | null;
  policiesExist: boolean;
  canUpload: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Vérifie les permissions de stockage pour le bucket "attachments"
 */
export async function checkStoragePermissions(): Promise<StoragePermissionCheck> {
  const result: StoragePermissionCheck = {
    bucketExists: false,
    bucketPublic: false,
    userAuthenticated: false,
    userId: null,
    policiesExist: false,
    canUpload: false,
    errors: [],
    warnings: [],
  };

  try {
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      result.errors.push('Utilisateur non authentifié. Veuillez vous reconnecter.');
      return result;
    }
    result.userAuthenticated = true;
    result.userId = user.id;

    // 2. Vérifier le bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      result.errors.push(`Erreur lors de la récupération des buckets: ${bucketsError.message}`);
      return result;
    }

    const attachmentsBucket = buckets?.find(b => b.id === 'attachments');
    if (!attachmentsBucket) {
      result.errors.push('Le bucket "attachments" n\'existe pas. Exécutez la migration SQL: 20250201_create_attachments_bucket.sql');
      return result;
    }
    result.bucketExists = true;

    if (!attachmentsBucket.public) {
      result.errors.push('Le bucket "attachments" n\'est PAS public. Activez "Public bucket" dans Supabase Dashboard > Storage > Buckets > "attachments"');
      return result;
    }
    result.bucketPublic = true;

    // 3. Tester un upload minimal
    const testFileName = `test-permissions-${Date.now()}.txt`;
    const testContent = 'test';
    const testFile = new File([testContent], testFileName, { type: 'text/plain' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(`test/${testFileName}`, testFile, {
        contentType: 'text/plain',
      });

    // Nettoyer le fichier de test
    if (uploadData?.path) {
      await supabase.storage.from('attachments').remove([uploadData.path]);
    }

    if (uploadError) {
      const errorMessage = uploadError.message || '';
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        result.errors.push('Les politiques RLS bloquent l\'upload. Exécutez la migration SQL: 20250201_fix_attachments_final_complete.sql');
      } else if (errorMessage.includes('mime type') && errorMessage.includes('json')) {
        result.errors.push('Les restrictions MIME types bloquent l\'upload. Exécutez la migration SQL: 20250201_fix_attachments_mime_types.sql');
      } else {
        result.errors.push(`Erreur d'upload: ${errorMessage}`);
      }
      return result;
    }

    // 4. Vérifier les politiques RLS (via une requête SQL si possible)
    // Note: On ne peut pas vérifier directement les politiques depuis le client,
    // mais si l'upload fonctionne, les politiques sont correctes
    result.policiesExist = true;
    result.canUpload = true;

    logger.info('✅ Vérification des permissions de stockage réussie', result);
    return result;

  } catch (error: any) {
    result.errors.push(`Erreur lors de la vérification: ${error.message || error}`);
    logger.error('Erreur lors de la vérification des permissions de stockage', { error });
    return result;
  }
}

/**
 * Affiche un rapport de vérification des permissions
 */
export function formatPermissionCheckReport(check: StoragePermissionCheck): string {
  const lines: string[] = [];
  
  lines.push('📋 RAPPORT DE VÉRIFICATION DES PERMISSIONS');
  lines.push('==========================================');
  lines.push('');
  
  lines.push('✅ Authentification:');
  lines.push(`   Utilisateur authentifié: ${check.userAuthenticated ? '✅ OUI' : '❌ NON'}`);
  if (check.userId) {
    lines.push(`   ID utilisateur: ${check.userId}`);
  }
  lines.push('');
  
  lines.push('✅ Bucket "attachments":');
  lines.push(`   Existe: ${check.bucketExists ? '✅ OUI' : '❌ NON'}`);
  lines.push(`   Public: ${check.bucketPublic ? '✅ OUI' : '❌ NON'}`);
  lines.push('');
  
  lines.push('✅ Permissions:');
  lines.push(`   Politiques RLS: ${check.policiesExist ? '✅ OK' : '❌ MANQUANTES'}`);
  lines.push(`   Peut uploader: ${check.canUpload ? '✅ OUI' : '❌ NON'}`);
  lines.push('');
  
  if (check.errors.length > 0) {
    lines.push('❌ ERREURS:');
    check.errors.forEach(error => {
      lines.push(`   • ${error}`);
    });
    lines.push('');
  }
  
  if (check.warnings.length > 0) {
    lines.push('⚠️ AVERTISSEMENTS:');
    check.warnings.forEach(warning => {
      lines.push(`   • ${warning}`);
    });
    lines.push('');
  }
  
  if (check.canUpload && check.errors.length === 0) {
    lines.push('✅ TOUT EST CORRECT !');
    lines.push('   Vous pouvez maintenant uploader des fichiers.');
  } else {
    lines.push('❌ CORRECTIONS NÉCESSAIRES:');
    lines.push('   1. Vérifiez les erreurs ci-dessus');
    lines.push('   2. Exécutez les migrations SQL suggérées');
    lines.push('   3. Vérifiez dans Supabase Dashboard que le bucket est public');
    lines.push('   4. Réessayez après avoir corrigé les problèmes');
  }
  
  lines.push('');
  lines.push('==========================================');
  
  return lines.join('\n');
}

