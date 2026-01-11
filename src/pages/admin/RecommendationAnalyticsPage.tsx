/**
 * Page d'analytics des recommandations IA
 * Accessible aux vendeurs pour analyser la performance de leurs recommandations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, TrendingUp, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RecommendationAnalytics } from '@/components/analytics/RecommendationAnalytics';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';

const RecommendationAnalyticsPage = () => {
  const { store } = useStoreContext();
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
    end: new Date()
  });

  const handleExportData = () => {
    // TODO: Implémenter l'export des données d'analytics
    logger.info('Export recommendation analytics requested', { storeId: store?.id, dateRange });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics des Recommandations IA</h1>
          <p className="text-muted-foreground">
            Analysez la performance de vos recommandations personnalisées
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sélecteur de période */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange ? (
                  `${format(dateRange.start, "dd/MM/yyyy", { locale: fr })} - ${format(dateRange.end, "dd/MM/yyyy", { locale: fr })}`
                ) : (
                  "Sélectionner une période"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Bouton d'export */}
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <RecommendationAnalytics
        storeId={store?.id}
        dateRange={dateRange}
      />

      {/* Conseils d'optimisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Conseils d'optimisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h4 className="font-medium">Améliorer le taux de clic</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Les recommandations avec un taux de clic élevé indiquent que vos clients trouvent
                vos suggestions pertinentes. Continuez à optimiser vos descriptions de produits.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">Analyser les tendances</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Identifiez les types de recommandations qui convertissent le mieux et ajustez
                vos stratégies de recommandation en conséquence.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Astuce pour maximiser les conversions
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Les recommandations "complémentaires" ont généralement un meilleur taux de conversion.
              Encouragez vos clients à acheter des produits qui se combinent bien ensemble.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informations techniques */}
      <Card>
        <CardHeader>
          <CardTitle>À propos des recommandations IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Types de recommandations</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Collaboratif</Badge>
                  <span className="text-muted-foreground">Basé sur les achats d'utilisateurs similaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Contenu</Badge>
                  <span className="text-muted-foreground">Produits similaires à l'historique</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Complémentaire</Badge>
                  <span className="text-muted-foreground">Produits souvent achetés ensemble</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Tendance</Badge>
                  <span className="text-muted-foreground">Produits populaires dans vos catégories</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Comment ça marche</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Analyse de l'historique d'achat des clients</p>
                <p>• Comparaison avec les comportements similaires</p>
                <p>• Calcul de scores de pertinence</p>
                <p>• Apprentissage continu des préférences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationAnalyticsPage;