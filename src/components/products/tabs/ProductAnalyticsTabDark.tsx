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
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from "lucide-react";
import "@/styles/modern-product-creation-dark.css";

interface ProductAnalyticsTabDarkProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductAnalyticsTabDark = ({ formData, updateFormData }: ProductAnalyticsTabDarkProps) => {
  const [analyticsData, setAnalyticsData] = useState({
    views: 0,
    clicks: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0
  });

  // Simulation de données d'analytics
  useEffect(() => {
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

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    className = "",
    trend = "positive" 
  }: {
    title: string;
    value: string | number;
    change: string;
    icon: any;
    className?: string;
    trend?: "positive" | "negative";
  }) => (
    <div className={`modern-stats-card-dark ${className} modern-animate-in-dark modern-glass-card`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Icon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="modern-stat-label-dark">{title}</p>
              <p className="modern-stat-value-dark text-purple-600">{value}</p>
            </div>
          </div>
        </div>
        <div className={`modern-stat-change-dark ${trend}`}>
          {trend === "positive" ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span>{change}</span>
        </div>
      </CardContent>
    </div>
  );

  return (
    <div className="modern-product-container-dark p-6 space-y-8">
      {/* En-tête de la section */}
      <div className="text-center mb-8">
        <h1 className="modern-title-xl-dark mb-2">Analytics & Performance</h1>
        <p className="modern-subtitle-dark max-w-2xl mx-auto">
          Surveillez les performances de votre produit et optimisez votre stratégie marketing
        </p>
      </div>

      {/* Vue d'ensemble des performances */}
      <div className="modern-section-dark modern-glass-card">
        <div className="modern-section-header-dark">
          <BarChart3 className="h-6 w-6 text-purple-400" />
          <div>
            <h2 className="modern-section-title-dark">Indicateurs Clés de Performance</h2>
            <p className="modern-section-description-dark">
              Métriques essentielles pour suivre le succès de votre produit
            </p>
          </div>
        </div>
        
        <div className="modern-grid-dark modern-grid-cols-4-dark">
          <StatCard
            title="Vues"
            value={analyticsData.views.toLocaleString()}
            change="+12%"
            icon={Eye}
            className="views"
            trend="positive"
          />
          <StatCard
            title="Clics"
            value={analyticsData.clicks.toLocaleString()}
            change="+8%"
            icon={MousePointer}
            className="clicks"
            trend="positive"
          />
          <StatCard
            title="Conversions"
            value={analyticsData.conversions.toLocaleString()}
            change="+15%"
            icon={Target}
            className="conversions"
            trend="positive"
          />
          <StatCard
            title="Taux de conversion"
            value={`${analyticsData.conversionRate.toFixed(1)}%`}
            change="+3%"
            icon={BarChart3}
            className="rate"
            trend="positive"
          />
        </div>
      </div>

      {/* Configuration du tracking */}
      <div className="modern-grid-dark modern-grid-cols-2-dark gap-6">
        <div className="modern-section-dark modern-glass-card">
          <div className="modern-section-header-dark">
            <Activity className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="modern-section-title-dark">Tracking des Événements</h3>
              <p className="modern-section-description-dark">
                Surveillez les interactions des utilisateurs
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div>
                <Label className="modern-title-md-dark">Tracking des vues</Label>
                <p className="modern-description-dark">Enregistrer chaque vue de produit</p>
              </div>
              <Switch
                checked={formData.track_views || false}
                onCheckedChange={(checked) => updateFormData("track_views", checked)}
                className="modern-switch-dark"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div>
                <Label className="modern-title-md-dark">Tracking des clics</Label>
                <p className="modern-description-dark">Enregistrer les clics sur les boutons</p>
              </div>
              <Switch
                checked={formData.track_clicks || false}
                onCheckedChange={(checked) => updateFormData("track_clicks", checked)}
                className="modern-switch-dark"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div>
                <Label className="modern-title-md-dark">Tracking des achats</Label>
                <p className="modern-description-dark">Enregistrer les conversions</p>
              </div>
              <Switch
                checked={formData.track_purchases || false}
                onCheckedChange={(checked) => updateFormData("track_purchases", checked)}
                className="modern-switch-dark"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div>
                <Label className="modern-title-md-dark">Tracking du temps passé</Label>
                <p className="modern-description-dark">Mesurer l'engagement</p>
              </div>
              <Switch
                checked={formData.track_time_spent || false}
                onCheckedChange={(checked) => updateFormData("track_time_spent", checked)}
                className="modern-switch-dark"
              />
            </div>
          </div>
        </div>

        <div className="modern-section-dark modern-glass-card">
          <div className="modern-section-header-dark">
            <PieChart className="h-6 w-6 text-pink-400" />
            <div>
              <h3 className="modern-section-title-dark">Analytics Externes</h3>
              <p className="modern-section-description-dark">
                Intégration avec des outils tiers
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="google_analytics_id" className="modern-title-md-dark">Google Analytics ID</Label>
              <Input
                id="google_analytics_id"
                value={formData.google_analytics_id || ""}
                onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
                placeholder="GA-XXXXXXXXX"
                className="modern-input-dark"
              />
            </div>

            <div>
              <Label htmlFor="facebook_pixel_id" className="modern-title-md-dark">Facebook Pixel ID</Label>
              <Input
                id="facebook_pixel_id"
                value={formData.facebook_pixel_id || ""}
                onChange={(e) => updateFormData("facebook_pixel_id", e.target.value)}
                placeholder="123456789012345"
                className="modern-input-dark"
              />
            </div>

            <div>
              <Label htmlFor="google_tag_manager_id" className="modern-title-md-dark">Google Tag Manager ID</Label>
              <Input
                id="google_tag_manager_id"
                value={formData.google_tag_manager_id || ""}
                onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="modern-input-dark"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div>
                <Label className="modern-title-md-dark">Tracking avancé</Label>
                <p className="modern-description-dark">Événements personnalisés</p>
              </div>
              <Switch
                checked={formData.advanced_tracking || false}
                onCheckedChange={(checked) => updateFormData("advanced_tracking", checked)}
                className="modern-switch-dark"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Objectifs et alertes */}
      <div className="modern-section-dark modern-glass-card">
        <div className="modern-section-header-dark">
          <Target className="h-6 w-6 text-orange-400" />
          <div>
            <h2 className="modern-section-title-dark">Objectifs et Alertes</h2>
            <p className="modern-section-description-dark">
              Définissez des objectifs de performance pour ce produit
            </p>
          </div>
        </div>
        
        <div className="modern-grid-dark modern-grid-cols-2-dark gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="target_views" className="modern-title-md-dark">Objectif vues (mensuel)</Label>
              <Input
                id="target_views"
                type="number"
                value={formData.target_views || ""}
                onChange={(e) => updateFormData("target_views", parseInt(e.target.value) || null)}
                placeholder="1000"
                className="modern-input-dark"
              />
            </div>
            <div>
              <Label htmlFor="target_conversions" className="modern-title-md-dark">Objectif conversions (mensuel)</Label>
              <Input
                id="target_conversions"
                type="number"
                value={formData.target_conversions || ""}
                onChange={(e) => updateFormData("target_conversions", parseInt(e.target.value) || null)}
                placeholder="50"
                className="modern-input-dark"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="target_revenue" className="modern-title-md-dark">Objectif revenus (mensuel)</Label>
              <Input
                id="target_revenue"
                type="number"
                value={formData.target_revenue || ""}
                onChange={(e) => updateFormData("target_revenue", parseFloat(e.target.value) || null)}
                placeholder="5000"
                className="modern-input-dark"
              />
            </div>
            <div>
              <Label htmlFor="target_conversion_rate" className="modern-title-md-dark">Objectif taux de conversion (%)</Label>
              <Input
                id="target_conversion_rate"
                type="number"
                step="0.1"
                value={formData.target_conversion_rate || ""}
                onChange={(e) => updateFormData("target_conversion_rate", parseFloat(e.target.value) || null)}
                placeholder="5.0"
                className="modern-input-dark"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label className="modern-title-md-dark">Alertes par email</Label>
              <p className="modern-description-dark">Notifications automatiques</p>
            </div>
            <Switch
              checked={formData.email_alerts || false}
              onCheckedChange={(checked) => updateFormData("email_alerts", checked)}
              className="modern-switch-dark"
            />
          </div>
        </div>
      </div>

      {/* Rapports et export */}
      <div className="modern-section-dark modern-glass-card">
        <div className="modern-section-header-dark">
          <BarChart3 className="h-6 w-6 text-indigo-400" />
          <div>
            <h2 className="modern-section-title-dark">Rapports et Export</h2>
            <p className="modern-section-description-dark">
              Générez des rapports détaillés et exportez vos données
            </p>
          </div>
        </div>
        
        <div className="modern-grid-dark modern-grid-cols-3-dark gap-6">
          <div className="modern-card-dark p-6 text-center modern-neon-effect">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="modern-title-md-dark mb-2">Rapport Quotidien</h3>
            <p className="modern-description-dark mb-4">
              Résumé des performances du jour
            </p>
            <Button className="modern-button-dark w-full">
              <BarChart3 className="h-4 w-4" />
              Générer
            </Button>
          </div>

          <div className="modern-card-dark p-6 text-center modern-neon-effect">
            <div className="p-3 bg-cyan-100 rounded-full w-fit mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-cyan-600" />
            </div>
            <h3 className="modern-title-md-dark mb-2">Rapport Mensuel</h3>
            <p className="modern-description-dark mb-4">
              Analyse complète du mois
            </p>
            <Button className="modern-button-dark w-full">
              <Activity className="h-4 w-4" />
              Générer
            </Button>
          </div>

          <div className="modern-card-dark p-6 text-center modern-neon-effect">
            <div className="p-3 bg-pink-100 rounded-full w-fit mx-auto mb-4">
              <Zap className="h-8 w-8 text-pink-600" />
            </div>
            <h3 className="modern-title-md-dark mb-2">Export CSV</h3>
            <p className="modern-description-dark mb-4">
              Données brutes pour analyse
            </p>
            <Button className="modern-button-dark w-full">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Données en temps réel */}
      <div className="modern-section-dark modern-glass-card">
        <div className="modern-section-header-dark">
          <Activity className="h-6 w-6 text-cyan-400" />
          <div>
            <h2 className="modern-section-title-dark">Données en Temps Réel</h2>
            <p className="modern-section-description-dark">
              Activité actuelle sur ce produit
            </p>
          </div>
        </div>
        
        <div className="modern-grid-dark modern-grid-cols-4-dark gap-6">
          <div className="text-center p-4 bg-purple-100 rounded-lg">
            <div className="modern-stat-value-dark text-purple-600">{analyticsData.views}</div>
            <div className="modern-stat-label-dark">Vues aujourd'hui</div>
          </div>
          <div className="text-center p-4 bg-cyan-100 rounded-lg">
            <div className="modern-stat-value-dark text-cyan-600">{analyticsData.clicks}</div>
            <div className="modern-stat-label-dark">Clics aujourd'hui</div>
          </div>
          <div className="text-center p-4 bg-pink-100 rounded-lg">
            <div className="modern-stat-value-dark text-pink-600">{analyticsData.conversions}</div>
            <div className="modern-stat-label-dark">Conversions aujourd'hui</div>
          </div>
          <div className="text-center p-4 bg-orange-100 rounded-lg">
            <div className="modern-stat-value-dark text-orange-600">{analyticsData.conversionRate.toFixed(1)}%</div>
            <div className="modern-stat-label-dark">Taux de conversion</div>
          </div>
        </div>
      </div>
    </div>
  );
};
