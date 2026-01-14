/**
 * Digital Products Bulk Actions Component
 * Date: 2025-01-27
 *
 * Composant pour gérer les actions en masse sur les produits digitaux
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Archive,
  FileDown,
  MoreHorizontal,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DigitalProduct {
  id: string;
  product?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    is_active?: boolean;
  };
}

interface DigitalProductsBulkActionsProps {
  selectedProducts: Set<string>;
  products: DigitalProduct[];
  onSelectionChange: (selected: Set<string>) => void;
  onBulkActivate: (productIds: string[]) => Promise<void>;
  onBulkDeactivate: (productIds: string[]) => Promise<void>;
  onBulkDelete: (productIds: string[]) => Promise<void>;
  onBulkArchive?: (productIds: string[]) => Promise<void>;
  onExport?: (productIds: string[], format?: 'csv' | 'excel' | 'pdf') => void;
}

export const DigitalProductsBulkActions = ({
  selectedProducts,
  products,
  onSelectionChange,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkArchive,
  onExport,
}: DigitalProductsBulkActionsProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedProducts.size;
  const totalCount = products.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      const allIds = new Set(products.map(p => p.id));
      onSelectionChange(allIds);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedCount === 0) return;
    setIsProcessing(true);
    try {
      await onBulkActivate(Array.from(selectedProducts));
      toast({
        title: 'Produits activés',
        description: `${selectedCount} produit${selectedCount > 1 ? 's' : ''} activé${selectedCount > 1 ? 's' : ''}`,
      });
      onSelectionChange(new Set());
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'activer les produits",
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCount === 0) return;
    setIsProcessing(true);
    try {
      await onBulkDeactivate(Array.from(selectedProducts));
      toast({
        title: 'Produits désactivés',
        description: `${selectedCount} produit${selectedCount > 1 ? 's' : ''} désactivé${selectedCount > 1 ? 's' : ''}`,
      });
      onSelectionChange(new Set());
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver les produits',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedCount === 0 || !onBulkArchive) return;
    setIsProcessing(true);
    try {
      await onBulkArchive(Array.from(selectedProducts));
      toast({
        title: 'Produits archivés',
        description: `${selectedCount} produit${selectedCount > 1 ? 's' : ''} archivé${selectedCount > 1 ? 's' : ''}`,
      });
      onSelectionChange(new Set());
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'archiver les produits",
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(Array.from(selectedProducts));
      onSelectionChange(new Set());
      setShowDeleteDialog(false);
      toast({
        title: 'Produits supprimés',
        description: `${selectedCount} produit${selectedCount > 1 ? 's' : ''} supprimé${selectedCount > 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer les produits',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    if (selectedCount === 0 || !onExport) return;
    onExport(Array.from(selectedProducts), format);
  };

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onSelect={handleSelectAll}
          className="h-8 w-8 p-0"
          aria-label={isAllSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
        >
          {isAllSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </Button>
        <span className="text-sm text-muted-foreground">
          {isAllSelected ? 'Tout désélectionner' : 'Sélectionner tout'}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné
          {selectedCount > 1 ? 's' : ''}
        </Badge>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onSelect={handleBulkActivate}
            disabled={isProcessing}
            className="h-8"
          >
            <Eye className="h-4 w-4 mr-2" />
            Activer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onSelect={handleBulkDeactivate}
            disabled={isProcessing}
            className="h-8"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Désactiver
          </Button>
          {onBulkArchive && (
            <Button
              size="sm"
              variant="outline"
              onSelect={handleBulkArchive}
              disabled={isProcessing}
              className="h-8"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          )}
          {onExport && (
            <Select>
              <SelectTrigger className="h-8" disabled={isProcessing}>

                  <FileDown className="h-4 w-4 mr-2" />
                  Exporter
                
</SelectTrigger>
              <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                <SelectItem value="edit" onSelect={() => handleExport('csv')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  CSV
                </SelectItem>
                <SelectItem value="delete" onSelect={() => handleExport('excel')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Excel
                </SelectItem>
                <SelectItem value="copy" onSelect={() => handleExport('pdf')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select>
            <SelectTrigger className="h-8" disabled={isProcessing}>

                <MoreHorizontal className="h-4 w-4 mr-2" />
                Plus
              
</SelectTrigger>
            <SelectContent mobileVariant="sheet" className="min-w-[200px]">
              <SelectItem value="view" onSelect={handleSelectAll}>
                {isAllSelected ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Désélectionner tout
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Sélectionner tout
                  </>
                )}
              </SelectItem>
              <DropdownMenuSeparator />
              <SelectItem value="export" onSelect={handleBulkDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedCount} produit
              {selectedCount > 1 ? 's' : ''} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onSelect={confirmDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};






