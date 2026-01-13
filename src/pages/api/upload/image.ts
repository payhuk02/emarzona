/**
 * API Route pour l'upload et l'optimisation d'images
 * Traite côté serveur pour éviter les erreurs client-side avec Sharp
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { uploadOptimizedImage } from '@/lib/image-upload-service';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Utiliser l'API Web Streams pour traiter le FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }

    // Extraire les options
    const bucketName = formData.get('bucketName') as string || 'images';
    const options: any = {};

    // Parser les autres champs comme options
    for (const [key, value] of formData.entries()) {
      if (key !== 'file' && key !== 'bucketName') {
        if (typeof value === 'string') {
          try {
            options[key] = JSON.parse(value);
          } catch {
            options[key] = value;
          }
        } else {
          options[key] = value;
        }
      }
    }

    logger.info('Upload image via API', {
      filename: file.name,
      size: file.size,
      bucket: bucketName
    });

    // Utiliser la fonction d'upload optimisée
    const result = await uploadOptimizedImage(file, bucketName, options);

    logger.info('Image uploaded and optimized successfully', {
      url: result.url,
      optimizedSize: result.metadata?.optimizedSize
    });

    res.status(200).json(result);

  } catch (error) {
    logger.error('Image upload API error', { error });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined
    });
  }
}

// Configuration pour les gros fichiers
export const config = {
  api: {
    responseLimit: '10mb',
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};