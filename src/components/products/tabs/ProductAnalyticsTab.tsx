import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Settings,
  Activity,
  Target,
  Zap,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  DollarSign,
  Users,
  TrendingUp,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProductAnalytics, useAnalyticsTracking, useAnalyticsHistory } from "@/hooks/useProductAnalytics";
import { AnalyticsChart, TrafficSourceChart, RealtimeMetrics } from "@/components/analytics/AnalyticsCharts";
import { ReportsSection } from "@/components/analytics/ReportsSection";

/**
 * Interface stricte pour les données du formulaire produit (Analytics)
 */
interface ProductFormData {
  id?: string;
  
  // Analytics configuration
  tracking_enabled?: boolean;
  track_views?: boolean;
  track_clicks?: boolean;
  track_conversions?: boolean;
  track_time_spent?: boolean;
  track_errors?: boolean;
  advanced_tracking?: boolean;
  custom_events?: string[];
  
  // External analytics
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_tag_manager_id?: string;
  tiktok_pixel_id?: string;
  pinterest_pixel_id?: string;
  linkedin_insight_tag?: string;
  
  // Goals
  goal_views?: number | null;
  goal_revenue?: number | null;
  goal_conversions?: number | null;
  goal_conversion_rate?: number | null;
  email_alerts?: boolean;
}

interface ProductAnalyticsTabProps {
  formData: ProductFormData;
  updateFormData: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export const ProductAnalyticsTab = ({ formData, updateFormData }: ProductAnalyticsTabProps) => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [selectedChart, setSelectedChart] = useState<"line" | "area" | "bar">("line");

