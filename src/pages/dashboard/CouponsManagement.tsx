/**
 * Page de Gestion Complète des Coupons
 * Date: 31 Janvier 2025
 *
 * Interface complète pour gérer les coupons avec :
 * - Création, édition, suppression
 * - Statistiques d'utilisation
 * - Tracking complet
 * - Support tous types de produits
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Copy,
  Download,
  BarChart3,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
} from '@/hooks/physical/usePromotions';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { CreatePromotionDialog } from '@/components/promotions/CreatePromotionDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MainLayout } from '@/components/layout';

interface PromotionUsage {
  id: string;
  promotion_id: string;
  order_id: string;
  customer_id?: string;
  discount_amount: number;
  order_total_before: number;
  order_total_after: number;
  customer_email?: string;
  customer_name?: string;
  used_at: string;
}

export default function CouponsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const { data: promotions = [], isLoading: promotionsLoading } = usePromotions({
    storeId: store?.id,
  });
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const isMobile = useIsMobile();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>(
    'all'
  );
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping'
  >('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(null);
  const [viewingUsageId, setViewingUsageId] = useState<string | null>(null);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les utilisations d'une promotion
  const { data: promotionUsages = [], isLoading: usagesLoading } = useQuery({
    queryKey: ['promotion-usages', viewingUsageId],
    queryFn: async () => {
      if (!viewingUsageId) return [];

      const { data, error } = await supabase
        .from('promotion_usage')
        .select('*')
        .eq('promotion_id', viewingUsageId)
        .order('used_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Error fetching promotion usages', { error, promotionId: viewingUsageId });
        throw error;
      }

      return (data || []) as PromotionUsage[];
    },
    enabled: !!viewingUsageId,
  });

  // Filtrer les promotions
  const filteredPromotions = useMemo(() => {
    let  filtered= promotions;

    // Filtre par statut
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        if (statusFilter === 'active') {
          return p.is_active && (!p.ends_at || new Date(p.ends_at) > now);
        }
        if (statusFilter === 'inactive') {
          return !p.is_active;
        }
        if (statusFilter === 'expired') {
          return p.ends_at && new Date(p.ends_at) <= now;
        }
        return true;
      });
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.discount_type === typeFilter);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.code?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [promotions, statusFilter, typeFilter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: promotions.length,
      active: promotions.filter(p => p.is_active && (!p.ends_at || new Date(p.ends_at) > now))
        .length,
      totalUses: promotions.reduce((sum, p) => sum + (p.current_uses || 0), 0),
      totalDiscount: promotions.reduce((sum, p) => sum + (p.total_discount_given || 0), 0),
      totalOrders: promotions.reduce((sum, p) => sum + (p.total_orders || 0), 0),
      averageDiscount:
        promotions.length > 0
          ? promotions.reduce((sum, p) => sum + (p.discount_value || 0), 0) / promotions.length
          : 0,
    };
  }, [promotions]);

  // Handlers
  const handleDeletePromotion = async (promotionId: string) => {
    try {
      await deletePromotion.mutateAsync(promotionId);
      setDeletingPromotionId(null);
      toast({
        title: '✅ Coupon supprimé',
        description: 'Le coupon a été supprimé avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le coupon',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: '✅ Code copié',
      description: 'Le code promo a été copié dans le presse-papiers',
    });
  };

  interface PromotionData {
    is_active?: boolean;
    ends_at?: string;
    starts_at?: string;
  }
  const getStatusBadge = (promotion: PromotionData) => {
    const now = new Date();
    if (!promotion.is_active) {
      return <Badge variant="secondary">Inactif</Badge>;
    }
    if (promotion.ends_at && new Date(promotion.ends_at) <= now) {
      return <Badge variant="destructive">Expiré</Badge>;
    }
    if (promotion.starts_at && new Date(promotion.starts_at) > now) {
      return <Badge variant="outline">Programmé</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-600">
        Actif
      </Badge>
    );
  };

  const getDiscountTypeLabel = (type: string) => {
    const  labels: Record<string, string> = {
      percentage: 'Pourcentage',
      fixed_amount: 'Montant fixe',
      buy_x_get_y: 'Acheter X obtenir Y',
      free_shipping: 'Livraison gratuite',
    };
    return labels[type] || type;
  };

  if (storeLoading || promotionsLoading) {
    return (
      <MainLayout layoutType="promotions">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="promotions">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Gestion des Coupons
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Créez et gérez vos codes promo pour tous types de produits
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Coupon
          </Button>
        </div>

        {/* Statistiques */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Actifs</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Utilisations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalUses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Réduction Totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {stats.totalDiscount.toLocaleString()} {store?.currency || 'XOF'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Commandes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrer & Rechercher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un coupon..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="expired">Expirés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={v => setTypeFilter(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                  <SelectItem value="buy_x_get_y">Acheter X obtenir Y</SelectItem>
                  <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des coupons */}
        <Card>
          <CardHeader>
            <CardTitle>Coupons ({filteredPromotions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPromotions.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Aucun coupon ne correspond à vos critères'
                    : 'Aucun coupon créé'}
                </p>
                {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre premier coupon
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile: Cards */}
                {isMobile ? (
                  <div className="space-y-3">
                    {filteredPromotions.map(promotion => (
                      <div key={promotion.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-semibold truncate">{promotion.name}</div>
                              {promotion.code && (
                                <Badge variant="outline" className="font-mono">
                                  {promotion.code}
                                </Badge>
                              )}
                              {getStatusBadge(promotion)}
                            </div>
                            {promotion.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {promotion.description}
                              </div>
                            )}
                          </div>

                          <Select>
                            <SelectTrigger className="shrink-0">

                                <MoreVertical className="h-4 w-4" />
                              
</SelectTrigger>
                            <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                              {promotion.code && (
                                <SelectItem value="edit" onSelect={() => handleCopyCode(promotion.code!)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copier le code
                                </SelectItem>
                              )}
                              <SelectItem value="delete" onSelect={() => setViewingUsageId(promotion.id)}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Voir les utilisations
                              </SelectItem>
                              <SelectItem value="copy" onSelect={() => setEditingPromotionId(promotion.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Éditer
                              </SelectItem>
                              <SelectItem value="view" onSelect={() => setDeletingPromotionId(promotion.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {getDiscountTypeLabel(promotion.discount_type)}
                            </div>
                            <div>Type</div>
                          </div>
                          <div className="text-muted-foreground text-right">
                            <div className="font-semibold text-foreground">
                              {promotion.discount_type === 'percentage'
                                ? `${promotion.discount_value}%`
                                : `${promotion.discount_value} ${store?.currency || 'XOF'}`}
                            </div>
                            <div>Valeur</div>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">
                              {promotion.current_uses || 0}
                              {promotion.max_uses && ` / ${promotion.max_uses}`}
                            </span>
                            <span>utilisations</span>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {format(new Date(promotion.starts_at), 'dd MMM yyyy', {
                                locale: fr,
                              })}
                            </div>
                            {promotion.ends_at ? (
                              <div className="text-muted-foreground">
                                jusqu'au{' '}
                                {format(new Date(promotion.ends_at), 'dd MMM yyyy', {
                                  locale: fr,
                                })}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">sans fin</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop: Table */
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Coupon</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Valeur</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Utilisations</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPromotions.map(promotion => (
                          <TableRow key={promotion.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {promotion.name}
                                  {promotion.code && (
                                    <Badge variant="outline" className="font-mono">
                                      {promotion.code}
                                    </Badge>
                                  )}
                                </div>
                                {promotion.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {promotion.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getDiscountTypeLabel(promotion.discount_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {promotion.discount_type === 'percentage'
                                  ? `${promotion.discount_value}%`
                                  : `${promotion.discount_value} ${store?.currency || 'XOF'}`}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(promotion)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {promotion.current_uses || 0}
                                  {promotion.max_uses && ` / ${promotion.max_uses}`}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>
                                  {format(new Date(promotion.starts_at), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </div>
                                {promotion.ends_at && (
                                  <div className="text-muted-foreground">
                                    jusqu'au{' '}
                                    {format(new Date(promotion.ends_at), 'dd MMM yyyy', {
                                      locale: fr,
                                    })}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select>
                                <SelectTrigger>

                                    <MoreVertical className="h-4 w-4" />
                                  
</SelectTrigger>
                                <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                  {promotion.code && (
                                    <SelectItem value="export" onSelect={() => handleCopyCode(promotion.code!)}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copier le code
                                    </SelectItem>
                                  )}
                                  <SelectItem value="duplicate" onSelect={() => setViewingUsageId(promotion.id)}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Voir les utilisations
                                  </SelectItem>
                                  <SelectItem value="toggle" onSelect={() => setEditingPromotionId(promotion.id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Éditer
                                  </SelectItem>
                                  <SelectItem value="quickview" onSelect={() => setDeletingPromotionId(promotion.id)}
                                    className="text-red-600"
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
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog Création */}
        <CreatePromotionDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            toast({
              title: '✅ Coupon créé',
              description: 'Le coupon a été créé avec succès',
            });
          }}
        />

        {/* Dialog Édition */}
        {editingPromotionId && (
          <CreatePromotionDialog
            open={!!editingPromotionId}
            onOpenChange={open => !open && setEditingPromotionId(null)}
            promotionId={editingPromotionId}
            onSuccess={() => {
              setEditingPromotionId(null);
              toast({
                title: '✅ Coupon mis à jour',
                description: 'Le coupon a été mis à jour avec succès',
              });
            }}
          />
        )}

        {/* Dialog Utilisations */}
        <Dialog open={!!viewingUsageId} onOpenChange={open => !open && setViewingUsageId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Utilisations du Coupon</DialogTitle>
              <DialogDescription>Historique des utilisations de ce coupon</DialogDescription>
            </DialogHeader>
            {usagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : promotionUsages.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune utilisation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promotionUsages.map(usage => (
                  <Card key={usage.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {usage.customer_name || usage.customer_email || 'Client anonyme'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Commande #{usage.order_id.slice(0, 8)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(usage.used_at), 'dd MMM yyyy à HH:mm', {
                              locale: fr,
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            -{usage.discount_amount.toLocaleString()} {store?.currency || 'XOF'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {usage.order_total_before.toLocaleString()} →{' '}
                            {usage.order_total_after.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Suppression */}
        <AlertDialog
          open={!!deletingPromotionId}
          onOpenChange={open => !open && setDeletingPromotionId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce coupon ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le coupon sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingPromotionId && handleDeletePromotion(deletingPromotionId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}






