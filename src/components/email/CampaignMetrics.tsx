/**
 * Composant pour afficher les métriques d'une campagne
 * Date: 1er Février 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { EmailCampaign } from '@/lib/email/email-campaign-service';
import { Mail, CheckCircle2, Eye, MousePointerClick, XCircle, UserX } from 'lucide-react';

interface CampaignMetricsProps {
  campaign: EmailCampaign;
}

export const CampaignMetrics = ({ campaign }: CampaignMetricsProps) => {
  const metrics = campaign.metrics;
  const sent = metrics.sent || 0;
  const delivered = metrics.delivered || 0;
  const opened = metrics.opened || 0;
  const clicked = metrics.clicked || 0;
  const bounced = metrics.bounced || 0;
  const unsubscribed = metrics.unsubscribed || 0;

  // Calculer les taux
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
  const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
  const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

  const statCards = [
    {
      label: 'Envoyés',
      value: sent.toLocaleString(),
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Livrés',
      value: delivered.toLocaleString(),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      rate: deliveryRate,
    },
    {
      label: 'Ouverts',
      value: opened.toLocaleString(),
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      rate: openRate,
    },
    {
      label: 'Clics',
      value: clicked.toLocaleString(),
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      rate: clickRate,
    },
    {
      label: 'Rebonds',
      value: bounced.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      rate: bounceRate,
    },
    {
      label: 'Désabonnés',
      value: unsubscribed.toLocaleString(),
      icon: UserX,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      rate: unsubscribeRate,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Métriques de la campagne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    {stat.rate !== undefined && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {stat.rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {stat.rate !== undefined && (
                    <Progress
                      value={stat.rate}
                      className="mt-2 h-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {metrics.revenue && metrics.revenue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenus générés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {metrics.revenue.toLocaleString('fr-FR', {
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