  // Utiliser les hooks d'analytics réels
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
    isRealTimeActive,
    setIsRealTimeActive,
    updateAnalytics,
    changePercentages
  } = useProductAnalytics(formData.id);

  const { trackView, trackClick, trackConversion, trackCustomEvent } = useAnalyticsTracking();
  
  const { dailyData, loading: historyLoading } = useAnalyticsHistory(formData.id, 
    selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90
  );

  /**
   * Active/désactive le mode temps réel avec notification utilisateur
   */
  const toggleRealTime = useCallback(() => {
    setIsRealTimeActive(!isRealTimeActive);
    toast({
      title: isRealTimeActive ? "Temps réel désactivé" : "Temps réel activé",
      description: isRealTimeActive 
        ? "Les données ne sont plus mises à jour en temps réel." 
        : "Les données sont maintenant mises à jour en temps réel.",
    });
  }, [isRealTimeActive, setIsRealTimeActive, toast]);

  /**
   * Statistiques calculées à partir des analytics
   */
  const trafficSourceData = [
    { name: "Recherche organique", value: 45, color: "#3b82f6" },
    { name: "Réseaux sociaux", value: 30, color: "#10b981" },
    { name: "Direct", value: 15, color: "#8b5cf6" },
    { name: "Référencement", value: 10, color: "#f59e0b" }
  ];

  const secondaryMetrics = analytics ? {
    revenue: analytics.total_revenue,
    bounceRate: analytics.bounce_rate,
    avgSessionDuration: analytics.avg_session_duration,
    returningVisitors: analytics.returning_visitors
  } : null;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* En-tête avec contrôles */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-white">Analytics & Tracking</CardTitle>
                  <CardDescription className="text-gray-400">
                    Surveillez les performances de votre produit en temps réel
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isRealTimeActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
                  )} />
                  <span className="text-sm text-gray-400">
                    {isRealTimeActive ? "Temps réel" : "Statique"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRealTime}
                  className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                  aria-label={isRealTimeActive ? "Désactiver le temps réel" : "Activer le temps réel"}
                >
                  {isRealTimeActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                  aria-label="Rafraîchir les données"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Affichage des erreurs */}
        {analyticsError && (
          <Card className="border-2 border-red-500/50 bg-red-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Erreur de chargement des analytics</span>
              </div>
              <p className="text-sm text-red-300 mt-1">{analyticsError}</p>
            </CardContent>
          </Card>
        )}

        {/* Métriques principales avec données réelles */}
        <RealtimeMetrics
          analytics={analytics}
          changePercentages={changePercentages}
          isRealTimeActive={isRealTimeActive}
          onToggleRealTime={toggleRealTime}
        />

        {/* Métriques secondaires */}
        {secondaryMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Revenus</p>
                    <p className="text-lg font-semibold text-white">{secondaryMetrics.revenue.toLocaleString()} XOF</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Taux de rebond</p>
                    <p className="text-lg font-semibold text-white">{secondaryMetrics.bounceRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Durée moyenne</p>
                    <p className="text-lg font-semibold text-white">
                      {Math.floor(secondaryMetrics.avgSessionDuration / 60)}m {secondaryMetrics.avgSessionDuration % 60}s
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Visiteurs récurrents</p>
                    <p className="text-lg font-semibold text-white">{secondaryMetrics.returningVisitors}</p>
                  </div>
                  <Users className="h-5 w-5 text-purple-400" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglets pour les différentes sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700 text-white">
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-gray-700 text-white">
              Tracking
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-gray-700 text-white hidden sm:block">
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-gray-700 text-white hidden sm:block">
              Objectifs
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-700 text-white">
              Rapports
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique des performances */}
              <AnalyticsChart
                data={dailyData}
                chartType={selectedChart}
                onChartTypeChange={setSelectedChart}
                period={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                title="Performances"
                description="Évolution des métriques sur la période sélectionnée"
                loading={historyLoading}
              />

              {/* Répartition des sources */}
              <TrafficSourceChart
                data={trafficSourceData}
                loading={analyticsLoading}
              />
            </div>
          </TabsContent>

          {/* Configuration du tracking */}
          <TabsContent value="tracking" className="space-y-6 mt-6">
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Settings className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Configuration du tracking</CardTitle>
                    <CardDescription className="text-gray-400">
                      Surveillez les interactions des utilisateurs avec votre produit
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tracking_enabled" className="text-sm font-medium text-white">
                          Tracking des événements
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enregistrer les événements personnalisés</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">Enregistrer les événements personnalisés</p>
                    </div>
                    <Switch
                      id="tracking_enabled"
                      checked={analytics?.tracking_enabled || false}
                      onCheckedChange={(checked) => updateAnalytics({ tracking_enabled: checked })}
                      aria-label="Activer le tracking des événements"
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="track_views" className="text-sm font-medium text-white">
                        Tracking des vues
                      </Label>
                      <p className="text-xs text-gray-400">Enregistrer chaque vue de produit</p>
                    </div>
                    <Switch
                      id="track_views"
                      checked={analytics?.track_views || false}
                      onCheckedChange={(checked) => updateAnalytics({ track_views: checked })}
                      aria-label="Activer le tracking des vues"
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="track_clicks" className="text-sm font-medium text-white">
                        Tracking des clics
                      </Label>
                      <p className="text-xs text-gray-400">Enregistrer les clics sur les boutons et liens</p>
                    </div>
                    <Switch
                      id="track_clicks"
                      checked={analytics?.track_clicks || false}
                      onCheckedChange={(checked) => updateAnalytics({ track_clicks: checked })}
                      aria-label="Activer le tracking des clics"
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="track_conversions" className="text-sm font-medium text-white">
                        Tracking des achats
                      </Label>
                      <p className="text-xs text-gray-400">Enregistrer les conversions et revenus</p>
                    </div>
                    <Switch
                      id="track_conversions"
                      checked={analytics?.track_conversions || false}
                      onCheckedChange={(checked) => updateAnalytics({ track_conversions: checked })}
                      aria-label="Activer le tracking des conversions"
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="track_time_spent" className="text-sm font-medium text-white">
                        Tracking du temps passé
                      </Label>
                      <p className="text-xs text-gray-400">Mesurer l'engagement des utilisateurs</p>
                    </div>
                    <Switch
                      id="track_time_spent"
                      checked={analytics?.track_time_spent || false}
                      onCheckedChange={(checked) => updateAnalytics({ track_time_spent: checked })}
                      aria-label="Activer le tracking du temps passé"
                      className="touch-manipulation"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="track_errors" className="text-sm font-medium text-white">
                        Tracking des erreurs
                      </Label>
                      <p className="text-xs text-gray-400">Enregistrer les erreurs JavaScript</p>
                    </div>
                    <Switch
                      id="track_errors"
                      checked={analytics?.track_errors || false}
                      onCheckedChange={(checked) => updateAnalytics({ track_errors: checked })}
                      aria-label="Activer le tracking des erreurs"
                      className="touch-manipulation"
                    />
                  </div>
                </div>

                {/* Tracking avancé */}
                <Separator className="bg-gray-700" />
                
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="advanced_tracking" className="text-sm font-medium text-white">
                      Tracking avancé
                    </Label>
                    <p className="text-xs text-gray-400">Événements personnalisés et configurations spécifiques</p>
                  </div>
                  <Switch
                    id="advanced_tracking"
                    checked={analytics?.advanced_tracking || false}
                    onCheckedChange={(checked) => updateAnalytics({ advanced_tracking: checked })}
                    aria-label="Activer le tracking avancé"
                    className="touch-manipulation"
                  />
                </div>
                
                {analytics?.advanced_tracking && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom_events" className="text-sm font-medium text-white">
                        Événements personnalisés
                      </Label>
                      <Input
                        id="custom_events"
                        value={analytics?.custom_events?.join(",") || ""}
                        onChange={(e) => updateAnalytics({ 
                          custom_events: e.target.value.split(",").map(s => s.trim()).filter(s => s) 
                        })}
                        placeholder="event1,event2,event3"
                        aria-label="Événements personnalisés séparés par des virgules"
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                      />
                      <p className="text-xs text-gray-400">Séparez les événements personnalisés par des virgules.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intégrations externes */}
          <TabsContent value="integrations" className="space-y-6 mt-6">
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Activity className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Analytics externes</CardTitle>
                    <CardDescription className="text-gray-400">
                      Intégrez votre produit avec des outils d'analyse tiers
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id" className="text-sm font-medium text-white flex items-center gap-2">
                      Google Analytics ID
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ID de votre propriété Google Analytics</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="google_analytics_id"
                      value={analytics?.google_analytics_id || ""}
                      onChange={(e) => updateAnalytics({ google_analytics_id: e.target.value })}
                      placeholder="UA-XXXXXXXXX-X ou G-XXXXXXXXXX"
                      aria-label="ID Google Analytics"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_pixel_id" className="text-sm font-medium text-white">
                      Facebook Pixel ID
                    </Label>
                    <Input
                      id="facebook_pixel_id"
                      value={analytics?.facebook_pixel_id || ""}
                      onChange={(e) => updateAnalytics({ facebook_pixel_id: e.target.value })}
                      placeholder="123456789012345"
                      aria-label="ID Facebook Pixel"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_tag_manager_id" className="text-sm font-medium text-white">
                      Google Tag Manager ID
                    </Label>
                    <Input
                      id="google_tag_manager_id"
                      value={analytics?.google_tag_manager_id || ""}
                      onChange={(e) => updateAnalytics({ google_tag_manager_id: e.target.value })}
                      placeholder="GTM-XXXXXXX"
                      aria-label="ID Google Tag Manager"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok_pixel_id" className="text-sm font-medium text-white">
                      TikTok Pixel ID
                    </Label>
                    <Input
                      id="tiktok_pixel_id"
                      value={analytics?.tiktok_pixel_id || ""}
                      onChange={(e) => updateAnalytics({ tiktok_pixel_id: e.target.value })}
                      placeholder="CXXXXXXXXXXXXXXX"
                      aria-label="ID TikTok Pixel"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pinterest_pixel_id" className="text-sm font-medium text-white">
                      Pinterest Pixel ID
                    </Label>
                    <Input
                      id="pinterest_pixel_id"
                      value={analytics?.pinterest_pixel_id || ""}
                      onChange={(e) => updateAnalytics({ pinterest_pixel_id: e.target.value })}
                      placeholder="123456789012345"
                      aria-label="ID Pinterest Pixel"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_insight_tag" className="text-sm font-medium text-white">
                      LinkedIn Insight Tag
                    </Label>
                    <Input
                      id="linkedin_insight_tag"
                      value={analytics?.linkedin_insight_tag || ""}
                      onChange={(e) => updateAnalytics({ linkedin_insight_tag: e.target.value })}
                      placeholder="1234567"
                      aria-label="ID LinkedIn Insight Tag"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Objectifs et alertes */}
          <TabsContent value="goals" className="space-y-6 mt-6">
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Objectifs et alertes</CardTitle>
                    <CardDescription className="text-gray-400">
                      Définissez des objectifs de performance pour ce produit et recevez des alertes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="goal_views" className="text-sm font-medium text-white">
                      Objectif vues (mensuel)
                    </Label>
                    <Input
                      id="goal_views"
                      type="number"
                      value={analytics?.goal_views || ""}
                      onChange={(e) => updateAnalytics({ goal_views: parseInt(e.target.value) || null })}
                      placeholder="1000"
                      aria-label="Objectif de vues mensuelles"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_revenue" className="text-sm font-medium text-white">
                      Objectif revenus (mensuel)
                    </Label>
                    <Input
                      id="goal_revenue"
                      type="number"
                      value={analytics?.goal_revenue || ""}
                      onChange={(e) => updateAnalytics({ goal_revenue: parseFloat(e.target.value) || null })}
                      placeholder="5000"
                      aria-label="Objectif de revenus mensuels"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_conversions" className="text-sm font-medium text-white">
                      Objectif conversions (mensuel)
                    </Label>
                    <Input
                      id="goal_conversions"
                      type="number"
                      value={analytics?.goal_conversions || ""}
                      onChange={(e) => updateAnalytics({ goal_conversions: parseInt(e.target.value) || null })}
                      placeholder="50"
                      aria-label="Objectif de conversions mensuelles"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_conversion_rate" className="text-sm font-medium text-white">
                      Objectif taux de conversion (%)
                    </Label>
                    <Input
                      id="goal_conversion_rate"
                      type="number"
                      step="0.1"
                      value={analytics?.goal_conversion_rate || ""}
                      onChange={(e) => updateAnalytics({ goal_conversion_rate: parseFloat(e.target.value) || null })}
                      placeholder="5.0"
                      aria-label="Objectif de taux de conversion"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="email_alerts" className="text-sm font-medium text-white">
                      Alertes par email
                    </Label>
                    <p className="text-xs text-gray-400">
                      Recevez des notifications automatiques en cas de dépassement ou de non-atteinte des objectifs
                    </p>
                  </div>
                  <Switch
                    id="email_alerts"
                    checked={analytics?.email_alerts || false}
                    onCheckedChange={(checked) => updateAnalytics({ email_alerts: checked })}
                    aria-label="Activer les alertes par email"
                    className="touch-manipulation"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports et export */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <ReportsSection productId={formData.id} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};
