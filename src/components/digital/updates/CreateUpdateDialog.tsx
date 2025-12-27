/**
 * Create Update Dialog Component
 * Date: 28 Janvier 2025
 * 
 * Dialog pour créer une nouvelle mise à jour de produit digital
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface CreateUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  digitalProductId: string;
  currentVersion: string;
  productName: string;
}

export function CreateUpdateDialog({
  open,
  onOpenChange,
  digitalProductId,
  currentVersion,
  productName,
}: CreateUpdateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [version, setVersion] = useState('');
  const [releaseType, setReleaseType] = useState<'major' | 'minor' | 'patch' | 'hotfix'>('minor');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isForced, setIsForced] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer la prochaine version suggérée
  const getSuggestedVersion = () => {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (releaseType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      case 'hotfix':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return currentVersion;
    }
  };

  const suggestedVersion = getSuggestedVersion();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier la taille (max 500MB)
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast({
          title: '❌ Fichier trop volumineux',
          description: 'La taille maximale est de 500MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${digitalProductId}/updates/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `digital-products/${fileName}`;

      // Upload du fichier
      // Note: Supabase Storage ne supporte pas onUploadProgress côté client
      // On simule la progression pour l'UX
      setUploadProgress(50);
      
      const { data, error } = await supabase.storage
        .from('product-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      setUploadProgress(100);

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('product-files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error uploading update file', { error, digitalProductId });
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de télécharger le fichier',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!version) {
      toast({
        title: '❌ Version requise',
        description: 'Veuillez entrer un numéro de version',
        variant: 'destructive',
      });
      return;
    }

    if (!title) {
      toast({
        title: '❌ Titre requis',
        description: 'Veuillez entrer un titre pour la mise à jour',
        variant: 'destructive',
      });
      return;
    }

    if (!changelog) {
      toast({
        title: '❌ Changelog requis',
        description: 'Veuillez entrer un changelog décrivant les modifications',
        variant: 'destructive',
      });
      return;
    }

    if (!file) {
      toast({
        title: '❌ Fichier requis',
        description: 'Veuillez sélectionner le fichier de mise à jour',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload du fichier
      const fileUrl = await handleUpload();
      if (!fileUrl) {
        setIsSubmitting(false);
        return;
      }

      // 2. Calculer la taille du fichier
      const fileSizeMB = file.size / (1024 * 1024);

      // 3. Créer la mise à jour
      const { data: update, error: updateError } = await supabase
        .from('digital_product_updates')
        .insert({
          digital_product_id: digitalProductId,
          version,
          previous_version: currentVersion,
          release_type: releaseType,
          title,
          description: description || null,
          changelog,
          file_url: fileUrl,
          file_size_mb: fileSizeMB,
          is_published: publishImmediately,
          is_forced: isForced,
          release_date: new Date().toISOString(),
          download_count: 0,
        })
        .select()
        .single();

      if (updateError) throw updateError;

      // 4. Mettre à jour la version du produit digital
      const { error: productError } = await supabase
        .from('digital_products')
        .update({
          version,
          changelog: changelog,
          last_version_date: new Date().toISOString(),
        })
        .eq('id', digitalProductId);

      if (productError) {
        logger.warn('Could not update product version', { error: productError });
      }

      // 5. Envoyer les notifications email automatiquement si publié immédiatement
      if (publishImmediately && update) {
        try {
          // Récupérer le product_id depuis digital_product
          const { data: digitalProduct } = await supabase
            .from('digital_products')
            .select('product_id, product:products(id, name)')
            .eq('id', digitalProductId)
            .single();

          if (digitalProduct?.product_id) {
            // Importer et appeler la fonction de notification
            const { notifyAllCustomersOfUpdate } = await import('@/lib/products/digital-product-updates');
            
            await notifyAllCustomersOfUpdate({
              product_id: digitalProduct.product_id,
              version,
              version_notes: changelog,
              download_url: fileUrl,
              previous_version: currentVersion,
              is_major_update: releaseType === 'major',
            });

            logger.info('Update notifications sent automatically', {
              updateId: update.id,
              version,
              digitalProductId,
            });
          }
        } catch (notifyError) {
          // Ne pas bloquer la création si les notifications échouent
          logger.error('Error sending update notifications', {
            error: notifyError,
            updateId: update.id,
          });
        }
      }

      // 6. Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['productUpdates', digitalProductId] });
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
      queryClient.invalidateQueries({ queryKey: ['digitalProduct', digitalProductId] });

      toast({
        title: '✅ Mise à jour créée',
        description: `La mise à jour ${version} a été créée${publishImmediately ? ' et les clients ont été notifiés' : ''}`,
      });

      // Reset form
      setVersion('');
      setTitle('');
      setDescription('');
      setChangelog('');
      setFile(null);
      setIsForced(false);
      setPublishImmediately(true);
      onOpenChange(false);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating update', { error, digitalProductId });
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReleaseTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Sparkles className="h-4 w-4" />;
      case 'minor':
        return <Package className="h-4 w-4" />;
      case 'patch':
        return <Zap className="h-4 w-4" />;
      case 'hotfix':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'minor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'patch':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'hotfix':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Nouvelle mise à jour - {productName}
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle version de votre produit digital
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Version & Release Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <div className="flex gap-2">
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder={suggestedVersion}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVersion(suggestedVersion)}
                  className="shrink-0"
                >
                  Utiliser {suggestedVersion}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Version actuelle: {currentVersion}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseType">Type de release *</Label>
              <Select value={releaseType} onValueChange={(value: string) => setReleaseType(value)}>
                <SelectTrigger id="releaseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="major">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Major (breaking changes)
                    </div>
                  </SelectItem>
                  <SelectItem value="minor">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Minor (nouvelles fonctionnalités)
                    </div>
                  </SelectItem>
                  <SelectItem value="patch">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Patch (corrections)
                    </div>
                  </SelectItem>
                  <SelectItem value="hotfix">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Hotfix (urgent)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nouvelle version avec améliorations majeures"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description courte de la mise à jour (optionnel)"
              rows={2}
            />
          </div>

          {/* Changelog */}
          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog *</Label>
            <Textarea
              id="changelog"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="Liste détaillée des modifications (une par ligne)"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Utilisez des puces (-) ou numéros (1.) pour formater votre changelog
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Fichier de mise à jour *</Label>
            <div className="border-2 border-dashed rounded-lg p-6">
              <input
                type="file"
                id="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".zip,.rar,.7z,.tar,.gz,.exe,.dmg,.pkg,.deb,.rpm"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="flex flex-col items-center justify-center gap-4">
                  {file ? (
                    <>
                      <FileText className="h-12 w-12 text-primary" />
                      <div className="text-center">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      {isUploading && (
                        <div className="w-full max-w-xs space-y-2">
                          <Progress value={uploadProgress} />
                          <p className="text-xs text-center text-muted-foreground">
                            {Math.round(uploadProgress)}%
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                        <p className="text-sm text-muted-foreground">
                          ZIP, RAR, EXE, DMG, etc. (max 500MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="publishImmediately"
                checked={publishImmediately}
                onCheckedChange={(checked) => setPublishImmediately(checked === true)}
              />
              <Label htmlFor="publishImmediately" className="cursor-pointer">
                Publier immédiatement
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isForced"
                checked={isForced}
                onCheckedChange={(checked) => setIsForced(checked === true)}
              />
              <Label htmlFor="isForced" className="cursor-pointer">
                Mise à jour forcée (les clients devront mettre à jour)
              </Label>
            </div>
            {isForced && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Les mises à jour forcées sont recommandées uniquement pour les corrections de sécurité critiques.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? 'Téléchargement...' : 'Création...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Créer la mise à jour
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}







