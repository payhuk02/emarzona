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
    <div className="saas-space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold saas-text-primary">Analytics & Tracking</h2>
          <p className="saas-text-secondary">Surveillez les performances de votre produit</p>
        </div>
      </div>

      {/* Vue d'ensemble des performances */}
      <div className="saas-grid saas-grid-cols-4">
        <div className="saas-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="saas-stats-label">Vues</p>
              <p className="saas-stats-value">{analyticsData.views}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="saas-stats-change">+12%</span>
          </div>
        </div>

        <div className="saas-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="saas-stats-label">Clics</p>
              <p className="saas-stats-value">{analyticsData.clicks}</p>
            </div>
            <MousePointer className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="saas-stats-change">+8%</span>
          </div>
        </div>

        <div className="saas-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="saas-stats-label">Conversions</p>
              <p className="saas-stats-value">{analyticsData.conversions}</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="saas-stats-change">+15%</span>
          </div>
        </div>

        <div className="saas-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="saas-stats-label">Taux de conversion</p>
              <p className="saas-stats-value">{analyticsData.conversionRate.toFixed(1)}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="saas-stats-change">+3%</span>
          </div>
        </div>
      </div>

      {/* Configuration du tracking */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Configuration du tracking</h3>
        </div>
        <p className="saas-section-description">
          Surveillez les interactions des utilisateurs avec votre produit.
        </p>
        
        <div className="saas-grid saas-grid-cols-2">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col">
              <label className="saas-label">Tracking des événements</label>
              <span className="saas-label-description">Enregistrer les événements personnalisés</span>
            </div>
            <Switch
              checked={formData.analytics_enabled}
              onCheckedChange={(checked) => updateFormData("analytics_enabled", checked)}
              className="saas-switch"
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col">
              <label className="saas-label">Tracking des vues</label>
              <span className="saas-label-description">Enregistrer chaque vue de produit</span>
            </div>
            <Switch
              checked={formData.track_views}
              onCheckedChange={(checked) => updateFormData("track_views", checked)}
              className="saas-switch"
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col">
              <label className="saas-label">Tracking des clics</label>
              <span className="saas-label-description">Enregistrer les clics sur les boutons et liens</span>
            </div>
            <Switch
              checked={formData.track_clicks}
              onCheckedChange={(checked) => updateFormData("track_clicks", checked)}
              className="saas-switch"
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col">
              <label className="saas-label">Tracking des achats</label>
              <span className="saas-label-description">Enregistrer les conversions et revenus</span>
            </div>
            <Switch
              checked={formData.track_purchases}
              onCheckedChange={(checked) => updateFormData("track_purchases", checked)}
              className="saas-switch"
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col">
              <label className="saas-label">Tracking du temps passé</label>
              <span className="saas-label-description">Mesurer l'engagement des utilisateurs</span>
            </div>
            <Switch
              checked={formData.track_time_spent}
              onCheckedChange={(checked) => updateFormData("track_time_spent", checked)}
              className="saas-switch"
            />
          </div>
        </div>
      </div>

      {/* Analytics externes */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Analytics externes</h3>
        </div>
        <p className="saas-section-description">
          Intégrez votre produit avec des outils d'analyse tiers.
        </p>
        
        <div className="saas-grid saas-grid-cols-2">
          <div>
            <label className="saas-label">Google Analytics ID</label>
            <Input
              value={formData.google_analytics_id}
              onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
              placeholder="UA-XXXXXXXXX-X ou G-XXXXXXXXXX"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">Facebook Pixel ID</label>
            <Input
              value={formData.facebook_pixel_id}
              onChange={(e) => updateFormData("facebook_pixel_id", e.target.value)}
              placeholder="123456789012345"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">Google Tag Manager ID</label>
            <Input
              value={formData.google_tag_manager_id}
              onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
              placeholder="GTM-XXXXXXX"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">TikTok Pixel ID</label>
            <Input
              value={formData.tiktok_pixel_id}
              onChange={(e) => updateFormData("tiktok_pixel_id", e.target.value)}
              placeholder="CXXXXXXXXXXXXXXX"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">Pinterest Pixel ID</label>
            <Input
              value={formData.pinterest_pixel_id}
              onChange={(e) => updateFormData("pinterest_pixel_id", e.target.value)}
              placeholder="123456789012345"
              className="saas-input"
            />
          </div>
        </div>
        
        <div className="saas-separator" />
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col">
            <label className="saas-label">Tracking avancé</label>
            <span className="saas-label-description">Événements personnalisés et configurations spécifiques</span>
          </div>
          <Switch
            checked={formData.advanced_tracking}
            onCheckedChange={(checked) => updateFormData("advanced_tracking", checked)}
            className="saas-switch"
          />
        </div>
        
        {formData.advanced_tracking && (
          <div>
            <label className="saas-label">Événements personnalisés</label>
            <Input
              value={formData.custom_events.join(",")}
              onChange={(e) => updateFormData("custom_events", e.target.value.split(",").map(s => s.trim()))}
              placeholder="event1,event2,event3"
              className="saas-input"
            />
            <p className="saas-label-description">Séparez les événements personnalisés par des virgules.</p>
          </div>
        )}
      </div>

      {/* Objectifs et alertes */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Objectifs et alertes</h3>
        </div>
        <p className="saas-section-description">
          Définissez des objectifs de performance pour ce produit et recevez des alertes.
        </p>
        
        <div className="saas-grid saas-grid-cols-4">
          <div>
            <label className="saas-label">Objectif vues (mensuel)</label>
            <Input
              type="number"
              value={formData.goal_views || ""}
              onChange={(e) => updateFormData("goal_views", parseInt(e.target.value) || null)}
              placeholder="1000"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">Objectif revenus (mensuel)</label>
            <Input
              type="number"
              value={formData.goal_revenue || ""}
              onChange={(e) => updateFormData("goal_revenue", parseFloat(e.target.value) || null)}
              placeholder="5000"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">Objectif conversions (mensuel)</label>
            <Input
              type="number"
              value={formData.goal_conversions || ""}
              onChange={(e) => updateFormData("goal_conversions", parseInt(e.target.value) || null)}
              placeholder="50"
              className="saas-input"
            />
          </div>
          <div>
            <label className="saas-label">Objectif taux de conversion (%)</label>
            <Input
              type="number"
              step="0.1"
              value={formData.goal_conversion_rate || ""}
              onChange={(e) => updateFormData("goal_conversion_rate", parseFloat(e.target.value) || null)}
              placeholder="5.0"
              className="saas-input"
            />
          </div>
        </div>
        
        <div className="saas-separator" />
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col">
            <label className="saas-label">Alertes par email</label>
            <span className="saas-label-description">Recevez des notifications automatiques en cas de dépassement ou de non-atteinte des objectifs.</span>
          </div>
          <Switch
            checked={formData.email_alerts}
            onCheckedChange={(checked) => updateFormData("email_alerts", checked)}
            className="saas-switch"
          />
        </div>
      </div>

      {/* Rapports et export */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Rapports et export</h3>
        </div>
        <p className="saas-section-description">
          Générez des rapports détaillés et exportez vos données d'analytics.
        </p>
        
        <div className="saas-grid saas-grid-cols-3">
          <div className="saas-section-card">
            <h4 className="saas-section-title mb-2">Rapport quotidien</h4>
            <p className="saas-label-description mb-4">Résumé des performances du jour.</p>
            <Button variant="outline" className="saas-button-outline w-full">Générer</Button>
          </div>
          <div className="saas-section-card">
            <h4 className="saas-section-title mb-2">Rapport mensuel</h4>
            <p className="saas-label-description mb-4">Analyse complète du mois.</p>
            <Button variant="outline" className="saas-button-outline w-full">Générer</Button>
          </div>
          <div className="saas-section-card">
            <h4 className="saas-section-title mb-2">Export CSV</h4>
            <p className="saas-label-description mb-4">Données brutes pour analyse approfondie.</p>
            <Button variant="outline" className="saas-button-outline w-full">Exporter</Button>
          </div>
        </div>
      </div>

      {/* Données en temps réel */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Données en temps réel</h3>
        </div>
        <p className="saas-section-description">
          Activité actuelle sur ce produit.
        </p>
        
        <div className="saas-grid saas-grid-cols-4 text-center">
          <div className="space-y-1">
            <p className="saas-stats-value">{analyticsData.views}</p>
            <p className="saas-label-description">Vues aujourd'hui</p>
          </div>
          <div className="space-y-1">
            <p className="saas-stats-value">{analyticsData.clicks}</p>
            <p className="saas-label-description">Clics aujourd'hui</p>
          </div>
          <div className="space-y-1">
            <p className="saas-stats-value">{analyticsData.conversions}</p>
            <p className="saas-label-description">Conversions aujourd'hui</p>
          </div>
          <div className="space-y-1">
            <p className="saas-stats-value">{analyticsData.conversionRate.toFixed(1)}%</p>
            <p className="saas-label-description">Taux de conversion</p>
          </div>
        </div>
      </div>
    </div>
  );
};