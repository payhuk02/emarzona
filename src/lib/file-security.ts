/**
 * Module de Sécurité des Fichiers Upload
 * 
 * Validation renforcée pour prévenir :
 * - Upload de malware
 * - Fichiers exécutables déguisés
 * - Exploitation de vulnérabilités
 * 
 * @module file-security
 * @version 1.0.0
 */

/**
 * Signatures magiques (magic bytes) pour validation de type réel
 * Les 4-8 premiers bytes identifient de manière fiable le type de fichier
 */
const FILE_SIGNATURES: Record<string, { signature: number[]; offset: number }> = {
  // Images
  'image/jpeg': { signature: [0xFF, 0xD8, 0xFF], offset: 0 },
  'image/png': { signature: [0x89, 0x50, 0x4E, 0x47], offset: 0 },
  'image/gif': { signature: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  'image/webp': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
  'image/bmp': { signature: [0x42, 0x4D], offset: 0 },
  
  // Documents
  'application/pdf': { signature: [0x25, 0x50, 0x44, 0x46], offset: 0 }, // %PDF
  'application/zip': { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0 },
  
  // Vidéos
  'video/mp4': { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp
  'video/webm': { signature: [0x1A, 0x45, 0xDF, 0xA3], offset: 0 },
};

/**
 * Extensions de fichiers dangereux interdits
 * Liste complète de fichiers exécutables et scripts
 */
const DANGEROUS_EXTENSIONS = [
  // Exécutables Windows
  'exe', 'dll', 'com', 'bat', 'cmd', 'msi', 'scr', 'vbs', 'ps1',
  // Exécutables Unix/Linux
  'sh', 'bash', 'zsh', 'run', 'bin', 'app', 'deb', 'rpm',
  // Scripts
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'pl', 'php', 'asp', 'aspx', 'jsp',
  // Archives suspects
  'rar', 'tar', 'gz', '7z', 'bz2',
  // Autres dangereux
  'dmg', 'pkg', 'jar', 'apk', 'ipa',
];

/**
 * Types MIME sûrs autorisés par catégorie
 */
export const SAFE_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  videos: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ],
};

/**
 * Résultat de la validation de sécurité
 */
export interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  securityLevel: 'safe' | 'warning' | 'danger';
}

/**
 * Lit les premiers bytes d'un fichier pour vérifier la signature
 */
async function readFileSignature(file: File, length: number = 8): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const blob = file.slice(0, length);
    
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(reader.result);
        resolve(Array.from(bytes));
      } else {
        reject(new Error('Erreur de lecture du fichier'));
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Vérifie si la signature du fichier correspond au type MIME déclaré
 */
function validateFileSignature(bytes: number[], mimeType: string, offset: number = 0): boolean {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature) return false; // Type non supporté
  
  // Vérifier l'offset si spécifié
  const startIndex = offset === 0 ? 0 : signature.offset;
  
  // Comparer les bytes
  return signature.signature.every((byte, index) => {
    return bytes[startIndex + index] === byte;
  });
}

/**
 * Extrait l'extension d'un fichier
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Vérifie si l'extension est dangereuse
 */
function isDangerousExtension(filename: string): boolean {
  const extension = getFileExtension(filename);
  return DANGEROUS_EXTENSIONS.includes(extension);
}

/**
 * Valide la cohérence entre extension et MIME type
 */
