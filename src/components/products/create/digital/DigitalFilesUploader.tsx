/**
 * Digital Product - Files Uploader (Step 2)
 * Date: 27 octobre 2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, CheckCircle2, AlertCircle, Link2, Plus } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { DigitalProductFormData, DigitalProductDownloadableFile } from '@/types/digital-product-form';

interface DigitalFilesUploaderProps {
  formData: DigitalProductFormData;
  updateFormData: (updates: Partial<DigitalProductFormData>) => void;
}

export const DigitalFilesUploader = ({
  formData,
  updateFormData,
}: DigitalFilesUploaderProps) => {
  const [mainFileUrl, setMainFileUrl] = useState(formData.main_file_url || '');
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
   * Ajouter le fichier principal (URL)
   */
  const handleMainFileUrlChange = (url: string) => {
    setMainFileUrl(url);
    if (url && isValidUrl(url)) {
      updateFormData({ main_file_url: url });
    } else if (!url) {
      updateFormData({ main_file_url: '' });
    }
  };

  /**
   * Ajouter un fichier additionnel (URL)
   */
  const handleAddAdditionalUrl = () => {
    if (!additionalUrl.trim()) {
      toast({
        title: 'URL vide',
        description: 'Veuillez entrer une URL valide',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidUrl(additionalUrl)) {
      toast({
        title: 'URL invalide',
        description: 'Veuillez entrer une URL valide (commençant par http:// ou https://)',
        variant: 'destructive',
      });
      return;
    }

    // Extraire le nom du fichier depuis l'URL
    const fileName = additionalUrl.split('/').pop() || `Fichier ${(formData.downloadable_files?.length || 0) + 1}`;
    
    const newFile = {
      name: fileName,
      url: additionalUrl,
      size: 0, // Taille inconnue pour les URLs
      type: 'application/octet-stream', // Type générique
    };

    updateFormData({
      downloadable_files: [
        ...(formData.downloadable_files || []),
        newFile,
      ],
    });

    setAdditionalUrl('');
    toast({
      title: 'URL ajoutée',
      description: 'Le lien a été ajouté avec succès',
    });
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
   * Mettre à jour main_file_url quand formData change
   */
  useEffect(() => {
    if (formData.main_file_url !== mainFileUrl) {
      setMainFileUrl(formData.main_file_url || '');
    }
  }, [formData.main_file_url, mainFileUrl]);


  return (
    <div className="space-y-6">
      {/* Main File URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lien du produit principal</CardTitle>
          <CardDescription>
            Le lien que les clients recevront après l'achat (URL directe vers le fichier)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://exemple.com/fichier.pdf"
                value={mainFileUrl}
                onChange={(e) => handleMainFileUrlChange(e.target.value)}
                className="flex-1"
              />
            </div>
            {mainFileUrl && !isValidUrl(mainFileUrl) && (
              <p className="text-sm text-destructive">
                ⚠️ URL invalide. Veuillez entrer une URL valide (commençant par http:// ou https://)
              </p>
            )}
            {mainFileUrl && isValidUrl(mainFileUrl) && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Lien principal configuré</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {mainFileUrl}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMainFileUrl('');
                    updateFormData({ main_file_url: '' });
                  }}
                  aria-label="Supprimer le lien du produit principal"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
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
                onChange={(e) => setAdditionalUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAdditionalUrl();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddAdditionalUrl}
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

          {/* Files List */}
          {formData.downloadable_files && formData.downloadable_files.length > 0 && (
            <div className="space-y-2">
              <Label>Liens additionnels ({formData.downloadable_files.length})</Label>
              {formData.downloadable_files.map((file: DigitalProductDownloadableFile, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg space-x-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {file.url}
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
                    aria-label={`Supprimer le fichier ${file.name || index + 1}`}
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
              Conseils pour les liens
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Utilisez des URLs directes vers les fichiers (commençant par http:// ou https://)</li>
              <li>Assurez-vous que les liens sont accessibles publiquement</li>
              <li>Les liens peuvent pointer vers des fichiers hébergés sur Google Drive, Dropbox, ou tout autre service</li>
              <li>Pour Google Drive, utilisez le format de lien direct de téléchargement</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


