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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import {
  LoyaltyTierType,
  LoyaltyRewardType,
  CreateLoyaltyTierForm,
  CreateLoyaltyRewardForm,
} from '@/types/loyalty';
import {
  Award,
  Plus,
  TrendingUp,
  Users,
  Gift,
  Sparkles,
  Coins,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    return TIER_TYPES.find((t) => t.value === tierType)?.color || '#808080';
  };

  const filteredRewards = rewards?.filter((reward) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return reward.name.toLowerCase().includes(query) || reward.description?.toLowerCase().includes(query);
  });

  if (storeLoading || tiersLoading || rewardsLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SidebarProvider>
    );
  }

  if (!currentStore) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6">
          <Alert>
            <AlertDescription>Veuillez d'abord créer une boutique.</AlertDescription>
          </Alert>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Award className="h-8 w-8" />
              Programme de Fidélité
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez les tiers, récompenses et suivez l'engagement de vos clients
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_customers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Points Émis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_points_issued.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Points Échangés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_points_redeemed.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Récompenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_rewards}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Échanges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_redemptions}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="rewards">Récompenses</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Tier Distribution */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribution des Tiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {TIER_TYPES.map((tier) => {
                      const count = stats.tier_distribution[tier.value] || 0;
                      const percentage = stats.total_customers > 0 
                        ? (count / stats.total_customers) * 100 
                        : 0;
                      return (
                        <div key={tier.value} className="text-center">
                          <div
                            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2"
                            style={{ backgroundColor: tier.color + '20', color: tier.color }}
                          >
                            {tier.label[0]}
                          </div>
                          <div className="font-semibold">{tier.label}</div>
                          <div className="text-sm text-muted-foreground">{count} membres</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transactions Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 10).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.transaction_type}</Badge>
                          </TableCell>
                          <TableCell className={transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertDescription>Aucune transaction enregistrée.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Configuration des Tiers</h2>
              <Button onClick={() => setIsTierDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Tier
              </Button>
            </div>

            {tiers && tiers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier) => (
                  <Card key={tier.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: tier.badge_color }}
                          >
                            {tier.tier_type[0].toUpperCase()}
                          </div>
                          {tier.name}
                        </CardTitle>
                        {tier.is_default && (
                          <Badge variant="secondary">Par défaut</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Points requis :</span> {tier.min_points_required}
                      </div>
                      {tier.points_multiplier > 1 && (
                        <div className="text-sm">
                          <span className="font-medium">Bonus :</span> {((tier.points_multiplier - 1) * 100).toFixed(0)}%
                        </div>
                      )}
                      {tier.discount_percentage > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Réduction :</span> {tier.discount_percentage}%
                        </div>
                      )}
                      {tier.free_shipping && (
                        <Badge variant="outline" className="text-xs">Livraison gratuite</Badge>
                      )}
                      {tier.description && (
                        <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Aucun tier configuré. Créez votre premier tier pour commencer.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Récompenses</h2>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Rechercher une récompense..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button onClick={() => setIsRewardDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Récompense
                </Button>
              </div>
            </div>

            {filteredRewards && filteredRewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRewards.map((reward) => (
                  <Card key={reward.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{reward.name}</span>
                        {reward.min_tier && (
                          <Badge variant="outline">{reward.min_tier}</Badge>
                        )}
                      </CardTitle>
                      {reward.description && (
                        <CardDescription>{reward.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Coût :</span>
                        <Badge className="bg-yellow-500">
                          <Coins className="h-3 w-3 mr-1" />
                          {reward.points_cost} points
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Type :</span>{' '}
                        {REWARD_TYPES.find((t) => t.value === reward.reward_type)?.label}
                      </div>
                      {reward.reward_type === 'discount' && reward.discount_percentage && (
                        <div className="text-sm">
                          <span className="font-medium">Valeur :</span> {reward.discount_percentage}% de réduction
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
              <Alert>
                <AlertDescription>
                  {searchQuery
                    ? 'Aucune récompense ne correspond à votre recherche.'
                    : 'Aucune récompense configurée. Créez votre première récompense pour commencer.'}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <h2 className="text-xl font-semibold">Historique des Transactions</h2>
            {transactions && transactions.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">Client #{transaction.customer_id.slice(0, 8)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.transaction_type}</Badge>
                          </TableCell>
                          <TableCell className={transaction.points_amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                          </TableCell>
                          <TableCell>{transaction.balance_after}</TableCell>
                          <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertDescription>Aucune transaction enregistrée.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Tier Dialog */}
        <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau Tier de Fidélité</DialogTitle>
              <DialogDescription>
                Configurez un nouveau tier pour votre programme de fidélité
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTier} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier_type">Type de Tier *</Label>
                  <Select
                    value={tierFormData.tier_type}
                    onValueChange={(value: LoyaltyTierType) =>
                      setTierFormData({ ...tierFormData, tier_type: value, badge_color: getTierColor(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_TYPES.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={tierFormData.name}
                    onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                    required
                    placeholder="Membre Bronze"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={tierFormData.description}
                  onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                  placeholder="Description du tier..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_points">Points Minimum *</Label>
                  <Input
                    id="min_points"
                    type="number"
                    min="0"
                    value={tierFormData.min_points_required}
                    onChange={(e) =>
                      setTierFormData({ ...tierFormData, min_points_required: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="multiplier">Multiplicateur</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    min="1"
                    step="0.1"
                    value={tierFormData.points_multiplier}
                    onChange={(e) =>
                      setTierFormData({ ...tierFormData, points_multiplier: parseFloat(e.target.value) || 1.0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Réduction (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={tierFormData.discount_percentage}
                    onChange={(e) =>
                      setTierFormData({ ...tierFormData, discount_percentage: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="free_shipping"
                    checked={tierFormData.free_shipping}
                    onCheckedChange={(checked) => setTierFormData({ ...tierFormData, free_shipping: checked })}
                  />
                  <Label htmlFor="free_shipping">Livraison gratuite</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exclusive"
                    checked={tierFormData.exclusive_access}
                    onCheckedChange={(checked) => setTierFormData({ ...tierFormData, exclusive_access: checked })}
                  />
                  <Label htmlFor="exclusive">Accès exclusif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={tierFormData.is_default}
                    onCheckedChange={(checked) => setTierFormData({ ...tierFormData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Tier par défaut</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTierDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!tierFormData.name}>
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Reward Dialog */}
        <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle Récompense</DialogTitle>
              <DialogDescription>
                Créez une nouvelle récompense échangeable contre des points
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReward} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward_name">Nom *</Label>
                  <Input
                    id="reward_name"
                    value={rewardFormData.name}
                    onChange={(e) => setRewardFormData({ ...rewardFormData, name: e.target.value })}
                    required
                    placeholder="Réduction 10%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward_type">Type *</Label>
                  <Select
                    value={rewardFormData.reward_type}
                    onValueChange={(value: LoyaltyRewardType) =>
                      setRewardFormData({ ...rewardFormData, reward_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REWARD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward_description">Description</Label>
                <Textarea
                  id="reward_description"
                  value={rewardFormData.description}
                  onChange={(e) => setRewardFormData({ ...rewardFormData, description: e.target.value })}
                  placeholder="Description de la récompense..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points_cost">Coût en Points *</Label>
                  <Input
                    id="points_cost"
                    type="number"
                    min="1"
                    value={rewardFormData.points_cost}
                    onChange={(e) =>
                      setRewardFormData({ ...rewardFormData, points_cost: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                {rewardFormData.reward_type === 'discount' && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Réduction (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={rewardFormData.discount_percentage || ''}
                      onChange={(e) =>
                        setRewardFormData({ ...rewardFormData, discount_percentage: parseFloat(e.target.value) || undefined })
                      }
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!rewardFormData.name || !rewardFormData.points_cost}>
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

