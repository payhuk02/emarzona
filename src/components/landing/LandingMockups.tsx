import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Globe,
  Lock,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  CreditCard,
  MapPin,
  Sparkles,
  Zap,
  Activity,
  Shield,
  Mail,
  Truck,
  FileText,
  Calendar,
  Clock,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  MessageSquare,
  TrendingDown,
  Eye,
  Info,
  Bell,
  Search,
  Menu,
  Store,
  Target,
  Settings,
  Globe as GlobeIcon,
  Download,
  Key,
  User,
} from 'lucide-react';

/**
 * Mockup du Dashboard de Boutique avec TopNavigationBar et Sidebar - Design Inspiré d'Emarzona
 * Layout complet avec TopNavigationBar horizontale, sidebar verticale et contenu principal
 */
export const StoreDashboardMockup = () => {
  // Métriques réelles inspirées du dashboard Emarzona (4 cartes principales)
  const stats = [
    { 
      icon: Package, 
      value: '127', 
      label: 'Produits', 
      subtitle: '127 actifs',
      trend: '+12%', 
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    { 
      icon: ShoppingCart, 
      value: '0', 
      label: 'Commandes', 
      subtitle: '0 en attente',
      trend: '-4%', 
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    { 
      icon: Users, 
      value: '0', 
      label: 'Clients', 
      subtitle: 'Clients enregistrés',
      trend: '+3%', 
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    { 
      icon: DollarSign, 
      value: '0', 
      label: 'Revenus', 
      subtitle: 'Total des ventes',
      trend: '+4%', 
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      currency: 'FCFA'
    },
  ];

  // Actions rapides inspirées du dashboard
  const quickActions = [
    {
      title: 'Nouveau Produit',
      description: 'Ajouter un produit à votre boutique',
      icon: Package,
      color: 'from-green-600 to-emerald-600',
    },
    {
      title: 'Nouvelle Commande',
      description: 'Créer une commande manuelle',
      icon: ShoppingCart,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'Analytics',
      description: 'Voir les statistiques détaillées',
      icon: BarChart3,
      color: 'from-purple-600 to-pink-600',
    },
  ];

  // Navigation principale (TopNavigationBar)
  const mainNavItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, active: true },
    { label: 'Produits', icon: Package, active: false },
    { label: 'Commandes', icon: ShoppingCart, active: false },
    { label: 'Clients', icon: Users, active: false },
    { label: 'Marketing', icon: Target, active: false },
    { label: 'Emails', icon: Mail, active: false },
    { label: 'Analytics', icon: BarChart3, active: false },
    { label: 'Paramètres', icon: Settings, active: false },
  ];

  // Données pour le graphique de ventes
  const salesData = [
    { month: 'Jan', value: 45 },
    { month: 'Fév', value: 65 },
    { month: 'Mar', value: 35 },
    { month: 'Avr', value: 80 },
    { month: 'Mai', value: 55 },
    { month: 'Jun', value: 70 },
    { month: 'Jul', value: 90 },
  ];

  // Données pour le donut chart (top produits)
  const topProducts = [
    { name: 'Produit A', value: 35, color: 'bg-emerald-400' },
    { name: 'Produit B', value: 28, color: 'bg-purple-400' },
    { name: 'Produit C', value: 20, color: 'bg-blue-400' },
    { name: 'Autres', value: 17, color: 'bg-gray-400' },
  ];

  return (
    <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-xl flex flex-col h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px]">
      {/* TopNavigationBar - Barre de navigation horizontale Premium */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-3 md:px-4 py-2 flex items-center justify-between shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">EZ</span>
          </div>
          <span className="text-sm md:text-base font-bold text-gray-800 hidden sm:inline">Emarzona</span>
        </div>

        {/* Navigation principale */}
        <div className="flex-1 flex items-center justify-center gap-1 md:gap-2 overflow-x-auto px-2 md:px-4">
          {mainNavItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  item.active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4 text-gray-600" />
          </button>
          <div className="px-2 py-1 bg-gray-100 rounded-md text-[10px] md:text-xs font-medium text-gray-700">
            Spacieux
          </div>
          <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <GlobeIcon className="h-4 w-4 text-gray-600" />
            <span className="text-[10px] ml-1 text-gray-700">FR</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Style Emarzona avec dégradé bleu Premium */}
        <div className="w-56 sm:w-64 md:w-72 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-r border-blue-500/40 flex flex-col shrink-0 shadow-xl">
          {/* Logo et sections */}
          <div className="p-3 md:p-4 border-b border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <span className="text-white text-sm font-bold">EZ</span>
              </div>
              <span className="text-sm font-bold text-white">Emarzona</span>
            </div>
            <div className="space-y-1.5">
              <div className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-md flex items-center justify-between border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-white" />
                  <span className="text-xs font-medium text-white">Tableau de bord</span>
                </div>
                <span className="text-[10px] text-white/70">▼</span>
              </div>
              <div className="px-3 py-2 bg-white/15 backdrop-blur-sm rounded-md flex items-center gap-2 border border-white/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-300" />
                <span className="text-xs font-medium text-white">Boutique 1</span>
              </div>
            </div>
          </div>

          {/* Navigation sidebar avec plusieurs éléments */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {/* Section Principal */}
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wide">Principal</div>
              <div className="space-y-0.5">
                {[
                  { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
                  { icon: Store, label: 'Boutique', active: false },
                  { icon: ShoppingCart, label: 'Marketplace', active: false },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded-md flex items-center gap-2 cursor-pointer transition-all ${
                        item.active
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Produits & Cours */}
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wide">Produits & Cours</div>
              <div className="space-y-0.5">
                {[
                  { icon: Package, label: 'Produits', active: false },
                  { icon: FileText, label: 'Mes Cours', active: false },
                  { icon: Download, label: 'Produits Digitaux', active: false },
                  { icon: Key, label: 'Mes Licences', active: false },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="px-3 py-2 rounded-md flex items-center gap-2 text-blue-100 hover:bg-white/10 hover:text-white cursor-pointer transition-all"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Ventes */}
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wide">Ventes</div>
              <div className="space-y-0.5">
                {[
                  { icon: ShoppingCart, label: 'Commandes', active: false },
                  { icon: Users, label: 'Clients', active: false },
                  { icon: DollarSign, label: 'Transactions', active: false },
                  { icon: Truck, label: 'Expéditions', active: false },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="px-3 py-2 rounded-md flex items-center gap-2 text-blue-100 hover:bg-white/10 hover:text-white cursor-pointer transition-all"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Marketing */}
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wide">Marketing</div>
              <div className="space-y-0.5">
                {[
                  { icon: Mail, label: 'Emails', active: false },
                  { icon: Target, label: 'Campagnes', active: false },
                  { icon: BarChart3, label: 'Analytics', active: false },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="px-3 py-2 rounded-md flex items-center gap-2 text-blue-100 hover:bg-white/10 hover:text-white cursor-pointer transition-all"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Mon Compte */}
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wide">Mon Compte</div>
              <div className="space-y-0.5">
                {[
                  { icon: User, label: 'Portail Client', active: false },
                  { icon: Receipt, label: 'Mes Factures', active: false },
                  { icon: Settings, label: 'Paramètres', active: false },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="px-3 py-2 rounded-md flex items-center gap-2 text-blue-100 hover:bg-white/10 hover:text-white cursor-pointer transition-all"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu Principal Premium */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
          {/* Header avec titre gradient Premium */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-4 md:px-6 py-3 md:py-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Tableau de bord
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] md:text-xs px-2 py-1">
                  <Activity className="h-3 w-3 mr-1" />
                  En ligne
                </Badge>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-600">Vue d'ensemble de votre boutique</p>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* KPI Cards - 4 cartes principales Premium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-5 md:mb-6">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="group relative overflow-hidden border border-gray-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-sm"
                >
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/30 group-hover:via-white/20 group-hover:to-white/0 transition-all duration-500"></div>
                  
                  <CardContent className="relative p-3 sm:p-4 md:p-5">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`relative p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                      </div>
                      <Badge className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100/80 backdrop-blur-sm text-gray-700 font-bold border border-gray-200/50 shadow-sm">
                        {stat.trend}
                      </Badge>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className={`text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${stat.textColor} bg-clip-text text-transparent`}>
                        {stat.value} {stat.currency && <span className="text-sm sm:text-base text-gray-600">{stat.currency}</span>}
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-800">{stat.label}</div>
                      {stat.subtitle && (
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-semibold">{stat.subtitle}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions rapides Premium - Responsive */}
            <div className="mb-4 sm:mb-5">
              <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 mb-3 sm:mb-4">Actions rapides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={index}
                      className="group relative overflow-hidden border border-gray-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-sm cursor-pointer"
                    >
                      {/* Effet de brillance au hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/40 group-hover:via-white/25 group-hover:to-white/0 transition-all duration-300"></div>
                      
                      <CardContent className="relative p-4 sm:p-5 md:p-6">
                        <div className={`relative p-3 sm:p-4 rounded-xl bg-gradient-to-br ${action.color} shadow-xl shadow-black/20 mb-3 sm:mb-4 w-fit group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 mb-1.5 sm:mb-2">{action.title}</h3>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed font-medium">{action.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mockup Multi-devises - Design Professionnel Inspiré des Dashboards Financiers
 */
export const MultiCurrencyMockup = () => {
  const currencies = [
    { 
      code: 'FCFA', 
      amount: '125,000', 
      flag: '🇨🇮', 
      growth: '+15%', 
      color: 'bg-orange-500',
      bgColor: 'from-orange-50 to-amber-50',
      progress: 75
    },
    { 
      code: 'EUR', 
      amount: '190', 
      flag: '🇪🇺', 
      growth: '+8%', 
      color: 'bg-blue-500',
      bgColor: 'from-blue-50 to-cyan-50',
      progress: 60
    },
    { 
      code: 'USD', 
      amount: '210', 
      flag: '🇺🇸', 
      growth: '+12%', 
      color: 'bg-emerald-500',
      bgColor: 'from-emerald-50 to-teal-50',
      progress: 85
    },
  ];

  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-200/70 bg-gradient-to-br from-white via-slate-50/40 to-white backdrop-blur-xl">
      {/* Effet de brillance animé Premium */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent animate-shimmer rotate-12" 
             style={{ width: '200%', height: '200%' }}></div>
      </div>
      
      <div className="relative p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-xl shadow-blue-500/30">
              <Globe className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Paiements multi-devises
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Conversion automatique en temps réel</p>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {currencies.map((currency, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border border-gray-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${currency.bgColor} backdrop-blur-sm`}
          >
            {/* Effet de brillance au hover Premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/30 group-hover:via-white/15 group-hover:to-white/0 transition-all duration-300"></div>
            
            <CardContent className="relative p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="text-2xl md:text-3xl filter drop-shadow-lg">{currency.flag}</div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm md:text-base font-bold text-gray-900 mb-0.5">{currency.code}</div>
                    <div className="text-xs md:text-sm font-semibold text-gray-700">{currency.amount}</div>
                  </div>
                </div>
                <Badge className={`${currency.color} text-white border-0 shadow-lg shadow-black/10 text-[10px] md:text-xs px-3 py-1 font-semibold group-hover:scale-110 transition-transform`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {currency.growth}
                </Badge>
              </div>
              {/* Progress bar premium */}
              <div className="relative">
                <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className={`h-full ${currency.color} rounded-full transition-all duration-1000 shadow-md relative overflow-hidden`}
                    style={{ width: `${currency.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 font-medium">{currency.progress}% du volume total</div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Footer Premium */}
        <div className="pt-3 border-t border-gray-200/60 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-emerald-50/80 rounded-xl p-3 backdrop-blur-sm border border-emerald-100/50">
          <div className="flex items-center gap-2.5 text-xs flex-wrap">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Conversion automatique</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700 font-medium">Taux en temps réel</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700 font-medium">Sans frais cachés</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mockup Sécurité/Intégrations - Design Professionnel
 */
export const SecurityMockup = () => {
  const integrations = [
    { 
      name: 'Stripe', 
      status: 'connected', 
      icon: '💳', 
      color: 'bg-indigo-500',
      bgColor: 'from-indigo-50 to-purple-50'
    },
    { 
      name: 'PayDunya', 
      status: 'connected', 
      icon: '🔐', 
      color: 'bg-blue-500',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    { 
      name: 'Moneroo', 
      status: 'connected', 
      icon: '💰', 
      color: 'bg-emerald-500',
      bgColor: 'from-emerald-50 to-teal-50'
    },
    { 
      name: 'Mailchimp', 
      status: 'pending', 
      icon: '📧', 
      color: 'bg-gray-400',
      bgColor: 'from-gray-50 to-gray-100'
    },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 bg-gradient-to-br from-white via-slate-50/50 to-white backdrop-blur-xl">
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-slate-500/5 to-transparent animate-shimmer rotate-12" 
             style={{ width: '200%', height: '200%' }}></div>
      </div>
      
      <div className="relative p-4 md:p-5 space-y-3">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-xl shadow-slate-500/30">
              <Lock className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Intégrations sécurisées
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Connexions cryptées et certifiées</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30 text-[10px] md:text-xs px-3 py-1 font-semibold">
            <Shield className="h-3 w-3 mr-1" />
            Sécurisé
          </Badge>
        </div>

        {integrations.map((integration, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br ${integration.bgColor} backdrop-blur-sm ${
              integration.status === 'pending' ? 'opacity-70 grayscale' : ''
            }`}
          >
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/25 group-hover:via-white/15 group-hover:to-white/0 transition-all duration-500"></div>
            
            <CardContent className="relative p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative p-2.5 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/50">
                    <div className="text-xl md:text-2xl filter drop-shadow-md">{integration.icon}</div>
                  </div>
                  <span className="text-sm md:text-base font-bold text-gray-900">{integration.name}</span>
                </div>
                <Badge
                  className={`${
                    integration.status === 'connected'
                      ? `bg-gradient-to-r ${integration.color} text-white border-0 shadow-lg shadow-black/10`
                      : 'bg-gray-200 text-gray-700 border-0'
                  } text-[10px] md:text-xs px-3 py-1 font-semibold group-hover:scale-110 transition-transform`}
                >
                  {integration.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connecté
                    </>
                  ) : (
                    'En attente'
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Footer Premium */}
        <div className="pt-3 border-t border-gray-200/60 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-emerald-50/80 rounded-xl p-3 backdrop-blur-sm border border-emerald-100/50">
          <div className="flex items-center gap-2.5 text-xs flex-wrap">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <Lock className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SSL 256-bit</span>
            <span className="text-gray-400">•</span>
            <span className="font-bold text-gray-900">Conforme RGPD</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700 font-medium">Certification ISO 27001</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mockup Analytics - Design Professionnel avec Graphiques
 */
export const AnalyticsMockup = () => {
  const metrics = [
    { 
      label: 'Taux de conversion', 
      value: 3.2, 
      target: 5, 
      color: 'bg-blue-500',
      bgColor: 'from-blue-50 to-cyan-50',
      icon: TrendingUp 
    },
    { 
      label: 'Panier moyen', 
      value: 12500, 
      target: 15000, 
      color: 'bg-purple-500',
      bgColor: 'from-purple-50 to-pink-50',
      icon: ShoppingCart 
    },
    { 
      label: 'Taux de rebond', 
      value: 42, 
      target: 30, 
      color: 'bg-emerald-500',
      bgColor: 'from-emerald-50 to-teal-50',
      icon: Activity 
    },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-xl">
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-shimmer rotate-12" 
             style={{ width: '200%', height: '200%' }}></div>
      </div>
      
      <div className="relative p-4 md:p-5 space-y-3">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-xl shadow-blue-500/30">
              <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Analytics en temps réel
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Données mises à jour instantanément</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1 rounded-full border border-emerald-200/50 shadow-sm">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-60"></div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700">Live</span>
          </div>
        </div>

        {metrics.map((metric, index) => (
          <Card key={index} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm">
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-blue-50/50 group-hover:via-white/30 group-hover:to-white/0 transition-all duration-500"></div>
            
            <CardContent className="relative p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`relative p-3 md:p-3.5 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg shadow-black/10 flex-shrink-0`}>
                    <metric.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-800">{metric.label}</span>
                </div>
                <span className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {typeof metric.value === 'number' && metric.value < 100
                    ? `${metric.value}%`
                    : `${metric.value.toLocaleString()} FCFA`}
                </span>
              </div>
              <div className="relative">
                <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-1000 shadow-md relative overflow-hidden`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 mt-1.5 font-medium">
                  Objectif: {typeof metric.target === 'number' && metric.target < 100 ? `${metric.target}%` : `${metric.target.toLocaleString()} FCFA`}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Stats additionnelles Premium */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200/60">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-50/50 p-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">+28%</div>
              </div>
              <div className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wide">vs mois dernier</div>
            </div>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-pink-100/50 to-purple-50/50 p-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                  <Users className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">1.2K</div>
              </div>
              <div className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wide">Visiteurs/jour</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/**
 * Mockup Support - Design Professionnel avec Chat
 */
export const SupportMockup = () => {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-xl">
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-shimmer rotate-12" 
             style={{ width: '200%', height: '200%' }}></div>
      </div>
      
      <div className="relative p-4 md:p-5 space-y-3">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-xl shadow-blue-500/30">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Support 24/7
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Assistance disponible à tout moment</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30 text-[10px] md:text-xs px-3 py-1 font-semibold">
            <Zap className="h-3 w-3 mr-1" />
            24/7
          </Badge>
        </div>

        {/* Chat message Premium */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50/80 to-blue-50 p-4 md:p-5 relative overflow-hidden backdrop-blur-sm">
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20"></div>
          
          <div className="relative flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-xl border-3 border-white">
                <span className="text-white text-sm md:text-base font-bold">E</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2.5 border-white shadow-lg">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm md:text-base font-bold text-gray-900">Équipe Emarzona</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 font-semibold">
                  En ligne
                </Badge>
              </div>
              <div className="text-xs md:text-sm text-gray-800 leading-relaxed bg-white/90 rounded-xl p-3 shadow-lg border border-white/50 backdrop-blur-sm">
                Bonjour ! Comment puis-je vous aider aujourd'hui ?
              </div>
              <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Il y a 2 min
              </div>
            </div>
          </div>
        </Card>

        {/* Statuts Premium */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100/50 backdrop-blur-sm shadow-sm">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-md"></div>
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-60"></div>
            </div>
            <span className="font-bold text-gray-900">En ligne</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700 font-medium">Réponse moyenne: 2 min</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100/50 backdrop-blur-sm shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-bold text-gray-900">Chat</span>
            <span className="text-gray-400">•</span>
            <span className="font-bold text-gray-900">Email</span>
            <span className="text-gray-400">•</span>
            <span className="font-bold text-gray-900">Téléphone</span>
          </div>
        </div>

        {/* Stats en grille Premium */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-gray-200/60">
          {[
            { value: '98%', label: 'Satisfaction', color: 'from-emerald-500 to-teal-500', icon: CheckCircle2 },
            { value: '2min', label: 'Temps réponse', color: 'from-blue-500 to-cyan-500', icon: Zap },
            { value: '24/7', label: 'Disponibilité', color: 'from-purple-500 to-pink-500', icon: Activity },
          ].map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/80 p-3 text-center backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${stat.color} shadow-md mb-2`}>
                <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-[9px] md:text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Mockup Couverture Internationale - Design Professionnel
 */
export const CoverageMapMockup = () => {
  const regions = [
    { 
      name: 'Afrique de l\'Ouest', 
      countries: 8, 
      flag: '🌍', 
      color: 'bg-orange-500',
      bgColor: 'from-orange-50 to-amber-50'
    },
    { 
      name: 'Europe', 
      countries: 27, 
      flag: '🇪🇺', 
      color: 'bg-blue-500',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    { 
      name: 'Amérique', 
      countries: 15, 
      flag: '🇺🇸', 
      color: 'bg-emerald-500',
      bgColor: 'from-emerald-50 to-teal-50'
    },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 bg-gradient-to-br from-white via-indigo-50/30 to-white backdrop-blur-xl">
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-shimmer rotate-12" 
             style={{ width: '200%', height: '200%' }}></div>
      </div>
      
      <div className="relative p-4 md:p-5 space-y-3">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 shadow-xl shadow-indigo-500/30">
              <Globe className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Couverture mondiale
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Présent dans plus de 50 pays</p>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
        </div>

        {regions.map((region, index) => (
          <Card
            key={index}
            className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br ${region.bgColor} backdrop-blur-sm`}
          >
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/25 group-hover:via-white/15 group-hover:to-white/0 transition-all duration-500"></div>
            
            <CardContent className="relative p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative p-2.5 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/50">
                    <div className="text-2xl md:text-3xl filter drop-shadow-lg">{region.flag}</div>
                  </div>
                  <div>
                    <div className="text-sm md:text-base font-bold text-gray-900 mb-0.5">{region.name}</div>
                    <div className="text-xs md:text-sm font-semibold text-gray-700">
                      {region.countries} pays couverts
                    </div>
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${region.color} shadow-lg shadow-black/10 group-hover:scale-110 transition-transform`}>
                  <ArrowUpRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Footer avec stats Premium */}
        <div className="pt-3 border-t border-gray-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 rounded-xl p-4 backdrop-blur-sm border border-indigo-100/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">50+</div>
                <div className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wide">Pays</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-700 shadow-lg">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">15+</div>
                <div className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wide">Devises</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};






