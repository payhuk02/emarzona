import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Payment } from "@/hooks/usePayments";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  onPaymentUpdated: () => void;
}

export const PaymentsTable = ({ payments, loading, onPaymentUpdated }: PaymentsTableProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paiement supprimé avec succès",
      });

      onPaymentUpdated();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
      refunded: "outline",
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      completed: "Complété",
      failed: "Échoué",
      refunded: "Remboursé",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Espèces",
      card: "Carte bancaire",
      mobile_money: "Mobile Money",
      bank_transfer: "Virement bancaire",
      check: "Chèque",
      other: "Autre",
    };

    return labels[method] || method;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
        <p className="text-muted-foreground">
          Commencez par créer votre premier paiement
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(new Date(payment.created_at), "dd MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  {payment.orders?.order_number || "-"}
                </TableCell>
                <TableCell>
                  {payment.customers?.name || "-"}
                </TableCell>
                <TableCell>{getMethodLabel(payment.payment_method)}</TableCell>
                <TableCell className="font-medium">
                  {payment.amount} {payment.currency}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {payment.transaction_id || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(payment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
