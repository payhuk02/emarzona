/**
 * Page Customer Loyalty - Programme de fidélité client
 * Date: 27 Janvier 2025
 * 
 * Fonctionnalités:
 * - Afficher les points de fidélité par store
 * - Voir le tier actuel et progrès vers le suivant
 * - Historique des transactions
 * - Récompenses disponibles et échanges
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  useMyLoyaltyPoints,
  useLoyaltyPoints,
  useLoyaltyTiers,
  useLoyaltyRewards,
  useLoyaltyTransactions,
  useLoyaltyRewardRedemptions,
  useRedeemLoyaltyReward,
} from '@/hooks/loyalty/useLoyalty';
import { useAuth } from '@/contexts/AuthContext';
import {
  Award,
  Coins,
  Gift,
  TrendingUp,
  History,
  Sparkles,
  Trophy,
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { LoyaltyTierType, LoyaltyRewardType } from '@/types/loyalty';

const TIER_COLORS: Record<LoyaltyTierType, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const REWARD_TYPE_LABELS: Record<LoyaltyRewardType, string> = {
  discount: 'Réduction',
  free_product: 'Produit gratuit',
  free_shipping: 'Livraison gratuite',
  gift_card: 'Carte cadeau',
  cash_back: 'Cashback',
  custom: 'Personnalisée',
};

export default function CustomerLoyalty() {
  const { user } = useAuth();
  const { data: myPoints, isLoading: pointsLoading } = useMyLoyaltyPoints();
  const { data: redemptions } = useLoyaltyRewardRedemptions(undefined, user?.id);
  const redeemReward = useRedeemLoyaltyReward();
  const { toast } = useToast();

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);

  // Charger les données pour le store sélectionné
  const { data: tiers } = useLoyaltyTiers(selectedStoreId || undefined);
  const { data: rewards } = useLoyaltyRewards(selectedStoreId || undefined, defaultStore?.current_tier_type);
  const { data: transactions } = useLoyaltyTransactions(selectedStoreId || undefined, user?.id);

  // Sélectionner le premier store par défaut
  const defaultStore = useMemo(() => {
    if (myPoints && myPoints.length > 0 && !selectedStoreId) {
      setSelectedStoreId(myPoints[0].store_id);
      return myPoints[0];
    }
    return myPoints?.find((p) => p.store_id === selectedStoreId);
  }, [myPoints, selectedStoreId]);

  // Trouver le tier suivant
  const nextTier = useMemo(() => {
    if (!tiers || !defaultStore) return null;
    return tiers.find(
      (tier) => tier.min_points_required > defaultStore.available_points && tier.is_active
    );
  }, [tiers, defaultStore]);

  // Calculer le progrès vers le tier suivant
  const progressToNextTier = useMemo(() => {
    if (!defaultStore || !nextTier) return 0;
    if (nextTier.min_points_required === 0) return 100;
    
    const currentTier = tiers?.find((t) => t.tier_type === defaultStore.current_tier_type);
    const minPoints = currentTier?.min_points_required || 0;
    const maxPoints = nextTier.min_points_required;
    const progress = ((defaultStore.available_points - minPoints) / (maxPoints - minPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [defaultStore, nextTier, tiers]);

  const handleRedeemReward = async (rewardId: string, storeId: string) => {
    if (!user?.id) return;

    try {
      const code = await redeemReward.mutateAsync({
        reward_id: rewardId,
        store_id: storeId,
        customer_id: user.id,
      });
      setIsRedeemDialogOpen(false);
      setRedeemingRewardId(null);
      // Le toast est géré par le hook
    } catch (error) {
      // Error handled by hook
    }
  };

  const openRedeemDialog = (rewardId: string) => {
    setRedeemingRewardId(rewardId);
    setIsRedeemDialogOpen(true);
  };

  if (pointsLoading) {
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

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Veuillez vous connecter pour voir votre programme de fidélité.</AlertDescription>
          </Alert>
        </div>
      </SidebarProvider>
    );
  }

  const selectedReward = rewards?.find((r) => r.id === redeemingRewardId);

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            Programme de Fidélité
          </h1>
          <p className="text-muted-foreground mt-1">
            Consultez vos points, échangez des récompenses et suivez votre progression
          </p>
        </div>

        {/* Store Selector */}
        {myPoints && myPoints.length > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {myPoints.map((points) => (
                  <Button
                    key={points.store_id}
                    variant={selectedStoreId === points.store_id ? 'default' : 'outline'}
                    onClick={() => setSelectedStoreId(points.store_id)}
                  >
                    {(points as any).store?.name || `Store ${points.store_id.slice(0, 8)}`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {defaultStore ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="rewards">Récompenses</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Points Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Mes Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{defaultStore?.available_points || 0}</span>
                    <span className="text-lg text-muted-foreground">points disponibles</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total gagnés :</span>
                      <div className="font-semibold">{defaultStore?.lifetime_points || 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Commandes :</span>
                      <div className="font-semibold">{defaultStore?.total_orders || 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total dépensé :</span>
                      <div className="font-semibold">
                        {defaultStore?.total_spent?.toLocaleString() || 0} {defaultStore?.store_id ? 'FCFA' : ''}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Tier */}
              {defaultStore && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Mon Tier Actuel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                        style={{
                          backgroundColor: TIER_COLORS[defaultStore.current_tier_type] || '#808080',
                        }}
                      >
                        {defaultStore.current_tier_type[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {defaultStore.current_tier?.name || defaultStore.current_tier_type.toUpperCase()}
                        </div>
                        {defaultStore.current_tier?.description && (
                          <p className="text-sm text-muted-foreground">{defaultStore.current_tier.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Next Tier Progress */}
                    {nextTier && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prochain tier : {nextTier.name}</span>
                          <span className="font-medium">
                            {defaultStore.available_points} / {nextTier.min_points_required} points
                          </span>
                        </div>
                        <Progress value={progressToNextTier} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {nextTier.min_points_required - defaultStore.available_points} points pour atteindre{' '}
                          {nextTier.name}
                        </p>
                      </div>
                    )}

                    {/* Tier Benefits */}
                    {defaultStore.current_tier && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        {defaultStore.current_tier.points_multiplier > 1 && (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">
                              Bonus {((defaultStore.current_tier.points_multiplier - 1) * 100).toFixed(0)}% de points
                            </span>
                          </div>
                        )}
                        {defaultStore.current_tier.discount_percentage > 0 && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{defaultStore.current_tier.discount_percentage}% de réduction</span>
                          </div>
                        )}
                        {defaultStore.current_tier.free_shipping && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Livraison gratuite</span>
                          </div>
                        )}
                        {defaultStore.current_tier.exclusive_access && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">Accès exclusif</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              <h2 className="text-xl font-semibold">Récompenses Disponibles</h2>
              {rewards && rewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => {
                    const canRedeem =
                      defaultStore && defaultStore.available_points >= reward.points_cost;
                    const isAvailable =
                      (!reward.available_from || new Date(reward.available_from) <= new Date()) &&
                      (!reward.available_until || new Date(reward.available_until) >= new Date());

                    return (
                      <Card key={reward.id} className={!isAvailable ? 'opacity-50' : ''}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{reward.name}</span>
                            {reward.min_tier && (
                              <Badge variant="outline" className="text-xs">{reward.min_tier}</Badge>
                            )}
                          </CardTitle>
                          {reward.description && <CardDescription>{reward.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Coût :</span>
                            <Badge className="bg-yellow-500">
                              <Coins className="h-3 w-3 mr-1" />
                              {reward.points_cost} points
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Type :</span>{' '}
                            {REWARD_TYPE_LABELS[reward.reward_type]}
                          </div>
                          {reward.reward_type === 'discount' && reward.discount_percentage && (
                            <div className="text-sm text-green-600 font-medium">
                              Réduction de {reward.discount_percentage}%
                            </div>
                          )}
                          <Button
                            className="w-full"
                            onClick={() => openRedeemDialog(reward.id)}
                            disabled={!canRedeem || !isAvailable || redeemReward.isPending}
                          >
                            {canRedeem && isAvailable ? (
                              <>
                                Échanger
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            ) : !isAvailable ? (
                              'Indisponible'
                            ) : (
                              'Points insuffisants'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune récompense disponible pour le moment. Revenez bientôt !
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <h2 className="text-xl font-semibold">Historique</h2>
              <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="redemptions">Échanges</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      {transactions && transactions.length > 0 ? (
                        <div className="space-y-3">
                          {transactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{transaction.description || 'Transaction'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-bold ${
                                    transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {transaction.points_amount > 0 ? '+' : ''}
                                  {transaction.points_amount}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Balance : {transaction.balance_after}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>Aucune transaction enregistrée.</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="redemptions" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      {redemptions && redemptions.length > 0 ? (
                        <div className="space-y-3">
                          {redemptions.map((redemption) => (
                            <div
                              key={redemption.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {redemption.reward?.name || 'Récompense'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Code : <code className="bg-muted px-2 py-0.5 rounded">{redemption.redemption_code}</code>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(redemption.created_at), 'PPp', { locale: fr })}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    redemption.status === 'used'
                                      ? 'default'
                                      : redemption.status === 'expired'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {redemption.status === 'used' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {redemption.status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                                  {redemption.status === 'active' && 'Actif'}
                                  {redemption.status === 'used' && 'Utilisé'}
                                  {redemption.status === 'expired' && 'Expiré'}
                                  {redemption.status === 'cancelled' && 'Annulé'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>Aucun échange enregistré.</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous n'avez pas encore de compte de fidélité. Effectuez votre premier achat pour commencer à gagner des points !
            </AlertDescription>
          </Alert>
        )}

        {/* Redeem Dialog */}
        <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Échanger la Récompense</DialogTitle>
              <DialogDescription>
                Confirmez l'échange de {selectedReward?.points_cost} points pour "{selectedReward?.name}"
              </DialogDescription>
            </DialogHeader>
            {selectedReward && defaultStore && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Points actuels :</span>
                    <span className="font-medium">{defaultStore?.available_points || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Coût :</span>
                    <span className="font-medium text-red-600">-{selectedReward.points_cost}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Points après échange :</span>
                    <span>{(defaultStore?.available_points || 0) - selectedReward.points_cost}</span>
                  </div>
                </div>
                {selectedReward.description && (
                  <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (selectedReward && selectedStoreId) {
                    handleRedeemReward(selectedReward.id, selectedStoreId);
                  }
                }}
                disabled={redeemReward.isPending}
              >
                {redeemReward.isPending ? 'Échange en cours...' : 'Confirmer l\'échange'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

