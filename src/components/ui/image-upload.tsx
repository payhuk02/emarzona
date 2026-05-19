import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Image as ImageIcon,
  Eye,
  Trash2,
  Download,
  FileImage,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-optimization';
import { logger } from '@/lib/logger';
import { useProductImageUpload } from '@/hooks/useProductImageUpload';
import type { CatalogImagePath } from '@/lib/images/product-image-upload';
import { IMAGE_FILE_LIMITS } from '@/config/image-formats';

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  /** Taille max par fichier en Mo */
  maxSize?: number;
  acceptedFormats?: string[];
  /** @deprecated Conservé pour compatibilité — l'upload utilise catalogPath */
  storeId?: string;
  /** Chemin catalogue dans le bucket product-images */
  catalogPath?: CatalogImagePath;
  /** Recadrage 1536×1024 avant envoi (défaut: true) */
  normalizeToCatalog?: boolean;
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export const ImageUpload = ({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  maxSize = IMAGE_FILE_LIMITS.maxFileSizeMB,
  acceptedFormats = IMAGE_FILE_LIMITS.allowedFormats,
  catalogPath = 'products',
  normalizeToCatalog = true,
  className,
  disabled = false,
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    uploadOne,
    uploadMany,
    uploading,
    progress: uploadProgress,
  } = useProductImageUpload(catalogPath);
  const [dragOver, setDragOver] = useState(false);
  const [previewImages, setPreviewImages] = useState<UploadedFile[]>([]);

  const maxSizeBytes = maxSize * 1024 * 1024;

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (!acceptedFormats.includes(file.type)) {
          toast({
            title: 'Format non supporté',
            description: `Le fichier ${file.name} n'est pas dans un format supporté.`,
            variant: 'destructive',
          });
          return;
        }

        if (file.size > maxSizeBytes) {
          toast({
            title: 'Fichier trop volumineux',
            description: `Le fichier ${file.name} dépasse la taille maximale de ${maxSize} Mo.`,
            variant: 'destructive',
          });
          return;
        }
      }

      if (!multiple && fileArray.length > 1) {
        toast({
          title: 'Trop de fichiers',
          description: "Vous ne pouvez sélectionner qu'un seul fichier.",
          variant: 'destructive',
        });
        return;
      }

      const currentCount = Array.isArray(value) ? value.length : value ? 1 : 0;
      if (multiple && fileArray.length + currentCount > maxFiles) {
        toast({
          title: 'Limite de fichiers atteinte',
          description: `Vous ne pouvez pas télécharger plus de ${maxFiles} fichiers.`,
          variant: 'destructive',
        });
        return;
      }

      try {
        const uploadedUrls = multiple
          ? await uploadMany(fileArray, {
              maxSizeBytes,
              normalizeToCatalogFormat: normalizeToCatalog,
            })
          : [
              await uploadOne(fileArray[0], {
                maxSizeBytes,
                normalizeToCatalogFormat: normalizeToCatalog,
              }),
            ];

        uploadedUrls.forEach((url, i) => {
          const file = fileArray[i] ?? fileArray[0];
          setPreviewImages(prev => [
            ...prev,
            {
              id: `${Date.now()}-${i}`,
              name: file.name,
              url,
              size: file.size,
              type: file.type,
              uploadedAt: new Date(),
            },
          ]);
        });

        if (multiple) {
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];
          onChange([...currentValues, ...uploadedUrls]);
        } else {
          onChange(uploadedUrls[0]);
        }

        toast({
          title: 'Succès',
          description: normalizeToCatalog
            ? `${uploadedUrls.length} image(s) recadrée(s) 1536×1024 et téléchargée(s).`
            : `${uploadedUrls.length} image(s) téléchargée(s).`,
        });
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : String(_error);
        logger.error('Upload error', { error: errorMessage, fileCount: fileArray.length });
        toast({
          title: 'Erreur de téléchargement',
          description: errorMessage || 'Une erreur est survenue lors du téléchargement.',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [
      acceptedFormats,
      maxFiles,
      maxSize,
      maxSizeBytes,
      multiple,
      normalizeToCatalog,
      onChange,
      toast,
      uploadMany,
      uploadOne,
      value,
    ]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    void handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((_, i) => i !== index));
    } else {
      onChange('');
    }
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const getImagePreview = () => {
    if (multiple && Array.isArray(value)) return value;
    if (value && !Array.isArray(value)) return [value];
    return [];
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-600" />
            </div>

            <div>
              <h3 className="text-lg font-medium">
                {multiple ? 'Téléchargez vos images' : 'Téléchargez une image'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                {normalizeToCatalog && ' — recadrage auto 1536×1024'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Téléchargement...' : 'Sélectionner des fichiers'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="flex items-center gap-2"
              >
                <FileImage className="h-4 w-4" />
                Depuis l'URL
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              <p>Formats acceptés: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}</p>
              <p>Taille maximale: {maxSize} Mo par fichier</p>
              {multiple && <p>Maximum: {maxFiles} fichiers</p>}
            </div>
          </div>

          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center mt-2">
                Téléchargement en cours... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        multiple={multiple}
        onChange={e => void handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {getImagePreview().length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Images téléchargées</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getImagePreview().map((url, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative group">
                    <img
                      src={url}
                      alt={`Prévisualisation ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Téléchargé
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-medium truncate">Image {index + 1}</p>
                    <p className="text-xs text-gray-500">
                      {previewImages[index]?.name
                        ? `${previewImages[index].name} (${formatFileSize(previewImages[index].size)})`
                        : `Image ${index + 1}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="image-url">Ou ajoutez une image depuis une URL</Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            placeholder="https://example.com/image.jpg"
            className="flex-1"
            disabled={disabled}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const url = e.currentTarget.value.trim();
                if (url) {
                  if (multiple) {
                    const currentValues = Array.isArray(value) ? value : value ? [value] : [];
                    onChange([...currentValues, url]);
                  } else {
                    onChange(url);
                  }
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              const input = document.getElementById('image-url') as HTMLInputElement;
              const url = input.value.trim();
              if (url) {
                if (multiple) {
                  const currentValues = Array.isArray(value) ? value : value ? [value] : [];
                  onChange([...currentValues, url]);
                } else {
                  onChange(url);
                }
                input.value = '';
              }
            }}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
};
