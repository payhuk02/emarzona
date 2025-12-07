/**
 * File Upload Enhanced Component
 * Date: 28 Janvier 2025
 * 
 * Composant d'upload amélioré avec :
 * - Progression réelle
 * - Preview avant upload
 * - Drag & drop amélioré
 * - Compression automatique images
 */

import React, { useState, useCallback, useRef, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileWithProgress, uploadMultipleFilesWithProgress } from '@/utils/fileUploadWithProgress';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export interface FileUploadEnhancedProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // MB
  acceptedFormats?: string[];
  bucket: string;
  path?: string;
  storeId?: string;
  compressImages?: boolean;
  showPreview?: boolean;
  className?: string;
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export const FileUploadEnhanced: React.FC<FileUploadEnhancedProps> = ({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  maxSize = 10, // MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  bucket,
  path,
  storeId,
  compressImages = true,
  showPreview = true,
  className,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);

  /**
   * Générer preview pour images
   */
  const generatePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  }, []);

  /**
   * Compresser image si nécessaire
   */
  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (!compressImages || !file.type.startsWith('image/')) {
      return file;
    }

    try {
      // Utiliser Canvas API pour compresser
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Redimensionner si trop grand (max 1920px)
          const maxWidth = 1920;
          const maxHeight = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            0.85 // Qualité 85%
          );
        };

        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      logger.warn('Erreur compression image', { error, fileName: file.name });
      return file; // Retourner fichier original en cas d'erreur
    }
  }, [compressImages]);

  /**
   * Gérer sélection de fichiers
   */
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validation
    for (const file of fileArray) {
      if (!acceptedFormats.includes(file.type)) {
        toast({
          title: 'Format non supporté',
          description: `Le fichier ${file.name} n'est pas dans un format supporté.`,
          variant: 'destructive',
        });
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `Le fichier ${file.name} dépasse la taille maximale de ${maxSize}MB.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!multiple && fileArray.length > 1) {
      toast({
        title: 'Trop de fichiers',
        description: 'Vous ne pouvez sélectionner qu\'un seul fichier.',
        variant: 'destructive',
      });
      return;
    }

    const currentCount = Array.isArray(value) ? value.length : (value ? 1 : 0);
    if (multiple && fileArray.length + currentCount > maxFiles) {
      toast({
        title: 'Limite de fichiers atteinte',
        description: `Vous ne pouvez pas télécharger plus de ${maxFiles} fichiers.`,
        variant: 'destructive',
      });
      return;
    }

    // Créer previews
    const newPreviews: FilePreview[] = [];
    for (const file of fileArray) {
      const preview = await generatePreview(file);
      newPreviews.push({
        file,
        preview,
        status: 'pending',
      });
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [acceptedFormats, maxSize, multiple, maxFiles, value, toast, generatePreview]);

  /**
   * Uploader les fichiers
   */
  const handleUpload = useCallback(async () => {
    if (previews.length === 0) return;

    setUploading(true);
    setGlobalProgress(0);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];
        
        // Mettre à jour statut
        setPreviews((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading', progress: 0 };
          return updated;
        });

        try {
          // Compresser si nécessaire
          const fileToUpload = await compressImage(preview.file);

          // Upload avec progression
          const result = await uploadFileWithProgress(fileToUpload, {
            bucket,
            path: path || (storeId ? `stores/${storeId}` : undefined),
            onProgress: (progress) => {
              setPreviews((prev) => {
                const updated = [...prev];
                updated[i] = { ...updated[i], progress };
                return updated;
              });
            },
            maxSizeBytes: maxSize * 1024 * 1024,
          });

          if (result.success && result.url) {
            uploadedUrls.push(result.url);
            
            setPreviews((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                status: 'success',
                progress: 100,
                url: result.url,
              };
              return updated;
            });
          } else {
            throw new Error(result.error || 'Erreur upload');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          
          setPreviews((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              status: 'error',
              error: errorMessage,
            };
            return updated;
          });

          logger.error('Erreur upload fichier', { error: errorMessage, fileName: preview.file.name });
        }
      }

      // Mettre à jour la valeur
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
        onChange([...currentValues, ...uploadedUrls]);
      } else if (uploadedUrls.length > 0) {
        onChange(uploadedUrls[0]);
      }

      toast({
        title: 'Succès',
        description: `${uploadedUrls.length} fichier(s) uploadé(s) avec succès !`,
      });

      // Nettoyer previews après 2 secondes
      setTimeout(() => {
        setPreviews([]);
      }, 2000);
    } catch (error) {
      logger.error('Erreur upload fichiers', { error });
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'upload.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setGlobalProgress(0);
    }
  }, [previews, bucket, path, storeId, maxSize, multiple, value, onChange, toast, compressImage]);

  /**
   * Supprimer preview
   */
  const handleRemovePreview = useCallback((index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Gérer drag & drop
   */
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (disabled) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [disabled, handleFileSelect]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone de drop */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          dragOver && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                Glissez-déposez vos fichiers ici
              </p>
              <p className="text-xs text-muted-foreground">
                ou cliquez pour sélectionner
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Sélectionner des fichiers
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={acceptedFormats.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled || uploading}
            />

            <div className="text-xs text-muted-foreground text-center">
              <p>Formats acceptés: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}</p>
              <p>Taille maximale: {maxSize}MB par fichier</p>
              {multiple && <p>Maximum: {maxFiles} fichiers</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previews */}
      {showPreview && previews.length > 0 && (
        <div className="space-y-2">
          {previews.map((preview, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-4">
                {/* Preview image */}
                {preview.preview ? (
                  <img
                    src={preview.preview}
                    alt={preview.file.name}
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                    <File className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Infos fichier */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{preview.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progression */}
                  {preview.status === 'uploading' && preview.progress !== undefined && (
                    <Progress value={preview.progress} className="mt-2" />
                  )}

                  {/* Erreur */}
                  {preview.status === 'error' && preview.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{preview.error}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Statut */}
                <div className="flex items-center space-x-2">
                  {preview.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {preview.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {preview.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}

                  {/* Bouton supprimer */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePreview(index)}
                    disabled={uploading}
                    aria-label={`Supprimer le fichier ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Bouton upload */}
          <Button
            type="button"
            onClick={handleUpload}
            disabled={disabled || uploading || previews.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Uploader {previews.length} fichier(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

