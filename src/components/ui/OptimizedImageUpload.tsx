/**
 * Composant d'upload d'images optimisé pour le SEO
 * Intègre automatiquement l'optimisation, la compression et les métadonnées SEO
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  TrendingUp,
  FileImage
} from 'lucide-react';
import { useOptimizedImageUpload } from '@/lib/image-upload-service';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface OptimizedImageUploadProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  bucketName?: string;
  folder?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  generateThumbnail?: boolean;
  generateSizes?: boolean;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  className?: string;

  // SEO
  requireAltText?: boolean;
  showSEOAnalysis?: boolean;
  autoGenerateAlt?: boolean;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  result?: any;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  seoScore?: number;
  compressionStats?: {
    ratio: string;
    saved: string;
    finalSize: string;
  };
}

export const OptimizedImageUpload: React.FC<OptimizedImageUploadProps> = ({
  onUploadComplete,
  onUploadError,
  bucketName = 'images',
  folder = 'products',
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  generateThumbnail = true,
  generateSizes = true,
  quality = 85,
  format = 'webp',
  className,
  requireAltText = true,
  showSEOAnalysis = true,
  autoGenerateAlt = true
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, isUploading, progress } = useOptimizedImageUpload();

  // Gestionnaire de sélection de fichiers
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    // Validation des fichiers
    for (const file of fileArray) {
      // Vérifier le type
      if (!acceptedTypes.includes(file.type)) {
        onUploadError?.(`Type de fichier non supporté: ${file.type}`);
        continue;
      }

      // Vérifier la taille
      if (file.size > maxSizeMB * 1024 * 1024) {
        onUploadError?.(`Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${maxSizeMB}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    // Vérifier la limite de fichiers
    if (uploadedImages.length + validFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    // Créer les objets d'upload
    const newUploads: UploadedImage[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const
    }));

    setUploadedImages(prev => [...prev, ...newUploads]);

    // Upload parallèle des fichiers
    for (const upload of newUploads) {
      try {
        const result = await uploadImage(upload.file, bucketName, {
          quality,
          format,
          generateThumbnail,
          folder,
          sizes: generateSizes ? [400, 800, 1200, 1600] : undefined,
          seo: {
            altText: autoGenerateAlt ? generateAltText(upload.file.name) : undefined
          }
        });

        if (result.success) {
          // Calculer les stats de compression
          const compressionStats = result.metadata ? {
            ratio: `${result.metadata.compressionRatio.toFixed(1)}%`,
            saved: `${((result.metadata.originalSize - result.metadata.optimizedSize) / 1024).toFixed(1)} KB`,
            finalSize: `${(result.metadata.optimizedSize / 1024).toFixed(1)} KB`
          } : undefined;

          setUploadedImages(prev => prev.map(img =>
            img.id === upload.id
              ? {
                  ...img,
                  status: 'success',
                  result,
                  seoScore: result.metadata?.seoScore,
                  compressionStats
                }
              : img
          ));

          onUploadComplete?.(result);
        } else {
          throw new Error(result.error || 'Erreur d\'upload');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur d\'upload';

        setUploadedImages(prev => prev.map(img =>
          img.id === upload.id
            ? { ...img, status: 'error', error: errorMessage }
            : img
        ));

        onUploadError?.(errorMessage);
        logger.error('Erreur upload image optimisée', { error, fileName: upload.file.name });
      }
    }
  }, [
    uploadedImages.length,
    maxFiles,
    acceptedTypes,
    maxSizeMB,
    uploadImage,
    bucketName,
    quality,
    format,
    generateThumbnail,
    folder,
    generateSizes,
    autoGenerateAlt,
    onUploadComplete,
    onUploadError
  ]);

  // Gestionnaire de drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Supprimer une image
  const removeImage = useCallback((id: string) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Générer automatiquement un texte alternatif
  const generateAltText = (filename: string): string => {
    // Enlever l'extension et les caractères spéciaux
    const name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // Capitaliser et nettoyer
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const totalUploaded = uploadedImages.filter(img => img.status === 'success').length;
  const totalErrors = uploadedImages.filter(img => img.status === 'error').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone d'upload */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
              isUploading && 'opacity-50 pointer-events-none'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

            <div className="space-y-2">
              <p className="text-lg font-medium">
                Glissez-déposez vos images ici
              </p>
              <p className="text-sm text-muted-foreground">
                ou <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600 underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  parcourez vos fichiers
                </button>
              </p>
            </div>

            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>• Formats acceptés: JPEG, PNG, WebP</p>
              <p>• Taille max: {maxSizeMB}MB par image</p>
              <p>• Optimisation automatique pour le SEO</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Barre de progression globale */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload en cours...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé des uploads */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{totalUploaded} réussis</span>
                </div>
                {totalErrors > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{totalErrors} erreurs</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadedImages([])}
              >
                Vider
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des images uploadées */}
      {uploadedImages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {uploadedImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={image.preview}
                  alt={image.file.name}
                  className="w-full h-48 object-cover"
                />

                {/* Badge de statut */}
                <div className="absolute top-2 left-2">
                  {image.status === 'uploading' && (
                    <Badge variant="secondary">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                      Upload
                    </Badge>
                  )}
                  {image.status === 'success' && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Optimisé
                    </Badge>
                  )}
                  {image.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Erreur
                    </Badge>
                  )}
                </div>

                {/* Bouton de suppression */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Informations de base */}
                <div>
                  <p className="font-medium text-sm truncate">{image.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Métriques d'optimisation */}
                {image.status === 'success' && image.compressionStats && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-green-500" />
                      <span className="text-xs">Compression: {image.compressionStats.ratio}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Économisé: {image.compressionStats.saved}
                    </div>
                  </div>
                )}

                {/* Score SEO */}
                {image.status === 'success' && showSEOAnalysis && image.seoScore !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">SEO Score</span>
                    </div>
                    <Badge
                      variant={image.seoScore >= 80 ? 'default' : image.seoScore >= 60 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {image.seoScore}/100
                    </Badge>
                  </div>
                )}

                {/* Erreur */}
                {image.status === 'error' && image.error && (
                  <Alert className="py-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {image.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* URL optimisée */}
                {image.status === 'success' && image.result?.url && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      ✅ Image optimisée et uploadée
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {image.result.url}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conseils d'optimisation */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Optimisation automatique</AlertTitle>
        <AlertDescription>
          Toutes les images sont automatiquement optimisées pour le SEO :
          compression WebP, tailles responsive, métadonnées optimisées.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OptimizedImageUpload;