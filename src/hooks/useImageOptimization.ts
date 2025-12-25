/**
 * Hook pour optimiser les images avant upload
 */

import { useState } from 'react';
import { optimizeImage } from '@/lib/image-optimization';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

type OptimizationType = 'standard' | 'thumbnail' | 'banner';

export const useImageOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const optimize = async (
    file: File,
    type: OptimizationType = 'standard'
  ): Promise<File | null> => {
    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Le fichier doit être une image',
        variant: 'destructive'
      });
      return null;
    }

    // Vérifier la taille max (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'Image trop volumineuse',
        description: 'La taille maximale est de 10MB',
        variant: 'destructive'
      });
      return null;
    }

    setIsOptimizing(true);

    try {
      const originalSize = (file.size / 1024).toFixed(2);
      
      // Optimiser avec les bonnes options selon le type
      let result;
      switch (type) {
        case 'thumbnail':
          result = await optimizeImage(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 600,
            initialQuality: 0.75
          });
          break;
        case 'banner':
          result = await optimizeImage(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85
          });
          break;
        default:
          result = await optimizeImage(file);
      }
      
      const optimizedFile = result.optimizedFile;

      const optimizedSize = (result.optimizedSize / 1024).toFixed(2);
      const reduction = result.compressionRatio.toFixed(0);

      logger.debug('Image optimized', { originalSize: `${originalSize}KB`, optimizedSize: `${optimizedSize}KB`, reduction: `${reduction}%` });

      toast({
        title: 'Image optimisée',
        description: `${originalSize}KB → ${optimizedSize}KB (${reduction}% de réduction)`,
      });

      return result.optimizedFile;
    } catch (error) {
      logger.error('Image optimization error', { error, fileName: file.name, type });
      toast({
        title: 'Erreur d\'optimisation',
        description: 'Impossible d\'optimiser l\'image',
        variant: 'destructive'
      });
      return file; // Retourner l'original en cas d'erreur
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    optimize,
    isOptimizing
  };
};
