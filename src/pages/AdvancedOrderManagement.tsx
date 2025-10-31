/**
 * 🚀 Gestion Avancée des Commandes - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des paiements avancés et messagerie client-vendeur
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  Users,
  ArrowUpRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useStore, Store } from "@/hooks/use-store";
import { useAdvancedPayments } from "@/hooks/useAdvancedPayments";
import { useOrders } from "@/hooks/useOrders";
import AdvancedPaymentsComponent from "@/components/payments/AdvancedPaymentsComponent";
import ConversationComponent from "@/components/messaging/ConversationComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// Composant séparé pour éviter les erreurs de hooks conditionnels
const AdvancedOrderContent: React.FC<{ store: Store }> = ({ store }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("payments");
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const paymentTypesRef = useScrollAnimation<HTMLDivElement>();
  const securityRef = useScrollAnimation<HTMLDivElement>();

  const {
    stats: paymentStats,
    loading: paymentsLoading,
  } = useAdvancedPayments(store.id);

  // Récupérer les commandes pour le sélecteur
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders(store.id, { pageSize: 100 });

  // Calculer les statistiques avec useMemo
  const stats = useMemo(() => {
    if (!paymentStats) {
      return {
        totalPayments: 0,
        completedPayments: 0,
        totalRevenue: 0,
        heldRevenue: 0,
        successRate: 0,
        conversationsCount: selectedOrderId ? 1 : 0,
      };
    }

    return {
      totalPayments: paymentStats.total_payments || 0,
      completedPayments: paymentStats.completed_payments || 0,
      totalRevenue: paymentStats.total_revenue || 0,
      heldRevenue: paymentStats.held_revenue || 0,
      successRate: paymentStats.success_rate || 0,
      conversationsCount: selectedOrderId ? 1 : 0,
    };
  }, [paymentStats, selectedOrderId]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchOrders();
    logger.info('Rafraîchissement des commandes avancées');
    toast({
      title: t('common.refreshed', 'Actualisé'),
      description: t('common.refreshedDesc', 'Les données ont été actualisées'),
    });
  }, [refetchOrders, toast, t]);

  // Logging on mount
  useEffect(() => {
    logger.info('Page Commandes Avancées chargée', {
      storeId: store.id,
      totalOrders: orders?.length || 0,
      activeTab,
    });
  }, [store.id, orders?.length, activeTab]);

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - Responsive & Animated */}
      <header 
        ref={headerRef}
        className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md shadow-soft animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 px-3 sm:px-4 lg:px-6">
          <SidebarTrigger className="h-9 w-9 sm:h-10 sm:w-10" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate">
              {t('advancedOrders.title', 'Gestion avancée des commandes')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {t('advancedOrders.subtitle', 'Paiements sécurisés et communication client-vendeur')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
            >
              <Shield className="h-3 w-3" aria-hidden="true" />
              {t('advancedOrders.secure', 'Sécurisé')}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-9 w-9 sm:h-10 sm:w-10"
              aria-label={t('common.refresh', 'Rafraîchir')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Stats Cards - Responsive & Animated */}
          <div 
            ref={statsRef}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            role="region"
            aria-label={t('advancedOrders.stats.ariaLabel', 'Statistiques des commandes avancées')}
          >
            {[
              {
                label: t('advancedOrders.stats.totalPayments', 'Paiements totaux'),
                value: stats.totalPayments,
                subValue: `${stats.completedPayments} ${t('advancedOrders.stats.completed', 'complétés')}`,
                icon: CreditCard,
                color: "from-blue-600 to-cyan-600",
                bgColor: "from-blue-500/10 to-cyan-500/5",
              },
              {
                label: t('advancedOrders.stats.revenue', 'Revenus'),
                value: `${stats.totalRevenue.toLocaleString()} FCFA`,
                subValue: `${stats.heldRevenue.toLocaleString()} FCFA ${t('advancedOrders.stats.held', 'retenus')}`,
                icon: DollarSign,
                color: "from-green-600 to-emerald-600",
                bgColor: "from-green-500/10 to-emerald-500/5",
              },
              {
                label: t('advancedOrders.stats.conversations', 'Conversations'),
                value: selectedOrderId ? stats.conversationsCount : "-",
                subValue: selectedOrderId 
                  ? t('advancedOrders.stats.active', 'Active')
                  : t('advancedOrders.stats.selectOrder', 'Sélectionnez une commande'),
                icon: MessageSquare,
                color: "from-purple-600 to-pink-600",
                bgColor: "from-purple-500/10 to-pink-500/5",
              },
              {
                label: t('advancedOrders.stats.successRate', 'Taux de réussite'),
                value: `${stats.successRate.toFixed(1)}%`,
                subValue: t('advancedOrders.stats.successfulPayments', 'Paiements réussis'),
                icon: TrendingUp,
                color: "from-orange-600 to-amber-600",
                bgColor: "from-orange-500/10 to-amber-500/5",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 group overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardHeader className="relative pb-2 sm:pb-3 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.bgColor} border border-opacity-20`}>
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/70" aria-hidden="true" />
                      </div>
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-3 sm:p-4 pt-0">
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                      {stat.value}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                      {stat.subValue}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Payment Types - Responsive & Animated */}
          <Card 
            ref={paymentTypesRef}
            className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                {t('advancedOrders.paymentTypes.title', 'Types de paiements disponibles')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {t('advancedOrders.paymentTypes.description', 'Découvrez les options de paiement avancées pour sécuriser vos transactions')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    title: t('advancedOrders.paymentTypes.full.title', 'Paiement complet'),
                    description: t('advancedOrders.paymentTypes.full.description', 'Le client paie la totalité de la commande immédiatement'),
                    badge: t('advancedOrders.paymentTypes.full.badge', 'Standard'),
                    icon: CreditCard,
                    iconColor: "text-blue-600 dark:text-blue-400",
                    gradient: "from-blue-600 to-cyan-600",
                    bgGradient: "from-blue-500/10 to-cyan-500/5",
                    borderColor: "border-blue-500/20",
                  },
                  {
                    title: t('advancedOrders.paymentTypes.percentage.title', 'Paiement par pourcentage'),
                    description: t('advancedOrders.paymentTypes.percentage.description', 'Le client paie un pourcentage défini et complète le reste après validation'),
                    badge: t('advancedOrders.paymentTypes.percentage.badge', 'Flexible'),
                    icon: Percent,
                    iconColor: "text-green-600 dark:text-green-400",
                    gradient: "from-green-600 to-emerald-600",
                    bgGradient: "from-green-500/10 to-emerald-500/5",
                    borderColor: "border-green-500/20",
                  },
                  {
                    title: t('advancedOrders.paymentTypes.secured.title', 'Paiement sécurisé'),
                    description: t('advancedOrders.paymentTypes.secured.description', 'Le montant est retenu jusqu\'à confirmation de livraison par le client'),
                    badge: t('advancedOrders.paymentTypes.secured.badge', 'Sécurisé'),
                    icon: Shield,
                    iconColor: "text-orange-600 dark:text-orange-400",
                    gradient: "from-orange-600 to-amber-600",
                    bgGradient: "from-orange-500/10 to-amber-500/5",
                    borderColor: "border-orange-500/20",
                  },
                ].map((type, index) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.title}
                      className={`border ${type.borderColor} bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group overflow-hidden animate-in fade-in zoom-in-95`}
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <CardContent className="relative p-4 sm:p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2.5 sm:p-3 rounded-lg bg-gradient-to-br ${type.bgGradient} border ${type.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${type.iconColor}`} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1.5">{type.title}</h3>
                            <Badge 
                              variant="secondary" 
                              className="text-[10px] sm:text-xs bg-gradient-to-r ${type.bgGradient} border ${type.borderColor}"
                            >
                              {type.badge}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {type.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs - Responsive */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <TabsList className="grid w-full grid-cols-2 h-auto bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="payments" 
                className="flex items-center gap-2 h-10 sm:h-11 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
              >
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('advancedOrders.tabs.payments', 'Paiements avancés')}</span>
                <span className="sm:hidden">{t('advancedOrders.tabs.paymentsShort', 'Paiements')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messaging" 
                className="flex items-center gap-2 h-10 sm:h-11 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('advancedOrders.tabs.messaging', 'Messagerie')}</span>
                <span className="sm:hidden">{t('advancedOrders.tabs.messagingShort', 'Messages')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {paymentsLoading ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6 sm:p-12" role="status" aria-live="polite">
                    <div className="flex items-center justify-center gap-3 py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t('advancedOrders.loading', 'Chargement des paiements...')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AdvancedPaymentsComponent
                  storeId={store.id}
                  orderId={selectedOrderId}
                  className="min-h-[500px] sm:min-h-[600px]"
                />
              )}
            </TabsContent>

            <TabsContent value="messaging" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    {t('advancedOrders.messaging.title', 'Communication client-vendeur')}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {t('advancedOrders.messaging.description', 'Gérez les échanges avec vos clients pour chaque commande')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="mb-4 sm:mb-6 space-y-3">
                    <Label htmlFor="order-select" className="text-sm sm:text-base">
                      {t('advancedOrders.messaging.selectOrder', 'Sélectionner une commande pour voir les conversations')}
                    </Label>
                    <Select
                      value={selectedOrderId || "all"}
                      onValueChange={(value) => {
                        setSelectedOrderId(value === "all" ? undefined : value);
                        logger.info('Commande sélectionnée pour messagerie', { orderId: value === "all" ? undefined : value });
                      }}
                    >
                      <SelectTrigger id="order-select" className="w-full h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder={t('advancedOrders.messaging.selectPlaceholder', 'Sélectionnez une commande')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2 py-1">
                            <Package className="h-4 w-4" aria-hidden="true" />
                            {t('advancedOrders.messaging.allOrders', 'Toutes les commandes')}
                          </div>
                        </SelectItem>
                        {ordersLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              {t('common.loading', 'Chargement...')}
                            </div>
                          </SelectItem>
                        ) : orders.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            {t('advancedOrders.messaging.noOrders', 'Aucune commande disponible')}
                          </SelectItem>
                        ) : (
                          orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="font-medium text-xs sm:text-sm">#{order.order_number}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground truncate ml-2">
                                  {order.customers?.name || t('common.unknownCustomer', 'Client inconnu')} • {order.total_amount?.toFixed(0) || 0} FCFA
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedOrderId && store?.id ? (
                    <ConversationComponent
                      orderId={selectedOrderId}
                      storeId={store.id}
                      className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] text-center p-6 sm:p-12 animate-in fade-in zoom-in-95 duration-500">
                      <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 mb-4 animate-in zoom-in-95 duration-500">
                        <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">
                        {t('advancedOrders.messaging.noSelection.title', 'Aucune commande sélectionnée')}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                        {t('advancedOrders.messaging.noSelection.description', 'Sélectionnez une commande pour voir les conversations associées et communiquer avec le client')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Security Features - Responsive & Animated */}
          <Card 
            ref={securityRef}
            className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                {t('advancedOrders.security.title', 'Fonctionnalités de sécurité')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {t('advancedOrders.security.description', 'Protégez vos transactions et gérez les litiges efficacement')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {[
                  {
                    title: t('advancedOrders.security.paymentProtection.title', 'Protection des paiements'),
                    icon: CheckCircle,
                    iconColor: "text-green-600 dark:text-green-400",
                    bgGradient: "from-green-500/10 to-emerald-500/5",
                    borderColor: "border-green-500/20",
                    features: [
                      t('advancedOrders.security.paymentProtection.feature1', 'Rétention des fonds jusqu\'à confirmation de livraison'),
                      t('advancedOrders.security.paymentProtection.feature2', 'Système de litiges intégré'),
                      t('advancedOrders.security.paymentProtection.feature3', 'Intervention administrative automatique'),
                      t('advancedOrders.security.paymentProtection.feature4', 'Historique complet des transactions'),
                    ],
                  },
                  {
                    title: t('advancedOrders.security.secureCommunication.title', 'Communication sécurisée'),
                    icon: MessageSquare,
                    iconColor: "text-blue-600 dark:text-blue-400",
                    bgGradient: "from-blue-500/10 to-cyan-500/5",
                    borderColor: "border-blue-500/20",
                    features: [
                      t('advancedOrders.security.secureCommunication.feature1', 'Messagerie en temps réel'),
                      t('advancedOrders.security.secureCommunication.feature2', 'Partage de fichiers sécurisé'),
                      t('advancedOrders.security.secureCommunication.feature3', 'Modération automatique'),
                      t('advancedOrders.security.secureCommunication.feature4', 'Accès administrateur aux conversations'),
                    ],
                  },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="space-y-3 sm:space-y-4 p-4 sm:p-5 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${feature.bgGradient} border ${feature.borderColor}`}>
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${feature.iconColor}`} aria-hidden="true" />
                        </div>
                        {feature.title}
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                        {feature.features.map((feat, featIndex) => (
                          <li key={featIndex} className="flex items-start gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${feature.bgGradient} mt-1.5 shrink-0`} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const AdvancedOrderManagement = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();

  // Loading state
  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                {t('common.loading', 'Chargement...')}
              </p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store state
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <Card className="max-w-md w-full border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
              <CardHeader className="text-center p-6 sm:p-8">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 flex items-center justify-center animate-in zoom-in-95 duration-500">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2">
                  {t('advancedOrders.noStore.title', 'Créez votre boutique d\'abord')}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {t('advancedOrders.noStore.description', 'Vous devez créer une boutique avant de pouvoir gérer les commandes avancées')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-6 sm:p-8 pt-0">
                <Button 
                  onClick={() => window.location.href = '/dashboard/store'}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {t('advancedOrders.noStore.createStore', 'Créer ma boutique')}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <AdvancedOrderContent store={store} />
      </div>
    </SidebarProvider>
  );
};

export default AdvancedOrderManagement;
