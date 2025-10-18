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
    <div className="space-y-6 modern-bg-secondary">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold modern-text-primary">Analytics & Tracking</h2>
          <p className="modern-text-muted">Surveillez les performances de votre produit</p>
        </div>
      </div>

      {/* Vue d'ensemble des performances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="modern-bg-card modern-border modern-shadow-md modern-stats-card views">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium modern-text-secondary">Vues</p>
                <p className="text-2xl font-bold modern-text-primary">{analyticsData.views}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-bg-card modern-border modern-shadow-md modern-stats-card clicks">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium modern-text-secondary">Clics</p>
                <p className="text-2xl font-bold modern-text-primary">{analyticsData.clicks}</p>
              </div>
              <MousePointer className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+8%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-bg-card modern-border modern-shadow-md modern-stats-card conversions">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium modern-text-secondary">Conversions</p>
                <p className="text-2xl font-bold modern-text-primary">{analyticsData.conversions}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+15%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-bg-card modern-border modern-shadow-md modern-stats-card rate">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium modern-text-secondary">Taux de conversion</p>
                <p className="text-2xl font-bold modern-text-primary">{analyticsData.conversionRate.toFixed(1)}%</p>
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
      <Card className="modern-bg-card modern-border modern-shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 modern-text-primary">
            <Settings className="h-5 w-5" />
            Configuration du tracking
          </CardTitle>
          <CardDescription className="modern-text-muted">
            Surveillez les interactions des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Tracking des événements</Label>
              <p className="text-sm modern-text-muted">Enregistrer les interactions utilisateur</p>
            </div>
            <Switch
              checked={formData.track_events || false}
              onCheckedChange={(checked) => updateFormData("track_events", checked)}
            />
          </div>

          <Separator className="modern-border-light" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Tracking des vues</Label>
              <p className="text-sm modern-text-muted">Enregistrer chaque vue de produit</p>
            </div>
            <Switch
              checked={formData.track_views || false}
              onCheckedChange={(checked) => updateFormData("track_views", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Tracking des clics</Label>
              <p className="text-sm modern-text-muted">Enregistrer les clics sur les boutons</p>
            </div>
            <Switch
              checked={formData.track_clicks || false}
              onCheckedChange={(checked) => updateFormData("track_clicks", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Tracking des achats</Label>
              <p className="text-sm modern-text-muted">Enregistrer les conversions</p>
            </div>
            <Switch
              checked={formData.track_purchases || false}
              onCheckedChange={(checked) => updateFormData("track_purchases", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Tracking du temps passé</Label>
              <p className="text-sm modern-text-muted">Mesurer l'engagement</p>
            </div>
            <Switch
              checked={formData.track_time_spent || false}
              onCheckedChange={(checked) => updateFormData("track_time_spent", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics externes */}
      <Card className="modern-bg-card modern-border modern-shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 modern-text-primary">
            <Activity className="h-5 w-5" />
            Analytics externes
          </CardTitle>
          <CardDescription className="modern-text-muted">
            Intégration avec des outils tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_analytics_id" className="modern-text-primary">Google Analytics ID</Label>
            <Input
              id="google_analytics_id"
              value={formData.google_analytics_id || ""}
              onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
              placeholder="GA-XXXXXXXXX"
              className="modern-input"
            />
          </div>

          <div>
            <Label htmlFor="facebook_pixel_id" className="modern-text-primary">Facebook Pixel ID</Label>
            <Input
              id="facebook_pixel_id"
              value={formData.facebook_pixel_id || ""}
              onChange={(e) => updateFormData("facebook_pixel_id", e.target.value)}
              placeholder="123456789012345"
              className="modern-input"
            />
          </div>

          <div>
            <Label htmlFor="google_tag_manager_id" className="modern-text-primary">Google Tag Manager ID</Label>
            <Input
              id="google_tag_manager_id"
              value={formData.google_tag_manager_id || ""}
              onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
              placeholder="GTM-XXXXXXX"
              className="modern-input"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Tracking avancé</Label>
              <p className="text-sm modern-text-muted">Événements personnalisés</p>
            </div>
            <Switch
              checked={formData.advanced_tracking || false}
              onCheckedChange={(checked) => updateFormData("advanced_tracking", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Objectifs et alertes */}
      <Card className="modern-bg-card modern-border modern-shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 modern-text-primary">
            <Target className="h-5 w-5" />
            Objectifs et alertes
          </CardTitle>
          <CardDescription className="modern-text-muted">
            Définissez des objectifs de performance pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly_views_goal" className="modern-text-primary">Objectif vues (mensuel)</Label>
              <Input
                id="monthly_views_goal"
                type="number"
                value={formData.monthly_views_goal || ""}
                onChange={(e) => updateFormData("monthly_views_goal", parseInt(e.target.value))}
                placeholder="1000"
                className="modern-input"
              />
            </div>

            <div>
              <Label htmlFor="monthly_revenue_goal" className="modern-text-primary">Objectif revenus (mensuel)</Label>
              <Input
                id="monthly_revenue_goal"
                type="number"
                value={formData.monthly_revenue_goal || ""}
                onChange={(e) => updateFormData("monthly_revenue_goal", parseInt(e.target.value))}
                placeholder="5000"
                className="modern-input"
              />
            </div>

            <div>
              <Label htmlFor="monthly_conversions_goal" className="modern-text-primary">Objectif conversions (mensuel)</Label>
              <Input
                id="monthly_conversions_goal"
                type="number"
                value={formData.monthly_conversions_goal || ""}
                onChange={(e) => updateFormData("monthly_conversions_goal", parseInt(e.target.value))}
                placeholder="50"
                className="modern-input"
              />
            </div>

            <div>
              <Label htmlFor="conversion_rate_goal" className="modern-text-primary">Objectif taux de conversion (%)</Label>
              <Input
                id="conversion_rate_goal"
                type="number"
                step="0.1"
                value={formData.conversion_rate_goal || ""}
                onChange={(e) => updateFormData("conversion_rate_goal", parseFloat(e.target.value))}
                placeholder="5.0"
                className="modern-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-text-primary">Alertes par email</Label>
              <p className="text-sm modern-text-muted">Notifications automatiques</p>
            </div>
            <Switch
              checked={formData.email_alerts || false}
              onCheckedChange={(checked) => updateFormData("email_alerts", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rapports et export */}
      <Card className="modern-bg-card modern-border modern-shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 modern-text-primary">
            <PieChart className="h-5 w-5" />
            Rapports et export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 modern-bg-muted modern-border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold modern-text-primary mb-1">Rapport quotidien</h3>
              <p className="text-sm modern-text-muted mb-3">Résumé des performances du jour</p>
              <Button className="w-full modern-button">Générer</Button>
            </div>

            <div className="text-center p-4 modern-bg-muted modern-border rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold modern-text-primary mb-1">Rapport mensuel</h3>
              <p className="text-sm modern-text-muted mb-3">Analyse complète du mois</p>
              <Button className="w-full modern-button">Générer</Button>
            </div>

            <div className="text-center p-4 modern-bg-muted modern-border rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold modern-text-primary mb-1">Export CSV</h3>
              <p className="text-sm modern-text-muted mb-3">Données brutes pour analyse</p>
              <Button className="w-full modern-button">Exporter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Données en temps réel */}
      <Card className="modern-bg-card modern-border modern-shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 modern-text-primary">
            <Zap className="h-5 w-5" />
            Données en temps réel
          </CardTitle>
          <CardDescription className="modern-text-muted">
            Activité actuelle sur ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 modern-bg-muted modern-border rounded-lg">
              <Eye className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold modern-text-primary">{analyticsData.views}</p>
              <p className="text-xs modern-text-muted">Vues aujourd'hui</p>
            </div>

            <div className="text-center p-3 modern-bg-muted modern-border rounded-lg">
              <MousePointer className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold modern-text-primary">{analyticsData.clicks}</p>
              <p className="text-xs modern-text-muted">Clics aujourd'hui</p>
            </div>

            <div className="text-center p-3 modern-bg-muted modern-border rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-lg font-bold modern-text-primary">{analyticsData.conversions}</p>
              <p className="text-xs modern-text-muted">Conversions aujourd'hui</p>
            </div>

            <div className="text-center p-3 modern-bg-muted modern-border rounded-lg">
              <BarChart3 className="h-6 w-6 mx-auto mb-1 text-orange-600" />
              <p className="text-lg font-bold modern-text-primary">{analyticsData.conversionRate.toFixed(1)}%</p>
              <p className="text-xs modern-text-muted">Taux de conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};