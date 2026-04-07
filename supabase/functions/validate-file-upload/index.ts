/**
 * Edge Function: Validate File Upload
 *
 * Validation backend renforcée pour les uploads de fichiers
 * - Vérification magic bytes (signatures réelles)
 * - Validation MIME type
 * - Blocage extensions dangereuses
 * - Vérification taille
 *
 * @module validate-file-upload
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface FileValidationRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileContent: string; // Base64 encoded first 16 bytes
  allowedTypes?: string[];
  maxSizeBytes?: number;
}

interface ValidationResponse {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  securityLevel: 'safe' | 'warning' | 'danger';
}

/**
 * Signatures magiques (magic bytes) pour validation
 */
const FILE_SIGNATURES: Record<string, { signature: number[]; offset: number }> = {
  // Images
  'image/jpeg': { signature: [0xff, 0xd8, 0xff], offset: 0 },
  'image/png': { signature: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  'image/gif': { signature: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  'image/webp': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
  'image/bmp': { signature: [0x42, 0x4d], offset: 0 },
  'image/svg+xml': { signature: [0x3c, 0x73, 0x76, 0x67], offset: 0 }, // <svg

  // Documents
  'application/pdf': { signature: [0x25, 0x50, 0x44, 0x46], offset: 0 }, // %PDF
  'application/zip': { signature: [0x50, 0x4b, 0x03, 0x04], offset: 0 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    signature: [0x50, 0x4b, 0x03, 0x04],
    offset: 0,
  }, // DOCX is ZIP

  // Vidéos
  'video/mp4': { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp
  'video/webm': { signature: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },
  'video/quicktime': { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 },

  // Audio
  'audio/mpeg': { signature: [0xff, 0xfb], offset: 0 },
  'audio/wav': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
};

/**
 * Extensions dangereuses interdites
 */
const DANGEROUS_EXTENSIONS = [
  // Exécutables Windows
  'exe',
  'dll',
  'com',
  'bat',
  'cmd',
  'msi',
  'scr',
  'vbs',
  'ps1',
  // Exécutables Unix/Linux
  'sh',
  'bash',
  'zsh',
  'run',
  'bin',
  'app',
  'deb',
  'rpm',
  // Scripts
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'rb',
  'pl',
  'php',
  'asp',
  'aspx',
  'jsp',
  // Archives suspects
  'rar',
  'tar',
  'gz',
  '7z',
  'bz2',
  // Autres dangereux
  'dmg',
  'pkg',
  'jar',
  'apk',
  'ipa',
];

/**
 * Types MIME sûrs par défaut
 */
const DEFAULT_SAFE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

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
 * Valide la signature du fichier (magic bytes)
 */
function validateFileSignature(fileBytes: Uint8Array, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature) {
    // Type non supporté - autoriser si dans la liste blanche
    return true;
  }

  const startIndex = signature.offset;
  const requiredBytes = signature.signature;

  // Vérifier qu'on a assez de bytes
  if (fileBytes.length < startIndex + requiredBytes.length) {
    return false;
  }

  // Comparer les bytes
  return requiredBytes.every((byte, index) => {
    return fileBytes[startIndex + index] === byte;
  });
}

/**
 * Valide un fichier uploadé
 */
function validateFile(request: FileValidationRequest): ValidationResponse {
  const warnings: string[] = [];
  const {
    fileName,
    fileSize,
    mimeType,
    fileContent,
    allowedTypes = DEFAULT_SAFE_TYPES,
    maxSizeBytes = 10 * 1024 * 1024, // 10MB par défaut
  } = request;

  try {
    // 1. Vérification extension dangereuse
    if (isDangerousExtension(fileName)) {
      return {
        isValid: false,
        error: `Extension de fichier interdite : ${getFileExtension(fileName)}. Ce type de fichier peut être dangereux.`,
        securityLevel: 'danger',
      };
    }

    // 2. Validation taille
    if (fileSize > maxSizeBytes) {
      return {
        isValid: false,
        error: `Fichier trop volumineux. Maximum : ${Math.round(maxSizeBytes / 1024 / 1024)}MB, actuel : ${Math.round(fileSize / 1024 / 1024)}MB`,
        securityLevel: 'danger',
      };
    }

    // 3. Validation type MIME autorisé
    if (!allowedTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `Type de fichier non autorisé : ${mimeType}. Types acceptés : ${allowedTypes.map(t => t.split('/')[1]).join(', ')}.`,
        securityLevel: 'danger',
      };
    }

    // 4. Validation magic bytes (signature réelle)
    try {
      // Décoder le contenu base64
      const fileBytes = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));

      if (!validateFileSignature(fileBytes, mimeType)) {
        return {
          isValid: false,
          error:
            'Le contenu du fichier ne correspond pas au type déclaré. Fichier potentiellement corrompu ou falsifié.',
          securityLevel: 'danger',
        };
      }
    } catch (signatureError) {
      warnings.push('Impossible de valider la signature du fichier');
    }

    // 5. Vérifications supplémentaires
    if (fileSize < 100) {
      warnings.push('Fichier très petit, potentiellement vide');
    }

    if (fileName.length > 255) {
      return {
        isValid: false,
        error: 'Nom de fichier trop long (max 255 caractères)',
        securityLevel: 'danger',
      };
    }

    // Caractères suspects dans le nom
    if (/[<>:"|?*\x00-\x1F]/.test(fileName)) {
      return {
        isValid: false,
        error: 'Le nom du fichier contient des caractères interdits',
        securityLevel: 'danger',
      };
    }

    // Validation réussie
    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      securityLevel: warnings.length > 0 ? 'warning' : 'safe',
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Erreur lors de la validation : ${error instanceof Error ? error.message : String(error)}`,
      securityLevel: 'danger',
    };
  }
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const request: FileValidationRequest = await req.json();

    // Valider le fichier
    const validation = validateFile(request);

    return new Response(JSON.stringify(validation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: validation.isValid ? 200 : 400,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        isValid: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        securityLevel: 'danger',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
