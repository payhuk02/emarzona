import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  Filter,
  Download,
  Key,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Shield,
  Eye,
  Edit,
  Plus,
  Minus,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Client avec accès
 */
export interface CustomerAccess {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  avatar?: string;
  productId: string;
  productName: string;
  downloadCount: number;
  downloadLimit?: number;
  licenseKey?: string;
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  purchaseDate: Date | string;
  lastAccessDate?: Date | string;
  expiryDate?: Date | string;
  ipAddress?: string;
  location?: string;
  amountPaid: number;
  currency?: string;
}

/**
 * Props pour CustomerAccessManager
 */
export interface CustomerAccessManagerProps {
  /** Liste des accès clients */
  customerAccess: CustomerAccess[];
  
  /** Callback lors de la révocation d'accès */
  onRevokeAccess?: (accessId: string, reason?: string) => void;
  
  /** Callback lors de la restauration d'accès */
  onRestoreAccess?: (accessId: string) => void;
  
  /** Callback lors de la modification de la limite */
  onUpdateLimit?: (accessId: string, newLimit: number) => void;
  
  /** Callback lors de la prolongation */
  onExtendAccess?: (accessId: string, newDate: Date) => void;
  
  /** Callback lors de la visualisation des détails */
  onViewDetails?: (access: CustomerAccess) => void;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * CustomerAccessManager - Gestionnaire des accès clients aux produits digitaux
 * 
 * @example
 * ```tsx
 * <CustomerAccessManager 
 *   customerAccess={accessList}
 *   onRevokeAccess={(id, reason) => console.log('Revoke:', id, reason)}
 *   onRestoreAccess={(id) => console.log('Restore:', id)}
 *   onUpdateLimit={(id, limit) => console.log('Update limit:', id, limit)}
 * />
 * ```
 */
export const CustomerAccessManager: React.FC<CustomerAccessManagerProps> = ({
  customerAccess,
  onRevokeAccess,
  onRestoreAccess,
  onUpdateLimit,
  onExtendAccess,
  onViewDetails,
  className,
}) => {
  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerAccess['status']>('all');
  const [productFilter, setProductFilter] = useState<'all' | string>('all');
  const [selectedAccess, setSelectedAccess] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [newLimit, setNewLimit] = useState<number>(0);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Obtenir la liste unique des produits
  const uniqueProducts = useMemo(() => {
    const products = new Map();
    customerAccess.forEach((access) => {
      if (!products.has(access.productId)) {
        products.set(access.productId, access.productName);
      }
    });
    return Array.from(products.entries());
  }, [customerAccess]);

  // Filtrer les accès
  const filteredAccess = useMemo(() => {
    let result = [...customerAccess];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.customerName.toLowerCase().includes(query) ||
          a.customerEmail.toLowerCase().includes(query) ||
          a.productName.toLowerCase().includes(query) ||
          a.licenseKey?.toLowerCase().includes(query)
      );
    }

    // Filtre statut
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filtre produit
    if (productFilter !== 'all') {
      result = result.filter((a) => a.productId === productFilter);
    }

    return result;
  }, [customerAccess, searchQuery, statusFilter, productFilter]);

  // Statistiques
  const stats = useMemo(() => {
    const total = customerAccess.length;
    const active = customerAccess.filter((a) => a.status === 'active').length;
    const suspended = customerAccess.filter((a) => a.status === 'suspended').length;
    const revoked = customerAccess.filter((a) => a.status === 'revoked').length;
    const expired = customerAccess.filter((a) => a.status === 'expired').length;
    const totalRevenue = customerAccess.reduce((sum, a) => sum + a.amountPaid, 0);

    return { total, active, suspended, revoked, expired, totalRevenue };
  }, [customerAccess]);

  // Obtenir la configuration du statut
  const getStatusConfig = (status: CustomerAccess['status']) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Actif' };
      case 'suspended':
        return { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Suspendu' };
      case 'revoked':
        return { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Révoqué' };
      case 'expired':
        return { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Expiré' };
    }
  };

  // Gérer la modification de limite
  const handleLimitUpdate = (accessId: string) => {
    if (newLimit > 0) {
      onUpdateLimit?.(accessId, newLimit);
      setEditingLimit(null);
      setNewLimit(0);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Accès Clients</h2>
          <p className="text-muted-foreground">
            Gérez les accès et licences de vos clients pour les produits digitaux
          </p>
        </div>
        <Badge variant="secondary" className="text-base">
          {filteredAccess.length} accès
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Suspendus</p>
              <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Révoqués</p>
              <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-xs text-muted-foreground">Expirés</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-green-600">
                {stats.totalRevenue.toLocaleString()} EUR
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, email, produit ou licence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>

            {/* Filtre statut */}
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="revoked">Révoqué</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre produit */}
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                {uniqueProducts.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Téléchargements</TableHead>
                <TableHead>Licence</TableHead>
                <TableHead>Date d'achat</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAccess.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-medium">Aucun accès trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccess.map((access) => {
                  const statusConfig = getStatusConfig(access.status);
                  const StatusIcon = statusConfig.icon;
                  const isEditingThisLimit = editingLimit === access.id;

                  return (
                    <TableRow key={access.id}>
                      {/* Client */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {access.avatar ? (
                            <img
                              src={access.avatar}
                              alt={access.customerName}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-600">
                                {access.customerName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{access.customerName}</p>
                            <p className="text-xs text-muted-foreground">{access.customerEmail}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Produit */}
                      <TableCell>
                        <p className="font-medium">{access.productName}</p>
                        {access.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {access.location}
                          </div>
                        )}
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full', statusConfig.bgColor)}>
                          <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                          <span className={cn('text-sm font-medium', statusConfig.color)}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </TableCell>

                      {/* Téléchargements */}
                      <TableCell>
                        {isEditingThisLimit ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={newLimit}
                              onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
                              className="w-20 h-8"
                              min="0"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => handleLimitUpdate(access.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => {
                                setEditingLimit(null);
                                setNewLimit(0);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4 text-blue-600" />
                            <span>
                              {access.downloadCount}
                              {access.downloadLimit && `/${access.downloadLimit}`}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setEditingLimit(access.id);
                                setNewLimit(access.downloadLimit || 0);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>

                      {/* Licence */}
                      <TableCell>
                        {access.licenseKey ? (
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-purple-600" />
                            <code className="text-xs font-mono">{access.licenseKey.slice(0, 12)}...</code>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aucune</span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(access.purchaseDate)}
                        </div>
                      </TableCell>

                      {/* Montant */}
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {access.amountPaid} {access.currency || 'EUR'}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onViewDetails && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => onViewDetails(access)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}

                          {access.status === 'active' && onRevokeAccess && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 text-red-600">
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Révoquer l'accès ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Le client {access.customerName} perdra l'accès au produit{' '}
                                    {access.productName}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="my-4">
                                  <Label htmlFor="reason">Raison (optionnelle)</Label>
                                  <Input
                                    id="reason"
                                    placeholder="Ex: Violation des conditions d'utilisation"
                                    value={revokeReason}
                                    onChange={(e) => setRevokeReason(e.target.value)}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600"
                                    onClick={() => {
                                      onRevokeAccess(access.id, revokeReason);
                                      setRevokeReason('');
                                    }}
                                  >
                                    Révoquer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {(access.status === 'suspended' || access.status === 'revoked') &&
                            onRestoreAccess && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-green-600"
                                onClick={() => onRestoreAccess(access.id)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
};

CustomerAccessManager.displayName = 'CustomerAccessManager';

export default CustomerAccessManager;