function validateExtensionMimeType(filename: string, mimeType: string): boolean {
  const extension = getFileExtension(filename);
  
  const extensionMap: Record<string, string[]> = {
    'jpg': ['image/jpeg', 'image/jpg'],
    'jpeg': ['image/jpeg', 'image/jpg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'mp4': ['video/mp4'],
    'webm': ['video/webm'],
  };
  
  const expectedMimeTypes = extensionMap[extension];
  if (!expectedMimeTypes) return false;
  
  return expectedMimeTypes.includes(mimeType);
}

/**
 * VALIDATION PRINCIPALE DE SÉCURITÉ
 * 
 * Effectue une validation multi-niveaux :
 * 1. Vérification extension dangereuse
 * 2. Validation MIME type autorisé
 * 3. Vérification signature réelle (magic bytes)
 * 4. Cohérence extension/MIME/signature
 * 
 * @param file - Fichier à valider
 * @param allowedTypes - Types MIME autorisés
 * @returns Résultat de validation avec niveau de sécurité
 * 
 * @example
 * ```typescript
 * const validation = await validateFileSecurity(file, SAFE_MIME_TYPES.images);
 * 
 * if (!validation.isValid) {
 *   toast.error(validation.error);
 *   return;
 * }
 * 
 * if (validation.securityLevel === 'warning') {
 *   toast.warning(validation.warnings?.join(', '));
 * }
 * 
 * // Procéder à l'upload
 * ```
 */
export async function validateFileSecurity(
  file: File,
  allowedTypes: string[] = SAFE_MIME_TYPES.images
): Promise<SecurityValidationResult> {
  const warnings: string[] = [];
  
  try {
    // 1. VÉRIFICATION EXTENSION DANGEREUSE
    if (isDangerousExtension(file.name)) {
      return {
        isValid: false,
        error: `Extension de fichier interdite : ${getFileExtension(file.name)}. Ce type de fichier peut être dangereux.`,
        securityLevel: 'danger',
      };
    }
    
    // 2. VALIDATION TYPE MIME AUTORISÉ
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Type de fichier non autorisé : ${file.type}. Types acceptés : ${allowedTypes.map(t => t.split('/')[1]).join(', ')}.`,
        securityLevel: 'danger',
      };
    }
    
    // 3. VÉRIFICATION COHÉRENCE EXTENSION/MIME
    if (!validateExtensionMimeType(file.name, file.type)) {
      warnings.push(`L'extension du fichier ne correspond pas au type déclaré`);
    }
    
    // 4. VALIDATION SIGNATURE RÉELLE (MAGIC BYTES)
    try {
      const bytes = await readFileSignature(file, 8);
      
      // Vérifier si la signature correspond au MIME type
      if (!validateFileSignature(bytes, file.type)) {
        return {
          isValid: false,
          error: `Le contenu du fichier ne correspond pas au type déclaré. Fichier potentiellement corrompu ou falsifié.`,
          securityLevel: 'danger',
        };
      }
    } catch (signatureError) {
      warnings.push('Impossible de valider la signature du fichier');
    }
    
    // 5. VÉRIFICATIONS ADDITIONNELLES
    
    // Taille fichier suspicieuse (très petit = potentiellement vide ou malformé)
    if (file.size < 100) {
      warnings.push('Fichier très petit, potentiellement vide');
    }
    
    // Nom de fichier suspect (caractères spéciaux, longueur excessive)
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'Nom de fichier trop long (max 255 caractères)',
        securityLevel: 'danger',
      };
    }
    
    // Caractères suspects dans le nom
    if (/[<>:"|?*\x00-\x1F]/.test(file.name)) {
      return {
        isValid: false,
        error: 'Le nom du fichier contient des caractères interdits',
        securityLevel: 'danger',
      };
    }
    
    // VALIDATION RÉUSSIE
    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      securityLevel: warnings.length > 0 ? 'warning' : 'safe',
    };
    
  } catch (error) {
    console.error('[File Security] Validation error:', error);
    return {
      isValid: false,
      error: 'Erreur lors de la validation du fichier',
      securityLevel: 'danger',
    };
  }
}

/**
 * Valide plusieurs fichiers en parallèle
 */
export async function validateMultipleFilesSecurity(
  files: File[],
  allowedTypes: string[] = SAFE_MIME_TYPES.images
): Promise<SecurityValidationResult[]> {
  const validations = await Promise.all(
    files.map(file => validateFileSecurity(file, allowedTypes))
  );
  
  return validations;
}

/**
 * Sanitise le nom de fichier pour éviter les problèmes
 * - Supprime caractères spéciaux
 * - Limite la longueur
 * - Normalise les espaces
 */
export function sanitizeFilename(filename: string): string {
  // Extraire extension
  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.slice(0, -(extension.length + 1));
  
  // Nettoyer le nom
  let sanitized = nameWithoutExt
    .normalize('NFD') // Décomposer accents
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Remplacer caractères spéciaux par _
    .replace(/_+/g, '_') // Fusionner underscores multiples
    .replace(/^_|_$/g, '') // Supprimer _ au début/fin
    .toLowerCase();
  
  // Limiter longueur (garder place pour timestamp)
  if (sanitized.length > 50) {
    sanitized = sanitized.slice(0, 50);
  }
  
  return `${sanitized}.${extension}`;
}

/**
 * Hook React pour validation de sécurité avec état
 */
export function useFileSecurityValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<SecurityValidationResult[]>([]);
  
  const validateFiles = async (files: File[], allowedTypes?: string[]) => {
    setIsValidating(true);
    
    try {
      const results = await validateMultipleFilesSecurity(files, allowedTypes);
      setValidationResults(results);
      return results;
    } finally {
      setIsValidating(false);
    }
  };
  
  const reset = () => {
    setValidationResults([]);
  };
  
  return {
    isValidating,
    validationResults,
    validateFiles,
    reset,
    allValid: validationResults.every(r => r.isValid),
    hasWarnings: validationResults.some(r => r.warnings && r.warnings.length > 0),
  };
}

// Import useState pour le hook
import { useState } from 'react';

