/**
 * Section Personnalisation des Pages
 * Permet de personnaliser tous les éléments de chaque page (textes, images, couleurs, polices, etc.)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Image as ImageIcon, 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RefreshCw,
  Upload,
  X,
  Plus,
  Trash2,
  Settings,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Globe,
  User,
  Download,
  Heart,
  Bell,
  RotateCcw,
  Award,
  Gift,
  LayoutDashboard,
  BarChart3,
  Clock,
  DollarSign,
  Tag,
  Store,
  Calendar,
  Briefcase,
  PenTool,
  BookOpen,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';

interface PagesCustomizationSectionProps {
  onChange?: () => void;
}

// Définition des pages configurables
interface PageConfig {
  id: string;
  name: string;
  route: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: PageSection[];
}

interface PageSection {
  id: string;
  name: string;
  type: 'hero' | 'content' | 'features' | 'testimonials' | 'cta' | 'footer' | 'custom';
  elements: PageElement[];
}

interface PageElement {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'font' | 'number' | 'url' | 'boolean';
  key: string; // Clé pour accéder à la valeur dans i18n ou settings
  defaultValue?: string;
  description?: string;
  options?: { value: string; label: string }[];
}

// Configuration des pages
const PAGES_CONFIG: PageConfig[] = [
  {
    id: 'landing',
    name: 'Page d\'accueil',
    route: '/',
    description: 'Personnalisez tous les éléments de la page d\'accueil',
    icon: Layout,
    sections: [
      {
        id: 'hero',
        name: 'Section Hero',
        type: 'hero',
        elements: [
          { id: 'badge', label: 'Badge', type: 'text', key: 'landing.hero.badge', defaultValue: 'La plateforme e-commerce tout-en-un pour l\'Afrique' },
          { id: 'title', label: 'Titre principal', type: 'textarea', key: 'landing.hero.title', defaultValue: 'Créez votre boutique en ligne en quelques minutes' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.hero.subtitle', defaultValue: 'Vendez vos produits digitaux et physiques avec une plateforme complète, sécurisée et facile à utiliser.' },
          { id: 'ctaPrimary', label: 'Bouton principal', type: 'text', key: 'landing.hero.ctaPrimary', defaultValue: 'Créer ma boutique gratuitement' },
          { id: 'ctaSecondary', label: 'Bouton secondaire', type: 'text', key: 'landing.hero.ctaSecondary', defaultValue: 'Voir la démo' },
          { id: 'bgColor', label: 'Couleur de fond', type: 'color', key: 'landing.hero.bgColor', defaultValue: '#1e293b' },
          { id: 'textColor', label: 'Couleur du texte', type: 'color', key: 'landing.hero.textColor', defaultValue: '#ffffff' },
          { id: 'bgImage', label: 'Image de fond', type: 'image', key: 'landing.hero.bgImage' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'usersLabel', label: 'Label utilisateurs', type: 'text', key: 'landing.stats.users', defaultValue: 'Utilisateurs' },
          { id: 'salesLabel', label: 'Label ventes', type: 'text', key: 'landing.stats.sales', defaultValue: 'Ventes' },
          { id: 'storesLabel', label: 'Label boutiques', type: 'text', key: 'landing.stats.stores', defaultValue: 'Boutiques' },
        ],
      },
      {
        id: 'features',
        name: 'Section Fonctionnalités',
        type: 'features',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'landing.features.title', defaultValue: 'Fonctionnalités clés' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.features.subtitle', defaultValue: 'Tout ce dont vous avez besoin pour réussir en ligne' },
        ],
      },
      {
        id: 'testimonials',
        name: 'Témoignages',
        type: 'testimonials',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'landing.testimonials.title', defaultValue: 'Ils réussissent avec Emarzona' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.testimonials.subtitle', defaultValue: 'Rejoignez des centaines d\'entrepreneurs qui développent leur activité' },
        ],
      },
    ],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    route: '/marketplace',
    description: 'Personnalisez tous les éléments de la page marketplace',
    icon: ShoppingCart,
    sections: [
      {
        id: 'hero',
        name: 'Section Hero',
        type: 'hero',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'textarea', key: 'marketplace.hero.title', defaultValue: 'Découvrez notre marketplace' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'marketplace.hero.subtitle', defaultValue: 'Explorez des milliers de produits digitaux' },
          { id: 'tagline', label: 'Tagline', type: 'text', key: 'marketplace.hero.tagline', defaultValue: 'Tout ce dont vous avez besoin' },
          { id: 'searchPlaceholder', label: 'Placeholder recherche', type: 'text', key: 'marketplace.searchPlaceholder', defaultValue: 'Rechercher un produit...' },
          { id: 'bgGradient', label: 'Dégradé de fond', type: 'color', key: 'marketplace.hero.bgGradient', defaultValue: '#1e293b' },
        ],
      },
      {
        id: 'cta',
        name: 'Call to Action',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre CTA', type: 'text', key: 'marketplace.cta.title', defaultValue: 'Prêt à commencer ?' },
          { id: 'subtitle', label: 'Sous-titre CTA', type: 'textarea', key: 'marketplace.cta.subtitle', defaultValue: 'Rejoignez des milliers d\'entrepreneurs' },
          { id: 'startFree', label: 'Bouton Commencer gratuitement', type: 'text', key: 'marketplace.cta.startFree', defaultValue: 'Commencer gratuitement' },
          { id: 'joinCommunity', label: 'Bouton Rejoindre communauté', type: 'text', key: 'marketplace.cta.joinCommunity', defaultValue: 'Rejoindre la communauté' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'filtersActive', label: 'Label Filtres actifs', type: 'text', key: 'marketplace.filtersActive', defaultValue: 'Filtres actifs' },
          { id: 'filterCategory', label: 'Label Catégorie', type: 'text', key: 'marketplace.filterLabels.category', defaultValue: 'Catégorie' },
          { id: 'filterType', label: 'Label Type', type: 'text', key: 'marketplace.filterLabels.type', defaultValue: 'Type' },
          { id: 'filterPriceRange', label: 'Label Fourchette prix', type: 'text', key: 'marketplace.filterLabels.priceRange', defaultValue: 'Fourchette de prix' },
          { id: 'filterVerified', label: 'Label Vérifié', type: 'text', key: 'marketplace.filterLabels.verified', defaultValue: 'Vérifié' },
          { id: 'filterFeatured', label: 'Label En vedette', type: 'text', key: 'marketplace.filterLabels.featured', defaultValue: 'En vedette' },
          { id: 'filterTag', label: 'Label Tag', type: 'text', key: 'marketplace.filterLabels.tag', defaultValue: 'Tag' },
          { id: 'filterClear', label: 'Bouton Effacer', type: 'text', key: 'marketplace.filterLabels.clear', defaultValue: 'Effacer' },
          { id: 'filterAll', label: 'Label Tout', type: 'text', key: 'marketplace.filterLabels.all', defaultValue: 'Tout' },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    route: '/dashboard',
    description: 'Personnalisez tous les éléments du tableau de bord',
    icon: Layout,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'welcomeMessage', label: 'Message de bienvenue', type: 'textarea', key: 'dashboard.welcome', defaultValue: 'Bienvenue sur votre tableau de bord' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboard.subtitle', defaultValue: 'Gérez votre boutique en toute simplicité' },
          { id: 'online', label: 'Label En ligne', type: 'text', key: 'dashboard.online', defaultValue: 'En ligne' },
          { id: 'refresh', label: 'Label Actualiser', type: 'text', key: 'dashboard.refresh', defaultValue: 'Actualiser' },
          { id: 'createStorePrompt', label: 'Message Créer boutique', type: 'textarea', key: 'dashboard.createStorePrompt', defaultValue: 'Créez votre première boutique pour commencer' },
          { id: 'createStoreButton', label: 'Bouton Créer boutique', type: 'text', key: 'dashboard.createStoreButton', defaultValue: 'Créer ma boutique' },
        ],
      },
    ],
  },
  {
    id: 'storefront',
    name: 'Storefront',
    route: '/stores/:slug',
    description: 'Personnalisez tous les éléments de la page boutique',
    icon: ShoppingCart,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'storefront.header.title', defaultValue: 'Boutique' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'storefront.header.subtitle', defaultValue: 'Découvrez nos produits' },
          { id: 'noProducts', label: 'Message Aucun produit', type: 'textarea', key: 'storefront.noProducts', defaultValue: 'Aucun produit disponible pour le moment' },
          { id: 'loading', label: 'Message Chargement', type: 'text', key: 'storefront.loading', defaultValue: 'Chargement des produits...' },
        ],
      },
    ],
  },
  {
    id: 'productDetail',
    name: 'Détail Produit',
    route: '/stores/:slug/products/:productSlug',
    description: 'Personnalisez tous les éléments de la page produit',
    icon: Package,
    sections: [
      {
        id: 'cta',
        name: 'Call to Action',
        type: 'content',
        elements: [
          { id: 'addToCart', label: 'Texte "Ajouter au panier"', type: 'text', key: 'productDetail.cta.addToCart', defaultValue: 'Ajouter au panier' },
          { id: 'buyNow', label: 'Texte "Acheter maintenant"', type: 'text', key: 'productDetail.cta.buyNow', defaultValue: 'Acheter maintenant' },
          { id: 'outOfStock', label: 'Message Rupture de stock', type: 'text', key: 'productDetail.outOfStock', defaultValue: 'Rupture de stock' },
          { id: 'freeProduct', label: 'Label Produit gratuit', type: 'text', key: 'productDetail.freeProduct', defaultValue: 'Gratuit' },
          { id: 'loading', label: 'Message Chargement', type: 'text', key: 'productDetail.loading', defaultValue: 'Chargement du produit...' },
        ],
      },
    ],
  },
  {
    id: 'cart',
    name: 'Panier',
    route: '/cart',
    description: 'Personnalisez tous les éléments de la page panier',
    icon: ShoppingCart,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'cart.title', defaultValue: 'Mon panier' },
          { id: 'emptyMessage', label: 'Message panier vide', type: 'textarea', key: 'cart.emptyMessage', defaultValue: 'Votre panier est vide' },
          { id: 'emptySubtitle', label: 'Sous-titre panier vide', type: 'textarea', key: 'cart.emptySubtitle', defaultValue: 'Ajoutez des produits pour commencer' },
          { id: 'emptyCta', label: 'Bouton Continuer shopping', type: 'text', key: 'cart.emptyCta', defaultValue: 'Continuer mes achats' },
          { id: 'clearCart', label: 'Bouton Vider panier', type: 'text', key: 'cart.clearCart', defaultValue: 'Vider le panier' },
          { id: 'itemCount', label: 'Label Nombre d\'articles', type: 'text', key: 'cart.itemCount', defaultValue: 'articles' },
        ],
      },
    ],
  },
  {
    id: 'auth',
    name: 'Authentification',
    route: '/auth',
    description: 'Personnalisez tous les éléments de la page connexion/inscription',
    icon: Users,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'loginTitle', label: 'Titre connexion', type: 'text', key: 'auth.login.title', defaultValue: 'Connexion' },
          { id: 'signupTitle', label: 'Titre inscription', type: 'text', key: 'auth.signup.title', defaultValue: 'Créer un compte' },
          { id: 'welcomeMessage', label: 'Message de bienvenue', type: 'textarea', key: 'auth.welcome', defaultValue: 'Bienvenue sur Emarzona' },
          { id: 'loginButton', label: 'Bouton Se connecter', type: 'text', key: 'auth.login.button', defaultValue: 'Se connecter' },
          { id: 'signupButton', label: 'Bouton S\'inscrire', type: 'text', key: 'auth.signup.button', defaultValue: 'S\'inscrire' },
          { id: 'forgotPassword', label: 'Lien Mot de passe oublié', type: 'text', key: 'auth.forgotPassword.link', defaultValue: 'Mot de passe oublié ?' },
          { id: 'alreadyHaveAccount', label: 'Message Déjà un compte', type: 'text', key: 'auth.alreadyHaveAccount', defaultValue: 'Déjà un compte ?' },
          { id: 'noAccount', label: 'Message Pas de compte', type: 'text', key: 'auth.noAccount', defaultValue: 'Pas encore de compte ?' },
        ],
      },
    ],
  },
  {
    id: 'affiliateDashboard',
    name: 'Tableau de bord affilié',
    route: '/affiliate/dashboard',
    description: 'Personnalisez tous les éléments du tableau de bord des affiliés',
    icon: TrendingUp,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'affiliateDashboard.title', defaultValue: 'Tableau de bord affilié' },
          { id: 'welcomeMessage', label: 'Message de bienvenue', type: 'textarea', key: 'affiliateDashboard.welcome', defaultValue: 'Bienvenue, {name} • Code : {code}' },
          { id: 'newLinkButton', label: 'Bouton Nouveau lien', type: 'text', key: 'affiliateDashboard.newLinkButton', defaultValue: 'Nouveau lien' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'clicksLabel', label: 'Label Clics totaux', type: 'text', key: 'affiliateDashboard.stats.clicks', defaultValue: 'Clics totaux' },
          { id: 'salesLabel', label: 'Label Ventes générées', type: 'text', key: 'affiliateDashboard.stats.sales', defaultValue: 'Ventes générées' },
          { id: 'revenueLabel', label: 'Label CA généré', type: 'text', key: 'affiliateDashboard.stats.revenue', defaultValue: 'CA généré' },
          { id: 'earningsLabel', label: 'Label Gains totaux', type: 'text', key: 'affiliateDashboard.stats.earnings', defaultValue: 'Gains totaux' },
          { id: 'balanceLabel', label: 'Label Solde disponible', type: 'text', key: 'affiliateDashboard.stats.balance', defaultValue: 'Solde disponible' },
          { id: 'conversionRateLabel', label: 'Label Taux de conversion', type: 'text', key: 'affiliateDashboard.stats.conversionRate', defaultValue: 'Taux de conversion' },
        ],
      },
      {
        id: 'links',
        name: 'Mes liens',
        type: 'content',
        elements: [
          { id: 'tabTitle', label: 'Titre onglet Mes liens', type: 'text', key: 'affiliateDashboard.links.title', defaultValue: 'Mes liens d\'affiliation' },
          { id: 'createLinkButton', label: 'Bouton Créer un lien', type: 'text', key: 'affiliateDashboard.links.createButton', defaultValue: 'Créer un lien' },
          { id: 'noLinksMessage', label: 'Message Aucun lien', type: 'textarea', key: 'affiliateDashboard.links.noLinks', defaultValue: 'Aucun lien d\'affiliation pour le moment' },
          { id: 'copyButton', label: 'Bouton Copier', type: 'text', key: 'affiliateDashboard.links.copyButton', defaultValue: 'Copier' },
          { id: 'openButton', label: 'Bouton Ouvrir', type: 'text', key: 'affiliateDashboard.links.openButton', defaultValue: 'Ouvrir' },
          { id: 'clicksLabel', label: 'Label Clics', type: 'text', key: 'affiliateDashboard.links.clicks', defaultValue: 'Clics' },
          { id: 'salesLabel', label: 'Label Ventes', type: 'text', key: 'affiliateDashboard.links.sales', defaultValue: 'Ventes' },
          { id: 'revenueLabel', label: 'Label CA généré', type: 'text', key: 'affiliateDashboard.links.revenue', defaultValue: 'CA généré' },
          { id: 'commissionLabel', label: 'Label Commission', type: 'text', key: 'affiliateDashboard.links.commission', defaultValue: 'Commission' },
          { id: 'conversionLabel', label: 'Label Conversion', type: 'text', key: 'affiliateDashboard.links.conversion', defaultValue: 'Conversion' },
        ],
      },
      {
        id: 'commissions',
        name: 'Commissions',
        type: 'content',
        elements: [
          { id: 'tabTitle', label: 'Titre onglet Commissions', type: 'text', key: 'affiliateDashboard.commissions.title', defaultValue: 'Mes commissions' },
          { id: 'pendingLabel', label: 'Label En attente', type: 'text', key: 'affiliateDashboard.commissions.pending', defaultValue: 'En attente' },
          { id: 'approvedLabel', label: 'Label Approuvées', type: 'text', key: 'affiliateDashboard.commissions.approved', defaultValue: 'Approuvées' },
          { id: 'paidLabel', label: 'Label Payées', type: 'text', key: 'affiliateDashboard.commissions.paid', defaultValue: 'Payées' },
          { id: 'rejectedLabel', label: 'Label Rejetées', type: 'text', key: 'affiliateDashboard.commissions.rejected', defaultValue: 'Rejetées' },
          { id: 'noCommissionsMessage', label: 'Message Aucune commission', type: 'textarea', key: 'affiliateDashboard.commissions.noCommissions', defaultValue: 'Aucune commission pour le moment' },
        ],
      },
      {
        id: 'withdrawals',
        name: 'Retraits',
        type: 'content',
        elements: [
          { id: 'tabTitle', label: 'Titre onglet Retraits', type: 'text', key: 'affiliateDashboard.withdrawals.title', defaultValue: 'Mes retraits' },
          { id: 'requestButton', label: 'Bouton Demander un retrait', type: 'text', key: 'affiliateDashboard.withdrawals.requestButton', defaultValue: 'Demander un retrait' },
          { id: 'minimumAmount', label: 'Message Montant minimum', type: 'textarea', key: 'affiliateDashboard.withdrawals.minimumAmount', defaultValue: 'Montant minimum pour retrait : {amount}' },
          { id: 'noWithdrawalsMessage', label: 'Message Aucun retrait', type: 'textarea', key: 'affiliateDashboard.withdrawals.noWithdrawals', defaultValue: 'Aucun retrait pour le moment' },
        ],
      },
      {
        id: 'registration',
        name: 'Inscription',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre page inscription', type: 'text', key: 'affiliateDashboard.registration.title', defaultValue: 'Rejoignez notre programme d\'affiliation' },
          { id: 'description', label: 'Description programme', type: 'textarea', key: 'affiliateDashboard.registration.description', defaultValue: 'Gagnez des commissions en promouvant nos produits' },
          { id: 'registerButton', label: 'Bouton Devenir affilié', type: 'text', key: 'affiliateDashboard.registration.registerButton', defaultValue: 'Devenir affilié' },
        ],
      },
    ],
  },
  {
    id: 'checkout',
    name: 'Checkout',
    route: '/checkout',
    description: 'Personnalisez tous les éléments de la page de paiement',
    icon: CreditCard,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'checkout.header.title', defaultValue: 'Finaliser la commande' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'checkout.header.subtitle', defaultValue: 'Remplissez vos informations pour compléter votre achat' },
        ],
      },
      {
        id: 'shipping',
        name: 'Informations de livraison',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre section', type: 'text', key: 'checkout.shipping.title', defaultValue: 'Informations de livraison' },
          { id: 'subtitle', label: 'Sous-titre section', type: 'textarea', key: 'checkout.shipping.subtitle', defaultValue: 'Où souhaitez-vous recevoir votre commande ?' },
          { id: 'fullNameLabel', label: 'Label Nom complet', type: 'text', key: 'checkout.shipping.fullNameLabel', defaultValue: 'Nom complet' },
          { id: 'emailLabel', label: 'Label Email', type: 'text', key: 'checkout.shipping.emailLabel', defaultValue: 'Email' },
          { id: 'phoneLabel', label: 'Label Téléphone', type: 'text', key: 'checkout.shipping.phoneLabel', defaultValue: 'Téléphone' },
          { id: 'addressLabel', label: 'Label Adresse', type: 'text', key: 'checkout.shipping.addressLabel', defaultValue: 'Adresse' },
          { id: 'cityLabel', label: 'Label Ville', type: 'text', key: 'checkout.shipping.cityLabel', defaultValue: 'Ville' },
          { id: 'countryLabel', label: 'Label Pays', type: 'text', key: 'checkout.shipping.countryLabel', defaultValue: 'Pays' },
          { id: 'postalCodeLabel', label: 'Label Code postal', type: 'text', key: 'checkout.shipping.postalCodeLabel', defaultValue: 'Code postal' },
        ],
      },
      {
        id: 'summary',
        name: 'Récapitulatif',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre récapitulatif', type: 'text', key: 'checkout.summary.title', defaultValue: 'Récapitulatif' },
          { id: 'subtotalLabel', label: 'Label Sous-total', type: 'text', key: 'checkout.summary.subtotalLabel', defaultValue: 'Sous-total' },
          { id: 'shippingLabel', label: 'Label Livraison', type: 'text', key: 'checkout.summary.shippingLabel', defaultValue: 'Livraison' },
          { id: 'taxLabel', label: 'Label Taxes', type: 'text', key: 'checkout.summary.taxLabel', defaultValue: 'Taxes' },
          { id: 'discountLabel', label: 'Label Remise', type: 'text', key: 'checkout.summary.discountLabel', defaultValue: 'Remise' },
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'checkout.summary.totalLabel', defaultValue: 'Total' },
          { id: 'couponPlaceholder', label: 'Placeholder Code promo', type: 'text', key: 'checkout.summary.couponPlaceholder', defaultValue: 'Code promo' },
          { id: 'giftCardPlaceholder', label: 'Placeholder Carte cadeau', type: 'text', key: 'checkout.summary.giftCardPlaceholder', defaultValue: 'Code carte cadeau' },
          { id: 'proceedButton', label: 'Bouton Procéder au paiement', type: 'text', key: 'checkout.summary.proceedButton', defaultValue: 'Procéder au paiement' },
        ],
      },
      {
        id: 'payment',
        name: 'Paiement',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre section paiement', type: 'text', key: 'checkout.payment.title', defaultValue: 'Méthode de paiement' },
          { id: 'subtitle', label: 'Sous-titre section paiement', type: 'textarea', key: 'checkout.payment.subtitle', defaultValue: 'Choisissez votre méthode de paiement' },
          { id: 'secureMessage', label: 'Message Sécurisé', type: 'textarea', key: 'checkout.payment.secureMessage', defaultValue: 'Vos informations de paiement sont sécurisées et cryptées' },
        ],
      },
      {
        id: 'errors',
        name: 'Messages d\'erreur',
        type: 'content',
        elements: [
          { id: 'emptyCart', label: 'Message Panier vide', type: 'textarea', key: 'checkout.errors.emptyCart', defaultValue: 'Votre panier est vide' },
          { id: 'validationError', label: 'Message Erreur validation', type: 'textarea', key: 'checkout.errors.validationError', defaultValue: 'Veuillez remplir tous les champs obligatoires' },
          { id: 'paymentError', label: 'Message Erreur paiement', type: 'textarea', key: 'checkout.errors.paymentError', defaultValue: 'Une erreur est survenue lors du paiement' },
        ],
      },
    ],
  },
  {
    id: 'community',
    name: 'Communauté',
    route: '/community',
    description: 'Personnalisez tous les éléments de la page communauté',
    icon: Users,
    sections: [
      {
        id: 'hero',
        name: 'Section Hero',
        type: 'hero',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'textarea', key: 'community.hero.title', defaultValue: 'Rejoignez notre communauté' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'community.hero.subtitle', defaultValue: 'Échangez avec d\'autres entrepreneurs et développez votre activité' },
          { id: 'ctaButton', label: 'Bouton CTA', type: 'text', key: 'community.hero.ctaButton', defaultValue: 'Rejoindre maintenant' },
          { id: 'bgColor', label: 'Couleur de fond', type: 'color', key: 'community.hero.bgColor', defaultValue: '#1e293b' },
          { id: 'textColor', label: 'Couleur du texte', type: 'color', key: 'community.hero.textColor', defaultValue: '#ffffff' },
        ],
      },
      {
        id: 'features',
        name: 'Fonctionnalités',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre section', type: 'text', key: 'community.features.title', defaultValue: 'Pourquoi rejoindre ?' },
          { id: 'subtitle', label: 'Sous-titre section', type: 'textarea', key: 'community.features.subtitle', defaultValue: 'Découvrez tous les avantages de notre communauté' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'membersLabel', label: 'Label Membres', type: 'text', key: 'community.stats.members', defaultValue: 'Membres' },
          { id: 'postsLabel', label: 'Label Publications', type: 'text', key: 'community.stats.posts', defaultValue: 'Publications' },
          { id: 'topicsLabel', label: 'Label Sujets', type: 'text', key: 'community.stats.topics', defaultValue: 'Sujets' },
        ],
      },
    ],
  },
  {
    id: 'paymentSuccess',
    name: 'Paiement Réussi',
    route: '/payment/success',
    description: 'Personnalisez tous les éléments de la page de confirmation de paiement',
    icon: CheckCircle2,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'paymentSuccess.header.title', defaultValue: 'Paiement réussi ! 🎉' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'paymentSuccess.header.subtitle', defaultValue: 'Merci pour votre achat ! Votre paiement a été confirmé.' },
          { id: 'processingMessage', label: 'Message En traitement', type: 'textarea', key: 'paymentSuccess.header.processingMessage', defaultValue: 'Votre paiement est en cours de traitement. Veuillez patienter...' },
          { id: 'completedMessage', label: 'Message Complété', type: 'textarea', key: 'paymentSuccess.header.completedMessage', defaultValue: 'Merci pour votre achat ! Votre paiement a été confirmé avec succès.' },
        ],
      },
      {
        id: 'actions',
        name: 'Actions',
        type: 'content',
        elements: [
          { id: 'downloadsButton', label: 'Bouton Mes Téléchargements', type: 'text', key: 'paymentSuccess.actions.downloadsButton', defaultValue: 'Mes Téléchargements' },
          { id: 'ordersButton', label: 'Bouton Mes Commandes', type: 'text', key: 'paymentSuccess.actions.ordersButton', defaultValue: 'Mes Commandes' },
          { id: 'continueShoppingButton', label: 'Bouton Continuer les achats', type: 'text', key: 'paymentSuccess.actions.continueShoppingButton', defaultValue: 'Continuer les achats' },
        ],
      },
      {
        id: 'license',
        name: 'Information Licence',
        type: 'content',
        elements: [
          { id: 'plrTitle', label: 'Titre Licence PLR', type: 'text', key: 'paymentSuccess.license.plrTitle', defaultValue: 'Licence PLR (droits de label privé)' },
          { id: 'copyrightedTitle', label: 'Titre Protégé', type: 'text', key: 'paymentSuccess.license.copyrightedTitle', defaultValue: 'Protégé par droit d\'auteur' },
          { id: 'standardTitle', label: 'Titre Licence standard', type: 'text', key: 'paymentSuccess.license.standardTitle', defaultValue: 'Licence standard' },
          { id: 'termsMessage', label: 'Message Conditions', type: 'textarea', key: 'paymentSuccess.license.termsMessage', defaultValue: 'Veuillez respecter les conditions d\'utilisation de ce contenu.' },
        ],
      },
    ],
  },
  {
    id: 'paymentCancel',
    name: 'Paiement Annulé',
    route: '/payment/cancel',
    description: 'Personnalisez tous les éléments de la page d\'annulation de paiement',
    icon: XCircle,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'paymentCancel.header.title', defaultValue: 'Paiement annulé ❌' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'paymentCancel.header.subtitle', defaultValue: 'Votre paiement n\'a pas été finalisé. Aucun montant n\'a été débité.' },
        ],
      },
      {
        id: 'actions',
        name: 'Actions',
        type: 'content',
        elements: [
          { id: 'backToMarketplaceButton', label: 'Bouton Retour marketplace', type: 'text', key: 'paymentCancel.actions.backToMarketplaceButton', defaultValue: 'Retour au marketplace' },
          { id: 'retryButton', label: 'Bouton Réessayer', type: 'text', key: 'paymentCancel.actions.retryButton', defaultValue: 'Réessayer le paiement' },
        ],
      },
      {
        id: 'license',
        name: 'Information Licence',
        type: 'content',
        elements: [
          { id: 'plrTitle', label: 'Titre Licence PLR', type: 'text', key: 'paymentCancel.license.plrTitle', defaultValue: 'Licence PLR (droits de label privé)' },
          { id: 'copyrightedTitle', label: 'Titre Protégé', type: 'text', key: 'paymentCancel.license.copyrightedTitle', defaultValue: 'Protégé par droit d\'auteur' },
          { id: 'standardTitle', label: 'Titre Licence standard', type: 'text', key: 'paymentCancel.license.standardTitle', defaultValue: 'Licence standard' },
          { id: 'termsMessage', label: 'Message Conditions', type: 'textarea', key: 'paymentCancel.license.termsMessage', defaultValue: 'Si vous réessayez l\'achat, veuillez respecter les conditions d\'utilisation.' },
        ],
      },
    ],
  },
  {
    id: 'customerPortal',
    name: 'Portail Client',
    route: '/account',
    description: 'Personnalisez tous les éléments du portail client',
    icon: User,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerPortal.header.title', defaultValue: 'Mon Espace Client' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerPortal.header.subtitle', defaultValue: 'Gérez vos achats, téléchargements et informations personnelles' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalOrdersLabel', label: 'Label Total commandes', type: 'text', key: 'customerPortal.stats.totalOrders', defaultValue: 'Commandes' },
          { id: 'totalSpentLabel', label: 'Label Total dépensé', type: 'text', key: 'customerPortal.stats.totalSpent', defaultValue: 'Total dépensé' },
          { id: 'digitalProductsLabel', label: 'Label Produits digitaux', type: 'text', key: 'customerPortal.stats.digitalProducts', defaultValue: 'Produits digitaux' },
          { id: 'physicalProductsLabel', label: 'Label Produits physiques', type: 'text', key: 'customerPortal.stats.physicalProducts', defaultValue: 'Produits physiques' },
          { id: 'servicesLabel', label: 'Label Services', type: 'text', key: 'customerPortal.stats.services', defaultValue: 'Services' },
          { id: 'coursesLabel', label: 'Label Cours', type: 'text', key: 'customerPortal.stats.courses', defaultValue: 'Cours' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'overviewTab', label: 'Onglet Vue d\'ensemble', type: 'text', key: 'customerPortal.tabs.overview', defaultValue: 'Vue d\'ensemble' },
          { id: 'digitalTab', label: 'Onglet Digital', type: 'text', key: 'customerPortal.tabs.digital', defaultValue: 'Digital' },
          { id: 'physicalTab', label: 'Onglet Physique', type: 'text', key: 'customerPortal.tabs.physical', defaultValue: 'Physique' },
          { id: 'servicesTab', label: 'Onglet Services', type: 'text', key: 'customerPortal.tabs.services', defaultValue: 'Services' },
          { id: 'coursesTab', label: 'Onglet Cours', type: 'text', key: 'customerPortal.tabs.courses', defaultValue: 'Cours' },
        ],
      },
      {
        id: 'actions',
        name: 'Actions rapides',
        type: 'content',
        elements: [
          { id: 'viewOrdersButton', label: 'Bouton Voir commandes', type: 'text', key: 'customerPortal.actions.viewOrders', defaultValue: 'Voir mes commandes' },
          { id: 'viewDownloadsButton', label: 'Bouton Voir téléchargements', type: 'text', key: 'customerPortal.actions.viewDownloads', defaultValue: 'Mes téléchargements' },
          { id: 'viewProfileButton', label: 'Bouton Voir profil', type: 'text', key: 'customerPortal.actions.viewProfile', defaultValue: 'Mon profil' },
        ],
      },
    ],
  },
  {
    id: 'customerMyOrders',
    name: 'Mes Commandes',
    route: '/account/orders',
    description: 'Personnalisez tous les éléments de la page mes commandes',
    icon: ShoppingBag,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyOrders.header.title', defaultValue: 'Mes Commandes' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyOrders.header.subtitle', defaultValue: 'Consultez toutes vos commandes et leur statut' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'allLabel', label: 'Label Toutes', type: 'text', key: 'customerMyOrders.stats.all', defaultValue: 'Toutes' },
          { id: 'pendingLabel', label: 'Label En attente', type: 'text', key: 'customerMyOrders.stats.pending', defaultValue: 'En attente' },
          { id: 'processingLabel', label: 'Label En traitement', type: 'text', key: 'customerMyOrders.stats.processing', defaultValue: 'En traitement' },
          { id: 'completedLabel', label: 'Label Complétées', type: 'text', key: 'customerMyOrders.stats.completed', defaultValue: 'Complétées' },
          { id: 'cancelledLabel', label: 'Label Annulées', type: 'text', key: 'customerMyOrders.stats.cancelled', defaultValue: 'Annulées' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'customerMyOrders.filters.searchPlaceholder', defaultValue: 'Rechercher une commande...' },
          { id: 'filterAll', label: 'Filtre Toutes', type: 'text', key: 'customerMyOrders.filters.all', defaultValue: 'Toutes' },
          { id: 'filterPending', label: 'Filtre En attente', type: 'text', key: 'customerMyOrders.filters.pending', defaultValue: 'En attente' },
          { id: 'filterProcessing', label: 'Filtre En traitement', type: 'text', key: 'customerMyOrders.filters.processing', defaultValue: 'En traitement' },
          { id: 'filterCompleted', label: 'Filtre Complétées', type: 'text', key: 'customerMyOrders.filters.completed', defaultValue: 'Complétées' },
          { id: 'filterCancelled', label: 'Filtre Annulées', type: 'text', key: 'customerMyOrders.filters.cancelled', defaultValue: 'Annulées' },
        ],
      },
      {
        id: 'order',
        name: 'Commande',
        type: 'content',
        elements: [
          { id: 'orderNumberLabel', label: 'Label Numéro commande', type: 'text', key: 'customerMyOrders.order.orderNumber', defaultValue: 'Commande' },
          { id: 'dateLabel', label: 'Label Date', type: 'text', key: 'customerMyOrders.order.date', defaultValue: 'Date' },
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'customerMyOrders.order.total', defaultValue: 'Total' },
          { id: 'statusLabel', label: 'Label Statut', type: 'text', key: 'customerMyOrders.order.status', defaultValue: 'Statut' },
          { id: 'viewButton', label: 'Bouton Voir détails', type: 'text', key: 'customerMyOrders.order.viewButton', defaultValue: 'Voir détails' },
          { id: 'noOrdersMessage', label: 'Message Aucune commande', type: 'textarea', key: 'customerMyOrders.order.noOrders', defaultValue: 'Aucune commande pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'customerMyDownloads',
    name: 'Mes Téléchargements',
    route: '/account/downloads',
    description: 'Personnalisez tous les éléments de la page mes téléchargements',
    icon: Download,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyDownloads.header.title', defaultValue: 'Mes Téléchargements' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyDownloads.header.subtitle', defaultValue: 'Accédez à tous vos produits digitaux achetés' },
          { id: 'refreshButton', label: 'Bouton Rafraîchir', type: 'text', key: 'customerMyDownloads.header.refreshButton', defaultValue: 'Rafraîchir' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'customerMyDownloads.stats.total', defaultValue: 'Total' },
          { id: 'successfulLabel', label: 'Label Réussis', type: 'text', key: 'customerMyDownloads.stats.successful', defaultValue: 'Réussis' },
          { id: 'failedLabel', label: 'Label Échoués', type: 'text', key: 'customerMyDownloads.stats.failed', defaultValue: 'Échoués' },
          { id: 'uniqueProductsLabel', label: 'Label Produits uniques', type: 'text', key: 'customerMyDownloads.stats.uniqueProducts', defaultValue: 'Produits uniques' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'customerMyDownloads.filters.searchPlaceholder', defaultValue: 'Rechercher un produit...' },
          { id: 'filterAll', label: 'Filtre Tous', type: 'text', key: 'customerMyDownloads.filters.all', defaultValue: 'Tous' },
          { id: 'filterSuccess', label: 'Filtre Réussis', type: 'text', key: 'customerMyDownloads.filters.success', defaultValue: 'Réussis' },
          { id: 'filterFailed', label: 'Filtre Échoués', type: 'text', key: 'customerMyDownloads.filters.failed', defaultValue: 'Échoués' },
        ],
      },
      {
        id: 'download',
        name: 'Téléchargement',
        type: 'content',
        elements: [
          { id: 'downloadButton', label: 'Bouton Télécharger', type: 'text', key: 'customerMyDownloads.download.downloadButton', defaultValue: 'Télécharger' },
          { id: 'retryButton', label: 'Bouton Réessayer', type: 'text', key: 'customerMyDownloads.download.retryButton', defaultValue: 'Réessayer' },
          { id: 'noDownloadsMessage', label: 'Message Aucun téléchargement', type: 'textarea', key: 'customerMyDownloads.download.noDownloads', defaultValue: 'Aucun téléchargement pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'customerDigitalPortal',
    name: 'Portail Digital',
    route: '/account/digital',
    description: 'Personnalisez tous les éléments du portail digital',
    icon: Package,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerDigitalPortal.header.title', defaultValue: 'Mon Portail Digital' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerDigitalPortal.header.subtitle', defaultValue: 'Gérez tous vos produits digitaux, licences et téléchargements' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'productsTab', label: 'Onglet Produits', type: 'text', key: 'customerDigitalPortal.tabs.products', defaultValue: 'Mes Produits' },
          { id: 'licensesTab', label: 'Onglet Licences', type: 'text', key: 'customerDigitalPortal.tabs.licenses', defaultValue: 'Mes Licences' },
          { id: 'downloadsTab', label: 'Onglet Téléchargements', type: 'text', key: 'customerDigitalPortal.tabs.downloads', defaultValue: 'Téléchargements' },
          { id: 'statsTab', label: 'Onglet Statistiques', type: 'text', key: 'customerDigitalPortal.tabs.stats', defaultValue: 'Statistiques' },
          { id: 'preferencesTab', label: 'Onglet Préférences', type: 'text', key: 'customerDigitalPortal.tabs.preferences', defaultValue: 'Préférences' },
        ],
      },
    ],
  },
  {
    id: 'customerPhysicalPortal',
    name: 'Portail Physique',
    route: '/account/physical',
    description: 'Personnalisez tous les éléments du portail produits physiques',
    icon: ShoppingBag,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerPhysicalPortal.header.title', defaultValue: 'Mon Portail Produits Physiques' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerPhysicalPortal.header.subtitle', defaultValue: 'Gérez vos commandes, retours, garanties et suivez vos expéditions' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'ordersTab', label: 'Onglet Commandes', type: 'text', key: 'customerPhysicalPortal.tabs.orders', defaultValue: 'Mes Commandes' },
          { id: 'trackingTab', label: 'Onglet Suivi', type: 'text', key: 'customerPhysicalPortal.tabs.tracking', defaultValue: 'Suivi' },
          { id: 'returnsTab', label: 'Onglet Retours', type: 'text', key: 'customerPhysicalPortal.tabs.returns', defaultValue: 'Retours' },
          { id: 'warrantiesTab', label: 'Onglet Garanties', type: 'text', key: 'customerPhysicalPortal.tabs.warranties', defaultValue: 'Garanties' },
          { id: 'historyTab', label: 'Onglet Historique', type: 'text', key: 'customerPhysicalPortal.tabs.history', defaultValue: 'Historique' },
        ],
      },
    ],
  },
  {
    id: 'customerMyCourses',
    name: 'Mes Cours',
    route: '/account/courses',
    description: 'Personnalisez tous les éléments de la page mes cours',
    icon: BookOpen,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyCourses.header.title', defaultValue: 'Mes Cours' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyCourses.header.subtitle', defaultValue: 'Suivez votre progression et continuez votre apprentissage' },
          { id: 'refreshButton', label: 'Bouton Rafraîchir', type: 'text', key: 'customerMyCourses.header.refreshButton', defaultValue: 'Rafraîchir' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'customerMyCourses.stats.total', defaultValue: 'Total' },
          { id: 'inProgressLabel', label: 'Label En cours', type: 'text', key: 'customerMyCourses.stats.inProgress', defaultValue: 'En cours' },
          { id: 'completedLabel', label: 'Label Complétés', type: 'text', key: 'customerMyCourses.stats.completed', defaultValue: 'Complétés' },
          { id: 'averageProgressLabel', label: 'Label Progression moyenne', type: 'text', key: 'customerMyCourses.stats.averageProgress', defaultValue: 'Progression moyenne' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'customerMyCourses.filters.searchPlaceholder', defaultValue: 'Rechercher un cours...' },
          { id: 'filterAll', label: 'Filtre Tous', type: 'text', key: 'customerMyCourses.filters.all', defaultValue: 'Tous' },
          { id: 'filterInProgress', label: 'Filtre En cours', type: 'text', key: 'customerMyCourses.filters.inProgress', defaultValue: 'En cours' },
          { id: 'filterCompleted', label: 'Filtre Complétés', type: 'text', key: 'customerMyCourses.filters.completed', defaultValue: 'Complétés' },
        ],
      },
      {
        id: 'course',
        name: 'Cours',
        type: 'content',
        elements: [
          { id: 'continueButton', label: 'Bouton Continuer', type: 'text', key: 'customerMyCourses.course.continueButton', defaultValue: 'Continuer' },
          { id: 'startButton', label: 'Bouton Commencer', type: 'text', key: 'customerMyCourses.course.startButton', defaultValue: 'Commencer' },
          { id: 'viewButton', label: 'Bouton Voir', type: 'text', key: 'customerMyCourses.course.viewButton', defaultValue: 'Voir' },
          { id: 'progressLabel', label: 'Label Progression', type: 'text', key: 'customerMyCourses.course.progress', defaultValue: 'Progression' },
          { id: 'noCoursesMessage', label: 'Message Aucun cours', type: 'textarea', key: 'customerMyCourses.course.noCourses', defaultValue: 'Aucun cours pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'customerMyProfile',
    name: 'Mon Profil',
    route: '/account/profile',
    description: 'Personnalisez tous les éléments de la page mon profil',
    icon: User,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyProfile.header.title', defaultValue: 'Mon Profil' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyProfile.header.subtitle', defaultValue: 'Gérez vos informations personnelles et vos adresses' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'profileTab', label: 'Onglet Profil', type: 'text', key: 'customerMyProfile.tabs.profile', defaultValue: 'Profil' },
          { id: 'addressesTab', label: 'Onglet Adresses', type: 'text', key: 'customerMyProfile.tabs.addresses', defaultValue: 'Adresses' },
        ],
      },
      {
        id: 'profile',
        name: 'Profil',
        type: 'content',
        elements: [
          { id: 'fullNameLabel', label: 'Label Nom complet', type: 'text', key: 'customerMyProfile.profile.fullNameLabel', defaultValue: 'Nom complet' },
          { id: 'emailLabel', label: 'Label Email', type: 'text', key: 'customerMyProfile.profile.emailLabel', defaultValue: 'Email' },
          { id: 'phoneLabel', label: 'Label Téléphone', type: 'text', key: 'customerMyProfile.profile.phoneLabel', defaultValue: 'Téléphone' },
          { id: 'saveButton', label: 'Bouton Enregistrer', type: 'text', key: 'customerMyProfile.profile.saveButton', defaultValue: 'Enregistrer' },
        ],
      },
      {
        id: 'addresses',
        name: 'Adresses',
        type: 'content',
        elements: [
          { id: 'addAddressButton', label: 'Bouton Ajouter adresse', type: 'text', key: 'customerMyProfile.addresses.addButton', defaultValue: 'Ajouter une adresse' },
          { id: 'editButton', label: 'Bouton Modifier', type: 'text', key: 'customerMyProfile.addresses.editButton', defaultValue: 'Modifier' },
          { id: 'deleteButton', label: 'Bouton Supprimer', type: 'text', key: 'customerMyProfile.addresses.deleteButton', defaultValue: 'Supprimer' },
          { id: 'setDefaultButton', label: 'Bouton Définir par défaut', type: 'text', key: 'customerMyProfile.addresses.setDefaultButton', defaultValue: 'Définir par défaut' },
          { id: 'noAddressesMessage', label: 'Message Aucune adresse', type: 'textarea', key: 'customerMyProfile.addresses.noAddresses', defaultValue: 'Aucune adresse enregistrée' },
        ],
      },
    ],
  },
  {
    id: 'customerMyWishlist',
    name: 'Ma Wishlist',
    route: '/account/wishlist',
    description: 'Personnalisez tous les éléments de la page wishlist',
    icon: Heart,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyWishlist.header.title', defaultValue: 'Ma Wishlist' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyWishlist.header.subtitle', defaultValue: 'Vos produits favoris' },
          { id: 'shareButton', label: 'Bouton Partager', type: 'text', key: 'customerMyWishlist.header.shareButton', defaultValue: 'Partager' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'customerMyWishlist.stats.total', defaultValue: 'Total' },
          { id: 'digitalLabel', label: 'Label Digital', type: 'text', key: 'customerMyWishlist.stats.digital', defaultValue: 'Digital' },
          { id: 'physicalLabel', label: 'Label Physique', type: 'text', key: 'customerMyWishlist.stats.physical', defaultValue: 'Physique' },
          { id: 'serviceLabel', label: 'Label Service', type: 'text', key: 'customerMyWishlist.stats.service', defaultValue: 'Service' },
          { id: 'courseLabel', label: 'Label Cours', type: 'text', key: 'customerMyWishlist.stats.course', defaultValue: 'Cours' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'customerMyWishlist.filters.searchPlaceholder', defaultValue: 'Rechercher dans la wishlist...' },
          { id: 'filterAll', label: 'Filtre Tous', type: 'text', key: 'customerMyWishlist.filters.all', defaultValue: 'Tous' },
          { id: 'filterDigital', label: 'Filtre Digital', type: 'text', key: 'customerMyWishlist.filters.digital', defaultValue: 'Digital' },
          { id: 'filterPhysical', label: 'Filtre Physique', type: 'text', key: 'customerMyWishlist.filters.physical', defaultValue: 'Physique' },
          { id: 'filterService', label: 'Filtre Service', type: 'text', key: 'customerMyWishlist.filters.service', defaultValue: 'Service' },
          { id: 'filterCourse', label: 'Filtre Cours', type: 'text', key: 'customerMyWishlist.filters.course', defaultValue: 'Cours' },
        ],
      },
      {
        id: 'actions',
        name: 'Actions',
        type: 'content',
        elements: [
          { id: 'addToCartButton', label: 'Bouton Ajouter au panier', type: 'text', key: 'customerMyWishlist.actions.addToCart', defaultValue: 'Ajouter au panier' },
          { id: 'removeButton', label: 'Bouton Retirer', type: 'text', key: 'customerMyWishlist.actions.remove', defaultValue: 'Retirer' },
          { id: 'noWishlistMessage', label: 'Message Wishlist vide', type: 'textarea', key: 'customerMyWishlist.actions.noWishlist', defaultValue: 'Aucun produit dans votre wishlist' },
        ],
      },
    ],
  },
  {
    id: 'priceStockAlerts',
    name: 'Mes Alertes',
    route: '/account/alerts',
    description: 'Personnalisez tous les éléments de la page mes alertes',
    icon: Bell,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'priceStockAlerts.header.title', defaultValue: 'Mes Alertes' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'priceStockAlerts.header.subtitle', defaultValue: 'Gérez vos alertes de prix et de stock' },
          { id: 'refreshButton', label: 'Bouton Rafraîchir', type: 'text', key: 'priceStockAlerts.header.refreshButton', defaultValue: 'Rafraîchir' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'priceStockAlerts.stats.total', defaultValue: 'Total' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'priceStockAlerts.stats.price', defaultValue: 'Prix' },
          { id: 'stockLabel', label: 'Label Stock', type: 'text', key: 'priceStockAlerts.stats.stock', defaultValue: 'Stock' },
          { id: 'priceReachedLabel', label: 'Label Prix atteint', type: 'text', key: 'priceStockAlerts.stats.priceReached', defaultValue: 'Prix atteint' },
          { id: 'stockInStockLabel', label: 'Label En stock', type: 'text', key: 'priceStockAlerts.stats.stockInStock', defaultValue: 'En stock' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'priceTab', label: 'Onglet Prix', type: 'text', key: 'priceStockAlerts.tabs.price', defaultValue: 'Alertes Prix' },
          { id: 'stockTab', label: 'Onglet Stock', type: 'text', key: 'priceStockAlerts.tabs.stock', defaultValue: 'Alertes Stock' },
        ],
      },
      {
        id: 'actions',
        name: 'Actions',
        type: 'content',
        elements: [
          { id: 'deleteButton', label: 'Bouton Supprimer', type: 'text', key: 'priceStockAlerts.actions.delete', defaultValue: 'Supprimer' },
          { id: 'viewProductButton', label: 'Bouton Voir produit', type: 'text', key: 'priceStockAlerts.actions.viewProduct', defaultValue: 'Voir produit' },
          { id: 'noAlertsMessage', label: 'Message Aucune alerte', type: 'textarea', key: 'priceStockAlerts.actions.noAlerts', defaultValue: 'Aucune alerte pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'customerMyInvoices',
    name: 'Mes Factures',
    route: '/account/invoices',
    description: 'Personnalisez tous les éléments de la page mes factures',
    icon: FileText,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyInvoices.header.title', defaultValue: 'Mes Factures' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyInvoices.header.subtitle', defaultValue: 'Consultez et téléchargez toutes vos factures' },
          { id: 'refreshButton', label: 'Bouton Rafraîchir', type: 'text', key: 'customerMyInvoices.header.refreshButton', defaultValue: 'Rafraîchir' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'customerMyInvoices.stats.total', defaultValue: 'Total' },
          { id: 'paidLabel', label: 'Label Payées', type: 'text', key: 'customerMyInvoices.stats.paid', defaultValue: 'Payées' },
          { id: 'pendingLabel', label: 'Label En attente', type: 'text', key: 'customerMyInvoices.stats.pending', defaultValue: 'En attente' },
          { id: 'totalAmountLabel', label: 'Label Montant total', type: 'text', key: 'customerMyInvoices.stats.totalAmount', defaultValue: 'Montant total' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'customerMyInvoices.filters.searchPlaceholder', defaultValue: 'Rechercher une facture...' },
          { id: 'filterAll', label: 'Filtre Toutes', type: 'text', key: 'customerMyInvoices.filters.all', defaultValue: 'Toutes' },
          { id: 'filterPaid', label: 'Filtre Payées', type: 'text', key: 'customerMyInvoices.filters.paid', defaultValue: 'Payées' },
          { id: 'filterSent', label: 'Filtre Envoyées', type: 'text', key: 'customerMyInvoices.filters.sent', defaultValue: 'Envoyées' },
          { id: 'filterDraft', label: 'Filtre Brouillons', type: 'text', key: 'customerMyInvoices.filters.draft', defaultValue: 'Brouillons' },
          { id: 'filterOverdue', label: 'Filtre Échues', type: 'text', key: 'customerMyInvoices.filters.overdue', defaultValue: 'Échues' },
          { id: 'filterCancelled', label: 'Filtre Annulées', type: 'text', key: 'customerMyInvoices.filters.cancelled', defaultValue: 'Annulées' },
        ],
      },
      {
        id: 'invoice',
        name: 'Facture',
        type: 'content',
        elements: [
          { id: 'downloadButton', label: 'Bouton Télécharger PDF', type: 'text', key: 'customerMyInvoices.invoice.downloadButton', defaultValue: 'Télécharger PDF' },
          { id: 'invoiceNumberLabel', label: 'Label Numéro facture', type: 'text', key: 'customerMyInvoices.invoice.invoiceNumber', defaultValue: 'Facture' },
          { id: 'statusLabel', label: 'Label Statut', type: 'text', key: 'customerMyInvoices.invoice.status', defaultValue: 'Statut' },
          { id: 'noInvoicesMessage', label: 'Message Aucune facture', type: 'textarea', key: 'customerMyInvoices.invoice.noInvoices', defaultValue: 'Aucune facture pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'customerMyReturns',
    name: 'Mes Retours',
    route: '/account/returns',
    description: 'Personnalisez tous les éléments de la page mes retours',
    icon: RotateCcw,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyReturns.header.title', defaultValue: 'Mes Retours' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyReturns.header.subtitle', defaultValue: 'Gérez vos demandes de retour et remboursement' },
          { id: 'refreshButton', label: 'Bouton Rafraîchir', type: 'text', key: 'customerMyReturns.header.refreshButton', defaultValue: 'Rafraîchir' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'customerMyReturns.stats.total', defaultValue: 'Total Retours' },
          { id: 'inProgressLabel', label: 'Label En cours', type: 'text', key: 'customerMyReturns.stats.inProgress', defaultValue: 'En cours' },
          { id: 'refundedLabel', label: 'Label Remboursés', type: 'text', key: 'customerMyReturns.stats.refunded', defaultValue: 'Remboursés' },
          { id: 'totalRefundedLabel', label: 'Label Total remboursé', type: 'text', key: 'customerMyReturns.stats.totalRefunded', defaultValue: 'Total remboursé' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'customerMyReturns.filters.searchPlaceholder', defaultValue: 'Rechercher un retour...' },
          { id: 'filterAll', label: 'Filtre Tous', type: 'text', key: 'customerMyReturns.filters.all', defaultValue: 'Tous' },
          { id: 'filterRequested', label: 'Filtre Demandés', type: 'text', key: 'customerMyReturns.filters.requested', defaultValue: 'Demandés' },
          { id: 'filterApproved', label: 'Filtre Approuvés', type: 'text', key: 'customerMyReturns.filters.approved', defaultValue: 'Approuvés' },
          { id: 'filterRefunded', label: 'Filtre Remboursés', type: 'text', key: 'customerMyReturns.filters.refunded', defaultValue: 'Remboursés' },
          { id: 'filterRejected', label: 'Filtre Rejetés', type: 'text', key: 'customerMyReturns.filters.rejected', defaultValue: 'Rejetés' },
          { id: 'filterCancelled', label: 'Filtre Annulés', type: 'text', key: 'customerMyReturns.filters.cancelled', defaultValue: 'Annulés' },
        ],
      },
      {
        id: 'return',
        name: 'Retour',
        type: 'content',
        elements: [
          { id: 'returnNumberLabel', label: 'Label Numéro retour', type: 'text', key: 'customerMyReturns.return.returnNumber', defaultValue: 'Retour' },
          { id: 'statusLabel', label: 'Label Statut', type: 'text', key: 'customerMyReturns.return.status', defaultValue: 'Statut' },
          { id: 'viewButton', label: 'Bouton Voir détails', type: 'text', key: 'customerMyReturns.return.viewButton', defaultValue: 'Voir détails' },
          { id: 'noReturnsMessage', label: 'Message Aucun retour', type: 'textarea', key: 'customerMyReturns.return.noReturns', defaultValue: 'Aucun retour pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'customerLoyalty',
    name: 'Programme de Fidélité',
    route: '/account/loyalty',
    description: 'Personnalisez tous les éléments de la page programme de fidélité',
    icon: Award,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerLoyalty.header.title', defaultValue: 'Programme de Fidélité' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerLoyalty.header.subtitle', defaultValue: 'Consultez vos points, échangez des récompenses et suivez votre progression' },
        ],
      },
      {
        id: 'points',
        name: 'Points',
        type: 'content',
        elements: [
          { id: 'availablePointsLabel', label: 'Label Points disponibles', type: 'text', key: 'customerLoyalty.points.available', defaultValue: 'Points disponibles' },
          { id: 'currentTierLabel', label: 'Label Tier actuel', type: 'text', key: 'customerLoyalty.points.currentTier', defaultValue: 'Tier actuel' },
          { id: 'nextTierLabel', label: 'Label Prochain tier', type: 'text', key: 'customerLoyalty.points.nextTier', defaultValue: 'Prochain tier' },
          { id: 'progressLabel', label: 'Label Progression', type: 'text', key: 'customerLoyalty.points.progress', defaultValue: 'Progression' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'overviewTab', label: 'Onglet Vue d\'ensemble', type: 'text', key: 'customerLoyalty.tabs.overview', defaultValue: 'Vue d\'ensemble' },
          { id: 'rewardsTab', label: 'Onglet Récompenses', type: 'text', key: 'customerLoyalty.tabs.rewards', defaultValue: 'Récompenses' },
          { id: 'transactionsTab', label: 'Onglet Transactions', type: 'text', key: 'customerLoyalty.tabs.transactions', defaultValue: 'Transactions' },
        ],
      },
      {
        id: 'rewards',
        name: 'Récompenses',
        type: 'content',
        elements: [
          { id: 'redeemButton', label: 'Bouton Échanger', type: 'text', key: 'customerLoyalty.rewards.redeem', defaultValue: 'Échanger' },
          { id: 'pointsRequiredLabel', label: 'Label Points requis', type: 'text', key: 'customerLoyalty.rewards.pointsRequired', defaultValue: 'Points requis' },
          { id: 'noRewardsMessage', label: 'Message Aucune récompense', type: 'textarea', key: 'customerLoyalty.rewards.noRewards', defaultValue: 'Aucune récompense disponible' },
        ],
      },
    ],
  },
  {
    id: 'customerMyGiftCards',
    name: 'Mes Cartes Cadeaux',
    route: '/account/gift-cards',
    description: 'Personnalisez tous les éléments de la page mes cartes cadeaux',
    icon: Gift,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'customerMyGiftCards.header.title', defaultValue: 'Mes Cartes Cadeaux' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'customerMyGiftCards.header.subtitle', defaultValue: 'Gérez vos cartes cadeaux et leur solde' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalBalanceLabel', label: 'Label Solde total', type: 'text', key: 'customerMyGiftCards.stats.totalBalance', defaultValue: 'Solde Total' },
          { id: 'totalCardsLabel', label: 'Label Total cartes', type: 'text', key: 'customerMyGiftCards.stats.totalCards', defaultValue: 'Total Cartes' },
          { id: 'transactionsLabel', label: 'Label Transactions', type: 'text', key: 'customerMyGiftCards.stats.transactions', defaultValue: 'Transactions' },
        ],
      },
      {
        id: 'giftCard',
        name: 'Carte Cadeau',
        type: 'content',
        elements: [
          { id: 'codeLabel', label: 'Label Code', type: 'text', key: 'customerMyGiftCards.giftCard.code', defaultValue: 'Code' },
          { id: 'balanceLabel', label: 'Label Solde disponible', type: 'text', key: 'customerMyGiftCards.giftCard.balance', defaultValue: 'Solde disponible' },
          { id: 'expiresLabel', label: 'Label Expire le', type: 'text', key: 'customerMyGiftCards.giftCard.expires', defaultValue: 'Expire le' },
          { id: 'copyButton', label: 'Bouton Copier', type: 'text', key: 'customerMyGiftCards.giftCard.copyButton', defaultValue: 'Copier' },
          { id: 'activeCardsTitle', label: 'Titre Cartes actives', type: 'text', key: 'customerMyGiftCards.giftCard.activeCardsTitle', defaultValue: 'Mes Cartes Cadeaux Actives' },
          { id: 'activeCardsDescription', label: 'Description Cartes actives', type: 'textarea', key: 'customerMyGiftCards.giftCard.activeCardsDescription', defaultValue: 'Vous pouvez utiliser ces cartes lors de vos prochains achats' },
          { id: 'noGiftCardsMessage', label: 'Message Aucune carte', type: 'textarea', key: 'customerMyGiftCards.giftCard.noGiftCards', defaultValue: 'Aucune carte cadeau pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'dashboardProducts',
    name: 'Dashboard Produits',
    route: '/dashboard/products',
    description: 'Personnalisez tous les éléments de la page produits du dashboard',
    icon: Package,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardProducts.header.title', defaultValue: 'Produits' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardProducts.header.subtitle', defaultValue: 'Gérez vos produits et vendez plus efficacement' },
          { id: 'refreshButton', label: 'Bouton Actualiser', type: 'text', key: 'dashboardProducts.header.refreshButton', defaultValue: 'Actualiser' },
          { id: 'newProductButton', label: 'Bouton Nouveau produit', type: 'text', key: 'dashboardProducts.header.newProductButton', defaultValue: 'Nouveau produit' },
        ],
      },
      {
        id: 'empty',
        name: 'État vide',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre état vide', type: 'text', key: 'dashboardProducts.empty.title', defaultValue: 'Aucun produit pour le moment' },
          { id: 'description', label: 'Description état vide', type: 'textarea', key: 'dashboardProducts.empty.description', defaultValue: 'Créez votre premier produit digital ou service pour commencer à vendre' },
          { id: 'createButton', label: 'Bouton Créer', type: 'text', key: 'dashboardProducts.empty.createButton', defaultValue: 'Créer mon premier produit' },
          { id: 'importButton', label: 'Bouton Importer CSV', type: 'text', key: 'dashboardProducts.empty.importButton', defaultValue: 'Importer CSV' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'dashboardProducts.filters.searchPlaceholder', defaultValue: 'Rechercher un produit...' },
          { id: 'filterAll', label: 'Filtre Tous', type: 'text', key: 'dashboardProducts.filters.all', defaultValue: 'Tous' },
          { id: 'filterActive', label: 'Filtre Actifs', type: 'text', key: 'dashboardProducts.filters.active', defaultValue: 'Actifs' },
          { id: 'filterInactive', label: 'Filtre Inactifs', type: 'text', key: 'dashboardProducts.filters.inactive', defaultValue: 'Inactifs' },
        ],
      },
      {
        id: 'actions',
        name: 'Actions',
        type: 'content',
        elements: [
          { id: 'editButton', label: 'Bouton Modifier', type: 'text', key: 'dashboardProducts.actions.edit', defaultValue: 'Modifier' },
          { id: 'deleteButton', label: 'Bouton Supprimer', type: 'text', key: 'dashboardProducts.actions.delete', defaultValue: 'Supprimer' },
          { id: 'duplicateButton', label: 'Bouton Dupliquer', type: 'text', key: 'dashboardProducts.actions.duplicate', defaultValue: 'Dupliquer' },
        ],
      },
    ],
  },
  {
    id: 'dashboardOrders',
    name: 'Dashboard Commandes',
    route: '/dashboard/orders',
    description: 'Personnalisez tous les éléments de la page commandes du dashboard',
    icon: Package,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardOrders.header.title', defaultValue: 'Commandes' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardOrders.header.subtitle', defaultValue: 'Gérez toutes vos commandes et suivez leurs statuts' },
          { id: 'exportButton', label: 'Bouton Exporter', type: 'text', key: 'dashboardOrders.header.exportButton', defaultValue: 'Exporter' },
          { id: 'newOrderButton', label: 'Bouton Nouvelle commande', type: 'text', key: 'dashboardOrders.header.newOrderButton', defaultValue: 'Nouvelle commande' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'dashboardOrders.stats.total', defaultValue: 'Total' },
          { id: 'pendingLabel', label: 'Label En attente', type: 'text', key: 'dashboardOrders.stats.pending', defaultValue: 'En attente' },
          { id: 'completedLabel', label: 'Label Terminées', type: 'text', key: 'dashboardOrders.stats.completed', defaultValue: 'Terminées' },
          { id: 'revenueLabel', label: 'Label Chiffre d\'affaires', type: 'text', key: 'dashboardOrders.stats.revenue', defaultValue: 'Chiffre d\'affaires' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'dashboardOrders.filters.searchPlaceholder', defaultValue: 'Rechercher une commande...' },
          { id: 'filterAll', label: 'Filtre Toutes', type: 'text', key: 'dashboardOrders.filters.all', defaultValue: 'Toutes' },
          { id: 'filterPending', label: 'Filtre En attente', type: 'text', key: 'dashboardOrders.filters.pending', defaultValue: 'En attente' },
          { id: 'filterCompleted', label: 'Filtre Terminées', type: 'text', key: 'dashboardOrders.filters.completed', defaultValue: 'Terminées' },
        ],
      },
      {
        id: 'order',
        name: 'Commande',
        type: 'content',
        elements: [
          { id: 'viewButton', label: 'Bouton Voir', type: 'text', key: 'dashboardOrders.order.viewButton', defaultValue: 'Voir' },
          { id: 'editButton', label: 'Bouton Modifier', type: 'text', key: 'dashboardOrders.order.editButton', defaultValue: 'Modifier' },
          { id: 'statusLabel', label: 'Label Statut', type: 'text', key: 'dashboardOrders.order.status', defaultValue: 'Statut' },
          { id: 'noOrdersMessage', label: 'Message Aucune commande', type: 'textarea', key: 'dashboardOrders.order.noOrders', defaultValue: 'Aucune commande pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'dashboardAnalytics',
    name: 'Dashboard Analytics',
    route: '/dashboard/analytics',
    description: 'Personnalisez tous les éléments de la page analytics du dashboard',
    icon: BarChart3,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardAnalytics.header.title', defaultValue: 'Statistiques' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardAnalytics.header.subtitle', defaultValue: 'Vue d\'ensemble de votre activité' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalRevenueLabel', label: 'Label Revenu total', type: 'text', key: 'dashboardAnalytics.stats.totalRevenue', defaultValue: 'Revenu total' },
          { id: 'totalRevenueDescription', label: 'Description Revenu total', type: 'text', key: 'dashboardAnalytics.stats.totalRevenueDescription', defaultValue: 'Total des ventes' },
          { id: 'ordersLabel', label: 'Label Commandes', type: 'text', key: 'dashboardAnalytics.stats.orders', defaultValue: 'Commandes' },
          { id: 'ordersDescription', label: 'Description Commandes', type: 'text', key: 'dashboardAnalytics.stats.ordersDescription', defaultValue: 'Commandes complétées' },
          { id: 'customersLabel', label: 'Label Clients', type: 'text', key: 'dashboardAnalytics.stats.customers', defaultValue: 'Clients' },
          { id: 'customersDescription', label: 'Description Clients', type: 'text', key: 'dashboardAnalytics.stats.customersDescription', defaultValue: 'Clients enregistrés' },
          { id: 'activeProductsLabel', label: 'Label Produits actifs', type: 'text', key: 'dashboardAnalytics.stats.activeProducts', defaultValue: 'Produits actifs' },
          { id: 'activeProductsDescription', label: 'Description Produits actifs', type: 'text', key: 'dashboardAnalytics.stats.activeProductsDescription', defaultValue: 'Sur {total} total' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'unifiedTab', label: 'Onglet Vue unifiée', type: 'text', key: 'dashboardAnalytics.tabs.unified', defaultValue: 'Vue Unifiée' },
          { id: 'classicTab', label: 'Onglet Vue classique', type: 'text', key: 'dashboardAnalytics.tabs.classic', defaultValue: 'Vue Classique' },
        ],
      },
      {
        id: 'noStore',
        name: 'Aucune boutique',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre Aucune boutique', type: 'text', key: 'dashboardAnalytics.noStore.title', defaultValue: 'Aucune boutique sélectionnée' },
          { id: 'description', label: 'Description Aucune boutique', type: 'textarea', key: 'dashboardAnalytics.noStore.description', defaultValue: 'Veuillez sélectionner une boutique ou créer une nouvelle boutique pour voir vos statistiques.' },
          { id: 'createStoreButton', label: 'Bouton Créer boutique', type: 'text', key: 'dashboardAnalytics.noStore.createStoreButton', defaultValue: 'Créer une boutique' },
          { id: 'backButton', label: 'Bouton Retour', type: 'text', key: 'dashboardAnalytics.noStore.backButton', defaultValue: 'Retour au tableau de bord' },
        ],
      },
    ],
  },
  {
    id: 'dashboardSettings',
    name: 'Dashboard Paramètres',
    route: '/dashboard/settings',
    description: 'Personnalisez tous les éléments de la page paramètres du dashboard',
    icon: Settings,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardSettings.header.title', defaultValue: 'Paramètres' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardSettings.header.subtitle', defaultValue: 'Gérez vos paramètres et préférences' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'profileTab', label: 'Onglet Profil', type: 'text', key: 'dashboardSettings.tabs.profile', defaultValue: 'Profil' },
          { id: 'storeTab', label: 'Onglet Boutique', type: 'text', key: 'dashboardSettings.tabs.store', defaultValue: 'Boutique' },
          { id: 'domainTab', label: 'Onglet Domaine', type: 'text', key: 'dashboardSettings.tabs.domain', defaultValue: 'Domaine' },
          { id: 'notificationsTab', label: 'Onglet Notifications', type: 'text', key: 'dashboardSettings.tabs.notifications', defaultValue: 'Notifications' },
          { id: 'importExportTab', label: 'Onglet Import/Export', type: 'text', key: 'dashboardSettings.tabs.importExport', defaultValue: 'Import/Export' },
          { id: 'securityTab', label: 'Onglet Sécurité', type: 'text', key: 'dashboardSettings.tabs.security', defaultValue: 'Sécurité' },
          { id: 'debugTab', label: 'Onglet Debug', type: 'text', key: 'dashboardSettings.tabs.debug', defaultValue: 'Debug' },
        ],
      },
      {
        id: 'sections',
        name: 'Sections',
        type: 'content',
        elements: [
          { id: 'profileTitle', label: 'Titre Section Profil', type: 'text', key: 'dashboardSettings.sections.profileTitle', defaultValue: 'Profil' },
          { id: 'profileDescription', label: 'Description Section Profil', type: 'textarea', key: 'dashboardSettings.sections.profileDescription', defaultValue: 'Gérez vos informations personnelles' },
          { id: 'storeTitle', label: 'Titre Section Boutique', type: 'text', key: 'dashboardSettings.sections.storeTitle', defaultValue: 'Boutique' },
          { id: 'storeDescription', label: 'Description Section Boutique', type: 'textarea', key: 'dashboardSettings.sections.storeDescription', defaultValue: 'Configurez les paramètres de votre boutique' },
          { id: 'notificationsTitle', label: 'Titre Section Notifications', type: 'text', key: 'dashboardSettings.sections.notificationsTitle', defaultValue: 'Notifications' },
          { id: 'notificationsDescription', label: 'Description Section Notifications', type: 'textarea', key: 'dashboardSettings.sections.notificationsDescription', defaultValue: 'Gérez vos préférences de notifications' },
        ],
      },
    ],
  },
  {
    id: 'dashboardCustomers',
    name: 'Dashboard Clients',
    route: '/dashboard/customers',
    description: 'Personnalisez tous les éléments de la page clients du dashboard',
    icon: Users,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardCustomers.header.title', defaultValue: 'Clients' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardCustomers.header.subtitle', defaultValue: 'Gérez votre base de clients et suivez leurs achats' },
          { id: 'newCustomerButton', label: 'Bouton Nouveau client', type: 'text', key: 'dashboardCustomers.header.newCustomerButton', defaultValue: 'Nouveau client' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'dashboardCustomers.stats.total', defaultValue: 'Total' },
          { id: 'totalOrdersLabel', label: 'Label Total commandes', type: 'text', key: 'dashboardCustomers.stats.totalOrders', defaultValue: 'Total commandes' },
          { id: 'totalSpentLabel', label: 'Label Total dépensé', type: 'text', key: 'dashboardCustomers.stats.totalSpent', defaultValue: 'Total dépensé' },
          { id: 'averageSpentLabel', label: 'Label Moyenne dépensée', type: 'text', key: 'dashboardCustomers.stats.averageSpent', defaultValue: 'Moyenne dépensée' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'dashboardCustomers.filters.searchPlaceholder', defaultValue: 'Rechercher un client...' },
          { id: 'sortByName', label: 'Trier par Nom', type: 'text', key: 'dashboardCustomers.filters.sortByName', defaultValue: 'Nom' },
          { id: 'sortByDate', label: 'Trier par Date', type: 'text', key: 'dashboardCustomers.filters.sortByDate', defaultValue: 'Date' },
          { id: 'sortByOrders', label: 'Trier par Commandes', type: 'text', key: 'dashboardCustomers.filters.sortByOrders', defaultValue: 'Commandes' },
          { id: 'sortBySpent', label: 'Trier par Dépensé', type: 'text', key: 'dashboardCustomers.filters.sortBySpent', defaultValue: 'Dépensé' },
        ],
      },
      {
        id: 'customer',
        name: 'Client',
        type: 'content',
        elements: [
          { id: 'viewButton', label: 'Bouton Voir', type: 'text', key: 'dashboardCustomers.customer.viewButton', defaultValue: 'Voir' },
          { id: 'editButton', label: 'Bouton Modifier', type: 'text', key: 'dashboardCustomers.customer.editButton', defaultValue: 'Modifier' },
          { id: 'noCustomersMessage', label: 'Message Aucun client', type: 'textarea', key: 'dashboardCustomers.customer.noCustomers', defaultValue: 'Aucun client pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'dashboardPayments',
    name: 'Dashboard Paiements',
    route: '/dashboard/payments',
    description: 'Personnalisez tous les éléments de la page paiements du dashboard',
    icon: CreditCard,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardPayments.header.title', defaultValue: 'Paiements' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardPayments.header.subtitle', defaultValue: 'Gérez tous vos paiements et transactions' },
          { id: 'newPaymentButton', label: 'Bouton Nouveau paiement', type: 'text', key: 'dashboardPayments.header.newPaymentButton', defaultValue: 'Nouveau paiement' },
          { id: 'exportButton', label: 'Bouton Exporter', type: 'text', key: 'dashboardPayments.header.exportButton', defaultValue: 'Exporter' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'allTab', label: 'Onglet Tous', type: 'text', key: 'dashboardPayments.tabs.all', defaultValue: 'Tous' },
          { id: 'completedTab', label: 'Onglet Complétés', type: 'text', key: 'dashboardPayments.tabs.completed', defaultValue: 'Complétés' },
          { id: 'pendingTab', label: 'Onglet En attente', type: 'text', key: 'dashboardPayments.tabs.pending', defaultValue: 'En attente' },
          { id: 'failedTab', label: 'Onglet Échoués', type: 'text', key: 'dashboardPayments.tabs.failed', defaultValue: 'Échoués' },
        ],
      },
      {
        id: 'payment',
        name: 'Paiement',
        type: 'content',
        elements: [
          { id: 'viewButton', label: 'Bouton Voir', type: 'text', key: 'dashboardPayments.payment.viewButton', defaultValue: 'Voir' },
          { id: 'editButton', label: 'Bouton Modifier', type: 'text', key: 'dashboardPayments.payment.editButton', defaultValue: 'Modifier' },
          { id: 'deleteButton', label: 'Bouton Supprimer', type: 'text', key: 'dashboardPayments.payment.deleteButton', defaultValue: 'Supprimer' },
          { id: 'statusCompleted', label: 'Statut Complété', type: 'text', key: 'dashboardPayments.payment.statusCompleted', defaultValue: 'Complété' },
          { id: 'statusPending', label: 'Statut En attente', type: 'text', key: 'dashboardPayments.payment.statusPending', defaultValue: 'En attente' },
          { id: 'statusFailed', label: 'Statut Échoué', type: 'text', key: 'dashboardPayments.payment.statusFailed', defaultValue: 'Échoué' },
          { id: 'noPaymentsMessage', label: 'Message Aucun paiement', type: 'textarea', key: 'dashboardPayments.payment.noPayments', defaultValue: 'Aucun paiement pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'dashboardPromotions',
    name: 'Dashboard Promotions',
    route: '/dashboard/promotions',
    description: 'Personnalisez tous les éléments de la page promotions du dashboard',
    icon: Tag,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardPromotions.header.title', defaultValue: 'Promotions' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboardPromotions.header.subtitle', defaultValue: 'Gérez vos codes promo et réductions' },
          { id: 'newPromotionButton', label: 'Bouton Nouvelle promotion', type: 'text', key: 'dashboardPromotions.header.newPromotionButton', defaultValue: 'Nouvelle promotion' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'totalLabel', label: 'Label Total', type: 'text', key: 'dashboardPromotions.stats.total', defaultValue: 'Total' },
          { id: 'activeLabel', label: 'Label Actives', type: 'text', key: 'dashboardPromotions.stats.active', defaultValue: 'Actives' },
          { id: 'totalUsesLabel', label: 'Label Total utilisations', type: 'text', key: 'dashboardPromotions.stats.totalUses', defaultValue: 'Total utilisations' },
          { id: 'averageDiscountLabel', label: 'Label Remise moyenne', type: 'text', key: 'dashboardPromotions.stats.averageDiscount', defaultValue: 'Remise moyenne' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'searchPlaceholder', label: 'Placeholder Recherche', type: 'text', key: 'dashboardPromotions.filters.searchPlaceholder', defaultValue: 'Rechercher une promotion...' },
          { id: 'filterAll', label: 'Filtre Toutes', type: 'text', key: 'dashboardPromotions.filters.all', defaultValue: 'Toutes' },
          { id: 'filterActive', label: 'Filtre Actives', type: 'text', key: 'dashboardPromotions.filters.active', defaultValue: 'Actives' },
          { id: 'filterInactive', label: 'Filtre Inactives', type: 'text', key: 'dashboardPromotions.filters.inactive', defaultValue: 'Inactives' },
        ],
      },
      {
        id: 'promotion',
        name: 'Promotion',
        type: 'content',
        elements: [
          { id: 'codeLabel', label: 'Label Code', type: 'text', key: 'dashboardPromotions.promotion.code', defaultValue: 'Code' },
          { id: 'discountLabel', label: 'Label Remise', type: 'text', key: 'dashboardPromotions.promotion.discount', defaultValue: 'Remise' },
          { id: 'usesLabel', label: 'Label Utilisations', type: 'text', key: 'dashboardPromotions.promotion.uses', defaultValue: 'Utilisations' },
          { id: 'noPromotionsMessage', label: 'Message Aucune promotion', type: 'textarea', key: 'dashboardPromotions.promotion.noPromotions', defaultValue: 'Aucune promotion pour le moment' },
        ],
      },
    ],
  },
  {
    id: 'dashboardStore',
    name: 'Dashboard Boutique',
    route: '/dashboard/store',
    description: 'Personnalisez tous les éléments de la page boutique du dashboard',
    icon: Store,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'dashboardStore.header.title', defaultValue: 'Boutique' },
          { id: 'viewStoreButton', label: 'Bouton Voir la boutique', type: 'text', key: 'dashboardStore.header.viewStoreButton', defaultValue: 'Voir la boutique' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'manageTab', label: 'Onglet Gérer', type: 'text', key: 'dashboardStore.tabs.manage', defaultValue: 'Gérer' },
          { id: 'createTab', label: 'Onglet Créer', type: 'text', key: 'dashboardStore.tabs.create', defaultValue: 'Créer' },
        ],
      },
      {
        id: 'empty',
        name: 'État vide',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre état vide', type: 'text', key: 'dashboardStore.empty.title', defaultValue: 'Aucune boutique' },
          { id: 'description', label: 'Description état vide', type: 'textarea', key: 'dashboardStore.empty.description', defaultValue: 'Créez votre première boutique pour commencer à vendre' },
          { id: 'createButton', label: 'Bouton Créer boutique', type: 'text', key: 'dashboardStore.empty.createButton', defaultValue: 'Créer ma boutique' },
        ],
      },
      {
        id: 'store',
        name: 'Boutique',
        type: 'content',
        elements: [
          { id: 'nameLabel', label: 'Label Nom', type: 'text', key: 'dashboardStore.store.name', defaultValue: 'Nom' },
          { id: 'slugLabel', label: 'Label Slug', type: 'text', key: 'dashboardStore.store.slug', defaultValue: 'Slug' },
          { id: 'descriptionLabel', label: 'Label Description', type: 'text', key: 'dashboardStore.store.description', defaultValue: 'Description' },
          { id: 'statusLabel', label: 'Label Statut', type: 'text', key: 'dashboardStore.store.status', defaultValue: 'Statut' },
        ],
      },
    ],
  },
  {
    id: 'serviceDetail',
    name: 'Détail Service',
    route: '/service/:serviceId',
    description: 'Personnalisez tous les éléments de la page de détail d\'un service',
    icon: Calendar,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'backButton', label: 'Bouton Retour', type: 'text', key: 'serviceDetail.header.backButton', defaultValue: 'Retour' },
          { id: 'shareButton', label: 'Bouton Partager', type: 'text', key: 'serviceDetail.header.shareButton', defaultValue: 'Partager' },
          { id: 'wishlistButton', label: 'Bouton Wishlist', type: 'text', key: 'serviceDetail.header.wishlistButton', defaultValue: 'Ajouter à la wishlist' },
        ],
      },
      {
        id: 'booking',
        name: 'Réservation',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre Réservation', type: 'text', key: 'serviceDetail.booking.title', defaultValue: 'Réserver ce service' },
          { id: 'dateLabel', label: 'Label Date', type: 'text', key: 'serviceDetail.booking.dateLabel', defaultValue: 'Sélectionner une date' },
          { id: 'timeLabel', label: 'Label Heure', type: 'text', key: 'serviceDetail.booking.timeLabel', defaultValue: 'Sélectionner un créneau' },
          { id: 'participantsLabel', label: 'Label Participants', type: 'text', key: 'serviceDetail.booking.participantsLabel', defaultValue: 'Nombre de participants' },
          { id: 'bookButton', label: 'Bouton Réserver', type: 'text', key: 'serviceDetail.booking.bookButton', defaultValue: 'Réserver maintenant' },
          { id: 'bookingMessage', label: 'Message Réservation', type: 'textarea', key: 'serviceDetail.booking.message', defaultValue: 'Veuillez sélectionner une date et un créneau horaire' },
        ],
      },
      {
        id: 'info',
        name: 'Informations',
        type: 'content',
        elements: [
          { id: 'durationLabel', label: 'Label Durée', type: 'text', key: 'serviceDetail.info.durationLabel', defaultValue: 'Durée' },
          { id: 'locationLabel', label: 'Label Lieu', type: 'text', key: 'serviceDetail.info.locationLabel', defaultValue: 'Lieu' },
          { id: 'capacityLabel', label: 'Label Capacité', type: 'text', key: 'serviceDetail.info.capacityLabel', defaultValue: 'Capacité' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'serviceDetail.info.priceLabel', defaultValue: 'Prix' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'descriptionTab', label: 'Onglet Description', type: 'text', key: 'serviceDetail.tabs.description', defaultValue: 'Description' },
          { id: 'reviewsTab', label: 'Onglet Avis', type: 'text', key: 'serviceDetail.tabs.reviews', defaultValue: 'Avis' },
          { id: 'recommendationsTab', label: 'Onglet Recommandations', type: 'text', key: 'serviceDetail.tabs.recommendations', defaultValue: 'Recommandations' },
        ],
      },
    ],
  },
  {
    id: 'serviceManagement',
    name: 'Gestion Services',
    route: '/dashboard/service-management',
    description: 'Personnalisez tous les éléments de la page de gestion des services',
    icon: Briefcase,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'text', key: 'serviceManagement.header.title', defaultValue: 'Gestion des Services' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'serviceManagement.header.subtitle', defaultValue: 'Gérez vos services, calendrier et disponibilités' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'bookingsLabel', label: 'Label Réservations', type: 'text', key: 'serviceManagement.stats.bookings', defaultValue: 'Réservations' },
          { id: 'staffLabel', label: 'Label Personnel', type: 'text', key: 'serviceManagement.stats.staff', defaultValue: 'Personnel actif' },
          { id: 'conflictsLabel', label: 'Label Conflits', type: 'text', key: 'serviceManagement.stats.conflicts', defaultValue: 'Conflits détectés' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'calendarTab', label: 'Onglet Calendrier', type: 'text', key: 'serviceManagement.tabs.calendar', defaultValue: 'Calendrier' },
          { id: 'availabilityTab', label: 'Onglet Disponibilité', type: 'text', key: 'serviceManagement.tabs.availability', defaultValue: 'Disponibilité' },
          { id: 'conflictsTab', label: 'Onglet Conflits', type: 'text', key: 'serviceManagement.tabs.conflicts', defaultValue: 'Conflits' },
        ],
      },
    ],
  },
  {
    id: 'artistProductDetail',
    name: 'Œuvre d\'Artiste',
    route: '/artist/:productId',
    description: 'Personnalisez tous les éléments de la page de détail d\'une œuvre d\'artiste',
    icon: PenTool,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'backButton', label: 'Bouton Retour', type: 'text', key: 'artistProductDetail.header.backButton', defaultValue: 'Retour' },
          { id: 'shareButton', label: 'Bouton Partager', type: 'text', key: 'artistProductDetail.header.shareButton', defaultValue: 'Partager' },
          { id: 'wishlistButton', label: 'Bouton Wishlist', type: 'text', key: 'artistProductDetail.header.wishlistButton', defaultValue: 'Ajouter à la wishlist' },
        ],
      },
      {
        id: 'purchase',
        name: 'Achat',
        type: 'content',
        elements: [
          { id: 'quantityLabel', label: 'Label Quantité', type: 'text', key: 'artistProductDetail.purchase.quantityLabel', defaultValue: 'Quantité' },
          { id: 'addToCartButton', label: 'Bouton Ajouter au panier', type: 'text', key: 'artistProductDetail.purchase.addToCartButton', defaultValue: 'Ajouter au panier' },
          { id: 'buyNowButton', label: 'Bouton Acheter maintenant', type: 'text', key: 'artistProductDetail.purchase.buyNowButton', defaultValue: 'Acheter maintenant' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'artistProductDetail.purchase.priceLabel', defaultValue: 'Prix' },
        ],
      },
      {
        id: 'certificate',
        name: 'Certificat',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre Certificat', type: 'text', key: 'artistProductDetail.certificate.title', defaultValue: 'Certificat d\'authenticité' },
          { id: 'description', label: 'Description Certificat', type: 'textarea', key: 'artistProductDetail.certificate.description', defaultValue: 'Cette œuvre est accompagnée d\'un certificat d\'authenticité' },
          { id: 'artistLabel', label: 'Label Artiste', type: 'text', key: 'artistProductDetail.certificate.artistLabel', defaultValue: 'Artiste' },
          { id: 'yearLabel', label: 'Label Année', type: 'text', key: 'artistProductDetail.certificate.yearLabel', defaultValue: 'Année' },
        ],
      },
      {
        id: 'shipping',
        name: 'Livraison',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre Livraison', type: 'text', key: 'artistProductDetail.shipping.title', defaultValue: 'Informations de livraison' },
          { id: 'shippingLabel', label: 'Label Livraison', type: 'text', key: 'artistProductDetail.shipping.shippingLabel', defaultValue: 'Livraison' },
          { id: 'handlingLabel', label: 'Label Manutention', type: 'text', key: 'artistProductDetail.shipping.handlingLabel', defaultValue: 'Manutention spéciale' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'descriptionTab', label: 'Onglet Description', type: 'text', key: 'artistProductDetail.tabs.description', defaultValue: 'Description' },
          { id: 'reviewsTab', label: 'Onglet Avis', type: 'text', key: 'artistProductDetail.tabs.reviews', defaultValue: 'Avis' },
          { id: 'certificateTab', label: 'Onglet Certificat', type: 'text', key: 'artistProductDetail.tabs.certificate', defaultValue: 'Certificat' },
        ],
      },
    ],
  },
  {
    id: 'digitalProductDetail',
    name: 'Détail Produit Digital',
    route: '/digital/:productId',
    description: 'Personnalisez tous les éléments de la page de détail d\'un produit digital',
    icon: Download,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'backButton', label: 'Bouton Retour', type: 'text', key: 'digitalProductDetail.header.backButton', defaultValue: 'Retour' },
          { id: 'compareButton', label: 'Bouton Comparer', type: 'text', key: 'digitalProductDetail.header.compareButton', defaultValue: 'Comparer' },
        ],
      },
      {
        id: 'purchase',
        name: 'Achat',
        type: 'content',
        elements: [
          { id: 'buyButton', label: 'Bouton Acheter', type: 'text', key: 'digitalProductDetail.purchase.buyButton', defaultValue: 'Acheter maintenant' },
          { id: 'downloadButton', label: 'Bouton Télécharger', type: 'text', key: 'digitalProductDetail.purchase.downloadButton', defaultValue: 'Télécharger' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'digitalProductDetail.purchase.priceLabel', defaultValue: 'Prix' },
          { id: 'licenseLabel', label: 'Label Licence', type: 'text', key: 'digitalProductDetail.purchase.licenseLabel', defaultValue: 'Licence' },
        ],
      },
      {
        id: 'files',
        name: 'Fichiers',
        type: 'content',
        elements: [
          { id: 'filesTitle', label: 'Titre Fichiers', type: 'text', key: 'digitalProductDetail.files.title', defaultValue: 'Fichiers inclus' },
          { id: 'fileSizeLabel', label: 'Label Taille', type: 'text', key: 'digitalProductDetail.files.sizeLabel', defaultValue: 'Taille' },
          { id: 'fileFormatLabel', label: 'Label Format', type: 'text', key: 'digitalProductDetail.files.formatLabel', defaultValue: 'Format' },
          { id: 'downloadCountLabel', label: 'Label Téléchargements', type: 'text', key: 'digitalProductDetail.files.downloadCountLabel', defaultValue: 'Téléchargements' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'descriptionTab', label: 'Onglet Description', type: 'text', key: 'digitalProductDetail.tabs.description', defaultValue: 'Description' },
          { id: 'filesTab', label: 'Onglet Fichiers', type: 'text', key: 'digitalProductDetail.tabs.files', defaultValue: 'Fichiers détails' },
          { id: 'reviewsTab', label: 'Onglet Avis', type: 'text', key: 'digitalProductDetail.tabs.reviews', defaultValue: 'Avis' },
          { id: 'faqsTab', label: 'Onglet FAQs', type: 'text', key: 'digitalProductDetail.tabs.faqs', defaultValue: 'FAQs' },
        ],
      },
    ],
  },
  {
    id: 'physicalProductDetail',
    name: 'Détail Produit Physique',
    route: '/physical/:productId',
    description: 'Personnalisez tous les éléments de la page de détail d\'un produit physique',
    icon: Package,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'backButton', label: 'Bouton Retour', type: 'text', key: 'physicalProductDetail.header.backButton', defaultValue: 'Retour' },
          { id: 'shareButton', label: 'Bouton Partager', type: 'text', key: 'physicalProductDetail.header.shareButton', defaultValue: 'Partager' },
          { id: 'wishlistButton', label: 'Bouton Wishlist', type: 'text', key: 'physicalProductDetail.header.wishlistButton', defaultValue: 'Ajouter à la wishlist' },
        ],
      },
      {
        id: 'purchase',
        name: 'Achat',
        type: 'content',
        elements: [
          { id: 'quantityLabel', label: 'Label Quantité', type: 'text', key: 'physicalProductDetail.purchase.quantityLabel', defaultValue: 'Quantité' },
          { id: 'addToCartButton', label: 'Bouton Ajouter au panier', type: 'text', key: 'physicalProductDetail.purchase.addToCartButton', defaultValue: 'Ajouter au panier' },
          { id: 'buyNowButton', label: 'Bouton Acheter maintenant', type: 'text', key: 'physicalProductDetail.purchase.buyNowButton', defaultValue: 'Acheter maintenant' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'physicalProductDetail.purchase.priceLabel', defaultValue: 'Prix' },
          { id: 'stockLabel', label: 'Label Stock', type: 'text', key: 'physicalProductDetail.purchase.stockLabel', defaultValue: 'Stock' },
        ],
      },
      {
        id: 'variants',
        name: 'Variantes',
        type: 'content',
        elements: [
          { id: 'variantLabel', label: 'Label Variante', type: 'text', key: 'physicalProductDetail.variants.variantLabel', defaultValue: 'Variante' },
          { id: 'sizeLabel', label: 'Label Taille', type: 'text', key: 'physicalProductDetail.variants.sizeLabel', defaultValue: 'Taille' },
          { id: 'colorLabel', label: 'Label Couleur', type: 'text', key: 'physicalProductDetail.variants.colorLabel', defaultValue: 'Couleur' },
        ],
      },
      {
        id: 'shipping',
        name: 'Livraison',
        type: 'content',
        elements: [
          { id: 'shippingTitle', label: 'Titre Livraison', type: 'text', key: 'physicalProductDetail.shipping.title', defaultValue: 'Informations de livraison' },
          { id: 'shippingLabel', label: 'Label Livraison', type: 'text', key: 'physicalProductDetail.shipping.shippingLabel', defaultValue: 'Livraison' },
          { id: 'dimensionsLabel', label: 'Label Dimensions', type: 'text', key: 'physicalProductDetail.shipping.dimensionsLabel', defaultValue: 'Dimensions' },
          { id: 'weightLabel', label: 'Label Poids', type: 'text', key: 'physicalProductDetail.shipping.weightLabel', defaultValue: 'Poids' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'descriptionTab', label: 'Onglet Description', type: 'text', key: 'physicalProductDetail.tabs.description', defaultValue: 'Description' },
          { id: 'specificationsTab', label: 'Onglet Spécifications', type: 'text', key: 'physicalProductDetail.tabs.specifications', defaultValue: 'Spécifications' },
          { id: 'reviewsTab', label: 'Onglet Avis', type: 'text', key: 'physicalProductDetail.tabs.reviews', defaultValue: 'Avis' },
        ],
      },
    ],
  },
  {
    id: 'courseDetail',
    name: 'Détail Cours',
    route: '/courses/:slug',
    description: 'Personnalisez tous les éléments de la page de détail d\'un cours',
    icon: GraduationCap,
    sections: [
      {
        id: 'hero',
        name: 'Section Hero',
        type: 'content',
        elements: [
          { id: 'categoryLabel', label: 'Label Catégorie', type: 'text', key: 'courseDetail.hero.categoryLabel', defaultValue: 'Catégorie' },
          { id: 'ratingLabel', label: 'Label Note', type: 'text', key: 'courseDetail.hero.ratingLabel', defaultValue: 'Note' },
          { id: 'studentsLabel', label: 'Label Étudiants', type: 'text', key: 'courseDetail.hero.studentsLabel', defaultValue: 'Étudiants' },
          { id: 'durationLabel', label: 'Label Durée', type: 'text', key: 'courseDetail.hero.durationLabel', defaultValue: 'Durée' },
          { id: 'lessonsLabel', label: 'Label Leçons', type: 'text', key: 'courseDetail.hero.lessonsLabel', defaultValue: 'Leçons' },
          { id: 'languageLabel', label: 'Label Langue', type: 'text', key: 'courseDetail.hero.languageLabel', defaultValue: 'Langue' },
          { id: 'instructorLabel', label: 'Label Instructeur', type: 'text', key: 'courseDetail.hero.instructorLabel', defaultValue: 'Créé par' },
        ],
      },
      {
        id: 'enrollment',
        name: 'Inscription',
        type: 'content',
        elements: [
          { id: 'enrollButton', label: 'Bouton S\'inscrire', type: 'text', key: 'courseDetail.enrollment.enrollButton', defaultValue: 'S\'inscrire maintenant' },
          { id: 'accessButton', label: 'Bouton Accéder', type: 'text', key: 'courseDetail.enrollment.accessButton', defaultValue: 'Accéder au cours' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'courseDetail.enrollment.priceLabel', defaultValue: 'Prix' },
          { id: 'includesTitle', label: 'Titre Inclus', type: 'text', key: 'courseDetail.enrollment.includesTitle', defaultValue: 'Ce cours comprend' },
          { id: 'lessonsCountLabel', label: 'Label Nombre de leçons', type: 'text', key: 'courseDetail.enrollment.lessonsCountLabel', defaultValue: 'leçons' },
          { id: 'durationTotalLabel', label: 'Label Durée totale', type: 'text', key: 'courseDetail.enrollment.durationTotalLabel', defaultValue: 'de contenu' },
          { id: 'certificateLabel', label: 'Label Certificat', type: 'text', key: 'courseDetail.enrollment.certificateLabel', defaultValue: 'Certificat de complétion' },
          { id: 'lifetimeAccessLabel', label: 'Label Accès à vie', type: 'text', key: 'courseDetail.enrollment.lifetimeAccessLabel', defaultValue: 'Accès à vie' },
        ],
      },
      {
        id: 'curriculum',
        name: 'Curriculum',
        type: 'content',
        elements: [
          { id: 'curriculumTitle', label: 'Titre Curriculum', type: 'text', key: 'courseDetail.curriculum.title', defaultValue: 'Curriculum du cours' },
          { id: 'sectionLabel', label: 'Label Section', type: 'text', key: 'courseDetail.curriculum.sectionLabel', defaultValue: 'Section' },
          { id: 'lessonLabel', label: 'Label Leçon', type: 'text', key: 'courseDetail.curriculum.lessonLabel', defaultValue: 'Leçon' },
          { id: 'previewLabel', label: 'Label Aperçu', type: 'text', key: 'courseDetail.curriculum.previewLabel', defaultValue: 'Aperçu' },
        ],
      },
      {
        id: 'objectives',
        name: 'Objectifs',
        type: 'content',
        elements: [
          { id: 'objectivesTitle', label: 'Titre Objectifs', type: 'text', key: 'courseDetail.objectives.title', defaultValue: 'Ce que vous allez apprendre' },
          { id: 'prerequisitesTitle', label: 'Titre Prérequis', type: 'text', key: 'courseDetail.objectives.prerequisitesTitle', defaultValue: 'Prérequis' },
        ],
      },
    ],
  },
  {
    id: 'bundleDetail',
    name: 'Détail Bundle',
    route: '/bundles/:bundleId',
    description: 'Personnalisez tous les éléments de la page de détail d\'un bundle',
    icon: Layers,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'backButton', label: 'Bouton Retour', type: 'text', key: 'bundleDetail.header.backButton', defaultValue: 'Retour' },
          { id: 'shareButton', label: 'Bouton Partager', type: 'text', key: 'bundleDetail.header.shareButton', defaultValue: 'Partager' },
        ],
      },
      {
        id: 'purchase',
        name: 'Achat',
        type: 'content',
        elements: [
          { id: 'buyButton', label: 'Bouton Acheter', type: 'text', key: 'bundleDetail.purchase.buyButton', defaultValue: 'Acheter le bundle' },
          { id: 'priceLabel', label: 'Label Prix', type: 'text', key: 'bundleDetail.purchase.priceLabel', defaultValue: 'Prix' },
          { id: 'savingsLabel', label: 'Label Économies', type: 'text', key: 'bundleDetail.purchase.savingsLabel', defaultValue: 'Vous économisez' },
          { id: 'valueLabel', label: 'Label Valeur', type: 'text', key: 'bundleDetail.purchase.valueLabel', defaultValue: 'Valeur totale' },
        ],
      },
      {
        id: 'products',
        name: 'Produits',
        type: 'content',
        elements: [
          { id: 'productsTitle', label: 'Titre Produits inclus', type: 'text', key: 'bundleDetail.products.title', defaultValue: 'Produits inclus dans ce bundle' },
          { id: 'productCountLabel', label: 'Label Nombre de produits', type: 'text', key: 'bundleDetail.products.countLabel', defaultValue: 'produits' },
          { id: 'viewProductButton', label: 'Bouton Voir produit', type: 'text', key: 'bundleDetail.products.viewProductButton', defaultValue: 'Voir le produit' },
        ],
      },
      {
        id: 'tabs',
        name: 'Onglets',
        type: 'content',
        elements: [
          { id: 'descriptionTab', label: 'Onglet Description', type: 'text', key: 'bundleDetail.tabs.description', defaultValue: 'Description' },
          { id: 'productsTab', label: 'Onglet Produits', type: 'text', key: 'bundleDetail.tabs.products', defaultValue: 'Produits' },
          { id: 'reviewsTab', label: 'Onglet Avis', type: 'text', key: 'bundleDetail.tabs.reviews', defaultValue: 'Avis' },
        ],
      },
    ],
  },
];

export const PagesCustomizationSection = ({ onChange }: PagesCustomizationSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState<string>('landing');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [pageValues, setPageValues] = useState<Record<string, Record<string, any>>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Charger les valeurs existantes
  useEffect(() => {
    if (customizationData?.pages) {
      setPageValues(customizationData.pages);
    }
  }, [customizationData]);

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const selectedPageConfig = useMemo(() => 
    PAGES_CONFIG.find(p => p.id === selectedPage),
    [selectedPage]
  );

  // Debounce pour les sauvegardes automatiques
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Record<string, Record<string, any>>>({});

  const handleElementChange = useCallback((pageId: string, elementKey: string, value: any) => {
    setPageValues(prev => {
      const updated = {
        ...prev,
        [pageId]: {
          ...prev[pageId],
          [elementKey]: value,
        },
      };
      
      // Mettre à jour les changements en attente
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        [pageId]: {
          ...pendingChangesRef.current[pageId],
          [elementKey]: value,
        },
      };
      
      // Déclencher immédiatement l'événement pour synchronisation temps réel
      // (avant même la sauvegarde en base)
      const currentData = customizationData || {};
      const updatedData = {
        ...currentData,
        pages: {
          ...currentData.pages,
          ...updated,
        },
      };
      
      // Mettre à jour l'état local immédiatement pour synchronisation temps réel
      window.dispatchEvent(new CustomEvent('platform-customization-updated', {
        detail: { customizationData: updatedData }
      }));
      
      // Debounce la sauvegarde en base (500ms)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        const changesToSave = pendingChangesRef.current;
        if (Object.keys(changesToSave).length > 0) {
          setIsSyncing(true);
          try {
            // Fusionner avec les données existantes
            const currentPages = customizationData?.pages || {};
            const mergedPages = {
              ...currentPages,
              ...changesToSave,
            };
            
            await save('pages', mergedPages).catch((error) => {
              logger.error('Error saving page customization', { error, pageId, elementKey });
            });
            
            // Réinitialiser les changements en attente
            pendingChangesRef.current = {};
          } finally {
            setIsSyncing(false);
          }
        }
      }, 500);
      
      return updated;
    });

    if (onChange) onChange();
  }, [save, onChange, customizationData]);

  const handleImageUpload = useCallback(async (pageId: string, elementKey: string, file: File) => {
    try {
      setUploadingImages(prev => ({ ...prev, [`${pageId}.${elementKey}`]: true }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${pageId}/${elementKey}-${Date.now()}.${fileExt}`;
      const filePath = `page-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(filePath);

      handleElementChange(pageId, elementKey, publicUrl);

      toast({
        title: 'Image uploadée',
        description: 'L\'image a été uploadée avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'uploader l\'image.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(prev => ({ ...prev, [`${pageId}.${elementKey}`]: false }));
    }
  }, [handleElementChange, toast]);

  const getElementValue = useCallback((pageId: string, elementKey: string, defaultValue?: string) => {
    return pageValues[pageId]?.[elementKey] ?? defaultValue ?? '';
  }, [pageValues]);

  const renderElementEditor = useCallback((pageId: string, element: PageElement) => {
    const value = getElementValue(pageId, element.key, element.defaultValue);

    switch (element.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            className="text-sm"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            rows={3}
            className="text-sm"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value || element.defaultValue || '#000000'}
              onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={value || element.defaultValue || ''}
              onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
              placeholder={element.defaultValue}
              className="flex-1 text-sm"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {value && (
              <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden">
                <img src={value} alt={element.label} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleElementChange(pageId, element.key, '')}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(pageId, element.key, file);
                }}
                className="hidden"
                id={`image-${pageId}-${element.key}`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`image-${pageId}-${element.key}`)?.click()}
                disabled={uploadingImages[`${pageId}.${element.key}`]}
                className="w-full sm:w-auto"
              >
                {uploadingImages[`${pageId}.${element.key}`] ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {value ? 'Remplacer' : 'Uploader'}
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'font':
        return (
          <Select
            value={value || element.defaultValue || 'Poppins'}
            onValueChange={(val) => handleElementChange(pageId, element.key, val)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || element.defaultValue || 0}
            onChange={(e) => handleElementChange(pageId, element.key, parseFloat(e.target.value) || 0)}
            className="text-sm"
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value || element.defaultValue || ''}
            onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            className="text-sm"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value ?? (element.defaultValue === 'true')}
              onChange={(e) => handleElementChange(pageId, element.key, e.target.checked)}
              className="rounded"
            />
            <Label className="text-sm">{element.label}</Label>
          </div>
        );

      default:
        return null;
    }
  }, [getElementValue, handleElementChange, handleImageUpload, uploadingImages]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sélection de la page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Sélectionner une page
          </CardTitle>
          <CardDescription>
            Choisissez la page que vous souhaitez personnaliser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAGES_CONFIG.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page.id);
                    setSelectedSection(page.sections[0]?.id || '');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPage === page.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">{page.name}</div>
                      <div className="text-xs text-muted-foreground">{page.route}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {page.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Éditeur de la page sélectionnée */}
      {selectedPageConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <selectedPageConfig.icon className="h-5 w-5" />
                  {selectedPageConfig.name}
                  {isSyncing && (
                    <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Synchronisation...</span>
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Personnalisez tous les éléments de cette page
                  {isSyncing && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      • Les modifications sont appliquées en temps réel
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant="outline">{selectedPageConfig.sections.length} sections</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSection || selectedPageConfig.sections[0]?.id} onValueChange={setSelectedSection}>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <TabsList className="inline-flex w-full justify-start p-1">
                  {selectedPageConfig.sections.map((section) => (
                    <TabsTrigger key={section.id} value={section.id} className="text-xs sm:text-sm shrink-0">
                      {section.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {selectedPageConfig.sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {section.elements.map((element) => (
                      <div key={element.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${selectedPage}-${element.id}`} className="text-sm font-medium">
                            {element.label}
                          </Label>
                          {element.description && (
                            <Badge variant="secondary" className="text-xs">
                              {element.type}
                            </Badge>
                          )}
                        </div>
                        {element.description && (
                          <p className="text-xs text-muted-foreground">{element.description}</p>
                        )}
                        {renderElementEditor(selectedPage, element)}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

