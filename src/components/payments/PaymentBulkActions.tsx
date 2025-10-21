import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
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
import { Payment } from "@/hooks/usePayments";
import { useToast } from "@/hooks/use-toast";

interface PaymentBulkActionsProps {
  selectedPayments: string[];
  payments: Payment[];
  onSelectionChange: (paymentIds: string[]) => void;
  onBulkAction: (action: string, paymentIds: string[]) => void;
  onDelete: (paymentIds: string[]) => void;
}

const PaymentBulkActions = ({
  selectedPayments,
  payments,
  onSelectionChange,
  onBulkAction,
  onDelete,
}: PaymentBulkActionsProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedCount = selectedPayments.length;
  const totalCount = payments.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(payments.map(p => p.id));
    }
  };

  const handleBulkComplete = () => {
    onBulkAction('complete', selectedPayments);
    toast({
      title: "Paiements complétés",
      description: `${selectedCount} paiement${selectedCount > 1 ? "s" : ""} marqué${selectedCount > 1 ? "s" : ""} comme complété${selectedCount > 1 ? "s" : ""}`,
    });
  };

  const handleBulkFail = () => {
    onBulkAction('fail', selectedPayments);
    toast({
      title: "Paiements échoués",
      description: `${selectedCount} paiement${selectedCount > 1 ? "s" : ""} marqué${selectedCount > 1 ? "s" : ""} comme échoué${selectedCount > 1 ? "s" : ""}`,
    });
  };

  const handleBulkPending = () => {
    onBulkAction('pending', selectedPayments);
    toast({
      title: "Paiements en attente",
      description: `${selectedCount} paiement${selectedCount > 1 ? "s" : ""} marqué${selectedCount > 1 ? "s" : ""} comme en attente`,
    });
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete(selectedPayments);
    onSelectionChange([]);
    setShowDeleteDialog(false);
    toast({
      title: "Paiements supprimés",
      description: `${selectedCount} paiement${selectedCount > 1 ? "s" : ""} supprimé${selectedCount > 1 ? "s" : ""}`,
    });
  };

  const handleExport = () => {
    const selectedPaymentsData = payments.filter(p => selectedPayments.includes(p.id));
    const csvContent = [
      ['ID Transaction', 'Client', 'Montant', 'Devise', 'Méthode', 'Statut', 'Commande', 'Date', 'Notes'].join(','),
      ...selectedPaymentsData.map(payment => [
        `"${payment.transaction_id || ''}"`,
        `"${payment.customers?.name || ''}"`,
        payment.amount,
        payment.currency,
        `"${payment.payment_method}"`,
        `"${payment.status}"`,
        `"${payment.orders?.order_number || ''}"`,
        new Date(payment.created_at).toLocaleDateString('fr-FR'),
        `"${payment.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paiements-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: `${selectedCount} paiement${selectedCount > 1 ? "s" : ""} exporté${selectedCount > 1 ? "s" : ""}`,
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
            onClick={handleBulkComplete}
            className="text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Compléter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkPending}
            className="text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkFail}
            className="text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Échoué
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
              Êtes-vous sûr de vouloir supprimer {selectedCount} paiement{selectedCount > 1 ? "s" : ""} ? 
              Cette action est irréversible et supprimera définitivement {selectedCount > 1 ? "ces paiements" : "ce paiement"}.
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

export default PaymentBulkActions;
