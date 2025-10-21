import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Square, 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  Download,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

interface ProductBulkActionsProps {
  selectedProducts: string[];
  products: Product[];
  onSelectionChange: (productIds: string[]) => void;
  onBulkAction: (action: string, productIds: string[]) => void;
  onDelete: (productIds: string[]) => void;
}

const ProductBulkActions = ({
  selectedProducts,
  products,
  onSelectionChange,
  onBulkAction,
  onDelete,
}: ProductBulkActionsProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedCount = selectedProducts.length;
  const totalCount = products.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const handleBulkActivate = () => {
    onBulkAction('activate', selectedProducts);
    toast({
      title: "Produits activés",
      description: `${selectedCount} produit${selectedCount > 1 ? "s" : ""} activé${selectedCount > 1 ? "s" : ""}`,
    });
  };

  const handleBulkDeactivate = () => {
    onBulkAction('deactivate', selectedProducts);
    toast({
      title: "Produits désactivés",
      description: `${selectedCount} produit${selectedCount > 1 ? "s" : ""} désactivé${selectedCount > 1 ? "s" : ""}`,
    });
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete(selectedProducts);
    onSelectionChange([]);
    setShowDeleteDialog(false);
    toast({
      title: "Produits supprimés",
      description: `${selectedCount} produit${selectedCount > 1 ? "s" : ""} supprimé${selectedCount > 1 ? "s" : ""}`,
    });
  };

  const handleExport = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    const csvContent = [
      ['Nom', 'Prix', 'Devise', 'Catégorie', 'Type', 'Statut', 'Date de création'].join(','),
      ...selectedProductsData.map(product => [
        `"${product.name}"`,
        product.price,
        product.currency,
        `"${product.category || ''}"`,
        `"${product.product_type || ''}"`,
        product.is_active ? 'Actif' : 'Inactif',
        new Date(product.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produits-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: `${selectedCount} produit${selectedCount > 1 ? "s" : ""} exporté${selectedCount > 1 ? "s" : ""}`,
    });
  };

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="h-8 w-8 p-0"
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          Sélectionner tout
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 w-6 p-0"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : isIndeterminate ? (
              <div className="h-4 w-4 border-2 border-primary bg-primary/20 rounded" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkActivate}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Activer
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDeactivate}
            className="text-xs"
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Désactiver
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <MoreHorizontal className="h-3 w-3 mr-1" />
                Plus
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter en CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedCount} produit{selectedCount > 1 ? "s" : ""} ? 
              Cette action est irréversible et supprimera définitivement {selectedCount > 1 ? "ces produits" : "ce produit"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductBulkActions;
