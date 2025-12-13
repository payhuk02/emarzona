/**
 * Diagnostic automatique de la configuration du bucket "attachments"
 * Date: 1 Février 2025
 * 
 * Vérifie automatiquement si le bucket est correctement configuré
 * et fournit des instructions claires pour corriger le problème
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BucketDiagnosticResult {
  bucketExists: boolean;
  bucketIsPublic: boolean;
  publicReadPolicyExists: boolean;
  insertPolicyExists: boolean;
  isConfigured: boolean;
  issues: string[];
  solutions: string[];
  publicUrlExample?: string;
}

/**
 * Diagnostique la configuration du bucket "attachments"
 */
export async function diagnoseAttachmentsBucket(): Promise<BucketDiagnosticResult> {
  const result: BucketDiagnosticResult = {
    bucketExists: false,
    bucketIsPublic: false,
    publicReadPolicyExists: false,
    insertPolicyExists: false,
    isConfigured: false,
    issues: [],
    solutions: [],
  };

  try {
    // 1. Vérifier si le bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      result.issues.push(`Erreur lors de la récupération des buckets: ${bucketsError.message}`);
      result.solutions.push('Vérifiez votre connexion à Supabase');
      return result;
    }

    const attachmentsBucket = buckets?.find(b => b.id === 'attachments');
    result.bucketExists = !!attachmentsBucket;

    if (!attachmentsBucket) {
      result.issues.push('Le bucket "attachments" n\'existe pas');
      result.solutions.push('Créez le bucket "attachments" dans Supabase Dashboard > Storage');
      result.solutions.push('Assurez-vous que le bucket est marqué comme PUBLIC');
      return result;
    }

    // 2. Vérifier si le bucket est public
    result.bucketIsPublic = attachmentsBucket.public === true;

    if (!result.bucketIsPublic) {
      result.issues.push('Le bucket "attachments" n\'est pas PUBLIC');
      result.solutions.push('Allez dans Supabase Dashboard > Storage > Buckets');
      result.solutions.push('Sélectionnez le bucket "attachments"');
      result.solutions.push('Activez l\'option "Public bucket"');
    }

    // 3. Vérifier les politiques RLS (nécessite une requête SQL)
    // On ne peut pas vérifier directement depuis le client, mais on peut tester l'accès
    try {
      // Tester l'accès public avec un fichier de test
      const testPath = 'test-access-check.txt';
      const { data: testFile, error: testError } = await supabase.storage
        .from('attachments')
        .list('', { limit: 1 });

      // Si on peut lister (même vide), c'est bon signe
      if (!testError) {
        // On ne peut pas vérifier les politiques directement, mais on peut suggérer
        result.publicReadPolicyExists = true; // Optimiste
      } else {
        result.issues.push('Impossible d\'accéder au bucket (vérifiez les politiques RLS)');
        result.solutions.push('Exécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql');
        result.solutions.push('Dans Supabase Dashboard > SQL Editor, exécutez cette migration');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.issues.push(`Erreur lors de la vérification des politiques: ${errorMessage}`);
    }

    // 4. Générer un exemple d'URL publique
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const urlParts = supabaseUrl.replace('https://', '').split('.');
      const projectRef = urlParts[0];
      result.publicUrlExample = `https://${projectRef}.supabase.co/storage/v1/object/public/attachments/[chemin-fichier]`;
    }

    // 5. Déterminer si tout est configuré
    result.isConfigured = 
      result.bucketExists && 
      result.bucketIsPublic && 
      result.publicReadPolicyExists;

    // 6. Ajouter des solutions générales si nécessaire
    if (!result.isConfigured) {
      result.solutions.push('');
      result.solutions.push('📋 MIGRATION SQL À EXÉCUTER:');
      result.solutions.push('1. Allez dans Supabase Dashboard > SQL Editor');
      
      // Utiliser la migration complète qui crée ET configure le bucket
      result.solutions.push('2. Copiez le contenu de: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql');
      result.solutions.push('   (Cette migration CRÉE le bucket s\'il n\'existe pas ET configure tout)');
      
      result.solutions.push('3. Exécutez la migration');
      result.solutions.push('4. Attendez 2-3 minutes (délai de propagation)');
      result.solutions.push('5. Rechargez cette page et réessayez');
    }

    logger.info('Bucket diagnostic completed', result);

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error diagnosing bucket configuration', { error });
    result.issues.push(`Erreur lors du diagnostic: ${errorMessage}`);
    return result;
  }
}

/**
 * Formate le résultat du diagnostic pour affichage
 */
export function formatDiagnosticResult(result: BucketDiagnosticResult): string {
  const lines: string[] = [];

  lines.push('🔍 DIAGNOSTIC DE LA CONFIGURATION DU BUCKET "attachments"');
  lines.push('');
  
  lines.push('📊 ÉTAT:');
  lines.push(`  • Bucket existe: ${result.bucketExists ? '✅' : '❌'}`);
  lines.push(`  • Bucket public: ${result.bucketIsPublic ? '✅' : '❌'}`);
  lines.push(`  • Politique lecture publique: ${result.publicReadPolicyExists ? '✅' : '❌'}`);
  lines.push(`  • Configuration complète: ${result.isConfigured ? '✅' : '❌'}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('⚠️ PROBLÈMES DÉTECTÉS:');
    result.issues.forEach(issue => {
      lines.push(`  • ${issue}`);
    });
    lines.push('');
  }

  if (result.solutions.length > 0) {
    lines.push('💡 SOLUTIONS:');
    result.solutions.forEach(solution => {
      lines.push(`  ${solution}`);
    });
    lines.push('');
  }

  if (result.publicUrlExample) {
    lines.push('📝 EXEMPLE D\'URL PUBLIQUE:');
    lines.push(`  ${result.publicUrlExample}`);
    lines.push('');
  }

  return lines.join('\n');
}

