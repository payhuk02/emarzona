/**
 * FileUploadAdvanced - Upload avancé avec compression et validation
 * Date: 2025-01-27
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compress,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { logger } from '@/lib/logger';

interface FileUploadAdvancedProps {
  digitalProductId: string;
  onUploadComplete?: (fileId: string, fileUrl: string) => void;
  onCancel?: () => void;
}

export const FileUploadAdvanced = ({
  digitalProductId,
  onUploadComplete,
  onCancel,
}: FileUploadAdvancedProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    is_main: false,
    is_preview: false,
    requires_purchase: true,
    requires_license: false,
    description: '',
    tags: [] as string[],
    compression_enabled: false,
    metadata: {} as Record<string, any>,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation de la taille (max 500 MB)
    const maxSize = 500 * 1024 * 1024; // 500 MB
    if (file.size > maxSize) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 500 MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    if (!formData.name) {
      setFormData({ ...formData, name: file.name });
    }

    // Détecter le type MIME
    const mimeType = file.type || 'application/octet-stream';
    logger.debug('File selected', { fileName: file.name, fileSize: file.size, mimeType });
  };

  const calculateSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un fichier à uploader',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name) {
      toast({
        title: 'Nom manquant',
        description: 'Veuillez entrer un nom pour le fichier',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 🆕 Traitement avancé du fichier : validation, compression, scan antivirus
      const { processDigitalFile } = await import('@/lib/files/digital-file-processing');
      
      setUploadProgress(10);
      const processingResult = await processDigitalFile(selectedFile, {
        compress: true,
        maxSizeMB: 500,
        scanAntivirus: true,
        quality: 85,
      });

      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Erreur lors du traitement du fichier');
      }

      if (!processingResult.processedFile) {
        throw new Error('Fichier traité introuvable');
      }

      // Utiliser le fichier traité (compressé si applicable)
      const fileToUpload = processingResult.processedFile;
      
      // Afficher les informations de compression si applicable
      if (processingResult.compressionRatio && processingResult.compressionRatio > 0) {
        toast({
          title: '✅ Fichier compressé',
          description: `Taille réduite de ${processingResult.compressionRatio.toFixed(1)}% (${(processingResult.originalSize / 1024 / 1024).toFixed(2)}MB → ${(processingResult.processedSize! / 1024 / 1024).toFixed(2)}MB)`,
        });
      }

      setUploadProgress(30);

      // Calculer le checksum SHA-256 du fichier traité
      const checksum = await calculateSHA256(fileToUpload);

      setUploadProgress(40);

      // Upload vers Supabase Storage
      const uploadResult = await uploadToSupabaseStorage(fileToUpload, {
        bucket: 'digital-products',
        path: digitalProductId,
        onProgress: (progress) => {
          // Ajuster la progression (40% à 90%)
          setUploadProgress(40 + (progress * 0.5));
        },
        maxSizeBytes: 500 * 1024 * 1024, // 500 MB
      });

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Erreur lors de l\'upload');
      }

      // Créer l'entrée dans digital_product_files
      const { supabase } = await import('@/integrations/supabase/client');
      const fileSizeMB = (processingResult.processedSize || selectedFile.size) / (1024 * 1024);

      const { data: fileRecord, error: fileError } = await supabase
        .from('digital_product_files')
        .insert({
          digital_product_id: digitalProductId,
          name: formData.name,
          file_url: uploadResult.url,
          file_type: fileToUpload.type || selectedFile.type || 'application/octet-stream',
          file_size_mb: fileSizeMB,
          checksum_sha256: checksum,
          mime_type: fileToUpload.type || selectedFile.type || 'application/octet-stream',
          category: formData.category || null,
          is_main: formData.is_main,
          is_preview: formData.is_preview,
          requires_purchase: formData.requires_purchase,
          requires_license: formData.requires_license,
          description: formData.description || null,
          tags: formData.tags,
          compression_enabled: formData.compression_enabled,
          metadata: formData.metadata,
          version_number: 1,
          file_version: '1.0.0',
        })
        .select()
        .single();

      if (fileError) {
        logger.error('Error creating file record', { error: fileError });
        throw fileError;
      }

      toast({
        title: 'Fichier uploadé',
        description: 'Le fichier a été uploadé avec succès',
      });

      if (onUploadComplete && fileRecord) {
        onUploadComplete(fileRecord.id, uploadResult.url);
      }

      // Reset form
      setSelectedFile(null);
      setFormData({
        name: '',
        category: '',
        is_main: false,
        is_preview: false,
        requires_purchase: true,
        requires_license: false,
        description: '',
        tags: [],
        compression_enabled: false,
        metadata: {},
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      logger.error('Error uploading file', { error });
      toast({
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible d\'uploader le fichier',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de fichier avancé
        </CardTitle>
        <CardDescription>
          Uploadez un fichier avec compression et métadonnées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection de fichier */}
        <div className="space-y-2">
          <Label>Sélectionner un fichier *</Label>
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="flex-1"
            />
            {selectedFile && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={isUploading}
                aria-label="Annuler la sélection du fichier"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informations de base */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du fichier *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nom du fichier"
            required
            disabled={isUploading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={isUploading}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Principal</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="source">Code source</SelectItem>
                <SelectItem value="update">Mise à jour</SelectItem>
                <SelectItem value="patch">Patch</SelectItem>
                <SelectItem value="demo">Démo</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description du fichier"
            rows={3}
            disabled={isUploading}
          />
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Fichier principal</Label>
              <div className="text-sm text-muted-foreground">
                Marquer comme fichier principal du produit
              </div>
            </div>
            <Switch
              checked={formData.is_main}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_main: checked })
              }
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Fichier de prévisualisation</Label>
              <div className="text-sm text-muted-foreground">
                Accessible sans achat
              </div>
            </div>
            <Switch
              checked={formData.is_preview}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_preview: checked })
              }
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compression</Label>
              <div className="text-sm text-muted-foreground">
                Activer la compression automatique
              </div>
            </div>
            <Switch
              checked={formData.compression_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, compression_enabled: checked })
              }
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Progression */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Upload en cours...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Annuler
            </Button>
          )}
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Uploader
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

