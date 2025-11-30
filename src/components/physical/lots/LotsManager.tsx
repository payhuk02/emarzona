/**
 * Gestionnaire de lots de produits
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Warehouse,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useProductLots, useDeleteLot } from '@/hooks/physical/useLotsExpiration';
import { LotForm } from './LotForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface LotsManagerProps {
  physicalProductId: string;
  variantId?: string;
  warehouseId?: string;
}

export function LotsManager({ physicalProductId, variantId, warehouseId }: LotsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<string | null>(null);

  const { data: lots, isLoading } = useProductLots(physicalProductId, {
    variantId,
    warehouseId,
  });

  const deleteLot = useDeleteLot();

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  const getStatusBadge = (status: string, expirationDate?: string) => {
    if (status === 'expired') {
      return <Badge variant="destructive">Expiré</Badge>;
    }
    if (status === 'expiring_soon') {
      return <Badge variant="default" className="bg-orange-500">Expire bientôt</Badge>;
    }
    if (status === 'active') {
      if (expirationDate) {
        const daysUntilExpiration = Math.ceil(
          (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiration <= 7) {
          return <Badge variant="default" className="bg-yellow-500">Expire dans {daysUntilExpiration}j</Badge>;
        }
      }
      return <Badge variant="default" className="bg-green-500">Actif</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getRotationMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      FIFO: 'Premier entré, premier sorti',
      LIFO: 'Dernier entré, premier sorti',
      FEFO: 'Premier expiré, premier sorti',
      manual: 'Manuel',
    };
    return labels[method] || method;
  };

  // Stats calculées
  const stats = useMemo(() => {
    if (!lots) return { total: 0, active: 0, expired: 0, expiringSoon: 0 };
    const total = lots.length;
    const active = lots.filter((lot) => lot.status === 'active').length;
    const expired = lots.filter((lot) => lot.status === 'expired').length;
    const expiringSoon = lots.filter((lot) => lot.status === 'expiring_soon').length;
    return { total, active, expired, expiringSoon };
  }, [lots]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <Skeleton className="h-10 sm:h-12 w-full" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-80 w-full" />
      </div>
    );
  }

  const activeLots = lots?.filter((lot) => lot.status === 'active') || [];
  const expiredLots = lots?.filter((lot) => lot.status === 'expired') || [];
  const expiringSoonLots = lots?.filter((lot) => lot.status === 'expiring_soon') || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold">Gestion des Lots</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez les lots de produits avec dates d'expiration et rotation FIFO/LIFO/FEFO
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau Lot</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Lot</DialogTitle>
            </DialogHeader>
            <LotForm
              physicalProductId={physicalProductId}
              variantId={variantId}
              warehouseId={warehouseId}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Responsive */}
      {lots && lots.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Lots', value: stats.total, icon: Package, color: 'from-purple-600 to-pink-600' },
            { label: 'Actifs', value: stats.active, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
            { label: 'Expirés', value: stats.expired, icon: AlertTriangle, color: 'from-red-600 to-pink-600' },
            { label: 'Expirent Bientôt', value: stats.expiringSoon, icon: Clock, color: 'from-orange-600 to-yellow-600' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabs - Responsive */}
      <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1">
            <TabsTrigger 
              value="all"
              className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              Tous ({lots?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              Actifs ({activeLots.length})
            </TabsTrigger>
            <TabsTrigger 
              value="expiring"
              className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline truncate">Expirent bientôt</span>
              <span className="xs:hidden truncate">Expirent</span>
              <span className="flex-shrink-0">({expiringSoonLots.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expired"
              className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              Expirés ({expiredLots.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <LotsTable
              lots={lots || []}
              onEdit={setEditingLot}
              onDelete={(lotId) => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                  deleteLot.mutate(lotId);
                }
              }}
              getStatusBadge={getStatusBadge}
              getRotationMethodLabel={getRotationMethodLabel}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <LotsTable
              lots={activeLots}
              onEdit={setEditingLot}
              onDelete={(lotId) => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                  deleteLot.mutate(lotId);
                }
              }}
              getStatusBadge={getStatusBadge}
              getRotationMethodLabel={getRotationMethodLabel}
            />
          </TabsContent>

          <TabsContent value="expiring" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <LotsTable
              lots={expiringSoonLots}
              onEdit={setEditingLot}
              onDelete={(lotId) => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                  deleteLot.mutate(lotId);
                }
              }}
              getStatusBadge={getStatusBadge}
              getRotationMethodLabel={getRotationMethodLabel}
            />
          </TabsContent>

          <TabsContent value="expired" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <LotsTable
              lots={expiredLots}
              onEdit={setEditingLot}
              onDelete={(lotId) => {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                  deleteLot.mutate(lotId);
                }
              }}
              getStatusBadge={getStatusBadge}
              getRotationMethodLabel={getRotationMethodLabel}
            />
          </TabsContent>
        </Tabs>
      </div>

      {editingLot && (
        <Dialog open={!!editingLot} onOpenChange={() => setEditingLot(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Lot</DialogTitle>
            </DialogHeader>
            <LotForm
              lotId={editingLot}
              physicalProductId={physicalProductId}
              variantId={variantId}
              warehouseId={warehouseId}
              onSuccess={() => setEditingLot(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function LotsTable({
  lots,
  onEdit,
  onDelete,
  getStatusBadge,
  getRotationMethodLabel,
}: {
  lots: any[];
  onEdit: (lotId: string) => void;
  onDelete: (lotId: string) => void;
  getStatusBadge: (status: string, expirationDate?: string) => JSX.Element;
  getRotationMethodLabel: (method: string) => string;
}) {
  if (lots.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
          <p className="text-sm sm:text-base text-muted-foreground">Aucun lot trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="block md:hidden space-y-3 sm:space-y-4">
        {lots.map((lot, index) => (
          <LotCard
            key={lot.id}
            lot={lot}
            onEdit={() => onEdit(lot.id)}
            onDelete={() => onDelete(lot.id)}
            getStatusBadge={getStatusBadge}
            getRotationMethodLabel={getRotationMethodLabel}
            animationDelay={index * 50}
          />
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Numéro de Lot</TableHead>
                  <TableHead className="min-w-[150px]">Quantité</TableHead>
                  <TableHead className="min-w-[150px]">Date Réception</TableHead>
                  <TableHead className="min-w-[150px]">Date Expiration</TableHead>
                  <TableHead className="min-w-[180px]">Rotation</TableHead>
                  <TableHead className="min-w-[120px]">Statut</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.lot_number}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lot.current_quantity - lot.reserved_quantity} / {lot.initial_quantity}
                        {lot.reserved_quantity > 0 && (
                          <span className="text-muted-foreground text-xs ml-2">
                            ({lot.reserved_quantity} réservé)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lot.received_date
                        ? <span className="text-sm truncate block">{format(new Date(lot.received_date), 'dd MMM yyyy', { locale: fr })}</span>
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {lot.expiration_date ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate block">{getRotationMethodLabel(lot.rotation_method)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(lot.status, lot.expiration_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(lot.id)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(lot.id)} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Lot Card Component for Mobile View
interface LotCardProps {
  lot: any;
  onEdit: () => void;
  onDelete: () => void;
  getStatusBadge: (status: string, expirationDate?: string) => JSX.Element;
  getRotationMethodLabel: (method: string) => string;
  animationDelay?: number;
}

function LotCard({ lot, onEdit, onDelete, getStatusBadge, getRotationMethodLabel, animationDelay = 0 }: LotCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {lot.lot_number}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {getRotationMethodLabel(lot.rotation_method)}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(lot.status, lot.expiration_date)}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Quantité: </span>
            <span>{lot.current_quantity - lot.reserved_quantity} / {lot.initial_quantity}</span>
            {lot.reserved_quantity > 0 && (
              <span className="text-muted-foreground">({lot.reserved_quantity} réservé)</span>
            )}
          </div>
          {lot.received_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Reçu: {format(new Date(lot.received_date), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          )}
          {lot.expiration_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Expire: {format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Modifier</span>
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Supprimer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
