/**
 * Composant de gestion Import/Export CSV pour l'inventaire
 * Date: 28 Janvier 2025
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import { useExportInventoryCSV, useImportInventoryCSV, CSVImportResult } from '@/hooks/physical/useInventoryCSV';
import { useToast } from '@/hooks/use-toast';
import { useInventoryItems } from '@/hooks/physical/useInventory';
import { useStore } from '@/hooks/useStore';

export function InventoryCSVManager() {
  const { store } = useStore();
  const { data: inventoryItems } = useInventoryItems(store?.id || '');
  const { exportToCSV } = useExportInventoryCSV();
  const { importFromCSV } = useImportInventoryCSV();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [importOptions, setImportOptions] = useState({
    updateExisting: true,
    createMissing: false,
    dryRun: false,
  });

  const handleExport = async () => {
    if (!inventoryItems || inventoryItems.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucun article à exporter',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportToCSV(inventoryItems);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier CSV',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await importFromCSV(file, importOptions);

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setShowImportResult(true);

      if (result.success > 0) {
        toast({
          title: 'Import réussi',
          description: `${result.success} article(s) importé(s) avec succès`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: 'Import partiel',
          description: `${result.failed} erreur(s) lors de l'import`,
          variant: 'destructive',
        });
      }

      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: 'Erreur import',
        description: error.message || 'Impossible d\'importer le fichier',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import/Export CSV Inventaire
        </CardTitle>
        <CardDescription>
          Exportez votre inventaire en CSV ou importez des mises à jour en masse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Exportez tous les articles de votre inventaire dans un fichier CSV.
                Le fichier inclut : SKU, nom produit, quantités, emplacements, codes-barres, etc.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting || !inventoryItems || inventoryItems.length === 0}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter l'inventaire ({inventoryItems?.length || 0} articles)
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Colonnes exportées :</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>SKU, Nom Produit, Quantité Disponible, Quantité Réservée</li>
                    <li>Point Réapprovisionnement, Emplacement Entrepôt</li>
                    <li>Code-barres, Prix Coût, Prix Vente, Valeur Totale</li>
                    <li>Statut, Date Mise à Jour</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fichier CSV</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    disabled={isImporting}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez un fichier CSV avec les colonnes : SKU, Quantité Disponible, etc.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Options d'import</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="update-existing"
                      checked={importOptions.updateExisting}
                      onChange={(e) =>
                        setImportOptions({ ...importOptions, updateExisting: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="update-existing" className="text-sm font-normal cursor-pointer">
                      Mettre à jour les articles existants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="create-missing"
                      checked={importOptions.createMissing}
                      onChange={(e) =>
                        setImportOptions({ ...importOptions, createMissing: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="create-missing" className="text-sm font-normal cursor-pointer">
                      Créer les articles manquants (non supporté automatiquement)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dry-run"
                      checked={importOptions.dryRun}
                      onChange={(e) =>
                        setImportOptions({ ...importOptions, dryRun: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="dry-run" className="text-sm font-normal cursor-pointer">
                      Mode test (validation uniquement, pas de modification)
                    </Label>
                  </div>
                </div>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Import en cours...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Format CSV requis :</strong> SKU, Quantité Disponible, Emplacement Entrepôt (optionnel),
                  Point Réapprovisionnement (optionnel)
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog Résultat Import */}
      <Dialog open={showImportResult} onOpenChange={setShowImportResult}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Résultat de l'Import</DialogTitle>
            <DialogDescription>
              Détails de l'import CSV
            </DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Succès</p>
                  <Badge variant="default" className="text-lg">
                    {importResult.success}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Échecs</p>
                  <Badge variant="destructive" className="text-lg">
                    {importResult.failed}
                  </Badge>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Erreurs :</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Ligne {error.row}</strong> (SKU: {error.sku}): {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Avertissements :</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Ligne {warning.row}</strong> (SKU: {warning.sku}): {warning.warning}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {importResult.success > 0 && importResult.failed === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Tous les articles ont été importés avec succès !
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

