/**
 * Page CustomerMyReturns - Mes retours (Customer Portal)
 * Date: 26 Janvier 2025
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerReturns } from '@/hooks/returns/useReturns';
import { useReturn } from '@/hooks/returns/useReturns';
import {
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReturnRequestForm } from '@/components/returns/ReturnRequestForm';

export default function CustomerMyReturns() {
  const { user } = useAuth();
  const { data: returns, isLoading } = useCustomerReturns(user?.id);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = (returns || []).filter((r: any) =>
    r.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      requested: { label: 'En attente', variant: 'secondary', icon: Clock },
      approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle2 },
      rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
      pending_pickup: { label: 'Récupération', variant: 'secondary', icon: Clock },
      in_transit: { label: 'En transit', variant: 'default', icon: Package },
      received: { label: 'Reçu', variant: 'default', icon: CheckCircle2 },
      inspecting: { label: 'Inspection', variant: 'secondary', icon: AlertCircle },
      refunded: { label: 'Remboursé', variant: 'default', icon: CheckCircle2 },
      exchanged: { label: 'Échangé', variant: 'default', icon: RefreshCw },
      replaced: { label: 'Remplacé', variant: 'default', icon: Package },
      cancelled: { label: 'Annulé', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <RefreshCw className="h-8 w-8" />
                Mes Retours
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos demandes de retour et remboursement
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{returns?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Total retours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {returns?.filter((r: any) => r.status === 'requested' || r.status === 'approved').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">En cours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {returns?.filter((r: any) => r.status === 'refunded').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Remboursés</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {returns?.reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0).toLocaleString('fr-FR') || 0} XOF
                  </div>
                  <div className="text-sm text-muted-foreground">Total remboursé</div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro de retour ou produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des Retours</CardTitle>
                <CardDescription>
                  Liste de toutes vos demandes de retour
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReturns && filteredReturns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReturns.map((returnItem: any) => (
                        <TableRow key={returnItem.id}>
                          <TableCell className="font-mono text-sm">
                            {returnItem.return_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {returnItem.products?.image_url && (
                                <img
                                  src={returnItem.products.image_url}
                                  alt={returnItem.products.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <span className="font-medium">{returnItem.products?.name || 'Produit'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {returnItem.return_reason === 'defective' && 'Défectueux'}
                              {returnItem.return_reason === 'wrong_item' && 'Mauvais article'}
                              {returnItem.return_reason === 'not_as_described' && 'Ne correspond pas'}
                              {returnItem.return_reason === 'damaged' && 'Endommagé'}
                              {returnItem.return_reason === 'size_fit' && 'Taille/ajustement'}
                              {returnItem.return_reason === 'quality' && 'Qualité'}
                              {returnItem.return_reason === 'duplicate' && 'Dupliqué'}
                              {returnItem.return_reason === 'changed_mind' && 'Changement d\'avis'}
                              {returnItem.return_reason === 'other' && 'Autre'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {returnItem.refund_amount
                                  ? returnItem.refund_amount.toLocaleString('fr-FR')
                                  : returnItem.total_amount.toLocaleString('fr-FR')}{' '}
                                XOF
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(returnItem.requested_at), 'PPP', { locale: fr })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du Retour</DialogTitle>
                                  <DialogDescription>
                                    {returnItem.return_number}
                                  </DialogDescription>
                                </DialogHeader>
                                <ReturnDetailView returnId={returnItem.id} />
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Aucun retour trouvé' : 'Aucun retour pour le moment'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Composant pour afficher les détails d'un retour
function ReturnDetailView({ returnId }: { returnId: string }) {
  const { data: returnItem } = useReturn(returnId);

  if (!returnItem) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Statut */}
      <div className="flex items-center justify-between">
        <Badge>{returnItem.status}</Badge>
        <span className="text-sm text-muted-foreground">
          {format(new Date(returnItem.requested_at), 'PPP p', { locale: fr })}
        </span>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Montant total</div>
          <div className="font-semibold">{returnItem.total_amount.toLocaleString('fr-FR')} XOF</div>
        </div>
        {returnItem.refund_amount && (
          <div>
            <div className="text-sm text-muted-foreground">Montant remboursé</div>
            <div className="font-semibold">{returnItem.refund_amount.toLocaleString('fr-FR')} XOF</div>
          </div>
        )}
      </div>

      {/* Raison */}
      {returnItem.return_reason_details && (
        <div>
          <div className="text-sm text-muted-foreground mb-1">Détails de la raison</div>
          <p className="text-sm">{returnItem.return_reason_details}</p>
        </div>
      )}

      {/* Notes */}
      {returnItem.customer_notes && (
        <div>
          <div className="text-sm text-muted-foreground mb-1">Vos notes</div>
          <p className="text-sm">{returnItem.customer_notes}</p>
        </div>
      )}

      {/* Photos */}
      {returnItem.customer_photos && returnItem.customer_photos.length > 0 && (
        <div>
          <div className="text-sm text-muted-foreground mb-2">Photos</div>
          <div className="grid grid-cols-3 gap-2">
            {returnItem.customer_photos.map((url: string, index: number) => (
              <img
                key={index}
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

