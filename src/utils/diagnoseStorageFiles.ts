/**
 * Script de diagnostic pour vérifier l'existence des fichiers dans Supabase Storage
 * 
 * Ce script vérifie que tous les fichiers référencés dans vendor_message_attachments
 * existent réellement dans le bucket 'attachments'.
 * 
 * Date: 2 Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface StorageFileDiagnostic {
  attachmentId: string;
  fileName: string;
  storagePath: string;
  fileUrl: string;
  exists: boolean;
  error?: string;
  canGenerateSignedUrl: boolean;
  signedUrlError?: string;
}

export interface DiagnosticReport {
  totalFiles: number;
  existingFiles: number;
  missingFiles: number;
  files: StorageFileDiagnostic[];
  summary: {
    allExist: boolean;
    missingPaths: string[];
    recommendations: string[];
  };
}

/**
 * Vérifie si un fichier existe dans le bucket
 */
async function checkFileExists(storagePath: string): Promise<{ exists: boolean; error?: string }> {
  try {
    // Nettoyer le chemin (supprimer les préfixes inutiles)
    const cleanPath = storagePath
      .replace(/^attachments\//, '')
      .replace(/^\/attachments\//, '')
      .replace(/^storage\/v1\/object\/public\/attachments\//, '')
      .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/public\/attachments\//, '');

    // Essayer de générer une URL signée (si ça fonctionne, le fichier existe)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('attachments')
      .createSignedUrl(cleanPath, 60); // 60 secondes suffisent pour le diagnostic

    if (signedUrlError) {
      // Si l'erreur indique que le fichier n'existe pas
      const isNotFound = signedUrlError.message?.toLowerCase().includes('not found') ||
                        signedUrlError.message?.toLowerCase().includes('does not exist') ||
                        signedUrlError.code === '404' ||
                        signedUrlError.status === 404;

      return {
        exists: false,
        error: isNotFound 
          ? 'Fichier introuvable dans le bucket'
          : signedUrlError.message || 'Erreur inconnue',
      };
    }

    if (signedUrlData?.signedUrl) {
      // Vérifier que l'URL signée fonctionne réellement en essayant de charger le fichier
      try {
        const response = await fetch(signedUrlData.signedUrl, { 
          method: 'HEAD',
          cache: 'no-cache',
        });
        
        if (response.ok) {
          // Vérifier aussi le Content-Type pour s'assurer que c'est bien une image
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            // Si le serveur retourne du JSON, le fichier n'existe probablement pas
            return {
              exists: false,
              error: 'Le serveur retourne du JSON au lieu d\'une image (fichier introuvable)',
            };
          }
          
          return { exists: true };
        } else {
          // Si HEAD échoue, essayer GET pour voir la réponse complète
          try {
            const getResponse = await fetch(signedUrlData.signedUrl, { 
              method: 'GET',
              cache: 'no-cache',
            });
            
            if (getResponse.ok) {
              const contentType = getResponse.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                // Analyser la réponse JSON pour obtenir plus d'infos
                try {
                  const jsonData = await getResponse.json();
                  return {
                    exists: false,
                    error: `Fichier introuvable: ${jsonData.message || JSON.stringify(jsonData)}`,
                  };
                } catch {
                  return {
                    exists: false,
                    error: 'Le serveur retourne du JSON au lieu d\'une image',
                  };
                }
              }
              return { exists: true };
            } else {
              return {
                exists: false,
                error: `HTTP ${getResponse.status}: ${getResponse.statusText}`,
              };
            }
          } catch (getError: any) {
            return {
              exists: false,
              error: `Erreur lors de la vérification GET: ${getError.message}`,
            };
          }
        }
      } catch (fetchError: any) {
        return {
          exists: false,
          error: `Erreur lors de la vérification: ${fetchError.message}`,
        };
      }
    }

    return { exists: false, error: 'Impossible de générer une URL signée' };
  } catch (error: any) {
    return {
      exists: false,
      error: error.message || 'Erreur inconnue',
    };
  }
}

/**
 * Diagnostique tous les fichiers de vendor_message_attachments
 */
export async function diagnoseVendorMessageAttachments(): Promise<DiagnosticReport> {
  logger.info('🔍 Démarrage du diagnostic des fichiers storage...');

  try {
    // Récupérer tous les attachments
    const { data: attachments, error: fetchError } = await supabase
      .from('vendor_message_attachments')
      .select('id, file_name, storage_path, file_url')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des attachments: ${fetchError.message}`);
    }

    if (!attachments || attachments.length === 0) {
      logger.info('ℹ️ Aucun attachment trouvé');
      return {
        totalFiles: 0,
        existingFiles: 0,
        missingFiles: 0,
        files: [],
        summary: {
          allExist: true,
          missingPaths: [],
          recommendations: ['Aucun fichier à vérifier'],
        },
      };
    }

    logger.info(`📦 Vérification de ${attachments.length} fichiers...`);

    const diagnostics: StorageFileDiagnostic[] = [];
    let existingCount = 0;
    let missingCount = 0;

    // Vérifier chaque fichier
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const progress = ((i + 1) / attachments.length * 100).toFixed(1);

      logger.info(`[${progress}%] Vérification: ${attachment.file_name}...`);

      const { exists, error } = await checkFileExists(attachment.storage_path || attachment.file_url);

      // Vérifier aussi si on peut générer une URL signée
      let canGenerateSignedUrl = false;
      let signedUrlError: string | undefined;

      // Toujours essayer de générer une URL signée pour voir l'erreur exacte
      try {
        const cleanPath = (attachment.storage_path || attachment.file_url)
          .replace(/^attachments\//, '')
          .replace(/^\/attachments\//, '')
          .replace(/^storage\/v1\/object\/public\/attachments\//, '')
          .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/public\/attachments\//, '');

        const { data: signData, error: signError } = await supabase.storage
          .from('attachments')
          .createSignedUrl(cleanPath, 60);

        if (signError) {
          signedUrlError = signError.message || 'Erreur inconnue';
          canGenerateSignedUrl = false;
        } else if (signData?.signedUrl) {
          canGenerateSignedUrl = true;
          // Vérifier que l'URL signée fonctionne réellement
          try {
            const testResponse = await fetch(signData.signedUrl, { method: 'HEAD', cache: 'no-cache' });
            if (!testResponse.ok || testResponse.headers.get('content-type')?.includes('application/json')) {
              canGenerateSignedUrl = false;
              signedUrlError = `URL signée générée mais retourne ${testResponse.status} ou JSON`;
            }
          } catch (fetchErr: any) {
            canGenerateSignedUrl = false;
            signedUrlError = `Erreur lors du test de l'URL signée: ${fetchErr.message}`;
          }
        }
      } catch (err: any) {
        signedUrlError = err.message || 'Erreur lors de la génération de l\'URL signée';
      }

      // Si checkFileExists dit que le fichier existe mais que l'URL signée ne fonctionne pas,
      // considérer le fichier comme manquant
      const actuallyExists = exists && canGenerateSignedUrl;
      
      if (actuallyExists) {
        existingCount++;
      } else {
        missingCount++;
      }

      diagnostics.push({
        attachmentId: attachment.id,
        fileName: attachment.file_name,
        storagePath: attachment.storage_path || attachment.file_url,
        fileUrl: attachment.file_url,
        exists: actuallyExists,
        error: actuallyExists ? undefined : (error || signedUrlError || 'Fichier introuvable ou inaccessible'),
        canGenerateSignedUrl,
        signedUrlError,
      });
    }

    // Générer le résumé
    const missingPaths = diagnostics
      .filter(d => !d.exists)
      .map(d => d.storagePath);
    
    // Compter les fichiers qui ont des problèmes avec les URLs signées
    const filesWithSignedUrlIssues = diagnostics.filter(d => 
      !d.exists && d.canGenerateSignedUrl && d.signedUrlError
    ).length;

    const recommendations: string[] = [];

    if (missingCount > 0) {
      recommendations.push(
        `${missingCount} fichier(s) manquant(s) ou inaccessible(s). Actions recommandées:`,
        '1. Vérifier dans Supabase Dashboard (Storage → attachments) si les fichiers existent',
        '2. Si les fichiers n\'existent pas:',
        '   - Supprimer les entrées invalides de vendor_message_attachments',
        '   - Ou ré-uploader les fichiers manquants',
        '3. Si les fichiers existent mais avec un chemin différent:',
        '   - Corriger le storage_path en base de données',
        '4. Si les URLs signées sont générées mais retournent du JSON:',
        '   - Les fichiers n\'existent probablement pas dans le bucket',
        '   - Vérifier les politiques RLS du bucket attachments',
        '   - Vérifier que les fichiers ont bien été uploadés'
      );
      
      if (filesWithSignedUrlIssues > 0) {
        recommendations.push(
          `⚠️ ${filesWithSignedUrlIssues} fichier(s) ont des URLs signées générées mais retournent du JSON (fichiers introuvables)`
        );
      }
    } else {
      recommendations.push('✅ Tous les fichiers existent dans le bucket');
    }

    const report: DiagnosticReport = {
      totalFiles: attachments.length,
      existingFiles: existingCount,
      missingFiles: missingCount,
      files: diagnostics,
      summary: {
        allExist: missingCount === 0,
        missingPaths,
        recommendations,
      },
    };

    logger.info('✅ Diagnostic terminé', {
      total: report.totalFiles,
      existing: report.existingFiles,
      missing: report.missingFiles,
    });

    return report;
  } catch (error: any) {
    logger.error('❌ Erreur lors du diagnostic', { error: error.message });
    throw error;
  }
}

