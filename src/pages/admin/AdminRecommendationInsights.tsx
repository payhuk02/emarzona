/**
 * Vue admin : analytics recommandations IA par boutique (P3)
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStorePicker } from '@/components/admin/AdminStorePicker';
import { RecommendationAnalytics } from '@/components/analytics/RecommendationAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AdminRecommendationInsights() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
            Recommandations IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance du moteur de recommandation par boutique (vue plateforme).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Boutique</CardTitle>
            <CardDescription>Sélectionnez la boutique à analyser</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminStorePicker value={storeId} onChange={setStoreId} />
          </CardContent>
        </Card>

        {storeId && <RecommendationAnalytics storeId={storeId} dateRange={dateRange} />}
      </div>
    </AdminLayout>
  );
}
