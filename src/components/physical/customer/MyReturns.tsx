/**
 * MyReturns - Gestion améliorée des retours produits physiques
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  AlertCircle,
  Plus,
  Eye,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReturnRequestForm } from '@/components/physical/returns/ReturnRequestForm';
import { useState } from 'react';

export const MyReturns = () => {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: returns, isLoading, error } = useQuery({
    queryKey: ['customerReturns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le customer_id
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customerData) return [];

      // Récupérer les retours
      const { data, error: returnsError } = await supabase
        .from('product_returns')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            created_at
          ),
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (returnsError) throw returnsError;

      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <CheckCircle2 className="h-3 w-3" />
            Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
        );
      case 'return_received':
        return (
          <Badge variant="default" className="gap-1 bg-purple-500">
            <Package className="h-3 w-3" />
            Reçu
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Remboursé
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement de vos retours. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Mes Retours</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Gérez vos demandes de retour et suivez leur statut
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedOrderId(null)}
                  className="min-h-[44px] sm:min-h-[36px] touch-manipulation w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle demande
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Demander un retour</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle demande de retour pour un produit
                  </DialogDescription>
                </DialogHeader>
                {selectedOrderId ? (
                  <ReturnRequestForm
                    orderId={selectedOrderId}
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedOrderId(null);
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Veuillez sélectionner une commande pour créer une demande de retour
                    </p>
                    <Button onClick={() => navigate('/account/orders')}>
                      Voir mes commandes
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          {!returns || returns.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <RotateCcw className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Aucun retour</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                Vous n'avez pas encore effectué de demande de retour
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="min-h-[44px] px-6 touch-manipulation"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une demande
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile: Cartes */}
              <div className="space-y-3 sm:hidden">
                {returns.map((returnItem: any) => (
                  <Card key={returnItem.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm mb-1">
                              #{returnItem.return_number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Commande: {returnItem.order?.order_number || returnItem.order_id?.slice(0, 8)}
                            </div>
                          </div>
                          {getStatusBadge(returnItem.status)}
                        </div>
                        
                        <div className="flex items-start gap-2">
                          {returnItem.product?.image_url && (
                            <img
                              src={returnItem.product.image_url}
                              alt={returnItem.product.name}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium break-words">
                              {returnItem.product?.name || 'Produit'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 capitalize break-words">
                              {returnItem.return_reason?.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(returnItem.requested_at), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/returns/${returnItem.id}`)}
                            className="min-h-[36px] touch-manipulation"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((returnItem: any) => (
                      <TableRow key={returnItem.id}>
                        <TableCell className="font-medium">
                          #{returnItem.return_number}
                        </TableCell>
                        <TableCell>
                          {returnItem.order?.order_number || returnItem.order_id?.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {returnItem.product?.image_url && (
                              <img
                                src={returnItem.product.image_url}
                                alt={returnItem.product.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <span className="text-sm">{returnItem.product?.name || 'Produit'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground capitalize">
                            {returnItem.return_reason?.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(returnItem.requested_at), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/returns/${returnItem.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
