/**
 * Dashboard global pour les affiliés de cours
 * Vue d'ensemble de toutes les promotions
 * Date : 27 octobre 2025
 * Updated: 2025-02-02 - Responsive design with Mes Templates style
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
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
  GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalAffiliateStats, usePromotedCourses } from '@/hooks/courses/useGlobalAffiliateStats';
import { AffiliateStatsCards } from '@/components/affiliate/AffiliateStatsCards';
import { CoursePromotionList } from '@/components/affiliate/CoursePromotionList';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const AffiliateCoursesDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: globalStats, isLoading: statsLoading, refetch: refetchStats } = useGlobalAffiliateStats();
  const { data: promotedCourses, isLoading: coursesLoading, refetch: refetchCourses } = usePromotedCourses();

  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (!user) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Alert className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('affiliate.dashboard.loginRequired')}</AlertTitle>
                <AlertDescription>
                  {t('affiliate.dashboard.mustBeLoggedIn')}
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/auth/login')} className="mt-4">
                {t('auth.login.button')}
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const isLoading = statsLoading || coursesLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchCourses();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20 animate-in zoom-in duration-500">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-500 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {t('affiliate.dashboard.title')}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('affiliate.dashboard.description')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-9 sm:h-10 transition-all hover:scale-105"
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline text-xs sm:text-sm">{t('common.refresh')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/marketplace')}
                  className="h-9 sm:h-10"
                >
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">{t('affiliate.dashboard.findCourses')}</span>
                  <span className="sm:hidden text-xs">{t('courses.title')}</span>
                </Button>
              </div>
            </div>
            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-24 sm:h-32 w-full" />
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
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 sm:p-8">
                      <div className="max-w-2xl mx-auto text-center">
                        <div className="p-4 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                          <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('affiliate.dashboard.welcome.title')}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6">
                          {t('affiliate.dashboard.welcome.description')}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 text-left">
                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                                  1
                                </div>
                                <h3 className="font-semibold text-sm sm:text-base">{t('affiliate.dashboard.steps.step1.title')}</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {t('affiliate.dashboard.steps.step1.description')}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                                  2
                                </div>
                                <h3 className="font-semibold text-sm sm:text-base">{t('affiliate.dashboard.steps.step2.title')}</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {t('affiliate.dashboard.steps.step2.description')}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                                  3
                                </div>
                                <h3 className="font-semibold text-sm sm:text-base">{t('affiliate.dashboard.steps.step3.title')}</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {t('affiliate.dashboard.steps.step3.description')}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <Button
                          size="lg"
                          onClick={() => navigate('/marketplace')}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-10 sm:h-11"
                        >
                          <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span className="text-xs sm:text-sm">{t('affiliate.dashboard.discoverCourses')}</span>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Conseils de promotion */}
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        {t('affiliate.dashboard.tips.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">{t('affiliate.dashboard.tips.tip1.title')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('affiliate.dashboard.tips.tip1.description')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">{t('affiliate.dashboard.tips.tip2.title')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('affiliate.dashboard.tips.tip2.description')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">{t('affiliate.dashboard.tips.tip3.title')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('affiliate.dashboard.tips.tip3.description')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">{t('affiliate.dashboard.tips.tip4.title')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('affiliate.dashboard.tips.tip4.description')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ */}
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        {t('affiliate.dashboard.faq.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">{t('affiliate.dashboard.faq.q1.question')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('affiliate.dashboard.faq.q1.answer')}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">{t('affiliate.dashboard.faq.q2.question')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('affiliate.dashboard.faq.q2.answer')}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">{t('affiliate.dashboard.faq.q3.question')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('affiliate.dashboard.faq.q3.answer')}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">{t('affiliate.dashboard.faq.q4.question')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('affiliate.dashboard.faq.q4.answer')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AffiliateCoursesDashboard;

