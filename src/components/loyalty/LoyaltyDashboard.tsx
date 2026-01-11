/**
 * Loyalty Dashboard Component
 * Dashboard complet pour la gestion de la fidélisation utilisateur
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Star,
  Gift,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Coins,
  Zap
} from 'lucide-react';
import { useLoyaltyProfile, useLoyaltyTransactions, useLoyaltyStats } from '@/hooks/useAdvancedLoyalty';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoyaltyDashboardProps {
  className?: string;
}

export const LoyaltyDashboard: React.FC<LoyaltyDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { profile, isLoading: profileLoading } = useLoyaltyProfile(user?.id);
  const { data: transactions } = useLoyaltyTransactions(user?.id);

  if (profileLoading) {
    return <LoyaltyDashboardSkeleton />;
  }

  if (!profile) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Programme de fidélité non disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header avec niveau actuel */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.currentTier.name}</h2>
                <p className="text-muted-foreground">{profile.currentTier.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{profile.availablePoints.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Points disponibles</p>
            </div>
          </div>

          {/* Barre de progression vers le niveau suivant */}
          {profile.nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progrès vers {profile.nextTier.name}</span>
                <span>{profile.pointsToNextTier} points restants</span>
              </div>
              <Progress
                value={(profile.totalPoints / (profile.currentTier.maxPoints || profile.totalPoints + profile.pointsToNextTier)) * 100}
                className="h-3"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{profile.totalPoints.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{profile.streakData.currentStreak}</div>
            <p className="text-sm text-muted-foreground">Série actuelle</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{profile.referralStats.totalReferrals}</div>
            <p className="text-sm text-muted-foreground">Parrainages</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{profile.badges.length}</div>
            <p className="text-sm text-muted-foreground">Badges</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="benefits">Avantages</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="referrals">Parrainage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Badges débloqués */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Badges débloqués
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profile.badges.map((badge) => (
                    <div key={badge.id} className="text-center">
                      <div
                        className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-2xl"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.icon}
                      </div>
                      <h4 className="font-medium text-sm">{badge.name}</h4>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun badge débloqué pour le moment. Continuez à gagner des points !
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions?.transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        transaction.type === 'earned' ? "bg-green-100 text-green-600" :
                        transaction.type === 'spent' ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {transaction.type === 'earned' ? <TrendingUp className="h-4 w-4" /> :
                         transaction.type === 'spent' ? <Gift className="h-4 w-4" /> :
                         <Star className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-bold",
                      transaction.points > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune activité récente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avantages de votre niveau {profile.currentTier.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.currentTier.benefits.length > 0 ? (
                <div className="grid gap-4">
                  {profile.currentTier.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{benefit.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {benefit.type === 'discount_percentage' && `${benefit.value}% de réduction`}
                          {benefit.type === 'discount_fixed' && `${benefit.value}€ de réduction`}
                          {benefit.type === 'free_shipping' && 'Livraison gratuite'}
                          {benefit.type === 'priority_support' && 'Support prioritaire'}
                          {benefit.type === 'early_access' && 'Accès anticipé'}
                          {benefit.type === 'exclusive_content' && 'Contenu exclusif'}
                          {benefit.type === 'bonus_points_multiplier' && `${benefit.value}x points bonus`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun avantage spécial pour ce niveau
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions?.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        transaction.type === 'earned' ? "bg-green-100 text-green-600" :
                        transaction.type === 'spent' ? "bg-red-100 text-red-600" :
                        transaction.type === 'expired' ? "bg-yellow-100 text-yellow-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {transaction.type === 'earned' ? <TrendingUp className="h-5 w-5" /> :
                         transaction.type === 'spent' ? <Gift className="h-5 w-5" /> :
                         transaction.type === 'expired' ? <Calendar className="h-5 w-5" /> :
                         <Star className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {transaction.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expire le {new Date(transaction.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      transaction.points > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun historique disponible
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Programme de parrainage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Code de parrainage */}
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <h3 className="font-medium mb-2">Votre code de parrainage</h3>
                <div className="text-2xl font-mono font-bold text-primary mb-4">
                  {profile.referralStats.referralCode}
                </div>
                <Button variant="outline" size="sm">
                  Copier le code
                </Button>
              </div>

              {/* Statistiques de parrainage */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {profile.referralStats.totalReferrals}
                  </div>
                  <p className="text-sm text-muted-foreground">Parrainages</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {profile.referralStats.successfulReferrals}
                  </div>
                  <p className="text-sm text-muted-foreground">Réussis</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {profile.referralStats.earnedFromReferrals}
                  </div>
                  <p className="text-sm text-muted-foreground">Points gagnés</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((profile.referralStats.successfulReferrals / Math.max(profile.referralStats.totalReferrals, 1)) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Taux de succès</p>
                </div>
              </div>

              {/* Comment ça marche */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Comment ça marche ?</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Partagez votre code avec vos amis</p>
                  <p>• Ils gagnent 500 points à l'inscription</p>
                  <p>• Vous gagnez 1000 points quand ils achètent</p>
                  <p>• Plus vous parrainez, plus vous gagnez !</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Composant de chargement
const LoyaltyDashboardSkeleton = () => (
  <div className="w-full space-y-6">
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-3 w-full mt-6" />
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 text-center">
            <Skeleton className="h-8 w-8 mx-auto mb-2" />
            <Skeleton className="h-6 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default LoyaltyDashboard;