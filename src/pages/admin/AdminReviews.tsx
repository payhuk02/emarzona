/**
 * Admin Reviews Moderation Dashboard
 * Date : 27 octobre 2025
 * Design responsive inspiré de la page Inventaire
 */

import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Flag, CheckCircle2, XCircle, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { ReviewModerationTable } from '@/components/admin/ReviewModerationTable';
import {
  useAdminReviews,
  useAdminReviewStats,
  useApproveReviews,
  useRejectReviews,
  useFlagReviews,
  useDeleteReviews,
} from '@/hooks/useAdminReviews';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const AdminReviews = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'approved' | 'all'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const { toast } = useToast();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Data hooks
  const { data: stats, refetch: refetchStats } = useAdminReviewStats();
  const { data: reviewsResult, isLoading, refetch } = useAdminReviews({ 
    status: activeTab,
    page: currentPage,
    pageSize 
  });
  const reviews = reviewsResult?.data || [];
  // const totalCount = reviewsResult?.count || 0; // Utilisé pour pagination future

  useEffect(() => {
    if (!isLoading && reviews) {
      logger.info(`Admin Reviews: ${reviews.length} avis chargés (tab: ${activeTab}, page: ${currentPage})`);
    }
  }, [isLoading, reviews, activeTab, currentPage]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Action hooks
  const approveReviews = useApproveReviews();
  const rejectReviews = useRejectReviews();
  const flagReviews = useFlagReviews();
  const deleteReviews = useDeleteReviews();

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    refetchStats();
    logger.info('Reviews refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'Les avis ont été actualisés.',
    });
  }, [refetch, refetchStats, toast]);

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header avec animation - Style Inventory */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Modération des Avis
              </span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Gérer et modérer tous les avis clients de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              size="sm"
              className="min-h-[44px] h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline text-xs sm:text-sm">Rafraîchir</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Style Inventory (Purple-Pink Gradient) */}
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="region" 
          aria-label="Statistiques des avis"
        >
          {[
            { 
              label: 'En attente', 
              value: (stats && typeof stats === 'object' && 'pending' in stats) ? stats.pending : 0, 
              icon: Clock, 
              color: "from-orange-600 to-amber-600",
              description: "Avis à modérer"
            },
            { 
              label: 'Signalés', 
              value: (stats && typeof stats === 'object' && 'flagged' in stats) ? stats.flagged : 0, 
              icon: Flag, 
              color: "from-red-600 to-rose-600",
              description: "Signalements actifs"
            },
            { 
              label: 'Approuvés', 
              value: (stats && typeof stats === 'object' && 'approved' in stats) ? stats.approved : 0, 
              icon: CheckCircle2, 
              color: "from-green-600 to-emerald-600",
              description: "Total approuvés"
            },
            { 
              label: 'Rejetés', 
              value: (stats && typeof stats === 'object' && 'rejected' in stats) ? stats.rejected : 0, 
              icon: XCircle, 
              color: "from-gray-600 to-slate-600",
              description: "Total rejetés"
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs - Style Inventory */}
        <div ref={tabsRef} role="region" aria-label="Onglets de modération">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger 
                value="pending" 
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                En attente
                {stats && typeof stats === 'object' && 'pending' in stats && stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="flagged" 
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                Signalés
                {stats && typeof stats === 'object' && 'flagged' in stats && stats.flagged > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {stats.flagged}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="approved" 
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                Approuvés
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                Tous
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Avis en attente de modération</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Ces avis nécessitent une validation manuelle
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                        <p className="text-sm sm:text-base text-muted-foreground">Chargement des avis...</p>
                      </div>
                    </div>
                  ) : (
                    <ReviewModerationTable
                      reviews={reviews || []}
                      loading={isLoading}
                      onApprove={(ids) => approveReviews.mutate(ids)}
                      onReject={(ids) => rejectReviews.mutate(ids)}
                      onFlag={(ids) => flagReviews.mutate(ids)}
                      onDelete={(ids) => deleteReviews.mutate(ids)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flagged" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Avis signalés</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Ces avis ont été signalés par des utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                        <p className="text-sm sm:text-base text-muted-foreground">Chargement des avis...</p>
                      </div>
                    </div>
                  ) : (
                    <ReviewModerationTable
                      reviews={reviews || []}
                      loading={isLoading}
                      onApprove={(ids) => approveReviews.mutate(ids)}
                      onReject={(ids) => rejectReviews.mutate(ids)}
                      onFlag={(ids) => flagReviews.mutate(ids)}
                      onDelete={(ids) => deleteReviews.mutate(ids)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Avis approuvés</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Historique des avis approuvés
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                        <p className="text-sm sm:text-base text-muted-foreground">Chargement des avis...</p>
                      </div>
                    </div>
                  ) : (
                    <ReviewModerationTable
                      reviews={reviews || []}
                      loading={isLoading}
                      onApprove={(ids) => approveReviews.mutate(ids)}
                      onReject={(ids) => rejectReviews.mutate(ids)}
                      onFlag={(ids) => flagReviews.mutate(ids)}
                      onDelete={(ids) => deleteReviews.mutate(ids)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Tous les avis</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Vue complète de tous les avis de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                        <p className="text-sm sm:text-base text-muted-foreground">Chargement des avis...</p>
                      </div>
                    </div>
                  ) : (
                    <ReviewModerationTable
                      reviews={reviews || []}
                      loading={isLoading}
                      onApprove={(ids) => approveReviews.mutate(ids)}
                      onReject={(ids) => rejectReviews.mutate(ids)}
                      onFlag={(ids) => flagReviews.mutate(ids)}
                      onDelete={(ids) => deleteReviews.mutate(ids)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

