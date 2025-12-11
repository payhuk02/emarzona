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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      result.errors.push('Utilisateur non authentifié. Veuillez vous reconnecter.');
      return result;
    }
    result.userAuthenticated = true;
    result.userId = user.id;

    // 2. Vérifier le bucket (avec retry pour gérer la propagation)
    let attachmentsBucket = null;
    let bucketsError = null;

    // Essayer jusqu'à 3 fois avec délai (pour gérer la propagation Supabase)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: buckets, error: error } = await supabase.storage.listBuckets();
      bucketsError = error;

      if (!error && buckets) {
        attachmentsBucket = buckets.find(b => b.id === 'attachments');
        if (attachmentsBucket) {
          break; // Bucket trouvé, sortir de la boucle
        }
      }

      // Si ce n'est pas le dernier essai, attendre avant de réessayer
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    // Si le bucket n'est toujours pas trouvé, essayer quand même l'upload
    // (le bucket peut exister mais ne pas être visible immédiatement)
    if (!attachmentsBucket) {
      result.warnings.push(
        'Le bucket "attachments" n\'a pas été trouvé dans la liste. Tentative d\'upload direct...'
      );
      // On continue quand même pour tester l'upload
    } else {
      result.bucketExists = true;

      if (!attachmentsBucket.public) {
        result.errors.push(
          'Le bucket "attachments" n\'est PAS public. Activez "Public bucket" dans Supabase Dashboard > Storage > Buckets > "attachments"'
        );
        // On continue quand même pour tester l'upload
      } else {
        result.bucketPublic = true;
      }
    }

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

      // Si l'upload échoue, mettre à jour le statut du bucket
      if (!result.bucketExists) {
        result.errors.push(
          'Le bucket "attachments" n\'existe pas ou n\'est pas accessible. Vérifiez dans Supabase Dashboard > Storage > Buckets que le bucket "attachments" existe et est PUBLIC.'
        );
      }

      if (
        errorMessage.includes('row-level security') ||
        errorMessage.includes('RLS') ||
        errorMessage.includes('policy')
      ) {
        result.errors.push(
          'Les politiques RLS bloquent l\'upload. Vérifiez que les 4 politiques RLS sont créées dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies.'
        );
        result.errors.push(
          'Exécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql'
        );
      } else if (errorMessage.includes('mime type') && errorMessage.includes('json')) {
        result.errors.push(
          "Les restrictions MIME types bloquent l'upload. Vérifiez que le bucket n'a pas de restrictions MIME dans Supabase Dashboard."
        );
        result.errors.push(
          'Exécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql'
        );
      } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        result.errors.push(
          'Le bucket "attachments" n\'existe pas. Créez-le dans Supabase Dashboard > Storage > Buckets, ou exécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql'
        );
      } else {
        result.errors.push(`Erreur d'upload: ${errorMessage}`);
        result.errors.push(
          'Vérifiez dans Supabase Dashboard que le bucket "attachments" existe, est PUBLIC, et a les 4 politiques RLS configurées.'
        );
      }
      return result;
    }

    // 4. Si l'upload réussit, tout est correct
    // Mettre à jour les statuts même si le bucket n'était pas dans la liste initiale
    result.bucketExists = true;
    result.bucketPublic = true; // Si l'upload fonctionne, le bucket est accessible
    result.policiesExist = true;
    result.canUpload = true;

    logger.info('✅ Vérification des permissions de stockage réussie', result);
    return result;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    result.errors.push(`Erreur lors de la vérification: ${err.message || String(error)}`);
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
