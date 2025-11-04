/**
 * Batch Shipment Details Component
 * Date: 27 Janvier 2025
 * 
 * Détails d'un lot d'expédition avec liste des commandes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBatchShipmentOrders } from '@/hooks/physical/useBatchShipping';
import { Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BatchShipmentDetailsProps {
  batchId: string;
}

export default function BatchShipmentDetails({ batchId }: BatchShipmentDetailsProps) {
  const { data: orders, isLoading } = useBatchShipmentOrders(batchId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statusCounts = {
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    processing: orders?.filter(o => o.status === 'processing').length || 0,
    label_generated: orders?.filter(o => o.status === 'label_generated').length || 0,
    shipped: orders?.filter(o => o.status === 'shipped').length || 0,
    failed: orders?.filter(o => o.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Commandes du lot</CardTitle>
          <CardDescription>
            {orders?.length || 0} commande{(orders?.length || 0) > 1 ? 's' : ''} dans ce lot
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistiques */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{statusCounts.pending}</div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.processing}</div>
              <div className="text-sm text-muted-foreground">En traitement</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{statusCounts.label_generated}</div>
              <div className="text-sm text-muted-foreground">Étiquette générée</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statusCounts.shipped}</div>
              <div className="text-sm text-muted-foreground">Expédié</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
              <div className="text-sm text-muted-foreground">Échoué</div>
            </div>
          </div>

          {/* Liste des commandes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Numéro de suivi</TableHead>
                  <TableHead>Erreur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!orders || orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune commande
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_in_batch}</TableCell>
                      <TableCell>
                        {(order.order as any)?.order_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {(order.order as any)?.customer_email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'shipped' ? 'default' :
                          order.status === 'label_generated' ? 'secondary' :
                          order.status === 'failed' ? 'destructive' :
                          'outline'
                        }>
                          {order.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {order.status === 'label_generated' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {order.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.tracking_number || (
                          (order.shipping_label as any)?.tracking_number || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {order.error_message ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">{order.error_message}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

