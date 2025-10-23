import { useState, useRef } from "react";
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
} from "lucide-react";
import Papa from "papaparse";
import { validateProductsImport } from "@/lib/validation/productSchemas";
import { useToast } from "@/hooks/use-toast";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportConfirmed: (products: any[]) => Promise<void>;
}

export const ImportCSVDialog = ({
  open,
  onOpenChange,
  onImportConfirmed,
}: ImportCSVDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setStep('preview');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        setParsedData(results);
        
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
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.successCount === 0) return;

    setImporting(true);
    try {
      const validProducts = validationResult.successes.map((s: any) => s.data);
      await onImportConfirmed(validProducts);
      
      toast({
        title: "Import réussi",
        description: `${validProducts.length} produit(s) importé(s) avec succès`,
      });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les produits",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsedData(null);
    setValidationResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    const template = [
      ['name', 'slug', 'description', 'price', 'currency', 'product_type', 'category', 'is_active', 'stock_quantity', 'sku', 'promotional_price', 'image_url'],
      ['Mon Produit', 'mon-produit', 'Description du produit', '10000', 'XOF', 'digital', 'Formation', 'true', '100', 'SKU-001', '', ''],
      ['Formation React', 'formation-react', 'Apprenez React de A à Z', '50000', 'XOF', 'digital', 'Formation', 'true', '0', 'REACT-001', '45000', ''],
      ['T-Shirt', 't-shirt-logo', 'T-Shirt avec logo', '15000', 'XOF', 'physical', 'Vêtements', 'true', '50', 'TS-001', '', ''],
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
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <strong> description, category, is_active, stock_quantity, sku, promotional_price, image_url</strong> (optionnels)
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Format du fichier CSV :</h4>
              <code className="block bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre">
{`name,slug,description,price,currency,product_type,category
"Mon Produit","mon-produit","Description",10000,XOF,digital,"Formation"`}
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.successes.slice(0, 10).map((item: any, idx: number) => (
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
                          {validationResult.errors.slice(0, 5).map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{item.index + 1}</TableCell>
                              <TableCell className="text-xs">
                                {JSON.stringify(item.originalData).substring(0, 50)}...
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {item.errors.slice(0, 2).map((error: any, i: number) => (
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
              <Button
                onClick={handleConfirmImport}
                disabled={parsing || importing || !validationResult || validationResult.successCount === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer {validationResult?.successCount || 0} produit(s)
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

