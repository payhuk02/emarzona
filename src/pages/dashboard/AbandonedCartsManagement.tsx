/**
 * Page de Gestion des Paniers Abandonnés
 * Date: 31 Janvier 2025
 *
 * Interface complète pour gérer les paniers abandonnés avec :
 * - Liste des paniers abandonnés
 * - Statistiques de récupération
 * - Envoi manuel d'emails
 * - Configuration des rappels
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Send,
  Eye,
  DollarSign,
  Users,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface AbandonedCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  customer_email: string | null;
  cart_items: Array<{
    product_name?: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
  currency: string;
  recovery_attempts: number;
  reminder_sent_at: string[] | null;
  recovered_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AbandonedCartsManagement() {
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'recovered' | 'pending'>('all');
  const [viewingCartId, setViewingCartId] = useState<string | null>(null);

  // Fetch abandoned carts
  const { data: abandonedCarts = [], isLoading: cartsLoading } = useQuery({
    queryKey: ['abandoned-carts', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      // Récupérer les paniers abandonnés via une fonction RPC ou directement
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Error fetching abandoned carts', { error });
        throw error;
      }

      return (data || []) as AbandonedCart[];
    },
    enabled: !!store?.id,
  });

  // Send recovery email mutation
  const sendRecoveryEmail = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase.functions.invoke('abandoned-cart-recovery', {
        body: { cart_id: cartId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast({
        title: '✅ Email envoyé',
        description: "L'email de récupération a été envoyé avec succès",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || "Impossible d'envoyer l'email",
        variant: 'destructive',
      });
    },
  });

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Filtered carts
  const filteredCarts = useMemo(() => {
    let  filtered= abandonedCarts;

    // Filter by status
    if (statusFilter === 'recovered') {
      filtered = filtered.filter(c => c.recovered_at !== null);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(c => c.recovered_at === null);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c => c.customer_email?.toLowerCase().includes(query) || c.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [abandonedCarts, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: abandonedCarts.length,
      pending: abandonedCarts.filter(c => c.recovered_at === null).length,
      recovered: abandonedCarts.filter(c => c.recovered_at !== null).length,
      totalValue: abandonedCarts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
      recoveryRate:
        abandonedCarts.length > 0
          ? (abandonedCarts.filter(c => c.recovered_at !== null).length / abandonedCarts.length) *
            100
          : 0,
      averageHours:
        abandonedCarts.length > 0
          ? abandonedCarts.reduce((sum, c) => {
              const hours = differenceInHours(now, new Date(c.created_at));
              return sum + hours;
            }, 0) / abandonedCarts.length
          : 0,
    };
  }, [abandonedCarts]);

  // Get hours since abandonment
  const getHoursSinceAbandon = (createdAt: string) => {
    return differenceInHours(new Date(), new Date(createdAt));
  };

  // Get recovery stage
  const getRecoveryStage = (cart: AbandonedCart) => {
    const hours = getHoursSinceAbandon(cart.created_at);
    if (hours < 1) return { label: 'Récent', color: 'blue' };
    if (hours < 24) return { label: '1h-24h', color: 'yellow' };
    if (hours < 72) return { label: '24h-72h', color: 'orange' };
    return { label: '72h+', color: 'red' };
  };

  if (storeLoading || cartsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Paniers Abandonnés
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez et récupérez les paniers abandonnés avec des emails automatiques
                </p>
              </div>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Récupérés</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {stats.recovered}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Valeur Totale</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {stats.totalValue.toLocaleString()} {store?.currency || 'XOF'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Taux Récupération
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {stats.recoveryRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par email ou ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={v => setStatusFilter(v as 'all' | 'sent' | 'not_sent')}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="recovered">Récupérés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Carts List */}
            <Card>
              <CardHeader>
                <CardTitle>Paniers Abandonnés ({filteredCarts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCarts.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Aucun panier ne correspond à vos critères'
                        : 'Aucun panier abandonné'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Articles</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Abandonné</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Rappels</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCarts.map(cart => {
                          const stage = getRecoveryStage(cart);
                          return (
                            <TableRow key={cart.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {cart.customer_email || 'Client anonyme'}
                                  </div>
                                  {cart.user_id && (
                                    <div className="text-xs text-muted-foreground">
                                      ID: {cart.user_id.slice(0, 8)}...
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {(cart.cart_items || []).length} article
                                  {(cart.cart_items || []).length > 1 ? 's' : ''}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold">
                                  {cart.total_amount.toLocaleString()} {cart.currency}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(cart.created_at), 'dd MMM yyyy HH:mm', {
                                    locale: fr,
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Il y a {getHoursSinceAbandon(cart.created_at)}h
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    stage.color === 'blue'
                                      ? 'default'
                                      : stage.color === 'yellow'
                                        ? 'secondary'
                                        : stage.color === 'orange'
                                          ? 'outline'
                                          : 'destructive'
                                  }
                                >
                                  {stage.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span>{cart.recovery_attempts || 0}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {cart.recovered_at ? (
                                  <Badge variant="default" className="bg-green-600">
                                    Récupéré
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">En attente</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingCartId(cart.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {!cart.recovered_at && cart.customer_email && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => sendRecoveryEmail.mutate(cart.id)}
                                      disabled={sendRecoveryEmail.isPending}
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      Envoyer
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Cart Dialog */}
            <Dialog open={!!viewingCartId} onOpenChange={open => !open && setViewingCartId(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Détails du Panier Abandonné</DialogTitle>
                  <DialogDescription>
                    Informations complètes sur ce panier abandonné
                  </DialogDescription>
                </DialogHeader>
                {viewingCartId && (
                  <div className="space-y-4">
                    {(() => {
                      const cart = abandonedCarts.find(c => c.id === viewingCartId);
                      if (!cart) return null;

                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Email</Label>
                              <div className="text-sm">
                                {cart.customer_email || 'Non disponible'}
                              </div>
                            </div>
                            <div>
                              <Label>Montant Total</Label>
                              <div className="text-sm font-semibold">
                                {cart.total_amount.toLocaleString()} {cart.currency}
                              </div>
                            </div>
                            <div>
                              <Label>Abandonné le</Label>
                              <div className="text-sm">
                                {format(new Date(cart.created_at), 'dd MMM yyyy à HH:mm', {
                                  locale: fr,
                                })}
                              </div>
                            </div>
                            <div>
                              <Label>Rappels Envoyés</Label>
                              <div className="text-sm">{cart.recovery_attempts || 0}</div>
                            </div>
                          </div>

                          <div>
                            <Label>Articles du Panier</Label>
                            <div className="mt-2 space-y-2">
                              {(cart.cart_items || []).map(
                                (
                                  item: {
                                    product_name?: string;
                                    variant_name?: string;
                                    quantity: number;
                                    unit_price: number;
                                  },
                                  index: number
                                ) => (
                                  <Card key={index}>
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium">
                                            {item.product_name || 'Produit'}
                                          </div>
                                          {item.variant_name && (
                                            <div className="text-xs text-muted-foreground">
                                              {item.variant_name}
                                            </div>
                                          )}
                                          <div className="text-xs text-muted-foreground">
                                            Quantité: {item.quantity}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-semibold">
                                            {(item.unit_price * item.quantity).toLocaleString()}{' '}
                                            {cart.currency}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              )}
                            </div>
                          </div>

                          {cart.reminder_sent_at && cart.reminder_sent_at.length > 0 && (
                            <div>
                              <Label>Historique des Rappels</Label>
                              <div className="mt-2 space-y-1">
                                {cart.reminder_sent_at.map((date, index) => (
                                  <div key={index} className="text-sm text-muted-foreground">
                                    {format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {cart.recovered_at && (
                            <div>
                              <Label>Récupéré le</Label>
                              <div className="text-sm">
                                {format(new Date(cart.recovered_at), 'dd MMM yyyy à HH:mm', {
                                  locale: fr,
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






