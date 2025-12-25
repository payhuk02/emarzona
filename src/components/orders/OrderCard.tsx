import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, Trash2, Edit, Calendar, CreditCard, User, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { OrderEditDialog } from "./OrderEditDialog";

interface OrderCardProps {
  order: Order;
  onUpdate: () => void;
  storeId: string;
}

const OrderCardComponent = ({ order, onUpdate, storeId }: OrderCardProps) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut mis à jour",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de paiement mis à jour",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
      });

      onUpdate();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      paid: "bg-green-500/10 text-green-500 border-green-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      paid: "Payée",
      failed: "Échouée",
    };
    return labels[status] || status;
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow" style={{ willChange: 'transform' }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold text-sm">{order.order_number}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>{format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{order.customers?.name || "Client non spécifié"}</span>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <span className="font-semibold text-lg">
              {order.total_amount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} {order.currency}
            </span>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <Select
              value={order.payment_status}
              onValueChange={handlePaymentStatusChange}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="failed">Échouée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Statut de la commande</label>
            <Select
              value={order.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailDialogOpen(true)}
              className="w-full"
              aria-label="Voir les détails de la commande"
            >
              <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="text-xs">Détails</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="w-full"
              aria-label="Modifier la commande"
            >
              <Edit className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="text-xs">Modifier</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full"
              aria-label="Supprimer la commande"
            >
              <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="text-xs">Supprimer</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <OrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        order={order}
      />

      <OrderEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={order}
        onSuccess={onUpdate}
        storeId={storeId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la commande <strong>{order.order_number}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrderCard = React.memo(OrderCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.payment_status === nextProps.order.payment_status &&
    prevProps.order.total_amount === nextProps.order.total_amount &&
    prevProps.order.created_at === nextProps.order.created_at &&
    prevProps.storeId === nextProps.storeId &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});

OrderCard.displayName = 'OrderCard';