/**
 * Supprime les entrées avec fichiers manquants (optionnel)
 */
export async function cleanupMissingFiles(
  report: DiagnosticReport,
  confirm: boolean = false
): Promise<{ deleted: number; errors: string[] }> {
  if (!confirm) {
    throw new Error('Confirmation requise pour supprimer les fichiers manquants');
  }

  const missingFiles = report.files.filter(f => !f.exists);
  const deleted: string[] = [];
  const errors: string[] = [];

  for (const file of missingFiles) {
    try {
      const { error } = await supabase
        .from('vendor_message_attachments')
        .delete()
        .eq('id', file.attachmentId);

      if (error) {
        errors.push(`Erreur lors de la suppression de ${file.fileName}: ${error.message}`);
      } else {
        deleted.push(file.attachmentId);
      }
    } catch (err: any) {
      errors.push(`Exception lors de la suppression de ${file.fileName}: ${err.message}`);
    }
  }

  logger.info(`🧹 Nettoyage terminé: ${deleted.length} entrée(s) supprimée(s)`);

  return {
    deleted: deleted.length,
    errors,
  };
}

/**
 * Exporte le rapport de diagnostic en CSV
 */
export function exportDiagnosticReportToCSV(report: DiagnosticReport): string {
  const headers = ['ID', 'Nom du fichier', 'Chemin storage', 'URL', 'Existe', 'Erreur', 'URL signée possible'];
  const rows = report.files.map(f => [
    f.attachmentId,
    f.fileName,
    f.storagePath,
    f.fileUrl,
    f.exists ? 'Oui' : 'Non',
    f.error || '',
    f.canGenerateSignedUrl ? 'Oui' : 'Non',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Affiche le rapport de diagnostic dans la console
 */
export function displayDiagnosticReport(report: DiagnosticReport): void {
  console.group('📊 Rapport de Diagnostic - Fichiers Storage');
  console.log(`Total: ${report.totalFiles} fichiers`);
  console.log(`✅ Existants: ${report.existingFiles}`);
  console.log(`❌ Manquants: ${report.missingFiles}`);
  
  if (report.missingFiles > 0) {
    console.group('❌ Fichiers manquants:');
    report.files
      .filter(f => !f.exists)
      .forEach(f => {
        console.log(`- ${f.fileName}`);
        console.log(`  Chemin: ${f.storagePath}`);
        if (f.error) {
          console.log(`  Erreur: ${f.error}`);
        }
        if (f.signedUrlError) {
          console.log(`  Erreur URL signée: ${f.signedUrlError}`);
        }
      });
    console.groupEnd();
  }

  console.group('💡 Recommandations:');
  report.summary.recommendations.forEach(rec => console.log(rec));
  console.groupEnd();

  console.groupEnd();
}

