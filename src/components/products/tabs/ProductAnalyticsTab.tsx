import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
  Calendar
} from "lucide-react";

interface ProductAnalyticsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductAnalyticsTab = ({ formData, updateFormData }: ProductAnalyticsTabProps) => {
  const [analyticsData, setAnalyticsData] = useState({
    views: 0,
    clicks: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0
  });

  // Simulation de données d'analytics (en production, ces données viendraient de votre backend)
  useEffect(() => {
    // Simuler des données d'analytics
    const mockData = {
      views: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 200) + 20,
      conversions: Math.floor(Math.random() * 50) + 5,
      conversionRate: 0,
      revenue: Math.floor(Math.random() * 5000) + 500
    };
    
    mockData.conversionRate = mockData.clicks > 0 ? (mockData.conversions / mockData.clicks) * 100 : 0;
    setAnalyticsData(mockData);
  }, []);

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des performances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Vues</p>
                <p className="text-2xl font-bold text-blue-800">{analyticsData.views}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Clics</p>
                <p className="text-2xl font-bold text-green-800">{analyticsData.clicks}</p>
              </div>
              <MousePointer className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+8%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Conversions</p>
                <p className="text-2xl font-bold text-purple-800">{analyticsData.conversions}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+15%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Taux de conversion</p>
                <p className="text-2xl font-bold text-orange-800">{analyticsData.conversionRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+3%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration du tracking */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configuration du tracking
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Tracking des événements
              </CardTitle>
              <CardDescription>
                Surveillez les interactions des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tracking des vues</Label>
                  <p className="text-sm text-muted-foreground">Enregistrer chaque vue de produit</p>
                </div>
                <Switch
                  checked={formData.track_views || false}
                  onCheckedChange={(checked) => updateFormData("track_views", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tracking des clics</Label>
                  <p className="text-sm text-muted-foreground">Enregistrer les clics sur les boutons</p>
                </div>
                <Switch
                  checked={formData.track_clicks || false}
                  onCheckedChange={(checked) => updateFormData("track_clicks", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tracking des achats</Label>
                  <p className="text-sm text-muted-foreground">Enregistrer les conversions</p>
                </div>
                <Switch
                  checked={formData.track_purchases || false}
                  onCheckedChange={(checked) => updateFormData("track_purchases", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tracking du temps passé</Label>
                  <p className="text-sm text-muted-foreground">Mesurer l'engagement</p>
                </div>
                <Switch
                  checked={formData.track_time_spent || false}
                  onCheckedChange={(checked) => updateFormData("track_time_spent", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-green-600" />
                Analytics externes
              </CardTitle>
              <CardDescription>
                Intégration avec des outils tiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input
                  id="google_analytics_id"
                  value={formData.google_analytics_id || ""}
                  onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
                  placeholder="GA-XXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input
                  id="facebook_pixel_id"
                  value={formData.facebook_pixel_id || ""}
                  onChange={(e) => updateFormData("facebook_pixel_id", e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                <Input
                  id="google_tag_manager_id"
                  value={formData.google_tag_manager_id || ""}
                  onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tracking avancé</Label>
                  <p className="text-sm text-muted-foreground">Événements personnalisés</p>
                </div>
                <Switch
                  checked={formData.advanced_tracking || false}
                  onCheckedChange={(checked) => updateFormData("advanced_tracking", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Objectifs et alertes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Objectifs et alertes
        </h3>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Configuration des objectifs
            </CardTitle>
            <CardDescription>
              Définissez des objectifs de performance pour ce produit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="target_views">Objectif vues (mensuel)</Label>
                <Input
                  id="target_views"
                  type="number"
                  value={formData.target_views || ""}
                  onChange={(e) => updateFormData("target_views", parseInt(e.target.value) || null)}
                  placeholder="1000"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="target_conversions">Objectif conversions (mensuel)</Label>
                <Input
                  id="target_conversions"
                  type="number"
                  value={formData.target_conversions || ""}
                  onChange={(e) => updateFormData("target_conversions", parseInt(e.target.value) || null)}
                  placeholder="50"
                  className="touch-target"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="target_revenue">Objectif revenus (mensuel)</Label>
                <Input
                  id="target_revenue"
                  type="number"
                  value={formData.target_revenue || ""}
                  onChange={(e) => updateFormData("target_revenue", parseFloat(e.target.value) || null)}
                  placeholder="5000"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="target_conversion_rate">Objectif taux de conversion (%)</Label>
                <Input
                  id="target_conversion_rate"
                  type="number"
                  step="0.1"
                  value={formData.target_conversion_rate || ""}
                  onChange={(e) => updateFormData("target_conversion_rate", parseFloat(e.target.value) || null)}
                  placeholder="5.0"
                  className="touch-target"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes par email</Label>
                <p className="text-sm text-muted-foreground">Notifications automatiques</p>
              </div>
              <Switch
                checked={formData.email_alerts || false}
                onCheckedChange={(checked) => updateFormData("email_alerts", checked)}
              />
            </div>

            {formData.email_alerts && (
              <div className="space-y-2">
                <Label htmlFor="alert_email">Email pour les alertes</Label>
                <Input
                  id="alert_email"
                  type="email"
                  value={formData.alert_email || ""}
                  onChange={(e) => updateFormData("alert_email", e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Rapports et export */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rapports et export
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-2">Rapport quotidien</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Résumé des performances du jour
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-2">Rapport mensuel</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Analyse complète du mois
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-2">Export CSV</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Données brutes pour analyse
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Exporter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aperçu des données en temps réel */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Données en temps réel
          </CardTitle>
          <CardDescription>
            Activité actuelle sur ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analyticsData.views}</div>
              <div className="text-sm text-muted-foreground">Vues aujourd'hui</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analyticsData.clicks}</div>
              <div className="text-sm text-muted-foreground">Clics aujourd'hui</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analyticsData.conversions}</div>
              <div className="text-sm text-muted-foreground">Conversions aujourd'hui</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analyticsData.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Taux de conversion</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
