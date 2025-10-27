/**
 * Dashboard global pour les affiliés de cours
 * Vue d'ensemble de toutes les promotions
 * Date : 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TrendingUp,
  Search,
  BookOpen,
  AlertCircle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalAffiliateStats, usePromotedCourses } from '@/hooks/courses/useGlobalAffiliateStats';
import { AffiliateStatsCards } from '@/components/affiliate/AffiliateStatsCards';
import { CoursePromotionList } from '@/components/affiliate/CoursePromotionList';

const AffiliateCoursesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: globalStats, isLoading: statsLoading, refetch: refetchStats } = useGlobalAffiliateStats();
  const { data: promotedCourses, isLoading: coursesLoading, refetch: refetchCourses } = usePromotedCourses();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connexion requise</AlertTitle>
          <AlertDescription>
            Vous devez être connecté pour accéder au dashboard affilié.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/auth/login')} className="mt-4">
          Se connecter
        </Button>
      </div>
    );
  }

  const isLoading = statsLoading || coursesLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchCourses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto py-12 px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard Affilié</h1>
              <p className="text-xl text-green-100">
                Vue d'ensemble de vos promotions de cours
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/marketplace')}
              >
                <Search className="w-4 h-4 mr-2" />
                Trouver des cours
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Statistiques globales */}
            {globalStats && (
              <AffiliateStatsCards
                totalCourses={globalStats.total_courses}
                totalLinks={globalStats.total_links}
                totalClicks={globalStats.total_clicks}
                totalConversions={globalStats.total_conversions}
                conversionRate={globalStats.conversion_rate}
                totalCommission={globalStats.total_commission}
                pendingCommission={globalStats.pending_commission}
                paidCommission={globalStats.paid_commission}
              />
            )}

            {/* Guide de démarrage (si aucun cours promu) */}
            {promotedCourses && promotedCourses.length === 0 && (
              <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Bienvenue dans le Programme d'Affiliation !</h2>
                    <p className="text-muted-foreground mb-6">
                      Commencez à gagner des commissions en promouvant des cours en ligne de qualité.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-green-600 font-bold">1</span>
                            </div>
                            <h3 className="font-semibold">Trouvez un cours</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Parcourez notre marketplace et trouvez des cours avec l'affiliation activée
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-green-600 font-bold">2</span>
                            </div>
                            <h3 className="font-semibold">Créez vos liens</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Générez des liens personnalisés pour chaque canal (blog, YouTube, etc.)
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-green-600 font-bold">3</span>
                            </div>
                            <h3 className="font-semibold">Gagnez !</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Recevez des commissions à chaque inscription via vos liens
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => navigate('/marketplace')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Découvrir les cours disponibles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des cours promus */}
            {promotedCourses && promotedCourses.length > 0 && (
              <CoursePromotionList courses={promotedCourses} />
            )}

            {/* Conseils et FAQ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conseils de promotion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Conseils de Promotion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Créez du contenu de valeur</p>
                      <p className="text-xs text-muted-foreground">
                        Rédigez des articles ou créez des vidéos qui apportent de la valeur à votre audience
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Testez différents canaux</p>
                      <p className="text-xs text-muted-foreground">
                        Créez des liens spécifiques pour blog, YouTube, Instagram pour analyser les performances
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Soyez transparent</p>
                      <p className="text-xs text-muted-foreground">
                        Indiquez toujours que vous utilisez un lien d'affiliation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Analysez vos statistiques</p>
                      <p className="text-xs text-muted-foreground">
                        Suivez régulièrement vos performances et optimisez vos stratégies
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    Questions Fréquentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm mb-1">Quand suis-je payé ?</p>
                    <p className="text-xs text-muted-foreground">
                      Les commissions sont payées mensuellement une fois que vous atteignez le seuil minimum de 50,000 XOF.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm mb-1">Combien de temps dure le cookie ?</p>
                    <p className="text-xs text-muted-foreground">
                      Cela dépend du cours. La durée est affichée sur chaque page de génération de liens (généralement 30 jours).
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm mb-1">Puis-je promouvoir plusieurs cours ?</p>
                    <p className="text-xs text-muted-foreground">
                      Oui ! Vous pouvez promouvoir autant de cours que vous le souhaitez et créer des liens illimités.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-sm mb-1">Comment optimiser mes conversions ?</p>
                    <p className="text-xs text-muted-foreground">
                      Créez du contenu pertinent, utilisez des appels à l'action clairs, et ciblez la bonne audience pour chaque cours.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateCoursesDashboard;

