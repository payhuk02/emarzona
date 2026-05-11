import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  X,
  Eye,
  ChevronLeft,
  FileDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Papa from "papaparse";
import { validateProductsImport } from "@/lib/validation/productSchemas";
import {
  previewImport,
  ImportPreviewResult,
  exportImportErrorsToCSV,
  exportPreviewResultsToCSV
} from "@/lib/import-export/import-export";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/hooks/useProducts";
import type { z } from "zod";
import type { ProductImportSchema } from "@/lib/validation/productSchemas";

type ValidatedProduct = z.infer<typeof ProductImportSchema>;
type ValidationSuccess = { index: number; data: ValidatedProduct };
type ValidationError = { index: number; errors: Array<{ path: (string | number)[]; message: string }>; originalData: unknown };
type ValidationResult = {
  successes: ValidationSuccess[];
  errors: ValidationError[];
  total: number;
  successCount: number;
  errorCount: number;
};

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportConfirmed: (
    products: Product[], 
    options?: { 
      onProgress?: (progress: { imported: number; total: number; percentage: number }) => void;
      onCancel?: () => boolean;
    }
  ) => Promise<void>;
}

const ImportCSVDialogComponent = ({
  open,
  onOpenChange,
  onImportConfirmed,
}: ImportCSVDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ imported: number; total: number; percentage: number } | null>(null);
  const [parsedData, setParsedData] = useState<Papa.ParseResult<unknown> | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [importCancelled, setImportCancelled] = useState(false);
  const importCancelledRef = useRef(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation taille fichier (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximum est de ${MAX_FILE_SIZE / 1024 / 1024}MB. Votre fichier fait ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive",
      });
      return;
    }

    setParsing(true);
    setStep('preview');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        setParsedData(results);
        
        // Validation nombre de produits (1000 max)
        const MAX_PRODUCTS = 1000;
        if (results.data.length > MAX_PRODUCTS) {
          setParsing(false);
          toast({
            title: "Trop de produits",
            description: `Maximum ${MAX_PRODUCTS} produits par import. Votre fichier contient ${results.data.length} produits`,
            variant: "destructive",
          });
          return;
        }
        
        // Valider les données
        const validation = validateProductsImport(results.data);
        setValidationResult(validation);
        setParsing(false);

        if (validation.errorCount === 0) {
          toast({
            title: "Fichier valide",
            description: `${validation.successCount} produit(s) prêt(s) à être importé(s)`,
          });
        } else {
          toast({
            title: "Erreurs détectées",
            description: `${validation.successCount} valide(s), ${validation.errorCount} erreur(s)`,
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        setParsing(false);
        toast({
          title: "Erreur de parsing",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, []); // Note: toast est stable, setParsing, setStep, setParsedData, setValidationResult sont stables

  const handleCancelImport = useCallback(() => {
    importCancelledRef.current = true;
    setImportCancelled(true);
    setImporting(false);
    toast({
      title: "Import annulé",
      description: "L'import a été annulé. Les produits déjà importés ont été sauvegardés.",
      variant: "default",
    });
  }, [toast]);

  const handlePreviewImport = useCallback(async () => {
    if (!parsedData?.data || !Array.isArray(parsedData.data)) return;

    setPreviewing(true);
    try {
      // Utiliser le preview mode pour analyser les données
      const result = await previewImport('', 'products', parsedData.data);
      setPreviewResult(result);
      setStep('confirm');

      toast({
        title: "Analyse terminée",
        description: `${result.validRows} valide(s), ${result.invalidRows} erreur(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'analyse",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  }, [parsedData, toast]);

  const handleConfirmImport = useCallback(async () => {
    if (!previewResult || previewResult.validRows === 0) return;

    // Réinitialiser le flag d'annulation
    importCancelledRef.current = false;
    setImportCancelled(false);
    setImporting(true);
    setImportProgress({ imported: 0, total: previewResult.validRows, percentage: 0 });

    try {
      const validProducts = previewResult.validationResults
        .filter(r => r.isValid && r.data)
        .map(r => r.data) as Product[];

      // Passer le callback de progression et le flag d'annulation
      await onImportConfirmed(validProducts, {
        onProgress: (progress) => {
          if (!importCancelledRef.current) {
            setImportProgress(progress);
          }
        },
        onCancel: () => importCancelledRef.current,
      });

      // Vérifier si l'import a été annulé
      if (importCancelledRef.current) {
        return;
      }

      toast({
        title: "Import réussi",
        description: `${validProducts.length} produit(s) importé(s) avec succès`,
      });

      handleClose();
    } catch (error) {
      if (importCancelledRef.current) {
        return; // Ne pas afficher d'erreur si annulé
      }

      const errorMessage = error instanceof Error ? error.message : "Impossible d'importer les produits";
      toast({
        title: "Erreur d'import",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setImportProgress(null);
      importCancelledRef.current = false;
    }
  }, [previewResult, onImportConfirmed, toast]);

  const handleClose = useCallback(() => {
    setParsedData(null);
    setValidationResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  }, [onOpenChange]);

  const handleDownloadTemplate = useCallback(() => {
    const template = [
      ['name', 'slug', 'description', 'price', 'currency', 'product_type', 'category', 'licensing_type', 'license_terms', 'is_active', 'stock_quantity', 'sku', 'promotional_price', 'image_url'],
      ['Mon Produit', 'mon-produit', 'Description du produit', '10000', 'XOF', 'digital', 'Formation', 'standard', '', 'true', '100', 'SKU-001', '', ''],
      ['Pack PLR Marketing', 'pack-plr-marketing', 'Ressources marketing réutilisables', '30000', 'XOF', 'digital', 'Template', 'plr', 'Peut être revendu/modifié avec attribution.', 'true', '0', 'PLR-001', '', ''],
      ['Formation React', 'formation-react', 'Apprenez React de A à Z', '50000', 'XOF', 'digital', 'Formation', 'copyrighted', 'Usage personnel. Revente/interdite.', 'true', '0', 'REACT-001', '45000', ''],
    ];

    const csv = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_import_produits.csv';
    link.click();

    toast({
      title: "Template téléchargé",
      description: "Utilisez ce fichier comme modèle pour votre import",
    });
  }, []); // Note: toast est stable

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer des produits depuis CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' ? (
              "Importez vos produits depuis un fichier CSV. Téléchargez le template pour voir le format attendu."
            ) : (
              "Vérifiez les produits avant de confirmer l'import"
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={parsing}
                className="mt-2"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Le fichier doit être au format CSV avec les colonnes suivantes :
                <strong> name, slug, price, currency, product_type</strong> (obligatoires) et 
                <strong> description, category, is_active, stock_quantity, sku, promotional_price, image_url, licensing_type, license_terms</strong> (optionnels)
                <br />
                licensing_type accepté: <code>standard</code>, <code>plr</code>, <code>copyrighted</code>
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Format du fichier CSV :</h4>
              <code className="block bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre">
{`name,slug,description,price,currency,product_type,category,licensing_type,license_terms
"Mon Produit","mon-produit","Description",10000,XOF,digital,"Formation",plr,"Peut être revendu et modifié avec attribution."`}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le template CSV
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {parsing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Analyse du fichier en cours...</p>
                </div>
              </div>
            ) : validationResult ? (
              <>
                {/* Résumé de validation */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{validationResult.total}</div>
                    <div className="text-xs text-muted-foreground">Total lignes</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg text-center border border-green-500/20">
                    <div className="text-2xl font-bold text-green-600">{validationResult.successCount}</div>
                    <div className="text-xs text-green-600">Valides</div>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg text-center border border-red-500/20">
                    <div className="text-2xl font-bold text-red-600">{validationResult.errorCount}</div>
                    <div className="text-xs text-red-600">Erreurs</div>
                  </div>
                </div>

                {/* Aperçu des produits valides */}
                {validationResult.successCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Produits valides ({validationResult.successCount})
                    </h4>
                    <div className="border rounded-lg max-h-64 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Licence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.successes.slice(0, 10).map((item: ValidationSuccess, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{item.index + 1}</TableCell>
                              <TableCell className="font-medium">{item.data.name}</TableCell>
                              <TableCell>{item.data.price.toLocaleString()} {item.data.currency}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{item.data.product_type}</Badge>
                              </TableCell>
                              <TableCell>{item.data.category || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={item.data.is_active ? "default" : "secondary"} className="text-xs">
                                  {item.data.is_active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{item.data.licensing_type || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {validationResult.successCount > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... et {validationResult.successCount - 10} autre(s) produit(s)
                      </p>
                    )}
                  </div>
                )}

                {/* Erreurs de validation */}
                {validationResult.errorCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Erreurs de validation ({validationResult.errorCount})
                    </h4>
                    <div className="border border-red-500/20 rounded-lg max-h-48 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Données</TableHead>
                            <TableHead>Erreurs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.errors.slice(0, 5).map((item: ValidationError, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{item.index + 1}</TableCell>
                              <TableCell className="text-xs">
                                {JSON.stringify(item.originalData).substring(0, 50)}...
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {item.errors.slice(0, 2).map((error: { path: (string | number)[]; message: string }, i: number) => (
                                    <Badge key={i} variant="destructive" className="text-xs">
                                      {error.path.join('.')}: {error.message}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {validationResult.errorCount > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... et {validationResult.errorCount - 5} autre(s) erreur(s)
                      </p>
                    )}
                  </div>
                )}

                {/* Résumé du preview */}
                {step === 'confirm' && previewResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{previewResult.validRows}</div>
                        <div className="text-sm text-green-800">Valides</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{previewResult.invalidRows}</div>
                        <div className="text-sm text-red-800">Erreurs</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{previewResult.categoriesFound.length}</div>
                        <div className="text-sm text-blue-800">Catégories</div>
                      </div>
                    </div>

                    {previewResult.invalidRows > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-800">Erreurs détectées :</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {previewResult.validationResults
                            .filter(r => !r.isValid)
                            .slice(0, 5)
                            .map(result => (
                              <div key={result.row} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                                Ligne {result.row}: {result.errors.map(e => e.message).join(', ')}
                              </div>
                            ))}
                        </div>
                        {previewResult.invalidRows > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... et {previewResult.invalidRows - 5} autres erreurs
                          </p>
                        )}
                      </div>
                    )}

                    {previewResult.categoriesFound.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-800">Catégories trouvées :</h4>
                        <div className="flex flex-wrap gap-2">
                          {previewResult.categoriesFound.map(cat => (
                            <Badge
                              key={cat.name}
                              variant={cat.categoryId ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {cat.name} ({cat.count})
                              {cat.categoryId ? ' ✓' : ' ⚠'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Barre de progression pendant l'import */}
                {importing && importProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Import en cours...</span>
                      <span className="font-medium">{importProgress.imported} / {importProgress.total} ({importProgress.percentage}%)</span>
                    </div>
                    <Progress value={importProgress.percentage} className="w-full" />
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' ? (
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData(null);
                  setValidationResult(null);
                  setStep('upload');
                }}
                disabled={parsing || importing}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              {importing ? (
                <Button
                  onClick={handleCancelImport}
                  variant="destructive"
                  disabled={!importing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler l'import
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmImport}
                  disabled={parsing || importing || !validationResult || validationResult.successCount === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer {validationResult?.successCount || 0} produit(s)
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ImportCSVDialogComponent.displayName = 'ImportCSVDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ImportCSVDialog = React.memo(ImportCSVDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onImportConfirmed === nextProps.onImportConfirmed
  );
});

ImportCSVDialog.displayName = 'ImportCSVDialog';







