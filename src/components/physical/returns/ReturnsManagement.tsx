/**
 * Returns Management Component
 * Interface admin pour gérer les retours
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStoreReturns, useApproveReturn, useRejectReturn, useUpdateReturnStatus, type ProductReturn } from '@/hooks/physical/useReturns';
import { useStore } from '@/hooks/useStore';
import { CheckCircle2, XCircle, Package, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_COLORS: Record<ProductReturn['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  return_shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  return_received: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inspecting: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  refund_processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  refunded: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  store_credit_issued: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  exchange_processing: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  exchanged: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const STATUS_LABELS: Record<ProductReturn['status'], string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  return_shipped: 'Retour expédié',
  return_received: 'Retour reçu',
  inspecting: 'En inspection',
  refund_processing: 'Remboursement en cours',
  refunded: 'Remboursé',
  store_credit_issued: 'Crédit émis',
  exchange_processing: 'Échange en cours',
  exchanged: 'Échangé',
  cancelled: 'Annulé',
};

interface ReturnsManagementProps {
  storeId: string;
}

export const ReturnsManagement = ({ storeId }: ReturnsManagementProps) => {
  const [selectedStatus, setSelectedStatus] = useState<ProductReturn['status'] | 'all'>('all');
  const { data: returns = [], isLoading } = useStoreReturns(storeId, {
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });
  
  const approveReturn = useApproveReturn();
  const rejectReturn = useRejectReturn();
  const updateStatus = useUpdateReturnStatus();

  const handleApprove = (returnId: string) => {
    if (confirm('Approuver ce retour ?')) {
      approveReturn.mutate({ returnId });
    }
  };

  const handleReject = (returnId: string) => {
    const reason = prompt('Raison du rejet :');
    if (reason) {
      rejectReturn.mutate({ returnId, rejectionReason: reason });
    }
  };

  const handleStatusUpdate = (returnId: string, newStatus: ProductReturn['status']) => {
    updateStatus.mutate({ returnId, status: newStatus });
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Retours</h1>
          <p className="text-muted-foreground">
            {returns.length} retour{returns.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="return_received">Retour reçu</SelectItem>
              <SelectItem value="refunded">Remboursé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{returns.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{returns.filter(r => r.status === 'approved').length}</div>
            <div className="text-sm text-muted-foreground">Approuvés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{returns.filter(r => r.status === 'return_received').length}</div>
            <div className="text-sm text-muted-foreground">Retours reçus</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{returns.filter(r => r.status === 'refunded').length}</div>
            <div className="text-sm text-muted-foreground">Remboursés</div>
          </CardContent>
        </Card>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {returns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun retour trouvé
            </CardContent>
          </Card>
        ) : (
          returns.map((returnItem) => (
            <Card key={returnItem.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {returnItem.return_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Commande: {returnItem.order?.order_number || 'N/A'}
                    </p>
                  </div>
                  <Badge className={cn(STATUS_COLORS[returnItem.status])}>
                    {STATUS_LABELS[returnItem.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Info */}
                <div className="flex items-center gap-4">
                  {returnItem.product?.image_url && (
                    <img
                      src={returnItem.product.image_url}
                      alt={returnItem.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{returnItem.product?.name || 'Produit'}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantité: {returnItem.quantity} | Montant: {returnItem.original_amount} XOF
                    </p>
                  </div>
                </div>

                {/* Return Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Raison:</span>
                    <p className="font-medium">{returnItem.return_reason}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Méthode remboursement:</span>
                    <p className="font-medium">{returnItem.refund_method}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date demande:</span>
                    <p className="font-medium">
                      {format(new Date(returnItem.requested_at), 'PP', { locale: fr })}
                    </p>
                  </div>
                  {returnItem.return_deadline_date && (
                    <div>
                      <span className="text-muted-foreground">Date limite:</span>
                      <p className="font-medium">
                        {format(new Date(returnItem.return_deadline_date), 'PP', { locale: fr })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Customer Notes */}
                {returnItem.customer_notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes client:</p>
                    <p className="text-sm">{returnItem.customer_notes}</p>
                  </div>
                )}

                {/* Actions */}
                {returnItem.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(returnItem.id)}
                      disabled={approveReturn.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(returnItem.id)}
                      disabled={rejectReturn.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                )}

                {returnItem.status === 'approved' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(returnItem.id, 'return_received')}
                    >
                      Marquer comme reçu
                    </Button>
                  </div>
                )}

                {returnItem.status === 'return_received' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(returnItem.id, 'inspecting')}
                    >
                      Démarrer inspection
                    </Button>
                  </div>
                )}

                {returnItem.status === 'inspecting' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(returnItem.id, 'refund_processing')}
                    >
                      Procéder au remboursement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

