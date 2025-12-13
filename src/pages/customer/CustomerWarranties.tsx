/**
 * Page de Gestion des Garanties Client
 * Date: 31 Janvier 2025
 *
 * Interface complète pour que les clients puissent :
 * - Enregistrer leurs garanties
 * - Suivre leurs garanties
 * - Soumettre des réclamations
 * - Voir l'historique
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Package,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { WarrantyRegistration, WarrantyClaim } from '@/hooks/physical/useWarranties';

export default function CustomerWarranties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState<'warranties' | 'claims' | 'register'>(
    'warranties'
  );
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({
    order_id: '',
    product_id: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    warranty_type: 'manufacturer' as 'manufacturer' | 'store' | 'extended' | 'insurance',
    duration_months: '12',
  });
  const [claimForm, setClaimForm] = useState({
    claim_type: 'repair' as 'repair' | 'replacement' | 'refund',
    description: '',
    issue_details: '',
  });

  // Fetch user warranties
  const { data: warranties = [], isLoading: warrantiesLoading } = useQuery({
    queryKey: ['customer-warranties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('product_warranties')
        .select(
          `
          *,
          products (
            id,
            name,
            image_url
          ),
          orders (
            id,
            order_number,
            created_at
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching warranties', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user warranty claims
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['customer-warranty-claims', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer les commandes de l'utilisateur
      const { data: userOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', user.id);

      const orderIds = userOrders?.map(o => o.id) || [];

      if (orderIds.length === 0) {
        return [];
      }

      // Récupérer les garanties de l'utilisateur
      const { data: userWarranties } = await supabase
        .from('product_warranties')
        .select('id')
        .in('order_id', orderIds);

      const warrantyIds = userWarranties?.map(w => w.id) || [];

      if (warrantyIds.length === 0) {
        return [];
      }

      // Récupérer les réclamations
      const { data, error } = await supabase
        .from('warranty_claims')
        .select(
          `
          *,
          product_warranties!inner (
            id,
            warranty_number,
            products (
              id,
              name,
              image_url
            )
          )
        `
        )
        .in('warranty_id', warrantyIds)
        .order('submitted_at', { ascending: false });

      if (error) {
        logger.error('Error fetching warranty claims', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user orders for registration
  const { data: orders = [] } = useQuery({
    queryKey: ['customer-orders-for-warranty', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_type,
            products (
              id,
              name,
              image_url
            )
          )
        `
        )
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching orders', { error });
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id && isRegisterDialogOpen,
  });

  // Register warranty mutation
  const registerWarranty = useMutation({
    mutationFn: async (data: typeof registerForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!data.order_id || !data.product_id) throw new Error('Commande et produit requis');

      // Get order info
      const { data: order } = await supabase
        .from('orders')
        .select('store_id, customer_id')
        .eq('id', data.order_id)
        .single();

      if (!order) throw new Error('Commande non trouvée');

      // Generate warranty number
      const { data: warrantyNumber } = await supabase.rpc('generate_warranty_number');

      // Calculate end date
      const startDate = new Date(data.purchase_date || new Date().toISOString().split('T')[0]);
      const durationMonths = parseInt(data.duration_months) || 12;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Récupérer user_id depuis customer_id si nécessaire
      let userId = user.id;
      if (!userId && order.customer_id) {
        // Essayer de récupérer user_id depuis customers table
        const { data: customer } = await supabase
          .from('customers')
          .select('user_id')
          .eq('id', order.customer_id)
          .single();
        if (customer?.user_id) {
          userId = customer.user_id;
        }
      }

      const { data: warranty, error } = await supabase
        .from('product_warranties')
        .insert({
          store_id: order.store_id,
          order_id: data.order_id,
          product_id: data.product_id,
          user_id: userId || null, // Permettre null temporairement
          customer_id: order.customer_id || null,
          warranty_number: warrantyNumber,
          warranty_type: data.warranty_type,
          duration_months: durationMonths,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          serial_number: data.serial_number || null,
          purchase_date: startDate.toISOString().split('T')[0],
          purchase_price: parseFloat(data.purchase_price) || 0,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error registering warranty', { error });
        throw error;
      }

      return warranty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-warranties'] });
      setIsRegisterDialogOpen(false);
      setRegisterForm({
        order_id: '',
        product_id: '',
        serial_number: '',
        purchase_date: '',
        purchase_price: '',
        warranty_type: 'manufacturer',
        duration_months: '12',
      });
      toast({
        title: '✅ Garantie enregistrée',
        description: 'Votre garantie a été enregistrée avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: error.message || "Impossible d'enregistrer la garantie",
        variant: 'destructive',
      });
    },
  });

  // Create claim mutation
  const createClaim = useMutation({
    mutationFn: async (data: typeof claimForm & { warranty_id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate claim number
      const { data: claimNumber } = await supabase.rpc('generate_claim_number');

      const { data: claim, error } = await supabase
        .from('warranty_claims')
        .insert({
          warranty_id: data.warranty_id,
          user_id: user.id,
          claim_number: claimNumber,
          claim_type: data.claim_type,
          description: data.description,
          issue_details: data.issue_details,
          status: 'submitted',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating warranty claim', { error });
        throw error;
      }

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-warranty-claims'] });
      setIsClaimDialogOpen(false);
      setSelectedWarranty(null);
      setClaimForm({
        claim_type: 'repair',
        description: '',
        issue_details: '',
      });
      toast({
        title: '✅ Réclamation soumise',
        description: 'Votre réclamation de garantie a été soumise avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de soumettre la réclamation',
        variant: 'destructive',
      });
    },
  });

  // Get status badge
  const getWarrantyStatusBadge = (warranty: WarrantyRegistration) => {
    const endDate = new Date(warranty.end_date);
    const isExpired = isBefore(endDate, new Date());
    const isExpiringSoon =
      isAfter(endDate, new Date()) &&
      isBefore(endDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    if (warranty.status === 'expired' || isExpired) {
      return <Badge variant="destructive">Expirée</Badge>;
    }
    if (isExpiringSoon) {
      return (
        <Badge variant="secondary" className="bg-yellow-600">
          Expire bientôt
        </Badge>
      );
    }
    if (warranty.status === 'active') {
      return (
        <Badge variant="default" className="bg-green-600">
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">{warranty.status}</Badge>;
  };

  // Get claim status badge
  const getClaimStatusBadge = (status: string) => {
    type IconComponent = React.ComponentType<{ className?: string }>;
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: IconComponent;
      }
    > = {
      submitted: { label: 'Soumise', variant: 'secondary', icon: Clock },
      under_review: { label: 'En révision', variant: 'secondary', icon: AlertCircle },
      approved: { label: 'Approuvée', variant: 'default', icon: CheckCircle2 },
      rejected: { label: 'Rejetée', variant: 'destructive', icon: XCircle },
      in_progress: { label: 'En cours', variant: 'default', icon: Clock },
      completed: { label: 'Complétée', variant: 'default', icon: CheckCircle2 },
      cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: 'secondary' as const,
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Stats
  const stats = useMemo(() => {
    const activeWarranties = warranties.filter((w: WarrantyRegistration) => {
      const endDate = new Date(w.end_date);
      return w.status === 'active' && isAfter(endDate, new Date());
    });
    const expiredWarranties = warranties.filter((w: WarrantyRegistration) => {
      const endDate = new Date(w.end_date);
      return w.status === 'expired' || isBefore(endDate, new Date());
    });

    return {
      total: warranties.length,
      active: activeWarranties.length,
      expired: expiredWarranties.length,
      claims: claims.length,
      pendingClaims: claims.filter(
        (c: WarrantyClaim) => c.status === 'submitted' || c.status === 'under_review'
      ).length,
    };
  }, [warranties, claims]);

  if (warrantiesLoading || claimsLoading) {
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
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 backdrop-blur-sm border border-green-500/20">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Mes Garanties
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez vos garanties et réclamations
                </p>
              </div>
              <Button onClick={() => setIsRegisterDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enregistrer une garantie
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Actives</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Expirées</CardTitle>
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.expired}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Réclamations</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.claims}</div>
                  {stats.pendingClaims > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {stats.pendingClaims} en attente
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={v => setSelectedTab(v as 'warranties' | 'claims' | 'register')}
            >
              <TabsList>
                <TabsTrigger value="warranties">
                  <Shield className="h-4 w-4 mr-2" />
                  Mes garanties ({warranties.length})
                </TabsTrigger>
                <TabsTrigger value="claims">
                  <FileText className="h-4 w-4 mr-2" />
                  Réclamations ({claims.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="warranties" className="space-y-4">
                {warranties.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Aucune garantie enregistrée</p>
                      <Button onClick={() => setIsRegisterDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Enregistrer une garantie
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {warranties.map((warranty: WarrantyRegistration) => {
                      const endDate = new Date(warranty.end_date);
                      const isExpired = isBefore(endDate, new Date());
                      const daysRemaining = Math.ceil(
                        (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );

                      return (
                        <Card key={warranty.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  {warranty.products?.name || 'Produit'}
                                </CardTitle>
                                <CardDescription>
                                  Garantie {warranty.warranty_number} -{' '}
                                  {format(new Date(warranty.created_at), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </CardDescription>
                              </div>
                              {getWarrantyStatusBadge(warranty)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-muted-foreground">Type</Label>
                                  <p className="font-medium capitalize">{warranty.warranty_type}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Durée</Label>
                                  <p className="font-medium">{warranty.duration_months} mois</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Date de début</Label>
                                  <p className="font-medium">
                                    {format(new Date(warranty.start_date), 'dd MMM yyyy', {
                                      locale: fr,
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Date de fin</Label>
                                  <p className={cn('font-medium', isExpired && 'text-red-600')}>
                                    {format(endDate, 'dd MMM yyyy', { locale: fr })}
                                    {!isExpired && ` (${daysRemaining} jours restants)`}
                                  </p>
                                </div>
                                {warranty.serial_number && (
                                  <div>
                                    <Label className="text-muted-foreground">Numéro de série</Label>
                                    <p className="font-medium">{warranty.serial_number}</p>
                                  </div>
                                )}
                                <div>
                                  <Label className="text-muted-foreground">Prix d'achat</Label>
                                  <p className="font-medium">
                                    {Number(warranty.purchase_price).toLocaleString('fr-FR')} XOF
                                  </p>
                                </div>
                              </div>

                              {!isExpired && warranty.status === 'active' && (
                                <Button
                                  onClick={() => {
                                    setSelectedWarranty(warranty.id);
                                    setIsClaimDialogOpen(true);
                                  }}
                                  className="w-full"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Soumettre une réclamation
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="claims" className="space-y-4">
                {claims.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune réclamation</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim: WarrantyClaim) => (
                      <Card key={claim.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                Réclamation {claim.claim_number}
                              </CardTitle>
                              <CardDescription>
                                {claim.product_warranties?.products?.name || 'Produit'} -{' '}
                                {format(new Date(claim.submitted_at), 'dd MMM yyyy', {
                                  locale: fr,
                                })}
                              </CardDescription>
                            </div>
                            {getClaimStatusBadge(claim.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Type</Label>
                                <p className="font-medium capitalize">{claim.claim_type}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Statut</Label>
                                <p className="font-medium capitalize">{claim.status}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Description</Label>
                              <p className="text-sm">{claim.description}</p>
                            </div>
                            {claim.issue_details && (
                              <div>
                                <Label className="text-muted-foreground">Détails</Label>
                                <p className="text-sm">{claim.issue_details}</p>
                              </div>
                            )}
                            {claim.resolution_notes && (
                              <div className="p-3 bg-muted rounded-lg">
                                <Label className="text-muted-foreground">Résolution</Label>
                                <p className="text-sm">{claim.resolution_notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Register Warranty Dialog */}
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enregistrer une garantie</DialogTitle>
                  <DialogDescription>
                    Enregistrez une garantie pour un produit acheté
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="order">Commande</Label>
                    <Select
                      value={registerForm.order_id}
                      onValueChange={value => {
                        setRegisterForm({ ...registerForm, order_id: value });
                        type OrderWithItems = {
                          id: string;
                          order_number: string;
                          created_at: string;
                          order_items?: Array<{ product_id: string }>;
                        };
                        const order = orders.find((o: OrderWithItems) => o.id === value);
                        if (order && order.order_items && order.order_items.length > 0) {
                          setRegisterForm({
                            ...registerForm,
                            order_id: value,
                            product_id: order.order_items[0].product_id,
                            purchase_date: order.created_at
                              ? format(new Date(order.created_at), 'yyyy-MM-dd')
                              : '',
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une commande" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map(order => {
                          type OrderWithItems = {
                            id: string;
                            order_number: string;
                            created_at: string;
                          };
                          const formattedDate = format(new Date(order.created_at), 'dd MMM yyyy', {
                            locale: fr,
                          });
                          return (
                            <SelectItem key={order.id} value={order.id}>
                              {order.order_number} - {formattedDate}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="warranty_type">Type de garantie</Label>
                    <Select
                      value={registerForm.warranty_type}
                      onValueChange={v =>
                        setRegisterForm({
                          ...registerForm,
                          warranty_type: v as 'manufacturer' | 'store' | 'extended' | 'insurance',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Garantie constructeur</SelectItem>
                        <SelectItem value="store">Garantie boutique</SelectItem>
                        <SelectItem value="extended">Garantie étendue</SelectItem>
                        <SelectItem value="insurance">Assurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Durée (mois)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={registerForm.duration_months}
                      onChange={e =>
                        setRegisterForm({ ...registerForm, duration_months: e.target.value })
                      }
                      min="1"
                      max="120"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serial_number">Numéro de série (optionnel)</Label>
                    <Input
                      id="serial_number"
                      value={registerForm.serial_number}
                      onChange={e =>
                        setRegisterForm({ ...registerForm, serial_number: e.target.value })
                      }
                      placeholder="Ex: SN123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchase_date">Date d'achat</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={registerForm.purchase_date}
                      onChange={e =>
                        setRegisterForm({ ...registerForm, purchase_date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchase_price">Prix d'achat (XOF)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      value={registerForm.purchase_price}
                      onChange={e =>
                        setRegisterForm({ ...registerForm, purchase_price: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRegisterDialogOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => registerWarranty.mutate(registerForm)}
                      disabled={
                        !registerForm.order_id ||
                        !registerForm.product_id ||
                        registerWarranty.isPending
                      }
                      className="flex-1"
                    >
                      {registerWarranty.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Claim Dialog */}
            <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Soumettre une réclamation</DialogTitle>
                  <DialogDescription>
                    Décrivez le problème avec votre produit sous garantie
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="claim_type">Type de réclamation</Label>
                    <Select
                      value={claimForm.claim_type}
                      onValueChange={v =>
                        setClaimForm({
                          ...claimForm,
                          claim_type: v as 'repair' | 'replacement' | 'refund',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repair">Réparation</SelectItem>
                        <SelectItem value="replacement">Remplacement</SelectItem>
                        <SelectItem value="refund">Remboursement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={claimForm.description}
                      onChange={e => setClaimForm({ ...claimForm, description: e.target.value })}
                      placeholder="Décrivez le problème..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="issue_details">Détails supplémentaires</Label>
                    <Textarea
                      id="issue_details"
                      value={claimForm.issue_details}
                      onChange={e => setClaimForm({ ...claimForm, issue_details: e.target.value })}
                      placeholder="Informations complémentaires..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsClaimDialogOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        if (!selectedWarranty) return;
                        createClaim.mutate({
                          ...claimForm,
                          warranty_id: selectedWarranty,
                        });
                      }}
                      disabled={!claimForm.description || createClaim.isPending}
                      className="flex-1"
                    >
                      {createClaim.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Soumettre
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
