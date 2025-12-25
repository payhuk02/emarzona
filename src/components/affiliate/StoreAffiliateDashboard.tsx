/**
 * Component: StoreAffiliateDashboard
 * Description: Dashboard pour gérer les affiliés d'un store
 * Date: 31 Janvier 2025
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Users,
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { useStoreAffiliates, StoreAffiliate } from '@/hooks/useStoreAffiliates';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoreAffiliateDashboardProps {
  storeId: string;
}

export function StoreAffiliateDashboard({ storeId }: StoreAffiliateDashboardProps) {
  const {
    affiliates,
    stats,
    isLoading,
    approveAffiliate,
    rejectAffiliate,
    suspendAffiliate,
  } = useStoreAffiliates(storeId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<StoreAffiliate | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend'>('approve');

  // Filtrer les affiliés
  const filteredAffiliates = affiliates.filter((affiliate) => {
    const matchesSearch =
      affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.affiliate_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (affiliate: StoreAffiliate, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedAffiliate(affiliate);
    setActionType(action);
    setShowActionDialog(true);
  };

  const confirmAction = () => {
    if (!selectedAffiliate) return;

    switch (actionType) {
      case 'approve':
        approveAffiliate.mutate(selectedAffiliate.id);
        break;
      case 'reject':
        rejectAffiliate.mutate(selectedAffiliate.id);
        break;
      case 'suspend':
        suspendAffiliate.mutate(selectedAffiliate.id);
        break;
    }

    setShowActionDialog(false);
    setSelectedAffiliate(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle; label: string }> = {
      pending: { variant: 'outline', icon: Clock, label: 'En attente' },
      active: { variant: 'default', icon: CheckCircle, label: 'Actif' },
      suspended: { variant: 'destructive', icon: XCircle, label: 'Suspendu' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeté' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliés</p>
                <p className="text-2xl font-bold">{stats?.total_affiliates || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold">{stats?.active_affiliates || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats?.pending_affiliates || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commissions en attente</p>
                <p className="text-2xl font-bold">
                  {stats?.pending_commissions?.toLocaleString('fr-FR') || 0} XOF
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Performance Globale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Clics</span>
              <span className="font-bold flex items-center gap-1">
                <MousePointerClick className="h-4 w-4" />
                {stats?.total_clicks || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Ventes</span>
              <span className="font-bold flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                {stats?.total_sales || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chiffre d'affaires</span>
              <span className="font-bold flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {stats?.total_revenue?.toLocaleString('fr-FR') || 0} XOF
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Commissions payées</span>
              <span className="font-bold flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {stats?.total_commissions_paid?.toLocaleString('fr-FR') || 0} XOF
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Affiliés</CardTitle>
          <CardDescription>
            {filteredAffiliates.length} affilié(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom ou code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="suspended">Suspendus</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredAffiliates.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun affilié trouvé avec les filtres sélectionnés.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affilié</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Clics</TableHead>
                    <TableHead>Ventes</TableHead>
                    <TableHead>Revenus</TableHead>
                    <TableHead>Commissions</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{affiliate.display_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {affiliate.affiliate_code}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                      <TableCell>{affiliate.total_clicks}</TableCell>
                      <TableCell>{affiliate.total_sales}</TableCell>
                      <TableCell className="font-mono">
                        {affiliate.total_revenue.toLocaleString('fr-FR')} XOF
                      </TableCell>
                      <TableCell className="font-mono">
                        {affiliate.total_commission.toLocaleString('fr-FR')} XOF
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(affiliate.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {affiliate.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(affiliate, 'approve')}
                                disabled={approveAffiliate.isPending}
                              >
                                {approveAffiliate.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Approuver'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(affiliate, 'reject')}
                                disabled={rejectAffiliate.isPending}
                              >
                                Rejeter
                              </Button>
                            </>
                          )}
                          {affiliate.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(affiliate, 'suspend')}
                              disabled={suspendAffiliate.isPending}
                            >
                              Suspendre
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approuver l\'affilié'}
              {actionType === 'reject' && 'Rejeter l\'affilié'}
              {actionType === 'suspend' && 'Suspendre l\'affilié'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Êtes-vous sûr de vouloir approuver cet affilié ? Il pourra commencer à promouvoir vos produits.'}
              {actionType === 'reject' && 'Êtes-vous sûr de vouloir rejeter cet affilié ? Cette action est irréversible.'}
              {actionType === 'suspend' && 'Êtes-vous sûr de vouloir suspendre cet affilié ? Il ne pourra plus promouvoir vos produits jusqu\'à réactivation.'}
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedAffiliate.display_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{selectedAffiliate.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Code: {selectedAffiliate.affiliate_code}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={confirmAction}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              disabled={
                approveAffiliate.isPending ||
                rejectAffiliate.isPending ||
                suspendAffiliate.isPending
              }
            >
              {(approveAffiliate.isPending || rejectAffiliate.isPending || suspendAffiliate.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







