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
  const [mainLabel, setMainLabel] = useState('');
  const [additionalUrl, setAdditionalUrl] = useState('');
  const [additionalLabel, setAdditionalLabel] = useState('');
  const { toast } = useToast();

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddUrl = (url: string, label: string, isMain: boolean) => {
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

    const newFile: DigitalProductDownloadableFile = {
      name: label.trim(),
      url: url.trim(),
      size: 0,
      type: 'application/octet-stream',
      is_main: isMain,
    };

    updateFormData({
      downloadable_files: [...(formData.downloadable_files || []), newFile],
    });

    if (isMain) {
      setMainUrl('');
      setMainLabel('');
    } else {
      setAdditionalUrl('');
      setAdditionalLabel('');
    }

    toast({
      title: 'URL ajoutée',
      description: label.trim()
        ? `"${label.trim()}" a été ajouté avec succès`
        : 'Le lien a été ajouté avec succès',
    });
  };

  const removeFile = (index: number) => {
    const newFiles = [...(formData.downloadable_files || [])];
    newFiles.splice(index, 1);
    updateFormData({ downloadable_files: newFiles });
  };

  const updateFileLabel = (index: number, label: string) => {
    const newFiles = [...(formData.downloadable_files || [])];
    newFiles[index] = { ...newFiles[index], name: label };
    updateFormData({ downloadable_files: newFiles });
  };

  const updateFileUrl = (index: number, url: string) => {
    const newFiles = [...(formData.downloadable_files || [])];
    newFiles[index] = { ...newFiles[index], url: url.trim() };
    updateFormData({ downloadable_files: newFiles });
  };

  const mainFiles = (formData.downloadable_files || []).filter(f => f.is_main);
  const additionalFiles = (formData.downloadable_files || []).filter(f => !f.is_main);

  const renderAddForm = (
    url: string,
    label: string,
    setUrl: (value: string) => void,
    setLabel: (value: string) => void,
    isMain: boolean,
    urlPlaceholder: string
  ) => (
    <div className="border-2 border-dashed rounded-lg p-6 space-y-3">
      <div className="space-y-2">
        <Label htmlFor={isMain ? 'main-link-label' : 'additional-link-label'}>
          Nom du lien (optionnel)
        </Label>
        <Input
          id={isMain ? 'main-link-label' : 'additional-link-label'}
          type="text"
          placeholder="Ex: Module 1 — Vidéos complètes"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Ce nom sera affiché sur le bouton de téléchargement dans l&apos;espace client.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-muted-foreground shrink-0" />
        <Input
          type="url"
          placeholder={urlPlaceholder}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl(url, label, isMain);
            }
          }}
          className="flex-1"
        />
        <Button onClick={() => handleAddUrl(url, label, isMain)} disabled={!url.trim()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {url && !isValidUrl(url) && (
        <p className="text-sm text-destructive">
          URL invalide. Veuillez entrer une URL valide (commençant par http:// ou https://)
        </p>
      )}
    </div>
  );

  const renderFileList = (files: DigitalProductDownloadableFile[], isMainList: boolean) => {
    if (files.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <Label>
          {isMainList ? 'Liens principaux ajoutés' : 'Liens additionnels ajoutés'} ({files.length})
        </Label>
        {formData.downloadable_files?.map((file, index) => {
          if (isMainList && !file.is_main) return null;
          if (!isMainList && file.is_main) return null;

          const displayIndex = isMainList
            ? (formData.downloadable_files?.slice(0, index).filter(f => f.is_main).length ?? 0)
            : (formData.downloadable_files?.slice(0, index).filter(f => !f.is_main).length ?? 0);

          return (
            <div
              key={file.id ?? `${file.url}-${index}`}
              className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-center sm:space-x-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Link2 className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Input
                    type="text"
                    placeholder={`Nom affiché (sinon: Accédez au produit ${displayIndex + 1})`}
                    value={file.name || ''}
                    onChange={e => updateFileLabel(index, e.target.value)}
                  />
                  <Input
                    type="url"
                    value={file.url || ''}
                    onChange={e => updateFileUrl(index, e.target.value)}
                    aria-label={`URL du lien ${displayIndex + 1}`}
                  />
                  {file.url && !isValidUrl(file.url) && (
                    <p className="text-xs text-destructive">URL invalide (http:// ou https://)</p>
                  )}
                </div>
              </div>

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
                aria-label={`Supprimer le lien ${file.name || index + 1}`}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liens principaux (requis)</CardTitle>
          <CardDescription>
            Ajoutez un ou plusieurs liens vers votre produit principal (URLs externes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderAddForm(
            mainUrl,
            mainLabel,
            setMainUrl,
            setMainLabel,
            true,
            'https://exemple.com/fichier-principal.pdf'
          )}
          {renderFileList(mainFiles, true)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liens additionnels (optionnel)</CardTitle>
          <CardDescription>
            Ajoutez des liens vers des bonus, ressources ou fichiers complémentaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderAddForm(
            additionalUrl,
            additionalLabel,
            setAdditionalUrl,
            setAdditionalLabel,
            false,
            'https://exemple.com/bonus.pdf'
          )}
          {renderFileList(additionalFiles, false)}

          {formData.create_free_preview &&
            formData.downloadable_files &&
            formData.downloadable_files.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Les fichiers cochés &quot;Preview gratuit&quot; seront inclus dans le produit
                preview gratuit
              </p>
            )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Conseils pour les liens
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Donnez un nom clair à chaque lien pour faciliter l&apos;accès de vos clients.</li>
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
