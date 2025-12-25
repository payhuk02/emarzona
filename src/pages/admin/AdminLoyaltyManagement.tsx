/**
 * Page Admin Loyalty Management - Gestion du programme de fidélité
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Configuration des tiers (Bronze, Silver, Gold, Platinum)
 * - Gestion des récompenses
 * - Statistiques du programme
 * - Historique des transactions
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/hooks/useStore';
import {
  useLoyaltyTiers,
  useLoyaltyRewards,
  useLoyaltyStats,
  useLoyaltyTransactions,
  useCreateLoyaltyTier,
  useCreateLoyaltyReward,
} from '@/hooks/loyalty/useLoyalty';
import type { LoyaltyTransaction } from '@/types/loyalty';
import {
  LoyaltyTierType,
  LoyaltyRewardType,
  CreateLoyaltyTierForm,
  CreateLoyaltyRewardForm,
} from '@/types/loyalty';
import { Award, Plus, TrendingUp, Users, Gift, Sparkles, Coins, Search, X } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const TIER_TYPES: { value: LoyaltyTierType; label: string; color: string }[] = [
  { value: 'bronze', label: 'Bronze', color: '#CD7F32' },
  { value: 'silver', label: 'Silver', color: '#C0C0C0' },
  { value: 'gold', label: 'Gold', color: '#FFD700' },
  { value: 'platinum', label: 'Platinum', color: '#E5E4E2' },
];

const REWARD_TYPES: { value: LoyaltyRewardType; label: string }[] = [
  { value: 'discount', label: 'Réduction' },
  { value: 'free_product', label: 'Produit gratuit' },
  { value: 'free_shipping', label: 'Livraison gratuite' },
  { value: 'gift_card', label: 'Carte cadeau' },
  { value: 'cash_back', label: 'Cashback' },
  { value: 'custom', label: 'Personnalisée' },
];

export default function AdminLoyaltyManagement() {
  const isMobile = useIsMobile();
  const { store, loading: storeLoading } = useStore();

  // Alias pour compatibilité
  const currentStore = store;

  const { data: tiers, isLoading: tiersLoading } = useLoyaltyTiers(currentStore?.id);
  const { data: rewards, isLoading: rewardsLoading } = useLoyaltyRewards(currentStore?.id);
  const { data: stats } = useLoyaltyStats(currentStore?.id);
  const { data: transactions } = useLoyaltyTransactions(currentStore?.id);
  const createTier = useCreateLoyaltyTier();
  const createReward = useCreateLoyaltyReward();

  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [tierFormData, setTierFormData] = useState<CreateLoyaltyTierForm>({
    tier_type: 'bronze',
    name: '',
    description: '',
    min_points_required: 0,
    points_multiplier: 1.0,
    discount_percentage: 0,
    free_shipping: false,
    exclusive_access: false,
    badge_color: '#808080',
    is_default: false,
    display_order: 0,
  });

  const [rewardFormData, setRewardFormData] = useState<CreateLoyaltyRewardForm>({
    name: '',
    description: '',
    reward_type: 'discount',
    points_cost: 100,
  });

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore?.id) return;

    try {
      await createTier.mutateAsync({
        ...tierFormData,
        store_id: currentStore.id,
      });
      setIsTierDialogOpen(false);
      setTierFormData({
        tier_type: 'bronze',
        name: '',
        description: '',
        min_points_required: 0,
        points_multiplier: 1.0,
        discount_percentage: 0,
        free_shipping: false,
        exclusive_access: false,
        badge_color: '#808080',
        is_default: false,
        display_order: 0,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore?.id) return;

    try {
      await createReward.mutateAsync({
        ...rewardFormData,
        store_id: currentStore.id,
      });
      setIsRewardDialogOpen(false);
      setRewardFormData({
        name: '',
        description: '',
        reward_type: 'discount',
        points_cost: 100,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const getTierColor = (tierType: LoyaltyTierType) => {
    return TIER_TYPES.find(t => t.value === tierType)?.color || '#808080';
  };

  const filteredRewards = rewards?.filter(reward => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reward.name.toLowerCase().includes(query) || reward.description?.toLowerCase().includes(query)
    );
  });

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || tiersLoading || rewardsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-24 sm:h-28 w-full" />
                ))}
              </div>
              <Skeleton className="h-64 sm:h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!currentStore) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Alert>
                    <AlertDescription className="text-xs sm:text-sm">
                      Veuillez d'abord créer une boutique.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Award
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Programme de Fidélité
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Gérez les tiers, récompenses et suivez l'engagement de vos clients
                </p>
              </div>
            </div>

            {/* Stats - Responsive */}
            {stats && (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Membres</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {stats.total_customers}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Points Émis</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {stats.total_points_issued.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                        <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                          Points Échangés
                        </p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {stats.total_points_redeemed.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Récompenses</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          {stats.active_rewards}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                        <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Échanges</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                          {stats.total_redemptions}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/5">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs - Responsive */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full overflow-x-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm min-h-[44px]">
                  <span className="hidden sm:inline">Vue d'ensemble</span>
                  <span className="sm:hidden">Vue</span>
                </TabsTrigger>
                <TabsTrigger value="tiers" className="text-xs sm:text-sm min-h-[44px]">
                  Tiers
                </TabsTrigger>
                <TabsTrigger value="rewards" className="text-xs sm:text-sm min-h-[44px]">
                  <span className="hidden sm:inline">Récompenses</span>
                  <span className="sm:hidden">Récomp.</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm min-h-[44px]">
                  <span className="hidden sm:inline">Transactions</span>
                  <span className="sm:hidden">Trans.</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Tier Distribution */}
                {stats && (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Distribution des Tiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {TIER_TYPES.map(tier => {
                          const count = stats.tier_distribution[tier.value] || 0;
                          const percentage =
                            stats.total_customers > 0 ? (count / stats.total_customers) * 100 : 0;
                          return (
                            <div key={tier.value} className="text-center">
                              <div
                                className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mb-2"
                                style={{ backgroundColor: tier.color + '20', color: tier.color }}
                              >
                                {tier.label[0]}
                              </div>
                              <div className="font-semibold text-sm sm:text-base">{tier.label}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {count} membres
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Transactions */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Transactions Récentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions && transactions.length > 0 ? (
                      isMobile ? (
                        <MobileTableCard
                          data={transactions.slice(0, 10).map(t => ({ ...t, id: t.id }))}
                          columns={[
                            {
                              key: 'date',
                              label: 'Date',
                              priority: 'high',
                              render: (row: LoyaltyTransaction) => (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(row.created_at), 'PPp', { locale: fr })}
                                </span>
                              ),
                            },
                            {
                              key: 'type',
                              label: 'Type',
                              priority: 'high',
                              render: (row: LoyaltyTransaction) => (
                                <Badge variant="outline" className="text-xs">
                                  {row.transaction_type}
                                </Badge>
                              ),
                            },
                            {
                              key: 'points',
                              label: 'Points',
                              priority: 'high',
                              render: (row: LoyaltyTransaction) => (
                                <span
                                  className={`text-sm font-medium ${row.points_amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {row.points_amount > 0 ? '+' : ''}
                                  {row.points_amount}
                                </span>
                              ),
                            },
                            {
                              key: 'description',
                              label: 'Description',
                              priority: 'medium',
                              render: (row: LoyaltyTransaction) => (
                                <p className="text-xs">{row.description || '-'}</p>
                              ),
                            },
                          ]}
                        />
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs sm:text-sm">Date</TableHead>
                                <TableHead className="text-xs sm:text-sm">Type</TableHead>
                                <TableHead className="text-xs sm:text-sm">Points</TableHead>
                                <TableHead className="text-xs sm:text-sm">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.slice(0, 10).map(transaction => (
                                <TableRow key={transaction.id} className="hover:bg-muted/50">
                                  <TableCell className="text-xs sm:text-sm">
                                    {format(new Date(transaction.created_at), 'PPp', {
                                      locale: fr,
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.transaction_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    className={`text-xs sm:text-sm font-medium ${transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    {transaction.points_amount > 0 ? '+' : ''}
                                    {transaction.points_amount}
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate text-xs sm:text-sm">
                                    {transaction.description}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    ) : (
                      <Alert>
                        <AlertDescription className="text-xs sm:text-sm">
                          Aucune transaction enregistrée.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tiers Tab */}
              <TabsContent value="tiers" className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Configuration des Tiers</h2>
                  <Button
                    onClick={() => setIsTierDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Nouveau Tier</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </div>

                {tiers && tiers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {tiers.map(tier => (
                      <Card
                        key={tier.id}
                        className="relative border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                              <div
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm"
                                style={{ backgroundColor: tier.badge_color }}
                              >
                                {tier.tier_type[0].toUpperCase()}
                              </div>
                              {tier.name}
                            </CardTitle>
                            {tier.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Par défaut
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium">Points requis :</span>{' '}
                            {tier.min_points_required}
                          </div>
                          {tier.points_multiplier > 1 && (
                            <div className="text-xs sm:text-sm">
                              <span className="font-medium">Bonus :</span>{' '}
                              {((tier.points_multiplier - 1) * 100).toFixed(0)}%
                            </div>
                          )}
                          {tier.discount_percentage > 0 && (
                            <div className="text-xs sm:text-sm">
                              <span className="font-medium">Réduction :</span>{' '}
                              {tier.discount_percentage}%
                            </div>
                          )}
                          {tier.free_shipping && (
                            <Badge variant="outline" className="text-xs">
                              Livraison gratuite
                            </Badge>
                          )}
                          {tier.description && (
                            <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <Alert>
                        <AlertDescription className="text-xs sm:text-sm">
                          Aucun tier configuré. Créez votre premier tier pour commencer.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Récompenses</h2>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm pl-8 sm:pl-10"
                      />
                      <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12"
                          onClick={() => setSearchQuery('')}
                          aria-label="Effacer la recherche"
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => setIsRewardDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                      size="sm"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Nouvelle Récompense</span>
                      <span className="sm:hidden">Nouvelle</span>
                    </Button>
                  </div>
                </div>

                {filteredRewards && filteredRewards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredRewards.map(reward => (
                      <Card
                        key={reward.id}
                        className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                            <span>{reward.name}</span>
                            {reward.min_tier && (
                              <Badge variant="outline" className="text-xs">
                                {reward.min_tier}
                              </Badge>
                            )}
                          </CardTitle>
                          {reward.description && (
                            <CardDescription className="text-xs sm:text-sm">
                              {reward.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium">Coût :</span>
                            <Badge className="bg-yellow-500 text-xs">
                              <Coins className="h-3 w-3 mr-1" />
                              {reward.points_cost} points
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium">Type :</span>{' '}
                            {REWARD_TYPES.find(t => t.value === reward.reward_type)?.label}
                          </div>
                          {reward.reward_type === 'discount' && reward.discount_percentage && (
                            <div className="text-xs sm:text-sm">
                              <span className="font-medium">Valeur :</span>{' '}
                              {reward.discount_percentage}% de réduction
                            </div>
                          )}
                          {reward.max_redemptions && (
                            <div className="text-xs text-muted-foreground">
                              {reward.redemption_count} / {reward.max_redemptions} échanges
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <Alert>
                        <AlertDescription className="text-xs sm:text-sm">
                          {searchQuery
                            ? 'Aucune récompense ne correspond à votre recherche.'
                            : 'Aucune récompense configurée. Créez votre première récompense pour commencer.'}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Historique des Transactions</h2>
                {transactions && transactions.length > 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CardContent className="pt-6">
                      {/* Desktop Table */}
                      <div className="hidden lg:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Date</TableHead>
                              <TableHead className="text-xs sm:text-sm">Client</TableHead>
                              <TableHead className="text-xs sm:text-sm">Type</TableHead>
                              <TableHead className="text-xs sm:text-sm">Points</TableHead>
                              <TableHead className="text-xs sm:text-sm">Balance</TableHead>
                              <TableHead className="text-xs sm:text-sm">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map(transaction => (
                              <TableRow key={transaction.id} className="hover:bg-muted/50">
                                <TableCell className="text-xs sm:text-sm">
                                  {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs sm:text-sm text-muted-foreground">
                                    Client #{transaction.customer_id.slice(0, 8)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.transaction_type}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={`text-xs sm:text-sm font-medium ${transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {transaction.points_amount > 0 ? '+' : ''}
                                  {transaction.points_amount}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {transaction.balance_after}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-xs sm:text-sm">
                                  {transaction.description || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="lg:hidden space-y-3 sm:space-y-4">
                        {transactions.map(transaction => (
                          <Card
                            key={transaction.id}
                            className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.transaction_type}
                                    </Badge>
                                    <span
                                      className={`text-xs sm:text-sm font-medium ${transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                      {transaction.points_amount > 0 ? '+' : ''}
                                      {transaction.points_amount} points
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                    {format(new Date(transaction.created_at), 'PPp', {
                                      locale: fr,
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Client #{transaction.customer_id.slice(0, 8)}
                                  </p>
                                  <p className="text-xs sm:text-sm mb-1">
                                    Balance: {transaction.balance_after}
                                  </p>
                                  {transaction.description && (
                                    <p className="text-xs sm:text-sm">{transaction.description}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <Alert>
                        <AlertDescription className="text-xs sm:text-sm">
                          Aucune transaction enregistrée.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Create Tier Dialog */}
            <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
              <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Nouveau Tier de Fidélité</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Configurez un nouveau tier pour votre programme de fidélité
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTier} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tier_type" className="text-xs sm:text-sm">
                        Type de Tier *
                      </Label>
                      <Select
                        value={tierFormData.tier_type}
                        onValueChange={(value: LoyaltyTierType) =>
                          setTierFormData({
                            ...tierFormData,
                            tier_type: value,
                            badge_color: getTierColor(value),
                          })
                        }
                      >
                        <SelectTrigger className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIER_TYPES.map(tier => (
                            <SelectItem key={tier.value} value={tier.value}>
                              {tier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        Nom *
                      </Label>
                      <Input
                        id="name"
                        value={tierFormData.name}
                        onChange={e => setTierFormData({ ...tierFormData, name: e.target.value })}
                        required
                        placeholder="Membre Bronze"
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs sm:text-sm">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={tierFormData.description}
                      onChange={e =>
                        setTierFormData({ ...tierFormData, description: e.target.value })
                      }
                      placeholder="Description du tier..."
                      rows={2}
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_points" className="text-xs sm:text-sm">
                        Points Minimum *
                      </Label>
                      <Input
                        id="min_points"
                        type="number"
                        min="0"
                        value={tierFormData.min_points_required}
                        onChange={e =>
                          setTierFormData({
                            ...tierFormData,
                            min_points_required: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="multiplier" className="text-xs sm:text-sm">
                        Multiplicateur
                      </Label>
                      <Input
                        id="multiplier"
                        type="number"
                        min="1"
                        step="0.1"
                        value={tierFormData.points_multiplier}
                        onChange={e =>
                          setTierFormData({
                            ...tierFormData,
                            points_multiplier: parseFloat(e.target.value) || 1.0,
                          })
                        }
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount" className="text-xs sm:text-sm">
                        Réduction (%)
                      </Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={tierFormData.discount_percentage}
                        onChange={e =>
                          setTierFormData({
                            ...tierFormData,
                            discount_percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="free_shipping"
                        checked={tierFormData.free_shipping}
                        onCheckedChange={checked =>
                          setTierFormData({ ...tierFormData, free_shipping: checked })
                        }
                      />
                      <Label htmlFor="free_shipping" className="text-xs sm:text-sm">
                        Livraison gratuite
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="exclusive"
                        checked={tierFormData.exclusive_access}
                        onCheckedChange={checked =>
                          setTierFormData({ ...tierFormData, exclusive_access: checked })
                        }
                      />
                      <Label htmlFor="exclusive" className="text-xs sm:text-sm">
                        Accès exclusif
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_default"
                        checked={tierFormData.is_default}
                        onCheckedChange={checked =>
                          setTierFormData({ ...tierFormData, is_default: checked })
                        }
                      />
                      <Label htmlFor="is_default" className="text-xs sm:text-sm">
                        Tier par défaut
                      </Label>
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTierDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={!tierFormData.name}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
                    >
                      Créer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Create Reward Dialog */}
            <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
              <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Nouvelle Récompense</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Créez une nouvelle récompense échangeable contre des points
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateReward} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reward_name" className="text-xs sm:text-sm">
                        Nom *
                      </Label>
                      <Input
                        id="reward_name"
                        value={rewardFormData.name}
                        onChange={e =>
                          setRewardFormData({ ...rewardFormData, name: e.target.value })
                        }
                        required
                        placeholder="Réduction 10%"
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reward_type" className="text-xs sm:text-sm">
                        Type *
                      </Label>
                      <Select
                        value={rewardFormData.reward_type}
                        onValueChange={(value: LoyaltyRewardType) =>
                          setRewardFormData({ ...rewardFormData, reward_type: value })
                        }
                      >
                        <SelectTrigger className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REWARD_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reward_description" className="text-xs sm:text-sm">
                      Description
                    </Label>
                    <Textarea
                      id="reward_description"
                      value={rewardFormData.description}
                      onChange={e =>
                        setRewardFormData({ ...rewardFormData, description: e.target.value })
                      }
                      placeholder="Description de la récompense..."
                      rows={2}
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="points_cost" className="text-xs sm:text-sm">
                        Coût en Points *
                      </Label>
                      <Input
                        id="points_cost"
                        type="number"
                        min="1"
                        value={rewardFormData.points_cost}
                        onChange={e =>
                          setRewardFormData({
                            ...rewardFormData,
                            points_cost: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                    {rewardFormData.reward_type === 'discount' && (
                      <div className="space-y-2">
                        <Label htmlFor="discount_percentage" className="text-xs sm:text-sm">
                          Réduction (%)
                        </Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={rewardFormData.discount_percentage || ''}
                          onChange={e =>
                            setRewardFormData({
                              ...rewardFormData,
                              discount_percentage: parseFloat(e.target.value) || undefined,
                            })
                          }
                          className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRewardDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={!rewardFormData.name || !rewardFormData.points_cost}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
                    >
                      Créer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
