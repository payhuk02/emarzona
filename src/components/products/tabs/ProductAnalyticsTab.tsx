import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Target,
  Zap,
  Settings,
  Activity,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  LineChart,
  AreaChart,
  ScatterChart
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProductAnalyticsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductAnalyticsTab = ({ formData, updateFormData }: ProductAnalyticsTabProps) => {
  const { toast } = useToast();
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedChart, setSelectedChart] = useState("line");
  const [isLoading, setIsLoading] = useState(false);

  // Données d'analytics simulées avec des valeurs réalistes
  const [analyticsData, setAnalyticsData] = useState({
    views: 0,
    clicks: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    returningVisitors: 0
  });

  // Données historiques pour les graphiques
  const [historicalData, setHistoricalData] = useState([]);

  // Simulation de données d'analytics en temps réel
  useEffect(() => {
    const generateMockData = () => {
      const baseViews = Math.floor(Math.random() * 1000) + 200;
      const baseClicks = Math.floor(baseViews * 0.3) + Math.floor(Math.random() * 50);
      const baseConversions = Math.floor(baseClicks * 0.15) + Math.floor(Math.random() * 10);
      const baseRevenue = baseConversions * (Math.floor(Math.random() * 100) + 50);
      
      return {
        views: baseViews,
        clicks: baseClicks,
        conversions: baseConversions,
        conversionRate: baseClicks > 0 ? (baseConversions / baseClicks) * 100 : 0,
        revenue: baseRevenue,
        bounceRate: Math.random() * 40 + 20, // 20-60%
        avgSessionDuration: Math.random() * 300 + 60, // 1-6 minutes
        returningVisitors: Math.floor(baseViews * 0.25) + Math.floor(Math.random() * 20)
      };
    };

    const mockData = generateMockData();
    setAnalyticsData(mockData);

    // Générer des données historiques pour les graphiques
    const historical = [];
    const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      historical.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 200) + 50,
        clicks: Math.floor(Math.random() * 60) + 10,
        conversions: Math.floor(Math.random() * 15) + 2,
        revenue: Math.floor(Math.random() * 1000) + 100
      });
    }
    
    setHistoricalData(historical);
  }, [selectedPeriod]);

  // Simulation de données en temps réel
  useEffect(() => {
    if (!isRealTimeActive) return;

    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        views: prev.views + Math.floor(Math.random() * 3),
        clicks: prev.clicks + Math.floor(Math.random() * 2),
        conversions: prev.conversions + (Math.random() > 0.8 ? 1 : 0),
        revenue: prev.revenue + (Math.random() > 0.9 ? Math.floor(Math.random() * 50) : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTimeActive]);

  // Fonctions utilitaires
  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  const generateReport = useCallback(async (type: string) => {
    setIsLoading(true);
    
    // Simulation de génération de rapport
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Rapport généré",
      description: `Le rapport ${type} a été généré avec succès.`,
    });
    
    setIsLoading(false);
  }, [toast]);

  const exportData = useCallback(async (format: string) => {
    setIsLoading(true);
    
    // Simulation d'export
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Export terminé",
      description: `Les données ont été exportées au format ${format.toUpperCase()}.`,
    });
    
    setIsLoading(false);
  }, [toast]);

  const toggleRealTime = useCallback(() => {
    setIsRealTimeActive(!isRealTimeActive);
    toast({
      title: isRealTimeActive ? "Temps réel désactivé" : "Temps réel activé",
      description: isRealTimeActive 
        ? "Les données ne sont plus mises à jour en temps réel." 
        : "Les données sont maintenant mises à jour en temps réel.",
    });
  }, [isRealTimeActive, toast]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* En-tête avec contrôles */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
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
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Vues</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.views.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(12)}
                    <span className={cn("text-sm font-medium", getChangeColor(12))}>+12%</span>
                    <span className="text-xs text-gray-500">vs hier</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Clics</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.clicks.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(8)}
                    <span className={cn("text-sm font-medium", getChangeColor(8))}>+8%</span>
                    <span className="text-xs text-gray-500">vs hier</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/20">
                  <MousePointer className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Conversions</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.conversions.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(15)}
                    <span className={cn("text-sm font-medium", getChangeColor(15))}>+15%</span>
                    <span className="text-xs text-gray-500">vs hier</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Taux de conversion</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.conversionRate.toFixed(1)}%</p>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(3)}
                    <span className={cn("text-sm font-medium", getChangeColor(3))}>+3%</span>
                    <span className="text-xs text-gray-500">vs hier</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <BarChart3 className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Revenus</p>
                  <p className="text-lg font-semibold text-white">{analyticsData.revenue.toLocaleString()} XOF</p>
                </div>
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Taux de rebond</p>
                  <p className="text-lg font-semibold text-white">{analyticsData.bounceRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Durée moyenne</p>
                  <p className="text-lg font-semibold text-white">{Math.floor(analyticsData.avgSessionDuration / 60)}m {analyticsData.avgSessionDuration % 60}s</p>
                </div>
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Visiteurs récurrents</p>
                  <p className="text-lg font-semibold text-white">{analyticsData.returningVisitors}</p>
                </div>
                <Users className="h-5 w-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets pour les différentes sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-gray-700">Tracking</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-gray-700">Intégrations</TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-gray-700">Objectifs</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-700">Rapports</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique des performances */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <LineChart className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-white">Performances</CardTitle>
                        <CardDescription className="text-gray-400">
                          Évolution des métriques sur la période sélectionnée
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedChart} onValueChange={setSelectedChart}>
                        <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="line" className="text-white hover:bg-gray-700">
                            <LineChart className="h-4 w-4 mr-2" />
                            Ligne
                          </SelectItem>
                          <SelectItem value="area" className="text-white hover:bg-gray-700">
                            <AreaChart className="h-4 w-4 mr-2" />
                            Zone
                          </SelectItem>
                          <SelectItem value="bar" className="text-white hover:bg-gray-700">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Barre
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="7d" className="text-white hover:bg-gray-700">7j</SelectItem>
                          <SelectItem value="30d" className="text-white hover:bg-gray-700">30j</SelectItem>
                          <SelectItem value="90d" className="text-white hover:bg-gray-700">90j</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">Graphique des performances</p>
                      <p className="text-sm text-gray-500">Données simulées pour la démonstration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition des sources */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/20">
                      <PieChart className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">Sources de trafic</CardTitle>
                      <CardDescription className="text-gray-400">
                        Répartition des visiteurs par source
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-300">Recherche organique</span>
                      </div>
                      <span className="text-sm font-medium text-white">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-300">Réseaux sociaux</span>
                      </div>
                      <span className="text-sm font-medium text-white">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-300">Direct</span>
                      </div>
                      <span className="text-sm font-medium text-white">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm text-gray-300">Référencement</span>
                      </div>
                      <span className="text-sm font-medium text-white">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">Tracking des événements</Label>
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
                      checked={formData.analytics_enabled || false}
                      onCheckedChange={(checked) => updateFormData("analytics_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">Tracking des vues</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enregistrer chaque vue de produit</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">Enregistrer chaque vue de produit</p>
                    </div>
                    <Switch
                      checked={formData.track_views || false}
                      onCheckedChange={(checked) => updateFormData("track_views", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">Tracking des clics</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enregistrer les clics sur les boutons et liens</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">Enregistrer les clics sur les boutons et liens</p>
                    </div>
                    <Switch
                      checked={formData.track_clicks || false}
                      onCheckedChange={(checked) => updateFormData("track_clicks", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">Tracking des achats</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enregistrer les conversions et revenus</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">Enregistrer les conversions et revenus</p>
                    </div>
                    <Switch
                      checked={formData.track_purchases || false}
                      onCheckedChange={(checked) => updateFormData("track_purchases", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">Tracking du temps passé</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mesurer l'engagement des utilisateurs</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">Mesurer l'engagement des utilisateurs</p>
                    </div>
                    <Switch
                      checked={formData.track_time_spent || false}
                      onCheckedChange={(checked) => updateFormData("track_time_spent", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">Tracking des erreurs</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enregistrer les erreurs JavaScript</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">Enregistrer les erreurs JavaScript</p>
                    </div>
                    <Switch
                      checked={formData.track_errors || false}
                      onCheckedChange={(checked) => updateFormData("track_errors", checked)}
                    />
                  </div>
                </div>

                {/* Tracking avancé */}
                <Separator className="bg-gray-700" />
                
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-white">Tracking avancé</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Événements personnalisés et configurations spécifiques</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-400">Événements personnalisés et configurations spécifiques</p>
                  </div>
                  <Switch
                    checked={formData.advanced_tracking || false}
                    onCheckedChange={(checked) => updateFormData("advanced_tracking", checked)}
                  />
                </div>
                
                {formData.advanced_tracking && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Événements personnalisés</Label>
                      <Input
                        value={formData.custom_events?.join(",") || ""}
                        onChange={(e) => updateFormData("custom_events", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
                        placeholder="event1,event2,event3"
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
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
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
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
                      value={formData.google_analytics_id || ""}
                      onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
                      placeholder="UA-XXXXXXXXX-X ou G-XXXXXXXXXX"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
                      Facebook Pixel ID
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ID de votre pixel Facebook</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.facebook_pixel_id || ""}
                      onChange={(e) => updateFormData("facebook_pixel_id", e.target.value)}
                      placeholder="123456789012345"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
                      Google Tag Manager ID
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ID de votre conteneur GTM</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.google_tag_manager_id || ""}
                      onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
                      placeholder="GTM-XXXXXXX"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
                      TikTok Pixel ID
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ID de votre pixel TikTok</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.tiktok_pixel_id || ""}
                      onChange={(e) => updateFormData("tiktok_pixel_id", e.target.value)}
                      placeholder="CXXXXXXXXXXXXXXX"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
                      Pinterest Pixel ID
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ID de votre pixel Pinterest</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.pinterest_pixel_id || ""}
                      onChange={(e) => updateFormData("pinterest_pixel_id", e.target.value)}
                      placeholder="123456789012345"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
                      LinkedIn Insight Tag
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ID de votre tag LinkedIn</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={formData.linkedin_insight_tag || ""}
                      onChange={(e) => updateFormData("linkedin_insight_tag", e.target.value)}
                      placeholder="1234567"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
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
                    <Label className="text-sm font-medium text-white">Objectif vues (mensuel)</Label>
                    <Input
                      type="number"
                      value={formData.goal_views || ""}
                      onChange={(e) => updateFormData("goal_views", parseInt(e.target.value) || null)}
                      placeholder="1000"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Objectif revenus (mensuel)</Label>
                    <Input
                      type="number"
                      value={formData.goal_revenue || ""}
                      onChange={(e) => updateFormData("goal_revenue", parseFloat(e.target.value) || null)}
                      placeholder="5000"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Objectif conversions (mensuel)</Label>
                    <Input
                      type="number"
                      value={formData.goal_conversions || ""}
                      onChange={(e) => updateFormData("goal_conversions", parseInt(e.target.value) || null)}
                      placeholder="50"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Objectif taux de conversion (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.goal_conversion_rate || ""}
                      onChange={(e) => updateFormData("goal_conversion_rate", parseFloat(e.target.value) || null)}
                      placeholder="5.0"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-white">Alertes par email</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recevez des notifications automatiques</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-400">Recevez des notifications automatiques en cas de dépassement ou de non-atteinte des objectifs</p>
                  </div>
                  <Switch
                    checked={formData.email_alerts || false}
                    onCheckedChange={(checked) => updateFormData("email_alerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports et export */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">Rapport quotidien</CardTitle>
                      <CardDescription className="text-gray-400">
                        Résumé des performances du jour
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => generateReport("quotidien")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <BarChart3 className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">Rapport mensuel</CardTitle>
                      <CardDescription className="text-gray-400">
                        Analyse complète du mois
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => generateReport("mensuel")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Download className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">Export CSV</CardTitle>
                      <CardDescription className="text-gray-400">
                        Données brutes pour analyse approfondie
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => exportData("csv")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Options d'export avancées */}
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Settings className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Options d'export avancées</CardTitle>
                    <CardDescription className="text-gray-400">
                      Personnalisez vos exports selon vos besoins
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Période d'export</Label>
                    <Select defaultValue="30d">
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="7d" className="text-white hover:bg-gray-700">7 derniers jours</SelectItem>
                        <SelectItem value="30d" className="text-white hover:bg-gray-700">30 derniers jours</SelectItem>
                        <SelectItem value="90d" className="text-white hover:bg-gray-700">90 derniers jours</SelectItem>
                        <SelectItem value="custom" className="text-white hover:bg-gray-700">Période personnalisée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Format d'export</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="csv" className="text-white hover:bg-gray-700">CSV</SelectItem>
                        <SelectItem value="xlsx" className="text-white hover:bg-gray-700">Excel</SelectItem>
                        <SelectItem value="json" className="text-white hover:bg-gray-700">JSON</SelectItem>
                        <SelectItem value="pdf" className="text-white hover:bg-gray-700">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-white">Inclure les graphiques</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Inclure les graphiques dans l'export PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-400">Inclure les graphiques dans l'export PDF</p>
                  </div>
                  <Switch
                    checked={formData.include_charts || false}
                    onCheckedChange={(checked) => updateFormData("include_charts", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};