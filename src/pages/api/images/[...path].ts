/**
 * API Route pour servir les images optimisées
 * Optimise automatiquement les images à la demande avec cache intelligent
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { optimizeImage, getOptimalImageFormat } from '@/lib/image-optimization';
import { logger } from '@/lib/logger';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cache en mémoire (pour le développement)
const imageCache = new Map<string, { buffer: Buffer; headers: Record<string, string>; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Uniquement les requêtes GET
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;

    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    // Analyser le chemin: [bucket]/[folder]/[filename] ou [bucket]/[folder]/[size]/[filename]
    const [bucket, ...restPath] = path;

    if (!bucket) {
      return res.status(400).json({ error: 'Bucket required' });
    }

    // Détecter si c'est une taille spécifique (ex: 800w/filename.webp)
    let size: string | undefined;
    let filePath: string;

    if (restPath.length >= 2 && restPath[0].match(/^\d+w$/)) {
      size = restPath[0];
      filePath = restPath.slice(1).join('/');
    } else {
      filePath = restPath.join('/');
    }

    // Clé de cache
    const cacheKey = `${bucket}/${filePath}${size ? `/${size}` : ''}`;

    // Vérifier le cache
    const cached = imageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      // Servir depuis le cache
      Object.entries(cached.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.setHeader('X-Cache', 'HIT');
      res.status(200).send(cached.buffer);
      return;
    }

    // Récupérer l'image depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error || !data) {
      logger.warn('Image not found in storage', { bucket, filePath, error });
      return res.status(404).json({ error: 'Image not found' });
    }

    // Convertir en buffer
    const buffer = Buffer.from(await data.arrayBuffer());

    let optimizedBuffer = buffer;
    let finalFormat = 'webp'; // Format par défaut

    // Détecter le format optimal selon l'accept header
    const acceptHeader = req.headers.accept || '';
    const optimalFormat = getOptimalImageFormat(acceptHeader);

    // Appliquer l'optimisation si demandé
    const shouldOptimize = req.query.optimize !== 'false';

    if (shouldOptimize || size || optimalFormat !== 'jpeg') {
      try {
        let optimizationOptions: any = {
          quality: 85,
          format: optimalFormat
        };

        // Appliquer la taille spécifique si demandée
        if (size) {
          const width = parseInt(size.replace('w', ''));
          optimizationOptions.maxWidth = width;
          optimizationOptions.sizes = [width];
        }

        const result = await optimizeImage(buffer, optimizationOptions);
        optimizedBuffer = result.optimized;
        finalFormat = result.metadata.format;

        logger.info('Image optimized on demand', {
          originalSize: result.metadata.originalSize,
          optimizedSize: result.metadata.optimizedSize,
          compressionRatio: result.metadata.compressionRatio,
          format: finalFormat
        });

      } catch (optimizationError) {
        logger.warn('Image optimization failed, serving original', {
          error: optimizationError,
          bucket,
          filePath
        });
        // Continuer avec l'image originale
      }
    }

    // Headers de cache et performance
    const headers = {
      'Content-Type': `image/${finalFormat}`,
      'Cache-Control': `public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400`,
      'CDN-Cache-Control': 'max-age=31536000',
      'Vercel-CDN-Cache-Control': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Image-Optimized': shouldOptimize ? 'true' : 'false',
      'X-Image-Format': finalFormat,
      'X-Cache': 'MISS'
    };

    // Headers supplémentaires pour la sécurité
    if (finalFormat !== 'svg') {
      headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self'";
    }

    // Appliquer les headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Mettre en cache
    imageCache.set(cacheKey, {
      buffer: optimizedBuffer,
      headers,
      timestamp: Date.now()
    });

    // Nettoyer le cache périodiquement (garder seulement les 100 plus récentes)
    if (imageCache.size > 100) {
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      imageCache.clear();

      // Remettre seulement les 50 plus récentes
      entries.slice(0, 50).forEach(([key, value]) => {
        imageCache.set(key, value);
      });
    }

    // Servir l'image
    res.status(200).send(optimizedBuffer);

  } catch (error) {
    logger.error('Image API error', { error, path: req.query.path });

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Configuration Next.js pour l'API
export const config = {
  api: {
    responseLimit: '10mb',
    bodyParser: false
  }
};