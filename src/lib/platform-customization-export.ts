/**
 * Utilitaires pour l'export/import des personnalisations de la plateforme
 */

import { PlatformCustomizationData } from '@/hooks/admin/usePlatformCustomization';
import { validateCustomizationData } from '@/lib/schemas/platform-customization';
import { logger } from '@/lib/logger';

/**
 * Exporte les données de personnalisation en JSON
 */
export function exportCustomization(
  data: PlatformCustomizationData,
  filename: string = `platform-customization-${new Date().toISOString().split('T')[0]}.json`
): void {
  try {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.debug('Personnalisations exportées', { filename, level: 'section' });
  } catch (error: any) {
    logger.error('Erreur lors de l\'export', {
      error: error.message || String(error),
      level: 'section',
    });
    throw new Error('Impossible d\'exporter les personnalisations');
  }
}

/**
 * Importe les données de personnalisation depuis un fichier JSON
 */
export async function importCustomization(
  file: File
): Promise<{ valid: boolean; data?: PlatformCustomizationData; errors?: string[] }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Vérifier la structure du fichier
    if (!parsed.data) {
      return {
        valid: false,
        errors: ['Le fichier JSON ne contient pas de données de personnalisation valides'],
      };
    }

    // Valider les données importées
    const validation = validateCustomizationData(parsed.data);
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors.map(e => `${e.path}: ${e.message}`),
      };
    }

    logger.debug('Personnalisations importées avec succès', {
      version: parsed.version,
      exportedAt: parsed.exportedAt,
      level: 'section',
    });

    return {
      valid: true,
      data: validation.data || parsed.data,
    };
  } catch (error: any) {
    logger.error('Erreur lors de l\'import', {
      error: error.message || String(error),
      level: 'section',
    });

    if (error instanceof SyntaxError) {
      return {
        valid: false,
        errors: ['Le fichier JSON est invalide ou corrompu'],
      };
    }

    return {
      valid: false,
      errors: [error.message || 'Erreur inconnue lors de l\'import'],
    };
  }
}

/**
 * Importe depuis une chaîne JSON (pour coller directement)
 */
export function importCustomizationFromString(
  jsonString: string
): { valid: boolean; data?: PlatformCustomizationData; errors?: string[] } {
  try {
    const parsed = JSON.parse(jsonString);

    // Vérifier la structure
    const data = parsed.data || parsed; // Supporte les deux formats

    // Valider les données
    const validation = validateCustomizationData(data);
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors.map(e => `${e.path}: ${e.message}`),
      };
    }

    return {
      valid: true,
      data: validation.data || data,
    };
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        errors: ['Le JSON est invalide ou mal formaté'],
      };
    }

    return {
      valid: false,
      errors: [error.message || 'Erreur inconnue lors de l\'import'],
    };
  }
}

