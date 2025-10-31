/**
 * Admin Reviews Moderation Dashboard
 * Date : 27 octobre 2025
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Flag, CheckCircle2, XCircle } from 'lucide-react';
import { ReviewModerationTable } from '@/components/admin/ReviewModerationTable';
import {
  useAdminReviews,
  useAdminReviewStats,
  useApproveReviews,
  useRejectReviews,
  useFlagReviews,
  useDeleteReviews,
} from '@/hooks/useAdminReviews';

export const AdminReviews = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'approved' | 'all'>('pending');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Data hooks
  const { data: stats } = useAdminReviewStats();
  const { data: reviews, isLoading } = useAdminReviews({ status: activeTab });

  useEffect(() => {
    if (!isLoading && reviews) {
      logger.info(`Admin Reviews: ${reviews.length} avis chargés (tab: ${activeTab})`);
    }
  }, [isLoading, reviews, activeTab]);

  // Action hooks
  const approveReviews = useApproveReviews();
  const rejectReviews = useRejectReviews();
  const flagReviews = useFlagReviews();
  const deleteReviews = useDeleteReviews();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div ref={headerRef} role="banner">
        <h1 className="text-3xl font-bold" id="admin-reviews-title">Modération des Avis</h1>
        <p className="text-muted-foreground mt-2">
          Gérer et modérer tous les avis clients de la plateforme
        </p>
      </div>

      {/* Stats Cards */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Statistiques des avis">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avis à modérer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signalés</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flagged || 0}</div>
            <p className="text-xs text-muted-foreground">
              Signalements actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total approuvés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total rejetés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} role="region" aria-label="Onglets de modération">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            En attente
            {stats?.pending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Signalés
            {stats?.flagged > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.flagged}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approuvés</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis en attente de modération</CardTitle>
              <CardDescription>
                Ces avis nécessitent une validation manuelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewModerationTable
                reviews={reviews || []}
                loading={isLoading}
                onApprove={(ids) => approveReviews.mutate(ids)}
                onReject={(ids) => rejectReviews.mutate(ids)}
                onFlag={(ids) => flagReviews.mutate(ids)}
                onDelete={(ids) => deleteReviews.mutate(ids)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis signalés</CardTitle>
              <CardDescription>
                Ces avis ont été signalés par des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewModerationTable
                reviews={reviews || []}
                loading={isLoading}
                onApprove={(ids) => approveReviews.mutate(ids)}
                onReject={(ids) => rejectReviews.mutate(ids)}
                onFlag={(ids) => flagReviews.mutate(ids)}
                onDelete={(ids) => deleteReviews.mutate(ids)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis approuvés</CardTitle>
              <CardDescription>
                Historique des avis approuvés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewModerationTable
                reviews={reviews || []}
                loading={isLoading}
                onApprove={(ids) => approveReviews.mutate(ids)}
                onReject={(ids) => rejectReviews.mutate(ids)}
                onFlag={(ids) => flagReviews.mutate(ids)}
                onDelete={(ids) => deleteReviews.mutate(ids)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les avis</CardTitle>
              <CardDescription>
                Vue complète de tous les avis de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewModerationTable
                reviews={reviews || []}
                loading={isLoading}
                onApprove={(ids) => approveReviews.mutate(ids)}
                onReject={(ids) => rejectReviews.mutate(ids)}
                onFlag={(ids) => flagReviews.mutate(ids)}
                onDelete={(ids) => deleteReviews.mutate(ids)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

