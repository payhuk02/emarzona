import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, Eye, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';
import { Order, SortColumn, SortDirection } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrderDetailDialog } from './OrderDetailDialog';
import { OrderEditDialog } from './OrderEditDialog';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  onUpdate: () => void;
  storeId: string;
  sortBy: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

const OrdersTableComponent = ({
  orders,
  onUpdate,
  storeId,
  sortBy,
  sortDirection,
  onSort,
}: OrdersTableProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper component for sortable column headers
  const SortableHeader = ({
    column,
    children,
    className,
  }: {
    column: SortColumn;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortBy === column;
    const Icon = isActive ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
      <TableHead
        className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
        onClick={() => onSort(column)}
        role="button"
        aria-label={`Trier par ${children}${isActive ? ` (${sortDirection === 'asc' ? 'croissant' : 'décroissant'})` : ''}`}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSort(column);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {children}
          <Icon
            className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            aria-hidden="true"
          />
        </div>
      </TableHead>
    );
  };

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Statut mis à jour',
        });

        onUpdate();
      } catch (_error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [onUpdate]
  ); // Note: toast est stable

  const handlePaymentStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: newStatus })
          .eq('id', orderId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Statut de paiement mis à jour',
        });

        onUpdate();
      } catch (_error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [onUpdate]
  ); // Note: toast est stable

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('orders').delete().eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Commande supprimée avec succès',
      });

      onUpdate();
      setDeleteId(null);
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [deleteId, onUpdate]);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-px">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader column="order_number">N° Commande</SortableHeader>
                <TableHead>Client</TableHead>
                <SortableHeader column="total_amount">Montant</SortableHeader>
                <SortableHeader column="status">Statut</SortableHeader>
                <SortableHeader column="payment_status">Paiement</SortableHeader>
                <SortableHeader column="created_at" className="hidden xl:table-cell">
                  Date
                </SortableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {order.customers?.name || 'Client non spécifié'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {order.total_amount.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {order.currency}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={value => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-full min-w-[120px] min-h-[44px] h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="processing">En cours</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.payment_status}
                      onValueChange={value => handlePaymentStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-full min-w-[110px] min-h-[44px] h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payée</SelectItem>
                        <SelectItem value="failed">Échouée</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell whitespace-nowrap">
                    {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select>
                      <SelectTrigger className="min-h-[44px] min-w-[44px]">
                        <MoreHorizontal className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                        <SelectItem
                          value="view"
                          onSelect={() => {
                            setSelectedOrder(order);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </SelectItem>
                        <SelectItem
                          value="edit"
                          onSelect={() => {
                            setSelectedOrder(order);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </SelectItem>
                        <SelectItem
                          value="delete"
                          onSelect={() => setDeleteId(order.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <OrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        order={selectedOrder}
      />

      <OrderEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={selectedOrder}
        onSuccess={onUpdate}
        storeId={storeId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

OrdersTableComponent.displayName = 'OrdersTableComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrdersTable = React.memo(OrdersTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.orders.length === nextProps.orders.length &&
    prevProps.storeId === nextProps.storeId &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.sortDirection === nextProps.sortDirection &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onSort === nextProps.onSort &&
    // Comparaison superficielle des orders (comparer les IDs)
    prevProps.orders.every(
      (order, index) =>
        order.id === nextProps.orders[index]?.id &&
        order.status === nextProps.orders[index]?.status &&
        order.total === nextProps.orders[index]?.total
    )
  );
});

OrdersTable.displayName = 'OrdersTable';
