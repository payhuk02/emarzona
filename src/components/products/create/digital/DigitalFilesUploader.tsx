/**
 * Digital Product - Files Uploader (Step 2)
 * Date: 27 octobre 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DigitalFilesUploaderProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const DigitalFilesUploader = ({
  formData,
  updateFormData,
}: DigitalFilesUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  /**
   * Upload file to Supabase Storage
   */
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  /**
   * Handle main file upload
   */
  const handleMainFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const url = await uploadFile(file);
      
      if (url) {
        updateFormData({ main_file_url: url });
        toast({
          title: 'Succès',
          description: 'Fichier principal uploadé',
        });
      } else {
        throw new Error('Failed to upload');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'upload du fichier',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle additional files upload
   */
  const handleAdditionalFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadFile(file);
        return {
          name: file.name,
          url: url || '',
          size: file.size,
          type: file.type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const validFiles = uploadedFiles.filter(f => f.url);

      updateFormData({
        downloadable_files: [
          ...(formData.downloadable_files || []),
          ...validFiles,
        ],
      });

      toast({
        title: 'Succès',
        description: `${validFiles.length} fichier(s) uploadé(s)`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'upload des fichiers',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * Remove additional file
   */
  const removeFile = (index: number) => {
    const newFiles = [...(formData.downloadable_files || [])];
    newFiles.splice(index, 1);
    updateFormData({ downloadable_files: newFiles });
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Main File */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fichier principal</CardTitle>
          <CardDescription>
            Le fichier que les clients recevront après l'achat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!formData.main_file_url ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Glissez-déposez votre fichier ou cliquez pour parcourir
              </p>
              <Input
                type="file"
                onChange={handleMainFileUpload}
                disabled={uploading}
                className="max-w-xs mx-auto"
              />
              {uploading && (
                <p className="text-sm text-primary mt-4">Upload en cours...</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Fichier principal uploadé</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.main_file_url.split('/').pop()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFormData({ main_file_url: '' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Files */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fichiers additionnels (optionnel)</CardTitle>
          <CardDescription>
            Ajoutez des bonus, ressources ou fichiers complémentaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <File className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Ajoutez des fichiers complémentaires
            </p>
            <Input
              type="file"
              multiple
              onChange={handleAdditionalFilesUpload}
              disabled={uploading}
              className="max-w-xs mx-auto"
            />
          </div>

          {/* Files List */}
          {formData.downloadable_files && formData.downloadable_files.length > 0 && (
            <div className="space-y-2">
              <Label>Fichiers ({formData.downloadable_files.length})</Label>
              {formData.downloadable_files.map((file: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg space-x-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle Preview (only if create_free_preview is enabled) */}
                  {formData.create_free_preview && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`is_preview_${index}`}
                        checked={file.is_preview || false}
                        onChange={(e) => {
                          const newFiles = [...formData.downloadable_files];
                          newFiles[index] = {
                            ...newFiles[index],
                            is_preview: e.target.checked,
                            requires_purchase: !e.target.checked,
                          };
                          updateFormData({ downloadable_files: newFiles });
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label 
                        htmlFor={`is_preview_${index}`} 
                        className="text-xs cursor-pointer text-muted-foreground"
                      >
                        Preview gratuit
                      </Label>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.create_free_preview && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Les fichiers cochés "Preview gratuit" seront inclus dans le produit preview gratuit
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Conseils pour l'upload
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Formats acceptés : PDF, ZIP, MP3, MP4, EPUB, etc.</li>
              <li>Taille maximale recommandée : 500 MB par fichier</li>
              <li>Assurez-vous que vos fichiers sont optimisés</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


