/**
 * Supplier Orders Component
 * Date: 27 Janvier 2025
 *
 * Gestion des commandes fournisseurs (création, suivi, réception)
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useSupplierOrders,
  useCreateSupplierOrder,
  useSuppliers,
  SupplierOrder,
} from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import {
  Plus,
  Package,
  Calendar,
  DollarSign,
  Search,
  X,
  MoreVertical,
  Eye,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const  ORDER_STATUSES: {
  value: SupplierOrder['status'] | 'all';
  label: string;
  shortLabel: string;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'all', label: 'Tous', shortLabel: 'Tous', color: 'from-purple-600 to-pink-600' },
  {
    value: 'draft',
    label: 'Brouillon',
    shortLabel: 'Brouillon',
    color: 'from-gray-600 to-gray-600',
  },
  {
    value: 'pending',
    label: 'En attente',
    shortLabel: 'Attente',
    color: 'from-yellow-600 to-orange-600',
  },
  { value: 'sent', label: 'Envoyée', shortLabel: 'Envoyée', color: 'from-blue-600 to-cyan-600' },
  {
    value: 'confirmed',
    label: 'Confirmée',
    shortLabel: 'Confirmée',
    color: 'from-green-600 to-emerald-600',
  },
  {
    value: 'processing',
    label: 'En traitement',
    shortLabel: 'Traitement',
    color: 'from-purple-600 to-pink-600',
  },
  {
    value: 'shipped',
    label: 'Expédiée',
    shortLabel: 'Expédiée',
    color: 'from-indigo-600 to-indigo-600',
  },
  {
    value: 'partially_received',
    label: 'Partiellement reçue',
    shortLabel: 'Partielle',
    color: 'from-orange-600 to-orange-600',
  },
  {
    value: 'received',
    label: 'Reçue',
    shortLabel: 'Reçue',
    color: 'from-green-600 to-emerald-600',
  },
  {
    value: 'cancelled',
    label: 'Annulée',
    shortLabel: 'Annulée',
    color: 'from-red-600 to-rose-600',
  },
  {
    value: 'completed',
    label: 'Terminée',
    shortLabel: 'Terminée',
    color: 'from-emerald-600 to-emerald-600',
  },
];

export default function SupplierOrders() {
  const { store } = useStore();
  const { data: orders, isLoading } = useSupplierOrders(store?.id);
  const { data: suppliers } = useSuppliers(store?.id);
  const createOrder = useCreateSupplierOrder();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupplierOrder['status'] | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  // ✅ PHASE 4: Mémoriser les statuts de commande filtrés pour éviter recalculs
  const filteredOrderStatuses = useMemo(() => {
    return ORDER_STATUSES.filter(s => s.value !== 'all');
  }, []);

  const [orderItems, setOrderItems] = useState<
    Array<{
      supplier_product_id?: string;
      product_id?: string;
      variant_id?: string;
      quantity: number;
      unit_cost: number;
    }>
  >([{ quantity: 1, unit_cost: 0 }]);
  const [notes, setNotes] = useState('');

  // ✅ PHASE 7: Refs pour stocker les valeurs actuelles et éviter dépendances dans handleSubmit
  const orderItemsRef = useRef(orderItems);
  const notesRef = useRef(notes);

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    orderItemsRef.current = orderItems;
  }, [orderItems]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Animations
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const ordersRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Scroll horizontal pour les filtres/tabs
  const {
    scrollRef: tabsScrollRef,
    canScrollLeft: canScrollTabsLeft,
    canScrollRight: canScrollTabsRight,
    scrollLeft: scrollTabsLeft,
    scrollRight: scrollTabsRight,
  } = useHorizontalScroll();

  // Scroll horizontal pour la table
  const {
    scrollRef: tableScrollRef,
    canScrollLeft: canScrollTableLeft,
    canScrollRight: canScrollTableRight,
    scrollLeft: scrollTableLeft,
    scrollRight: scrollTableRight,
  } = useHorizontalScroll();

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let  filtered= orders;

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtrer par recherche
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(order => {
        const supplier = order.supplier as { name?: string; company_name?: string } | undefined;
        return (
          order.order_number.toLowerCase().includes(query) ||
          supplier?.name?.toLowerCase().includes(query) ||
          supplier?.company_name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [orders, statusFilter, debouncedSearch]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(order =>
      ['draft', 'pending', 'sent'].includes(order.status)
    ).length;
    const receivedOrders = filteredOrders.filter(order =>
      ['received', 'partially_received', 'completed'].includes(order.status)
    ).length;
    const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      receivedOrders,
      totalAmount,
    };
  }, [filteredOrders]);

  const displayCurrency = useMemo(() => filteredOrders[0]?.currency ?? 'XOF', [filteredOrders]);

  const statsCards = useMemo(
    () => [
      {
        label: 'Total commandes',
        value: stats.totalOrders.toString(),
        description: 'Toutes les commandes fournisseurs',
        icon: Package,
        gradient: 'from-purple-600 to-pink-600',
        iconGradient: 'from-purple-500/10 to-pink-500/5',
        iconBorder: 'border-purple-500/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
      {
        label: 'En cours',
        value: stats.pendingOrders.toString(),
        description: 'Brouillon, en attente ou envoyée',
        icon: Calendar,
        gradient: 'from-amber-500 to-orange-500',
        iconGradient: 'from-amber-500/10 to-orange-500/5',
        iconBorder: 'border-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
      },
      {
        label: 'Réceptionnées',
        value: stats.receivedOrders.toString(),
        description: 'Partiellement ou totalement reçues',
        icon: CheckCircle,
        gradient: 'from-green-600 to-emerald-600',
        iconGradient: 'from-green-500/10 to-emerald-500/5',
        iconBorder: 'border-green-500/20',
        iconColor: 'text-green-600 dark:text-green-400',
      },
      {
        label: 'Total engagements',
        value: new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: displayCurrency,
          maximumFractionDigits: 0,
        }).format(stats.totalAmount),
        description: 'Montant cumulé des commandes',
        icon: DollarSign,
        gradient: 'from-blue-600 to-cyan-600',
        iconGradient: 'from-blue-500/10 to-cyan-500/5',
        iconBorder: 'border-blue-500/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
    ],
    [
      displayCurrency,
      stats.pendingOrders,
      stats.receivedOrders,
      stats.totalAmount,
      stats.totalOrders,
    ]
  );

  // Gestion du clavier pour la recherche
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setSearchInput('');
      searchInputRef.current?.blur();
    }
  }, []);

  // ✅ PHASE 7: Optimiser handlers avec forme fonctionnelle de setState pour éviter dépendance orderItems
  const handleAddItem = useCallback(() => {
    setOrderItems(prev => [...prev, { quantity: 1, unit_cost: 0 }]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateItem = useCallback((index: number, field: string, value: string | number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // ✅ PHASE 7: Optimiser handleSubmit avec refs pour éviter dépendance orderItems et notes
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!store?.id || !selectedSupplier) {
        toast({
          title: '❌ Erreur',
          description: 'Veuillez sélectionner un fournisseur',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Utiliser les valeurs actuelles depuis les refs pour éviter la dépendance
        await createOrder.mutateAsync({
          storeId: store.id,
          supplierId: selectedSupplier,
          items: orderItemsRef.current.filter(item => item.quantity > 0 && item.unit_cost > 0),
          notes: notesRef.current,
        });
        setIsDialogOpen(false);
        setOrderItems([{ quantity: 1, unit_cost: 0 }]);
        setNotes('');
        setSelectedSupplier('');
      } catch ( _error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Impossible de créer la commande';
        toast({
          title: '❌ Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [store?.id, selectedSupplier, createOrder, toast]
  );

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: SupplierOrder['status']) => {
      try {
        const { error } = await supabase
          .from('supplier_orders')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
        toast({
          title: '✅ Statut mis à jour',
          description: 'Le statut de la commande a été mis à jour',
        });
      } catch ( _error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Impossible de mettre à jour le statut';
        toast({
          title: '❌ Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [queryClient, toast]
  );

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Actions - Totalement Responsive */}
      <div
        ref={actionsRef}
        className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm flex-1 w-full hover:shadow-lg transition-all duration-300">
          <CardContent className="p-2 sm:p-2.5 sm:p-3 md:p-4">
            <div className="relative w-full">
              <Search className="absolute left-2 sm:left-2.5 md:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-muted-foreground z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-7 sm:pl-8 md:pl-9 lg:pl-10 pr-7 sm:pr-8 md:pr-9 lg:pr-10 min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 text-xs sm:text-sm md:text-base w-full touch-manipulation"
                title="Rechercher par numéro de commande ou fournisseur"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 sm:right-1.5 md:right-2 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 p-0 hover:bg-muted touch-manipulation"
                  onClick={() => setSearchInput('')}
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                </Button>
              )}
              <div className="absolute right-2 sm:right-2.5 md:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center gap-1.5 pointer-events-none">
                <Badge variant="outline" className="text-xs font-mono">
                  ⌘K
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-5 lg:px-6 w-full sm:w-auto shrink-0"
        >
          <Plus className="mr-1 sm:mr-1.5 md:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
          <span className="hidden sm:inline">Nouvelle commande</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </div>

      {/* Stats - Totalement Responsive */}
      <div
        ref={statsRef}
        className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] touch-manipulation w-full"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardHeader className="pb-1.5 sm:pb-2 md:pb-2.5 lg:pb-3 p-2 sm:p-2.5 md:p-3 lg:p-4">
                <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  <div
                    className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded-lg bg-gradient-to-br ${stat.iconGradient} border ${stat.iconBorder} flex items-center justify-center shrink-0`}
                  >
                    <Icon
                      className={`h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${stat.iconColor}`}
                    />
                  </div>
                  <span className="truncate leading-tight">{stat.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-2.5 md:p-3 lg:p-4 pt-0 space-y-1 sm:space-y-1.5">
                <div
                  className={`text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent break-words leading-tight`}
                >
                  {stat.value}
                </div>
                <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground line-clamp-2 leading-tight">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Filters as Tabs - Totalement Responsive avec Scroll Professionnel */}
      <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Tabs
          value={statusFilter}
          onValueChange={value => setStatusFilter(value as SupplierOrder['status'] | 'all')}
          className="w-full"
        >
          <div className="relative group">
            {/* Indicateur de scroll à gauche - Dynamique */}
            {canScrollTabsLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 md:w-16 bg-gradient-to-r from-background via-background/80 to-transparent z-20 flex items-center justify-start pl-1 sm:pl-2 transition-opacity duration-300">
                <div className="h-full w-full flex items-center pointer-events-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background hover:scale-110 transition-all duration-200 touch-manipulation"
                    onClick={scrollTabsLeft}
                    aria-label="Défiler vers la gauche"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Indicateur de scroll à droite - Dynamique */}
            {canScrollTabsRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 md:w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-20 flex items-center justify-end pr-1 sm:pr-2 transition-opacity duration-300">
                <div className="h-full w-full flex items-center justify-end pointer-events-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background hover:scale-110 transition-all duration-200 touch-manipulation"
                    onClick={scrollTabsRight}
                    aria-label="Défiler vers la droite"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Zone de scroll avec momentum */}
            <div
              ref={tabsScrollRef}
              className="overflow-x-auto scrollbar-hide scroll-smooth -mx-2 sm:-mx-3 md:-mx-4 lg:mx-0 px-2 sm:px-3 md:px-4 lg:px-0"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 sm:p-1.5 w-max min-w-full sm:min-w-0 sm:w-auto inline-flex gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5">
                {ORDER_STATUSES.map(status => (
                  <TabsTrigger
                    key={status.value}
                    value={status.value}
                    className="flex-none gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 lg:px-3.5 xl:px-4 py-1.5 sm:py-2 md:py-2.5 text-[9px] xs:text-[10px] sm:text-xs md:text-sm min-h-[36px] xs:min-h-[38px] sm:min-h-[40px] md:min-h-[42px] lg:min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap shrink-0 touch-manipulation active:scale-95"
                  >
                    <span className="hidden sm:inline">{status.label}</span>
                    <span className="sm:hidden">{status.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Orders List */}
      <div ref={ordersRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {filteredOrders.length === 0 ? (
          <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center px-3 sm:px-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">
                {searchInput ? 'Aucune commande trouvée' : 'Aucune commande'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {searchInput
                  ? 'Essayez de modifier votre recherche'
                  : 'Créez une nouvelle commande pour commencer'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View - Responsive avec Scroll Professionnel */}
            <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm overflow-hidden hidden lg:block relative group">
              {/* Indicateur de scroll à gauche - Dynamique */}
              {canScrollTableLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-10 lg:w-12 bg-gradient-to-r from-card via-card/90 to-transparent z-20 flex items-center justify-start pl-1.5 lg:pl-2 transition-opacity duration-300">
                  <div className="pointer-events-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-card hover:scale-110 transition-all duration-200 touch-manipulation"
                      onClick={scrollTableLeft}
                      aria-label="Défiler vers la gauche"
                    >
                      <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Indicateur de scroll à droite - Dynamique */}
              {canScrollTableRight && (
                <div className="absolute right-0 top-0 bottom-0 w-10 lg:w-12 bg-gradient-to-l from-card via-card/90 to-transparent z-20 flex items-center justify-end pr-1.5 lg:pr-2 transition-opacity duration-300">
                  <div className="pointer-events-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-card hover:scale-110 transition-all duration-200 touch-manipulation"
                      onClick={scrollTableRight}
                      aria-label="Défiler vers la droite"
                    >
                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                  </div>
                </div>
              )}

              <CardContent className="p-0">
                <div
                  ref={tableScrollRef}
                  className="overflow-x-auto scroll-smooth scrollbar-orders"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <Table className="min-w-[900px] lg:min-w-[1000px] xl:min-w-[1100px] 2xl:min-w-[1200px] w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap min-w-[120px] lg:min-w-[140px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Numéro
                        </TableHead>
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap min-w-[130px] lg:min-w-[150px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Fournisseur
                        </TableHead>
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap min-w-[100px] lg:min-w-[120px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Date
                        </TableHead>
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap min-w-[100px] lg:min-w-[120px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Montant
                        </TableHead>
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap min-w-[140px] lg:min-w-[160px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Statut
                        </TableHead>
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap min-w-[130px] lg:min-w-[150px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Livraison prévue
                        </TableHead>
                        <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap min-w-[80px] lg:min-w-[100px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => {
                        return (
                          <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs lg:text-sm font-medium whitespace-nowrap min-w-[120px] lg:min-w-[140px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              <div className="flex items-center gap-1.5 lg:gap-2">
                                <div className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center shrink-0">
                                  <Package className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="truncate">{order.order_number}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm whitespace-nowrap min-w-[130px] lg:min-w-[150px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              <span className="truncate block">
                                {(order.supplier as { name?: string } | undefined)?.name || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm whitespace-nowrap min-w-[100px] lg:min-w-[120px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              {format(new Date(order.order_date), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm whitespace-nowrap min-w-[100px] lg:min-w-[120px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              <div className="flex items-center gap-1 lg:gap-1.5">
                                <DollarSign className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-muted-foreground shrink-0" />
                                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
                                  {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: order.currency || 'XOF',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(order.total_amount)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm whitespace-nowrap min-w-[140px] lg:min-w-[160px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              <Select
                                value={order.status}
                                onValueChange={(value: SupplierOrder['status']) =>
                                  handleStatusUpdate(order.id, value)
                                }
                              >
                                <SelectTrigger className="w-full max-w-[160px] lg:max-w-[180px] min-h-[44px] h-11 lg:h-12 xl:h-12 text-xs lg:text-sm touch-manipulation">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {filteredOrderStatuses.map(s => (
                                    <SelectItem
                                      key={s.value}
                                      value={s.value}
                                      className="text-xs lg:text-sm"
                                    >
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm whitespace-nowrap min-w-[130px] lg:min-w-[150px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              {order.expected_delivery_date ? (
                                <div className="flex items-center gap-1 lg:gap-1.5">
                                  <Calendar className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-muted-foreground shrink-0" />
                                  <span>
                                    {format(new Date(order.expected_delivery_date), 'dd MMM yyyy', {
                                      locale: fr,
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs lg:text-sm">
                                  Non définie
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap min-w-[80px] lg:min-w-[100px] px-2.5 lg:px-3 xl:px-4 2xl:px-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[44px] min-w-[44px] h-11 w-11 lg:h-12 lg:w-12 xl:h-12 xl:w-12 p-0 touch-manipulation"
                                    aria-label={`Actions pour la commande ${order.order_number || order.id}`}
                                  >
                                    <MoreVertical className="h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[calc(100vw-2rem)] sm:w-44 lg:w-48 xl:w-56 max-w-[calc(100vw-2rem)] sm:max-w-xs"
                                  mobileOptimized
                                >
                                  <DropdownMenuItem className="text-xs lg:text-sm cursor-pointer">
                                    <Eye className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order.id, 'completed')}
                                    className="text-xs lg:text-sm cursor-pointer"
                                    disabled={order.status === 'completed'}
                                  >
                                    <Package className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    Marquer comme terminée
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile & Tablet Card View - Totalement Responsive */}
            <div className="lg:hidden space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 w-full">
              {filteredOrders.map((order, index) => {
                return (
                  <Card
                    key={order.id}
                    className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 active:scale-[0.98] touch-manipulation animate-in fade-in slide-in-from-bottom-4 w-full"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader className="pb-2 sm:pb-2.5 md:pb-3 px-2.5 sm:px-3 md:px-4 lg:px-5 pt-2.5 sm:pt-3 md:pt-4 lg:pt-5">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 text-xs sm:text-sm md:text-base lg:text-lg mb-1 sm:mb-1.5 md:mb-2">
                            <div className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <Package className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="truncate font-semibold leading-tight">
                              {order.order_number}
                            </span>
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                            <span className="truncate max-w-[90px] xs:max-w-[110px] sm:max-w-[140px] md:max-w-none">
                              {(order.supplier as { name?: string } | undefined)?.name || 'N/A'}
                            </span>
                            <span className="hidden xs:inline">•</span>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Calendar className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                              <span className="whitespace-nowrap leading-tight">
                                {format(new Date(order.order_date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-[44px] min-w-[44px] h-11 w-11 xs:h-12 xs:w-12 sm:h-12 sm:w-12 p-0 shrink-0 touch-manipulation"
                              aria-label={`Actions pour la commande ${order.order_number || order.id}`}
                            >
                              <MoreVertical className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[calc(100vw-2rem)] xs:w-44 sm:w-48 md:w-56 max-w-[calc(100vw-2rem)] sm:max-w-xs"
                            mobileOptimized
                          >
                            <DropdownMenuItem className="text-xs sm:text-sm md:text-base cursor-pointer touch-manipulation">
                              <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order.id, 'completed')}
                              className="text-xs sm:text-sm md:text-base cursor-pointer touch-manipulation"
                              disabled={order.status === 'completed'}
                            >
                              <Package className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Marquer comme terminée
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 pb-2.5 sm:pb-3 md:pb-4 lg:pb-5 space-y-2 sm:space-y-2.5 md:space-y-3 w-full">
                      {/* Montant */}
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 sm:gap-2 w-full">
                        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground shrink-0">
                          Montant
                        </span>
                        <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words text-right xs:text-left">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: order.currency || 'XOF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(order.total_amount)}
                        </span>
                      </div>

                      {/* Statut */}
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 sm:gap-2 md:gap-3 w-full">
                        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground shrink-0">
                          Statut
                        </span>
                        <Select
                          value={order.status}
                          onValueChange={(value: SupplierOrder['status']) =>
                            handleStatusUpdate(order.id, value)
                          }
                        >
                          <SelectTrigger className="w-full xs:w-[140px] sm:w-[160px] md:w-[180px] min-h-[44px] h-11 xs:h-12 sm:h-12 text-[10px] xs:text-xs sm:text-sm md:text-base touch-manipulation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
                            {filteredOrderStatuses.map(s => (
                              <SelectItem
                                key={s.value}
                                value={s.value}
                                className="text-xs sm:text-sm md:text-base"
                              >
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Livraison prévue */}
                      {order.expected_delivery_date && (
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 sm:gap-2 pt-1.5 sm:pt-2 xs:pt-0 border-t xs:border-0 border-border/50 w-full">
                          <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground shrink-0">
                            Livraison prévue
                          </span>
                          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] xs:text-[10px] sm:text-xs md:text-sm">
                            <Calendar className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                            <span className="whitespace-nowrap leading-tight">
                              {format(new Date(order.expected_delivery_date), 'dd MMM yyyy', {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dialog Create Order - Totalement Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="!max-w-[calc(100vw-1rem)] sm:!max-w-[calc(100vw-2rem)] md:!max-w-[90vw] lg:!max-w-2xl xl:!max-w-3xl !max-h-[calc(100vh-1rem)] sm:!max-h-[calc(100vh-2rem)] md:!max-h-[90vh] !w-[calc(100vw-1rem)] sm:!w-[calc(100vw-2rem)] md:!w-auto p-2.5 sm:p-3 md:p-4 lg:p-5 xl:p-6 m-2 sm:m-4 overflow-hidden">
          <DialogHeader className="px-0 sm:px-0 pr-6 sm:pr-8">
            <DialogTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-tight break-words">
              Nouvelle commande fournisseur
            </DialogTitle>
            <DialogDescription className="text-[10px] xs:text-xs sm:text-sm md:text-base leading-tight">
              Créez une nouvelle commande auprès d'un fournisseur
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="mt-2 sm:mt-3 md:mt-4 overflow-y-auto max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)] md:max-h-[calc(100vh-16rem)] -mx-2.5 sm:-mx-3 md:-mx-4 lg:-mx-5 xl:-mx-6 px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6"
          >
            <div className="grid gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 py-2 sm:py-3 md:py-4">
              {/* Fournisseur Selection */}
              <div className="space-y-1.5 sm:space-y-2 w-full">
                <Label htmlFor="supplier" className="text-xs sm:text-sm md:text-base font-medium">
                  Fournisseur *
                </Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger className="min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 text-xs sm:text-sm md:text-base w-full touch-manipulation">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] sm:max-h-[300px] w-[var(--radix-select-trigger-width)]">
                    {suppliers?.map(supplier => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id}
                        className="text-xs sm:text-sm md:text-base"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium truncate">{supplier.name}</span>
                          {supplier.company_name && (
                            <span className="text-muted-foreground text-xs sm:text-sm truncate">
                              ({supplier.company_name})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Articles Section */}
              <div className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-5 w-full">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 sm:gap-3">
                  <Label className="text-xs sm:text-sm md:text-base font-medium">Articles</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 text-xs sm:text-sm md:text-base w-full xs:w-auto shrink-0 touch-manipulation"
                  >
                    <Plus className="mr-1 sm:mr-1.5 md:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                    <span className="hidden sm:inline">Ajouter un article</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </div>

                {/* Articles List */}
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 w-full">
                  {orderItems.map((item, index) => (
                    <Card
                      key={index}
                      className="border border-border/50 bg-card/50 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 w-full"
                    >
                      <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 w-full">
                        {/* Mobile Layout: Stacked, Desktop: Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 sm:gap-2.5 md:gap-3 w-full">
                          {/* Produit / SKU - Full width on mobile, 5 cols on desktop */}
                          <div className="col-span-1 sm:col-span-2 md:col-span-5 space-y-1 sm:space-y-1.5 md:space-y-2 w-full">
                            <Label className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium leading-tight">
                              Produit / SKU
                            </Label>
                            <Input
                              placeholder="ID produit ou SKU"
                              value={item.product_id || item.supplier_product_id || ''}
                              onChange={e =>
                                handleUpdateItem(
                                  index,
                                  item.product_id ? 'product_id' : 'supplier_product_id',
                                  e.target.value
                                )
                              }
                              className="text-xs sm:text-sm md:text-base min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 xl:h-12 w-full touch-manipulation"
                            />
                          </div>

                          {/* Quantité - Full width on mobile, 2 cols on desktop */}
                          <div className="col-span-1 sm:col-span-1 md:col-span-2 space-y-1 sm:space-y-1.5 md:space-y-2 w-full">
                            <Label className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium leading-tight">
                              Quantité
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e =>
                                handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)
                              }
                              className="text-xs sm:text-sm md:text-base min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 xl:h-12 w-full touch-manipulation"
                            />
                          </div>

                          {/* Coût unitaire - Full width on mobile, 3 cols on desktop */}
                          <div className="col-span-1 sm:col-span-1 md:col-span-3 space-y-1 sm:space-y-1.5 md:space-y-2 w-full">
                            <Label className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium leading-tight">
                              Coût unitaire
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_cost}
                              onChange={e =>
                                handleUpdateItem(
                                  index,
                                  'unit_cost',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="text-xs sm:text-sm md:text-base min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 xl:h-12 w-full touch-manipulation"
                            />
                          </div>

                          {/* Total - Full width on mobile, 2 cols on desktop */}
                          <div className="col-span-1 sm:col-span-2 md:col-span-2 space-y-1 sm:space-y-1.5 md:space-y-2 w-full">
                            <Label className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium leading-tight">
                              Total
                            </Label>
                            <div className="flex items-center h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 px-2 sm:px-2.5 md:px-3 lg:px-4 bg-muted/50 rounded-md text-[10px] xs:text-xs sm:text-sm md:text-base font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(item.quantity * item.unit_cost)}
                            </div>
                          </div>
                        </div>

                        {/* Remove Button - Always visible on mobile, only when multiple items on desktop */}
                        {orderItems.length > 1 && (
                          <div className="flex justify-end pt-1.5 sm:pt-2 md:pt-0 border-t md:border-0 border-border/50 w-full">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="min-h-[44px] h-11 sm:h-12 md:h-12 w-full sm:w-auto px-3 sm:px-4 text-[10px] xs:text-xs sm:text-sm md:text-base text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 md:mr-0" />
                              <span className="sm:hidden">Supprimer</span>
                              <span className="hidden sm:inline md:hidden">Supprimer article</span>
                              <span className="hidden md:inline">Supprimer</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Total Section */}
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t border-border/50 w-full">
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-muted-foreground xs:hidden">
                    Total de la commande:
                  </span>
                  <div className="flex items-center justify-between xs:justify-end gap-2 w-full xs:w-auto">
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-muted-foreground hidden xs:inline">
                      Total:
                    </span>
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        orderItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-1.5 sm:space-y-2 w-full">
                <Label htmlFor="notes" className="text-xs sm:text-sm md:text-base font-medium">
                  Notes (optionnel)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes supplémentaires sur la commande..."
                  className="text-xs sm:text-sm md:text-base resize-none min-h-[70px] sm:min-h-[80px] md:min-h-[100px] w-full touch-manipulation"
                />
              </div>
            </div>

            {/* Footer Buttons - Responsive */}
            <DialogFooter className="flex-col xs:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-6 px-0 sm:px-0 w-full border-t border-border/50 pt-3 sm:pt-4 -mb-2.5 sm:-mb-3 md:-mb-4 lg:-mb-5 xl:-mb-6 pb-2.5 sm:pb-3 md:pb-4 lg:pb-5 xl:pb-6 bg-background sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full xs:w-auto min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 text-xs sm:text-sm md:text-base order-2 xs:order-1 touch-manipulation shrink-0"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full xs:w-auto min-h-[44px] h-11 sm:h-12 md:h-12 lg:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base order-1 xs:order-2 touch-manipulation shrink-0"
              >
                {createOrder.isPending ? (
                  <>
                    <span className="hidden sm:inline">Création en cours...</span>
                    <span className="sm:hidden">Création...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Créer la commande</span>
                    <span className="sm:hidden">Créer</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}






