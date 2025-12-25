/**
 * Digital Product Update Manager
 * Date: 28 Janvier 2025
 * 
 * Composant pour gérer les mises à jour de produits digitaux
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  History,
  Send,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createProductVersion, notifyAllCustomersOfUpdate } from '@/lib/products/digital-product-updates';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface DigitalProductUpdateManagerProps {
  productId: string;
  productName: string;
  currentVersion: string;
  currentFileUrl: string;
}

export const DigitalProductUpdateManager = ({
  productId,
  productName,
  currentVersion,
  currentFileUrl,
}: DigitalProductUpdateManagerProps) => {
  const { toast } = useToast();
  const [newVersion, setNewVersion] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [isMajorUpdate, setIsMajorUpdate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newFileUrl, setNewFileUrl] = useState('');
  const [updateHistory, setUpdateHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpdateHistory();
  }, [productId]);

  const loadUpdateHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_product_updates')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdateHistory(data || []);
    } catch (error: any) {
      logger.error('Error loading update history', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { url, error } = await uploadToSupabaseStorage(file, {
        bucket: 'product-files',
        path: 'digital',
        filePrefix: `v${newVersion || 'update'}`,
        onProgress: (progress) => setUploadProgress(progress),
      });

      if (error) throw error;

      if (url) {
        setNewFileUrl(url);
        toast({
          title: '✅ Fichier uploadé',
          description: 'Le nouveau fichier a été uploadé avec succès',
        });
      }
    } catch (error: any) {
      toast({
        title: '❌ Erreur d\'upload',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleCreateUpdate = async () => {
    if (!newVersion || !newFileUrl) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une version et un fichier',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createProductVersion(
        productId,
        newVersion,
        newFileUrl,
        versionNotes,
        isMajorUpdate
      );

      if (result.success) {
        toast({
          title: '✅ Mise à jour créée',
          description: 'La nouvelle version a été créée et les clients ont été notifiés',
        });

        // Réinitialiser le formulaire
        setNewVersion('');
        setVersionNotes('');
        setIsMajorUpdate(false);
        setNewFileUrl('');
        
        // Recharger l'historique
        await loadUpdateHistory();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleNotifyCustomers = async () => {
    if (!newVersion || !newFileUrl) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une version et un fichier',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await notifyAllCustomersOfUpdate({
        product_id: productId,
        version: newVersion,
        version_notes: versionNotes,
        download_url: newFileUrl,
        previous_version: currentVersion,
        is_major_update: isMajorUpdate,
      });

      if (result.success) {
        toast({
          title: '✅ Notifications envoyées',
          description: `${result.notified_count} client(s) ont été notifié(s)`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Calculer la prochaine version suggérée
  const getSuggestedVersion = () => {
    if (!currentVersion) return '1.0.0';
    
    const parts = currentVersion.split('.');
    if (parts.length === 3) {
      const [major, minor, patch] = parts.map(Number);
      if (isMajorUpdate) {
        return `${major + 1}.0.0`;
      }
      return `${major}.${minor + 1}.0`;
    }
    return currentVersion;
  };

  useEffect(() => {
    if (!newVersion && currentVersion) {
      setNewVersion(getSuggestedVersion());
    }
  }, [currentVersion, isMajorUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Gestion des mises à jour</h3>
        <p className="text-muted-foreground">
          Créez de nouvelles versions et notifiez automatiquement vos clients
        </p>
      </div>

      {/* Formulaire de mise à jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Créer une nouvelle version
          </CardTitle>
          <CardDescription>
            Version actuelle : <Badge variant="outline">{currentVersion}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_version">Nouvelle version *</Label>
              <Input
                id="new_version"
                placeholder="1.1.0"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format recommandé : X.Y.Z (ex: 1.1.0)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_major">Type de mise à jour</Label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_major"
                  checked={isMajorUpdate}
                  onChange={(e) => setIsMajorUpdate(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_major" className="cursor-pointer">
                  Mise à jour majeure
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version_notes">Notes de version</Label>
            <Textarea
              id="version_notes"
              placeholder="Décrivez les améliorations et corrections de cette version..."
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_file">Nouveau fichier *</Label>
            {newFileUrl ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Fichier uploadé</p>
                    <p className="text-xs text-muted-foreground">
                      {newFileUrl.split('/').pop()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewFileUrl('')}
                >
                  Changer
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">{uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Cliquez pour uploader le nouveau fichier
                    </span>
                  </>
                )}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateUpdate}
              disabled={!newVersion || !newFileUrl || uploading}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Créer la version et notifier les clients
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tous les clients qui ont acheté ce produit recevront automatiquement 
              une notification par email et in-app avec le lien de téléchargement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Historique des mises à jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des mises à jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : updateHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune mise à jour pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {updateHistory.map((update) => (
                <div
                  key={update.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={update.is_major_update ? 'default' : 'secondary'}>
                        v{update.version}
                      </Badge>
                      {update.is_major_update && (
                        <Badge variant="destructive">Majeure</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(update.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {update.version_notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {update.version_notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {update.notified_count} / {update.total_customers} clients notifiés
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

