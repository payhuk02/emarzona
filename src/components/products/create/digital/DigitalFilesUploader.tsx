/**
 * Digital Product - Files Uploader (Step 2)
 * Date: 27 octobre 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, AlertCircle, Link2, Plus } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type {
  DigitalProductFormData,
  DigitalProductDownloadableFile,
} from '@/types/digital-product-form';

interface DigitalFilesUploaderProps {
  formData: DigitalProductFormData;
  updateFormData: (updates: Partial<DigitalProductFormData>) => void;
}

export const DigitalFilesUploader = ({ formData, updateFormData }: DigitalFilesUploaderProps) => {
  const [mainUrl, setMainUrl] = useState('');
  const [additionalUrl, setAdditionalUrl] = useState('');
  const { toast } = useToast();

  /**
   * Valider une URL
   */
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Ajouter un fichier (URL)
   */
  const handleAddUrl = (url: string, isMain: boolean) => {
    if (!url.trim()) {
      toast({
        title: 'URL vide',
        description: 'Veuillez entrer une URL valide',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: 'URL invalide',
        description: 'Veuillez entrer une URL valide (commençant par http:// ou https://)',
        variant: 'destructive',
      });
      return;
    }

    // Extraire le nom du fichier depuis l'URL
    const fileName =
      url.split('/').pop() || `Fichier ${(formData.downloadable_files?.length || 0) + 1}`;

    const newFile = {
      name: fileName,
      url: url,
      size: 0, // Taille inconnue pour les URLs
      type: 'application/octet-stream', // Type générique
      is_main: isMain,
    };

    updateFormData({
      downloadable_files: [...(formData.downloadable_files || []), newFile],
    });

    if (isMain) {
      setMainUrl('');
    } else {
      setAdditionalUrl('');
    }

    toast({
      title: 'URL ajoutée',
      description: 'Le lien a été ajouté avec succès',
    });
  };

  /**
   * Remove file
   */
  const removeFile = (index: number) => {
    const newFiles = [...(formData.downloadable_files || [])];
    newFiles.splice(index, 1);
    updateFormData({ downloadable_files: newFiles });
  };

  const mainFiles = (formData.downloadable_files || []).filter(f => f.is_main);
  const additionalFiles = (formData.downloadable_files || []).filter(f => !f.is_main);

  const renderFileList = (files: DigitalProductDownloadableFile[], isMainList: boolean) => {
    if (files.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <Label>
          {isMainList ? 'Liens principaux ajoutés' : 'Liens additionnels ajoutés'} ({files.length})
        </Label>
        {formData.downloadable_files?.map((file, index) => {
          // Ne render que les fichiers du type demandé
          if (isMainList && !file.is_main) return null;
          if (!isMainList && file.is_main) return null;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg space-x-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground break-all">{file.url}</p>
                </div>
              </div>

              {/* Toggle Preview (only if create_free_preview is enabled) */}
              {formData.create_free_preview && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`is_preview_${index}`}
                    checked={file.is_preview || false}
                    onChange={e => {
                      const newFiles = [...(formData.downloadable_files || [])];
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
                aria-label={`Supprimer le fichier ${file.name || index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Files URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liens principaux (requis)</CardTitle>
          <CardDescription>
            Ajoutez un ou plusieurs liens vers votre produit principal (URLs externes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://exemple.com/fichier-principal.pdf"
                value={mainUrl}
                onChange={e => setMainUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl(mainUrl, true);
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => handleAddUrl(mainUrl, true)}
                disabled={!mainUrl.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            {mainUrl && !isValidUrl(mainUrl) && (
              <p className="text-sm text-destructive">
                ⚠️ URL invalide. Veuillez entrer une URL valide (commençant par http:// ou https://)
              </p>
            )}
          </div>

          {renderFileList(mainFiles, true)}
        </CardContent>
      </Card>

      {/* Additional Files URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liens additionnels (optionnel)</CardTitle>
          <CardDescription>
            Ajoutez des liens vers des bonus, ressources ou fichiers complémentaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://exemple.com/bonus.pdf"
                value={additionalUrl}
                onChange={e => setAdditionalUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl(additionalUrl, false);
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => handleAddUrl(additionalUrl, false)}
                disabled={!additionalUrl.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            {additionalUrl && !isValidUrl(additionalUrl) && (
              <p className="text-sm text-destructive">
                ⚠️ URL invalide. Veuillez entrer une URL valide (commençant par http:// ou https://)
              </p>
            )}
          </div>

          {renderFileList(additionalFiles, false)}

          {formData.create_free_preview &&
            formData.downloadable_files &&
            formData.downloadable_files.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Les fichiers cochés "Preview gratuit" seront inclus dans le produit preview
                gratuit
              </p>
            )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Conseils pour les liens
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Les URLs externes sont supportées pour Google Drive, Dropbox, Notion, etc.</li>
              <li>
                Assurez-vous que les liens sont accessibles par vos clients (permissions de
                partage).
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
