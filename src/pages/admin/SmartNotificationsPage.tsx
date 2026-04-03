/**
 * Page d'administration des notifications intelligentes
 * Interface complète pour gérer les notifications automatisées
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationRulesManager } from '@/components/notifications/NotificationRulesManager';
import { Bell, Settings, BarChart3, Users, Zap, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { useStoreContext } from '@/contexts/StoreContext';

const SmartNotificationsPage = () => {
  const { store } = useStoreContext();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notifications Intelligentes</h1>
            <p className="text-muted-foreground">
              Automatisez vos communications pour engager vos clients au bon moment
            </p>
          </div>
        </div>

        {/* Fonctionnalités clés */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Règles Automatisées
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Personnalisation IA
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Multi-canaux
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Analytics Temps Réel
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Contrôle Total
          </Badge>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notifications Aujourd'hui</p>
                <p className="text-2xl font-bold">247</p>
                <p className="text-xs text-green-600">+12% vs hier</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'Ouverture</p>
                <p className="text-2xl font-bold">68%</p>
                <p className="text-xs text-green-600">+5% vs moyenne</p>
              </div>
              <Mail className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Clic</p>
                <p className="text-2xl font-bold">24%</p>
                <p className="text-xs text-green-600">+8% vs moyenne</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">89</p>
                <p className="text-xs text-green-600">+15% vs hier</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Règles & Configuration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Performance
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates & Contenu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <NotificationRulesManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance par canal */}
            <Card>
              <CardHeader>
                <CardTitle>Performance par Canal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Email</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">72%</div>
                    <div className="text-xs text-muted-foreground">Taux d'ouverture</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Push</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">45%</div>
                    <div className="text-xs text-muted-foreground">Taux de clic</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">In-App</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">89%</div>
                    <div className="text-xs text-muted-foreground">Taux de lecture</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">SMS</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">34%</div>
                    <div className="text-xs text-muted-foreground">Taux de réponse</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top règles de performance */}
            <Card>
              <CardHeader>
                <CardTitle>Règles les Plus Performantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Achat réussi - Points fidélité</span>
                    <Badge className="bg-green-500">95% ouverture</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    1,247 envois • 342 clics • €2,890 conversions
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Panier abandonné</span>
                    <Badge className="bg-blue-500">78% ouverture</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    892 envois • 234 récupérations • €4,567 revenus
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Recommandations IA</span>
                    <Badge className="bg-purple-500">67% ouverture</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    1,567 envois • 456 découvertes • €1,234 ventes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques de tendance */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Performances (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Graphiques de performance à implémenter
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Intégration avec Chart.js ou Recharts prévue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modèles de Notification</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gérez vos templates de notification pour maintenir une cohérence de marque
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Confirmation d'achat</h4>
                        <p className="text-sm text-muted-foreground">Merci pour votre commande !</p>
                      </div>
                    </div>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    <strong>Objet:</strong> 🎉 Commande confirmée - {{orderNumber}}<br/>
                    <strong>Contenu:</strong> Votre commande de {{totalAmount}}€ a été confirmée. Livraison prévue le {{deliveryDate}}.
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Rappel de panier</h4>
                        <p className="text-sm text-muted-foreground">Votre panier vous attend</p>
                      </div>
                    </div>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    <strong>Titre:</strong> 🛒 Votre panier vous attend<br/>
                    <strong>Message:</strong> Vous avez {{itemCount}} article(s) en attente. Finalisez votre commande !
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Recommandation IA</h4>
                        <p className="text-sm text-muted-foreground">Découverte personnalisée</p>
                      </div>
                    </div>
                    <Badge>Actif</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    <strong>Titre:</strong> 💡 Rien que pour vous<br/>
                    <strong>Message:</strong> Basé sur vos achats, {{productName}} pourrait vous plaire !
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Gérer les Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartNotificationsPage;