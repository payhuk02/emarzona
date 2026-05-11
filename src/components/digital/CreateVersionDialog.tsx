/**
 * CreateVersionDialog - Dialog pour créer une nouvelle version avec upload de fichiers
 * Date: 1 Février 2025
 * 
 * Interface complète pour créer une version de produit digital avec :
 * - Upload de fichiers multiples
 * - Gestion des métadonnées de version
 * - Validation et gestion d'erreurs
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  useCreateDigitalProductVersion,
  type CreateDigitalProductVersionInput,
} from '@/hooks/digital/useDigitalProductVersions';
import {
  Upload,
  X,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@/lib/logger';

const versionFormSchema = z.object({
  version_number: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Format: major.minor.patch (ex: 1.2.3)'),
  version_name: z.string().optional(),
  release_notes: z.string().optional(),
  is_current: z.boolean().default(false),
  is_beta: z.boolean().default(false),
});

type VersionFormValues = z.infer<typeof versionFormSchema>;

interface CreateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  digitalProductId: string;
  productId: string;
  onSuccess?: () => void;
}

interface UploadedFile {
  file: File;
  uploadResult?: {
    path: string;
    publicUrl: string;
    signedUrl?: string | null;
    fileName: string;
    mimeType: string;
    size: number;
  };
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function CreateVersionDialog({
  open,
  onOpenChange,
  digitalProductId,
  productId,
  onSuccess,
}: CreateVersionDialogProps) {
  const { toast } = useToast();
  const createVersion = useCreateDigitalProductVersion();
  const { uploadFiles, state: uploadState } = useFileUpload();

  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionFormSchema),
    defaultValues: {
      version_number: '1.0.0',
      version_name: '',
      release_notes: '',
      is_current: false,
      is_beta: false,
    },
  });

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      
      if (files.length === 0) return;

      // Valider les fichiers
      const  validFiles: UploadedFile[] = files.map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      // Vérifier la taille totale (max 500MB par défaut)
      const totalSize = validFiles.reduce((sum, f) => sum + f.file.size, 0);
      const maxSize = 500 * 1024 * 1024; // 500MB

      if (totalSize > maxSize) {
        toast({
          title: 'Fichiers trop volumineux',
          description: `La taille totale des fichiers ne doit pas dépasser ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
          variant: 'destructive',
        });
        return;
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);
    },
    [toast]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      return [];
    }

    const filesToUpload = selectedFiles
      .filter((f) => f.status === 'pending')
      .map((f) => f.file);

    if (filesToUpload.length === 0) {
      return selectedFiles
        .filter((f) => f.uploadResult)
        .map((f) => f.uploadResult!);
    }

    // Mettre à jour le statut des fichiers
    setSelectedFiles((prev) =>
      prev.map((f) =>
        filesToUpload.includes(f.file)
          ? { ...f, status: 'uploading' as const }
          : f
      )
    );

    try {
      const uploadResults = await uploadFiles(filesToUpload, {
        bucket: 'products',
        folder: `digital/${digitalProductId}/versions`,
        maxSize: 500 * 1024 * 1024, // 500MB
        compressImages: false, // Ne pas compresser les fichiers de produits
        onProgress: (progress) => {
          setUploadProgress(progress);
          // Mettre à jour la progression de chaque fichier
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.status === 'uploading'
                ? { ...f, progress }
                : f
            )
          );
        },
      });

      // Mettre à jour les fichiers avec les résultats
      setSelectedFiles((prev) => {
        const updated = [...prev];
        let  resultIndex= 0;

        for (let  i= 0; i < updated.length; i++) {
          if (updated[i].status === 'uploading') {
            if (resultIndex < uploadResults.length) {
              updated[i] = {
                ...updated[i],
                uploadResult: uploadResults[resultIndex],
                status: 'success' as const,
                progress: 100,
              };
              resultIndex++;
            } else {
              updated[i] = {
                ...updated[i],
                status: 'error' as const,
                error: 'Erreur lors de l\'upload',
              };
            }
          }
        }

        return updated;
      });

      return uploadResults;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error uploading files', { error: errorMessage });

      // Mettre à jour les fichiers en erreur
      setSelectedFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? {
                ...f,
                status: 'error' as const,
                error: error.message || 'Erreur lors de l\'upload',
              }
            : f
        )
      );

      throw error;
    }
  }, [selectedFiles, uploadFiles, digitalProductId]);

  const onSubmit = async (data: VersionFormValues) => {
    try {
      // Uploader les fichiers d'abord
      if (selectedFiles.length > 0) {
        await handleUploadFiles();
      }

      // Vérifier que tous les fichiers sont uploadés
      const failedFiles = selectedFiles.filter((f) => f.status === 'error');
      if (failedFiles.length > 0) {
        toast({
          title: 'Erreur d\'upload',
          description: `${failedFiles.length} fichier(s) n'ont pas pu être uploadés`,
          variant: 'destructive',
        });
        return;
      }

      // Préparer les fichiers pour la version
      const files = selectedFiles
        .filter((f) => f.uploadResult)
        .map((f) => ({
          url: f.uploadResult!.publicUrl,
          name: f.uploadResult!.fileName,
          size: f.uploadResult!.size,
        }));

      // Calculer la taille totale
      const fileSizeBytes = files.reduce((sum, f) => sum + f.size, 0);

      // Parser le numéro de version
      const [major, minor, patch] = data.version_number
        .split('.')
        .map(Number);

      // Créer la version
      const  versionInput: CreateDigitalProductVersionInput = {
        digital_product_id: digitalProductId,
        product_id: productId,
        version_number: data.version_number,
        major_version: major,
        minor_version: minor,
        patch_version: patch,
        version_name: data.version_name,
        release_notes: data.release_notes,
        files,
        is_current: data.is_current,
        is_beta: data.is_beta,
        file_size_bytes: fileSizeBytes,
      };

      await createVersion.mutateAsync(versionInput);

      toast({
        title: 'Version créée',
        description: `Version ${data.version_number} créée avec succès`,
      });

      // Réinitialiser le formulaire
      form.reset();
      setSelectedFiles([]);
      setUploadProgress(0);
      onOpenChange(false);
      onSuccess?.();
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating version', { error: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de créer la version',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle version</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle version de votre produit digital avec les fichiers associés
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations de version */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="version_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de version *</FormLabel>
                    <FormControl>
                      <Input placeholder="1.2.3" {...field} />
                    </FormControl>
                    <FormDescription>
                      Format: major.minor.patch (ex: 1.2.3)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la version</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Version 2.0 - Nouveau Design"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="release_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes de version</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nouvelles fonctionnalités, corrections de bugs..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="is_current"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Version courante
                        </FormLabel>
                        <FormDescription>
                          Marquer cette version comme la version actuelle
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_beta"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Version beta</FormLabel>
                        <FormDescription>
                          Marquer cette version comme beta
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Upload de fichiers */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Fichiers de la version *</Label>
                <FormDescription className="mb-2">
                  Sélectionnez les fichiers à inclure dans cette version (max 500MB par fichier)
                </FormDescription>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                  disabled={uploadState.uploading}
                />
              </div>

              {/* Liste des fichiers sélectionnés */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((uploadedFile, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <File className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                        </div>
                        {uploadedFile.status === 'uploading' && (
                          <div className="flex items-center gap-2 flex-1">
                            <Progress value={uploadedFile.progress} className="flex-1" />
                            <span className="text-xs text-muted-foreground">
                              {uploadedFile.progress}%
                            </span>
                          </div>
                        )}
                        {uploadedFile.status === 'success' && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Uploadé
                          </Badge>
                        )}
                        {uploadedFile.status === 'error' && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Erreur
                          </Badge>
                        )}
                      </div>
                      {uploadedFile.status !== 'uploading' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Progress global */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Upload en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setSelectedFiles([]);
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  createVersion.isPending ||
                  uploadState.uploading ||
                  selectedFiles.length === 0
                }
              >
                {createVersion.isPending || uploadState.uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadState.uploading ? 'Upload...' : 'Création...'}
                  </>
                ) : (
                  'Créer la version'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}







