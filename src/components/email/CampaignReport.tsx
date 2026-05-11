/**
 * Composant pour afficher un rapport détaillé d'une campagne
 * Date: 1er Février 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Mail } from 'lucide-react';
import { useCampaignAnalytics } from '@/hooks/email/useEmailAnalytics';
import { CampaignMetrics } from './CampaignMetrics';
import type { EmailCampaign } from '@/lib/email/email-campaign-service';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface CampaignReportProps {
  campaign: EmailCampaign;
}

export const CampaignReport = ({ campaign }: CampaignReportProps) => {
  const { data: analytics, isLoading } = useCampaignAnalytics(campaign.id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement des analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée analytics disponible pour cette campagne</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du rapport */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription className="mt-1">
                Rapport analytique de la campagne
              </CardDescription>
            </div>
            <Badge variant="outline">{campaign.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
          )}
          
          {/* Statistiques clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Taux de livraison</p>
              <p className="text-2xl font-bold">{analytics.delivery_rate.toFixed(1)}%</p>
              <Progress value={analytics.delivery_rate} className="mt-2 h-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
              <p className="text-2xl font-bold">{analytics.open_rate.toFixed(1)}%</p>
              <Progress value={analytics.open_rate} className="mt-2 h-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux de clic</p>
              <p className="text-2xl font-bold">{analytics.click_rate.toFixed(1)}%</p>
              <Progress value={analytics.click_rate} className="mt-2 h-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CTR/Open Rate</p>
              <p className="text-2xl font-bold">{analytics.click_to_open_rate.toFixed(1)}%</p>
              <Progress value={analytics.click_to_open_rate} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques détaillées */}
      <CampaignMetrics campaign={campaign} />

      {/* Revenus */}
      {analytics.revenue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenus générés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {(analytics.revenue / 100).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'XOF',
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};







