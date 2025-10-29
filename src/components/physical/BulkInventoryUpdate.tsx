import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Plus,
  Minus,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MovementType } from './StockMovementHistory';

// ============================================================================
// TYPES
// ============================================================================

export type BulkUpdateMode = 'set' | 'adjust';

export interface BulkUpdateItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  current_quantity: number;
  new_quantity: number;
  adjustment?: number;
  low_stock_threshold?: number;
  is_selected: boolean;
  error?: string;
}

export interface BulkInventoryUpdateProps {
  storeId: string;
  onComplete?: (updatedCount: number) => void;
  className?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PRODUCTS: Omit<BulkUpdateItem, 'is_selected' | 'new_quantity' | 'adjustment'>[] = [
  {
    id: '1',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Rouge / M',
    sku: 'TSH-RED-M',
    current_quantity: 50,
    low_stock_threshold: 10,
  },
  {
    id: '2',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Bleu / L',
    sku: 'TSH-BLU-L',
    current_quantity: 105,
    low_stock_threshold: 10,
  },
  {
    id: '3',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Vert / S',
    sku: 'TSH-GRN-S',
    current_quantity: 28,
    low_stock_threshold: 10,
  },
  {
    id: '4',
    product_id: 'prod_2',
    product_name: 'Jeans Classic',
    sku: 'JNS-BLK-32',
    current_quantity: 0,
    low_stock_threshold: 5,
  },
  {
    id: '5',
    product_id: 'prod_3',
    product_name: 'Sneakers Pro',
    variant_label: 'Blanc / 42',
    sku: 'SNK-WHT-42',
    current_quantity: 8,
    low_stock_threshold: 15,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BulkInventoryUpdate({
  storeId,
  onComplete,
  className,
}: BulkInventoryUpdateProps) {
  const [items, setItems] = useState<BulkUpdateItem[]>(
    MOCK_PRODUCTS.map((p) => ({
      ...p,
      is_selected: false,
      new_quantity: p.current_quantity,
      adjustment: 0,
    }))
  );

  const [mode, setMode] = useState<BulkUpdateMode>('set');
  const [movementType, setMovementType] = useState<MovementType>('adjustment');
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Selected items
  const selectedItems = items.filter((i) => i.is_selected);
  const allSelected = items.length > 0 && items.every((i) => i.is_selected);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_selected: !item.is_selected } : item
      )
    );
  };

  const toggleAll = () => {
    const newValue = !allSelected;
    setItems((prev) => prev.map((item) => ({ ...item, is_selected: newValue })));
  };

  // Update quantity
  const updateQuantity = (id: string, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (mode === 'set') {
          return {
            ...item,
            new_quantity: Math.max(0, value),
            adjustment: Math.max(0, value) - item.current_quantity,
            error: value < 0 ? 'La quantité ne peut pas être négative' : undefined,
          };
        } else {
          // adjust mode
          const newQty = item.current_quantity + value;
          return {
            ...item,
            adjustment: value,
            new_quantity: Math.max(0, newQty),
            error: newQty < 0 ? 'Le stock ne peut pas être négatif' : undefined,
          };
        }
      })
    );
  };

  // Bulk update all selected
  const bulkUpdateAll = (value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (!item.is_selected) return item;

        if (mode === 'set') {
          return {
            ...item,
            new_quantity: Math.max(0, value),
            adjustment: Math.max(0, value) - item.current_quantity,
            error: value < 0 ? 'La quantité ne peut pas être négative' : undefined,
          };
        } else {
          const newQty = item.current_quantity + value;
          return {
            ...item,
            adjustment: value,
            new_quantity: Math.max(0, newQty),
            error: newQty < 0 ? 'Le stock ne peut pas être négatif' : undefined,
          };
        }
      })
    );
  };

  // Process update
  const handleUpdate = async () => {
    setShowConfirm(false);
    setIsProcessing(true);
    setProgress(0);

    const itemsToUpdate = items.filter((i) => i.is_selected && !i.error);
    let successCount = 0;
    const errors: string[] = [];

    // Simulate processing
    for (let i = 0; i < itemsToUpdate.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(((i + 1) / itemsToUpdate.length) * 100);

      // Simulate success/failure (90% success rate)
      if (Math.random() > 0.1) {
        successCount++;
      } else {
        errors.push(`Erreur: ${itemsToUpdate[i].product_name} (${itemsToUpdate[i].sku})`);
      }
    }

    setUpdateResult({
      success: successCount,
      failed: errors.length,
      errors,
    });

    setIsProcessing(false);
    setShowResult(true);

    if (onComplete) {
      onComplete(successCount);
    }
  };

  // CSV Import/Export
  const handleExportCSV = () => {
    const csvContent =
      'SKU,Produit,Variante,Stock Actuel,Nouveau Stock,Ajustement\n' +
      selectedItems
        .map(
          (item) =>
            `${item.sku || ''},${item.product_name},"${item.variant_label || ''}",${
              item.current_quantity
            },${item.new_quantity},${item.adjustment || 0}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mise à Jour Groupée de l'Inventaire</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Modifiez les stocks de plusieurs produits simultanément
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importer CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportCSV}
                disabled={selectedItems.length === 0}
              >
                <Download className="h-4 w-4" />
                Exporter ({selectedItems.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <Tabs value={mode} onValueChange={(v: BulkUpdateMode) => setMode(v)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="set" className="gap-2">
                <Edit className="h-4 w-4" />
                Définir Stock
              </TabsTrigger>
              <TabsTrigger value="adjust" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajuster Stock
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">
                      {mode === 'set'
                        ? 'Définir le stock pour tous les produits sélectionnés'
                        : 'Ajuster le stock de tous les produits sélectionnés'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={mode === 'set' ? 'Ex: 100' : 'Ex: +10 ou -5'}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) bulkUpdateAll(val);
                        }}
                        className="max-w-[200px]"
                      />
                      <Badge variant="secondary" className="text-sm">
                        {selectedItems.length} produit(s) sélectionné(s)
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock Actuel</TableHead>
                  <TableHead>
                    {mode === 'set' ? 'Nouveau Stock' : 'Ajustement'}
                  </TableHead>
                  <TableHead>Après Maj</TableHead>
                  <TableHead>Différence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={item.error ? 'bg-destructive/5' : ''}>
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={item.is_selected}
                        onCheckedChange={() => toggleSelection(item.id)}
                      />
                    </TableCell>

                    {/* Product */}
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_label && (
                          <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell>
                      <span className="font-mono text-sm">{item.sku || '-'}</span>
                    </TableCell>

                    {/* Current Quantity */}
                    <TableCell>
                      <Badge
                        variant={
                          item.current_quantity === 0
                            ? 'destructive'
                            : item.low_stock_threshold &&
                              item.current_quantity <= item.low_stock_threshold
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {item.current_quantity}
                      </Badge>
                    </TableCell>

                    {/* Input */}
                    <TableCell>
                      <Input
                        type="number"
                        value={mode === 'set' ? item.new_quantity : item.adjustment}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        disabled={!item.is_selected}
                        className={cn(
                          'w-[100px]',
                          item.error && 'border-destructive'
                        )}
                      />
                      {item.error && (
                        <p className="text-xs text-destructive mt-1">{item.error}</p>
                      )}
                    </TableCell>

                    {/* After */}
                    <TableCell>
                      <span className="font-medium">{item.new_quantity}</span>
                    </TableCell>

                    {/* Difference */}
                    <TableCell>
                      {item.adjustment !== 0 && (
                        <div
                          className={cn(
                            'flex items-center gap-1 font-medium',
                            (item.adjustment || 0) > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {(item.adjustment || 0) > 0 ? (
                            <Plus className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {Math.abs(item.adjustment || 0)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Movement Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de mouvement</Label>
              <Select
                value={movementType}
                onValueChange={(v: MovementType) => setMovementType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Achat/Approvisionnement</SelectItem>
                  <SelectItem value="adjustment">Ajustement manuel</SelectItem>
                  <SelectItem value="return">Retour client</SelectItem>
                  <SelectItem value="damage">Produit endommagé</SelectItem>
                  <SelectItem value="theft">Perte/Vol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Raison (optionnel)</Label>
              <Input
                placeholder="Ex: Inventaire physique, réception fournisseur..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedItems.length > 0 ? (
                <>
                  <span className="font-medium">{selectedItems.length}</span> produit(s)
                  sélectionné(s) •{' '}
                  <span className="font-medium">
                    {selectedItems.filter((i) => !i.error).length}
                  </span>{' '}
                  valide(s)
                </>
              ) : (
                'Sélectionnez des produits pour commencer'
              )}
            </div>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={
                selectedItems.length === 0 ||
                selectedItems.every((i) => i.error || i.adjustment === 0)
              }
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mettre à jour ({selectedItems.filter((i) => !i.error && i.adjustment !== 0).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirmer la mise à jour groupée
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Vous êtes sur le point de mettre à jour{' '}
                <span className="font-bold">{selectedItems.filter((i) => !i.error).length}</span>{' '}
                produit(s).
              </p>
              <div className="rounded-md bg-muted p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Résumé des changements :</p>
                <ul className="text-sm space-y-1">
                  <li>
                    • Entrées :{' '}
                    <span className="text-green-600 font-medium">
                      +{selectedItems.filter((i) => (i.adjustment || 0) > 0).length}
                    </span>
                  </li>
                  <li>
                    • Sorties :{' '}
                    <span className="text-red-600 font-medium">
                      {selectedItems.filter((i) => (i.adjustment || 0) < 0).length}
                    </span>
                  </li>
                  <li>
                    • Type : <span className="font-medium">{movementType}</span>
                  </li>
                  {reason && (
                    <li>
                      • Raison : <span className="font-medium">{reason}</span>
                    </li>
                  )}
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Cette action sera enregistrée dans l'historique des mouvements de stock.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdate}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Processing Dialog */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 animate-pulse" />
              Mise à jour en cours...
            </DialogTitle>
            <DialogDescription>
              Veuillez patienter pendant la mise à jour des stocks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(progress)}% complété
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      {updateResult && (
        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {updateResult.failed === 0 ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Mise à jour réussie
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Mise à jour terminée avec erreurs
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{updateResult.success}</p>
                    <p className="text-sm text-muted-foreground">Réussies</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{updateResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Échouées</p>
                  </CardContent>
                </Card>
              </div>

              {updateResult.errors.length > 0 && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Erreurs détectées :
                  </p>
                  <ul className="text-sm space-y-1">
                    {updateResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {error}
                      </li>
                    ))}
                    {updateResult.errors.length > 5 && (
                      <li className="text-muted-foreground italic">
                        ... et {updateResult.errors.length - 5} autre(s)
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowResult(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

