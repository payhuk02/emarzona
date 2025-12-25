/**
 * Import/Export Manager Component
 * Date: 28 Janvier 2025
 * 
 * Composant UI pour gérer l'import/export de données
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import {
  exportToCSV,
  exportToJSON,
  importFromCSV,
  importFromJSON,
  type ImportExportType,
  type ImportExportFormat,
} from '@/lib/import-export/import-export';
import { logger } from '@/lib/logger';

export const ImportExportManager = () => {
  const { toast } = useToast();
  const { store } = useStore();
  const [type, setType] = useState<ImportExportType>('products');
  const [format, setFormat] = useState<ImportExportFormat>('csv');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = async () => {
    if (!store) {
      toast({
        title: 'Erreur',
        description: 'Aucune boutique sélectionnée',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    try {
      let result;
      if (format === 'csv') {
        result = await exportToCSV(store.id, type, startDate || undefined, endDate || undefined);
      } else {
        result = await exportToJSON(store.id, type, startDate || undefined, endDate || undefined);
      }

      if (result.success && result.data) {
        // Télécharger le fichier
        const blob = format === 'csv'
          ? new Blob([result.data], { type: 'text/csv' })
          : new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: '✅ Export réussi',
          description: `Les données ont été exportées avec succès`,
        });
      } else {
        throw new Error(result.error || 'Erreur lors de l\'export');
      }
    } catch (error: any) {
      logger.error('Error exporting data', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de l\'export',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!store) {
      toast({
        title: 'Erreur',
        description: 'Aucune boutique sélectionnée',
        variant: 'destructive',
      });
      return;
    }

    if (!importFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const fileContent = await importFile.text();
      let result;

      if (format === 'csv') {
        result = await importFromCSV(store.id, type, fileContent);
      } else {
        const jsonData = JSON.parse(fileContent);
        result = await importFromJSON(store.id, type, jsonData);
      }

      setImportResult(result);

      if (result.success) {
        toast({
          title: '✅ Import réussi',
          description: `${result.imported} élément(s) importé(s) avec succès`,
        });
      } else {
        toast({
          title: '⚠️ Import partiel',
          description: `${result.imported} importé(s), ${result.failed} échec(s)`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      logger.error('Error importing data', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de l\'import',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Détecter le format
      if (file.name.endsWith('.csv')) {
        setFormat('csv');
      } else if (file.name.endsWith('.json')) {
        setFormat('json');
      }
    }
  };

  if (!store) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune boutique sélectionnée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Import/Export de données</h2>
        <p className="text-muted-foreground">
          Importez ou exportez vos produits, commandes et clients
        </p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Exporter</TabsTrigger>
          <TabsTrigger value="import">Importer</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exporter des données
              </CardTitle>
              <CardDescription>
                Téléchargez vos données au format CSV ou JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="export-type">Type de données</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ImportExportType)}>
                    <SelectTrigger id="export-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">Produits</SelectItem>
                      <SelectItem value="orders">Commandes</SelectItem>
                      <SelectItem value="customers">Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="export-format">Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as ImportExportFormat)}>
                    <SelectTrigger id="export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Date de début (optionnel)</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Date de fin (optionnel)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importer des données
              </CardTitle>
              <CardDescription>
                Importez vos données depuis un fichier CSV ou JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-type">Type de données</Label>
                <Select value={type} onValueChange={(v) => setType(v as ImportExportType)}>
                  <SelectTrigger id="import-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">Produits</SelectItem>
                    <SelectItem value="customers">Clients</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Note: Les commandes ne peuvent pas être importées directement
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-file">Fichier</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                  {importFile && (
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      {importFile.name}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                  </>
                )}
              </Button>

              {importResult && (
                <Alert>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      {importResult.success ? 'Import réussi' : 'Import partiel'}
                    </span>
                  </div>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <Badge variant="outline" className="mr-2">
                          {importResult.imported}
                        </Badge>
                        élément(s) importé(s)
                      </p>
                      {importResult.failed > 0 && (
                        <p>
                          <Badge variant="destructive" className="mr-2">
                            {importResult.failed}
                          </Badge>
                          échec(s)
                        </p>
                      )}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Erreurs :</p>
                          <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errors.slice(0, 10).map((error: any, index: number) => (
                              <li key={index} className="text-muted-foreground">
                                Ligne {error.row}: {error.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

