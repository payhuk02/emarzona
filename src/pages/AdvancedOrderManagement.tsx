import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  MessageSquare,
  Shield,
  Percent,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Package,
} from "lucide-react";
import { useStore, Store } from "@/hooks/use-store";
import { useAdvancedPayments } from "@/hooks/useAdvancedPayments";
import { useMessaging } from "@/hooks/useMessaging";
import AdvancedPaymentsComponent from "@/components/payments/AdvancedPaymentsComponent";
import ConversationComponent from "@/components/messaging/ConversationComponent";

// Composant séparé pour éviter les erreurs de hooks conditionnels
const AdvancedOrderContent: React.FC<{ store: Store }> = ({ store }) => {
  const [activeTab, setActiveTab] = useState("payments");
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  const {
    stats: paymentStats,
  } = useAdvancedPayments(store.id);

  // Ne pas appeler useMessaging ici pour éviter les problèmes de WebSocket
  // Les stats de conversation seront chargées directement dans l'onglet Messagerie si nécessaire
  const conversationStats = null;

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Gestion avancée des commandes</h1>
            <p className="text-sm text-muted-foreground">
              Paiements sécurisés et communication client-vendeur
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Sécurisé
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 bg-gradient-hero">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Vue d'ensemble */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paiements totaux</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paymentStats?.total_payments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentStats?.completed_payments || 0} complétés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(paymentStats?.total_revenue || 0).toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">
                  {(paymentStats?.held_revenue || 0).toLocaleString()} FCFA retenus
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  -
                </div>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez une commande
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(paymentStats?.success_rate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Paiements réussis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Types de paiements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Types de paiements disponibles
              </CardTitle>
              <CardDescription>
                Découvrez les options de paiement avancées pour sécuriser vos transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Paiement complet</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Le client paie la totalité de la commande immédiatement
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Standard
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Paiement par pourcentage</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Le client paie un pourcentage défini et complète le reste après validation
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Flexible
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold">Paiement sécurisé</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Le montant est retenu jusqu'à confirmation de livraison par le client
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Sécurisé
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets principaux */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paiements avancés
              </TabsTrigger>
              <TabsTrigger value="messaging" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messagerie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-4">
              <AdvancedPaymentsComponent
                storeId={store.id}
                orderId={selectedOrderId}
                className="min-h-[600px]"
              />
            </TabsContent>

            <TabsContent value="messaging" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Communication client-vendeur
                  </CardTitle>
                  <CardDescription>
                    Gérez les échanges avec vos clients pour chaque commande
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">
                      Sélectionner une commande pour voir les conversations
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={!selectedOrderId ? "default" : "outline"}
                        onClick={() => setSelectedOrderId(undefined)}
                        size="sm"
                      >
                        Toutes les commandes
                      </Button>
                      {/* TODO: Ajouter une liste déroulante des commandes */}
                    </div>
                  </div>
                  
                  {selectedOrderId && store?.id ? (
                    <ConversationComponent
                      orderId={selectedOrderId}
                      storeId={store.id}
                      className="min-h-[600px]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune commande sélectionnée</h3>
                      <p className="text-muted-foreground max-w-md">
                        Sélectionnez une commande pour voir les conversations associées et communiquer avec le client
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Fonctionnalités de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Fonctionnalités de sécurité
              </CardTitle>
              <CardDescription>
                Protégez vos transactions et gérez les litiges efficacement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Protection des paiements
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Rétention des fonds jusqu'à confirmation de livraison</li>
                    <li>• Système de litiges intégré</li>
                    <li>• Intervention administrative automatique</li>
                    <li>• Historique complet des transactions</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Communication sécurisée
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Messagerie en temps réel</li>
                    <li>• Partage de fichiers sécurisé</li>
                    <li>• Modération automatique</li>
                    <li>• Accès administrateur aux conversations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const AdvancedOrderManagement = () => {
  const { store, loading: storeLoading } = useStore();

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>Créez votre boutique d'abord</CardTitle>
                <CardDescription>
                  Vous devez créer une boutique avant de pouvoir gérer les commandes avancées
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => window.location.href = '/dashboard/store'}>
                  Créer ma boutique
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <AdvancedOrderContent store={store} />
      </div>
    </SidebarProvider>
  );
};

export default AdvancedOrderManagement;
