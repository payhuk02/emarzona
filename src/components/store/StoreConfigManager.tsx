/**
 * StoreConfigManager Component
 * Gestion de l'export et de l'import de configurations de boutique
 */

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { downloadStoreConfig, importStoreConfig, applyImportedConfig, type StoreConfigExport } from '@/lib/store-config-export';
import { useToast } from '@/hooks/use-toast';
import type { Store } from '@/hooks/useStores';

interface StoreConfigManagerProps {
  store: Store;
  onImportConfig: (config: Partial<Store>) => void;
}

export const StoreConfigManager : React.FC<StoreConfigManagerProps> = ({
  store,
  onImportConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [importStatus, setImportStatus] = React.useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = () => {
    try {
      downloadStoreConfig(store);
      toast({
        title: 'Configuration exportée',
        description: 'Le fichier de configuration a été téléchargé avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter la configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportStatus({
        type: 'error',
        message: 'Le fichier doit être au format JSON (.json)',
      });
      toast({
        title: 'Erreur',
        description: 'Le fichier doit être au format JSON.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await importStoreConfig(file);
      
      if (!result.success || !result.config) {
        setImportStatus({
          type: 'error',
          message: result.error || 'Erreur lors de l\'import',
        });
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible d\'importer la configuration.',
          variant: 'destructive',
        });
        return;
      }

      const configToApply = applyImportedConfig(result.config);
      onImportConfig(configToApply);

      setImportStatus({
        type: 'success',
        message: `Configuration "${result.config.store.name}" importée avec succès. N'oubliez pas de sauvegarder.`,
      });

      toast({
        title: 'Configuration importée',
        description: 'La configuration a été importée. Vérifiez les modifications avant de sauvegarder.',
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'importer la configuration.',
        variant: 'destructive',
      });
    } finally {
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Export / Import de Configuration
        </CardTitle>
        <CardDescription>
          Exportez votre configuration pour la sauvegarder ou l'importer dans une autre boutique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export */}
        <div className="space-y-2">
          <Label>Exporter la configuration</Label>
          <p className="text-sm text-muted-foreground">
            Téléchargez un fichier JSON contenant toutes les personnalisations de votre boutique
          </p>
          <Button
            variant="outline"
            onClick={handleExport}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter la configuration
          </Button>
        </div>

        <div className="border-t pt-4" />

        {/* Import */}
        <div className="space-y-2">
          <Label>Importer une configuration</Label>
          <p className="text-sm text-muted-foreground">
            Importez un fichier JSON de configuration pour appliquer les personnalisations
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleImportClick}
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choisir un fichier
            </Button>
          </div>
        </div>

        {/* Status */}
        {importStatus.type && (
          <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
            {importStatus.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              {importStatus.type === 'error' ? 'Erreur' : 'Succès'}
            </AlertTitle>
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Le fichier exporté contient toutes les personnalisations (thème, SEO, layout, etc.)</p>
          <p>• Les images (logos, bannières) ne sont pas incluses dans l'export</p>
          <p>• Vous pouvez utiliser l'export pour dupliquer une configuration entre boutiques</p>
        </div>
      </CardContent>
    </Card>
  );
};









