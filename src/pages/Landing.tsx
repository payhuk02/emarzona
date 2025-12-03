import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Shield, 
  Globe, 
  DollarSign, 
  BarChart3, 
  Lock, 
  Smartphone, 
  Star,
  Users,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  TrendingUp,
  Package,
  CreditCard,
  Mail,
  Truck,
  GraduationCap,
  Briefcase,
  Gift,
  Award,
  MessageSquare,
  FileText,
  ShoppingCart,
  Settings,
  Target,
  Sparkles,
  Rocket,
  Infinity,
  Heart,
  Coins,
  Building2,
  HeadphonesIcon,
  Palette,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { usePlatformLogo } from "@/hooks/usePlatformLogo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { OptimizedImg } from "@/components/shared/OptimizedImg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { WebsiteSchema } from "@/components/seo/WebsiteSchema";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePageCustomization } from "@/hooks/usePageCustomization";
import {
  StoreDashboardMockup,
  MultiCurrencyMockup,
  SecurityMockup,
  AnalyticsMockup,
  SupportMockup,
  CoverageMapMockup,
} from "@/components/landing/LandingMockups";

const Landing = () => {
  const { t } = useTranslation();
  const { getValue } = usePageCustomization('landing');
  const platformLogo = usePlatformLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    sales: 0,
    stores: 0,
    products: 0
  });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  // Animated counters for stats - Optimisé avec requestAnimationFrame
  useEffect(() => {
    const targetStats = { users: 2500, sales: 150000, stores: 850, products: 12000 };
    const duration = 2000;
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        users: Math.floor(targetStats.users * easedProgress),
        sales: Math.floor(targetStats.sales * easedProgress),
        stores: Math.floor(targetStats.stores * easedProgress),
        products: Math.floor(targetStats.products * easedProgress)
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setAnimatedStats(targetStats);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const baseUrl = window.location.origin;

  // Animations au scroll pour les sections
  const heroRef = useScrollAnimation<HTMLDivElement>();
  const featuresRef = useScrollAnimation<HTMLDivElement>();
  const pricingRef = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* SEO Meta Tags */}
      <SEOMeta
        title="Emarzona - Plateforme E-commerce Complète avec Marketplace | Produits Digitaux, Physiques, Services & Cours"
        description="Vendez 5 types de produits sur une seule plateforme : produits digitaux, physiques, services, cours en ligne et oeuvres d'artiste. Créez votre boutique ou vendez sur notre Marketplace. Paiements multi-devises, email marketing avancé, shipping FedEx, analytics intégrés. Démarrez gratuitement."
        keywords="emarzona, ecommerce, plateforme e-commerce, marketplace, produits digitaux, produits physiques, services, cours en ligne, paiements FCFA, PayDunya, Moneroo, email marketing, shipping FedEx"
        url={baseUrl}
        canonical={baseUrl}
        image={`${baseUrl}/og-landing.jpg`}
        imageAlt="Emarzona - Plateforme de ecommerce et marketplace complète"
        type="website"
        locale="fr_FR"
      />

      {/* Schema.org Website Data */}
      <WebsiteSchema />
      
      {/* Header Premium - Design Moderne */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg" role="banner">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="relative flex items-center justify-start gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-7 sm:relative sm:left-auto sm:top-auto sm:translate-y-0 sm:h-8 sm:w-8 md:h-9 md:w-9 z-0">
              {platformLogo ? (
                <OptimizedImg
                  src={platformLogo}
                  alt="Emarzona"
                  width={36}
                  height={36}
                  className="h-full w-full opacity-70 sm:opacity-100 flex-shrink-0 object-contain rounded-lg"
                  priority={true}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center opacity-70 sm:opacity-100 flex-shrink-0 shadow-md">
                  <span className="text-xs sm:text-sm font-bold text-white">E</span>
                </div>
              )}
            </div>
            <span className="relative z-10 pl-8 sm:pl-0 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-foreground tracking-tight">
              Emarzona
            </span>
          </div>
          
          {/* Desktop Navigation Premium */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Navigation principale">
            <Link to="/marketplace">
              <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4">
                Marketplace
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Fonctionnalités
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Tarifs
            </Button>
            <LanguageSwitcher variant="ghost" showLabel={false} />
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4">
                Connexion
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-accent text-accent-foreground font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 text-sm xl:text-base px-4 xl:px-6">
                Démarrer gratuitement
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2.5 text-foreground hover:text-primary transition-smooth min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t bg-card/98 backdrop-blur-sm animate-fade-in-up" aria-label="Menu mobile">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground hover:text-primary transition-smooth">
                  Marketplace
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full text-foreground hover:text-primary transition-smooth"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Fonctionnalités
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-foreground hover:text-primary transition-smooth"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Tarifs
              </Button>
              <div className="border-t pt-3">
                <LanguageSwitcher variant="outline" showLabel={true} className="w-full" />
              </div>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground hover:text-primary transition-smooth">
                  Connexion
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gradient-accent text-accent-foreground font-semibold shadow-glow hover:opacity-90 transition-smooth">
                  Démarrer gratuitement
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section - Design Premium Inspiré Stripe/Linear */}
      <section className="relative py-6 sm:py-10 md:py-14 lg:py-20 overflow-hidden" ref={heroRef} aria-label="Section principale">
        {/* Background avec gradient animé et effets de lumière */}
        <div className="gradient-hero relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] mx-3 sm:mx-4 md:mx-6 lg:mx-8 py-10 sm:py-14 md:py-20 lg:py-28">
          {/* Effets de lumière animés */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(30,58,138,0.4),transparent_50%)] rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.2),transparent_60%)] rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem]"></div>
          
          {/* Grille de fond subtile */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
              {/* Badge Premium */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                <span className="text-[10px] sm:text-xs md:text-sm text-white font-semibold tracking-wide">La plateforme e-commerce la plus complète d'Afrique</span>
              </div>
              
              {/* Titre Principal - Typographie Responsive Optimisée */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold mb-3 sm:mb-4 md:mb-6 leading-[1.1] sm:leading-tight text-white px-2 sm:px-4 break-words tracking-tight">
                <span className="block mb-1 sm:mb-2">Vendez 5 types de produits</span>
                <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">sur une seule plateforme</span>
              </h1>
              
              {/* Sous-titre Optimisé */}
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/85 sm:text-white/90 mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 break-words font-medium">
                Produits digitaux, physiques, services, cours en ligne et œuvres d'artiste. Créez votre boutique, vendez sur notre Marketplace ou les deux ! Tout ce dont vous avez besoin pour créer et développer votre business en ligne.
              </p>
              
              {/* CTAs Premium avec meilleure hiérarchie */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10 md:mb-12 px-4">
                <Link to="/auth" className="w-full sm:w-auto group">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shadow-xl hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-2xl">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/marketplace" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/5 backdrop-blur-md text-white text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-2 border-white/30 hover:bg-white/10 hover:border-white/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-semibold">
                    Explorer la marketplace
                  </Button>
                </Link>
              </div>

              {/* Stats Counter Premium - Design Moderne */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto mb-6 sm:mb-8 md:mb-12 px-2 sm:px-4">
                <div className="group bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1 sm:mb-1.5 break-words">
                    {animatedStats.users.toLocaleString()}+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-semibold leading-tight">Vendeurs actifs</div>
                </div>
                <div className="group bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1 sm:mb-1.5 break-words">
                    {animatedStats.products.toLocaleString()}+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-semibold leading-tight">Produits disponibles</div>
                </div>
                <div className="group bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1 sm:mb-1.5 break-words">
                    {animatedStats.sales.toLocaleString()}+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-semibold leading-tight">Ventes réalisées</div>
                </div>
                <div className="group bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-1.5 break-words">
                    {animatedStats.stores}+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-semibold leading-tight">Boutiques créées</div>
                </div>
              </div>

              {/* Dashboard Mockup Premium avec animation améliorée */}
              <div className="relative mt-6 sm:mt-8 md:mt-10 mx-2 sm:mx-4 md:mx-0 hidden sm:block">
                <div className="animate-float hover:scale-[1.02] transition-transform duration-500">
                  <StoreDashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Types Section - Optimisé Mobile */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background scroll-mt-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 border border-primary/20">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary">5 Types de Produits</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-3 sm:mb-4 text-foreground px-2 sm:px-4 leading-tight tracking-tight">
              Vendez tout ce que vous voulez
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed font-medium">
              Une plateforme unique pour gérer tous vos produits : digitaux, physiques, services, cours en ligne et œuvres d'artiste. Vendez depuis votre boutique ou exposez vos produits sur notre Marketplace pour toucher plus de clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Digital Products */}
            <Card className="bg-card border-border/50 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl gradient-primary flex items-center justify-center mb-3 sm:mb-4 mx-auto text-primary-foreground group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-foreground">Produits Digitaux</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4 font-medium">
                  eBooks, logiciels, templates, formations numériques. Protection des téléchargements, système de licences et analytics intégrés.
                </p>
                <ul className="text-left space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                    <span>Upload illimité de fichiers</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                    <span>Système de licences avancé</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                    <span>Protection anti-piratage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Physical Products */}
            <Card className="bg-card border-border/50 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl gradient-accent flex items-center justify-center mb-3 sm:mb-4 mx-auto text-accent-foreground group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-foreground">Produits Physiques</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4 font-medium">
                  Gestion d'inventaire avancée, variants, tracking de stock. Intégration FedEx pour calcul de frais de port et génération d'étiquettes.
                </p>
                <ul className="text-left space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                    <span>Gestion d'inventaire en temps réel</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                    <span>Shipping FedEx intégré</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                    <span>Variants et lots</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-card border-border/50 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto text-purple-600 group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <Briefcase className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-foreground">Services</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4 font-medium">
                  Système de réservation avec calendrier moderne, gestion de disponibilité, staff assignment et notifications automatiques.
                </p>
                <ul className="text-left space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                    <span>Calendrier de réservation</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                    <span>Gestion de disponibilité</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                    <span>Assignation de staff</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Courses */}
            <Card className="bg-card border-border/50 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-orange-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto text-orange-600 group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-foreground">Cours en Ligne</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4 font-medium">
                  Plateforme LMS complète avec modules, leçons, quiz, progression, certificats et gamification pour vos étudiants.
                </p>
                <ul className="text-left space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                    <span>Éditeur de curriculum</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                    <span>Quizzes et examens</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                    <span>Certificats de fin</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Artist Works */}
            <Card className="bg-card border-border/50 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-pink-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto text-pink-600 group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <Palette className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-foreground">Oeuvres d'Artiste</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4 font-medium">
                  Vendez vos créations artistiques : peintures, sculptures, livres, musique, designs. Gestion d'éditions limitées, certificats d'authenticité et profils artistes dédiés.
                </p>
                <ul className="text-left space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 shrink-0" />
                    <span>5 types d'artistes supportés</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 shrink-0" />
                    <span>Éditions limitées & originaux</span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 shrink-0" />
                    <span>Certificats d'authenticité</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods Section - Optimisé Mobile */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="hidden sm:block">
                <MultiCurrencyMockup />
              </div>
              <div className="sm:hidden">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-gradient-to-br from-white via-slate-50/50 to-white backdrop-blur-xl p-4">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-xl">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-base font-bold text-foreground">Paiements Multi-Devises</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['FCFA', 'EUR', 'USD', '50+'].map((currency, i) => (
                        <div key={i} className="bg-card/50 rounded-lg p-3 border border-border">
                          <div className="text-lg font-bold text-primary">{currency}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 border border-primary/20">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold text-primary">Paiements Multi-Devises</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-foreground leading-tight tracking-tight">
                Acceptez les paiements du monde entier
              </h3>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed font-medium">
                Intégrations natives avec PayDunya, Moneroo, Stripe, PayPal et Flutterwave. Acceptez les paiements en FCFA, EUR, USD et 50+ autres devises. Paiement intégral, par acompte ou sécurisé (escrow).
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">50+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">Devises supportées</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1">5</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">Passerelles de paiement</div>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Configurer les paiements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section - Optimisé Mobile */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 border border-primary/20">
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold text-primary">Marketplace Intégré</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-foreground leading-tight tracking-tight">
                Découvrez notre Marketplace
              </h3>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed font-medium">
                Explorez des milliers de produits de vendeurs vérifiés. Achetez des produits digitaux, physiques, services et cours en ligne en toute sécurité. Recherche avancée, filtres intelligents et recommandations personnalisées pour trouver exactement ce que vous cherchez.
              </p>
              <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Catalogue Complet</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Des milliers de produits de tous types : digitaux, physiques, services et cours</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Recherche Intelligente</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Recherche avancée avec filtres par catégorie, prix, note et disponibilité</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Recommandations Personnalisées</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Découvrez des produits adaptés à vos préférences et historique d'achat</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Achat Sécurisé</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Paiements sécurisés avec escrow, garanties et système de notation</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">{animatedStats.products.toLocaleString()}+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">Produits disponibles</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1">{animatedStats.users.toLocaleString()}+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">Vendeurs vérifiés</div>
                </div>
              </div>
              <Link to="/marketplace">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Explorer la marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-border/60 bg-gradient-to-br from-white via-slate-50/50 to-white backdrop-blur-xl">
                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-foreground">Marketplace Emarzona</h4>
                      <p className="text-sm text-muted-foreground">Découvrez nos produits</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Formation E-commerce", price: "25 000 FCFA", rating: 4.8, type: "Cours" },
                      { name: "Template WordPress", price: "15 000 FCFA", rating: 4.9, type: "Digital" },
                      { name: "Consultation SEO", price: "50 000 FCFA", rating: 5.0, type: "Service" },
                    ].map((product, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border hover:shadow-md transition-smooth">
                        <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-foreground truncate">{product.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-accent fill-current" />
                              <span className="text-xs text-muted-foreground">{product.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{product.type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-primary">{product.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/marketplace">
                    <Button variant="outline" className="w-full mt-4">
                      Voir tous les produits
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Marketing Section - Optimisé Mobile */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 border border-accent/20">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                <span className="text-xs sm:text-sm font-semibold text-accent">Email Marketing Avancé</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-foreground leading-tight tracking-tight">
                Automatisez votre marketing email
              </h3>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed font-medium">
                Campagnes ciblées, séquences automatisées, workflows conditionnels, segmentation avancée et analytics en temps réel. Tout ce dont vous avez besoin pour convertir vos visiteurs en clients.
              </p>
              <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Campagnes & Séquences</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Créez des campagnes ciblées et des séquences d'emails automatisées</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Segmentation Avancée</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Segments statiques et dynamiques basés sur le comportement</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Workflows Automatisés</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Déclencheurs basés sur les événements et actions conditionnelles</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">Analytics Complets</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Suivez les ouvertures, clics, conversions et ROI en temps réel</div>
                  </div>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Découvrir l'email marketing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <AnalyticsMockup />
          </div>
          </div>
        </div>
      </section>

      {/* Shipping Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="bg-card rounded-xl p-6 border border-border shadow-medium">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">FedEx Integration</h4>
                    <p className="text-sm text-muted-foreground">Shipping professionnel</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-foreground">Calcul de frais en temps réel</span>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-foreground">Génération d'étiquettes</span>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-foreground">Tracking automatique</span>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-primary">Shipping Professionnel</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Livraison simplifiée avec FedEx
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Intégration native avec FedEx pour calculer automatiquement les frais de port, générer des étiquettes d'expédition et suivre vos colis en temps réel. Vos clients reçoivent des notifications automatiques à chaque étape.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Configurer le shipping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
                </div>
              </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              Fonctionnalités avancées pour développer votre business
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Tout ce dont vous avez besoin pour créer, vendre et développer votre activité en ligne.
            </p>
            </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {/* Affiliation */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center mb-4 text-accent-foreground group-hover:shadow-glow transition-smooth">
                  <TrendingUp className="h-6 w-6" />
          </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Programme d'Affiliation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Créez un programme d'affiliation avec commissions personnalisées. Gérez vos affiliés et suivez leurs performances.
                </p>
              </CardContent>
            </Card>

            {/* Cartes Cadeaux */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4 text-pink-600 group-hover:shadow-glow transition-smooth">
                  <Gift className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Cartes Cadeaux</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vendez et acceptez les cartes cadeaux. Gérez les codes, les montants et les dates d'expiration.
                </p>
              </CardContent>
            </Card>

            {/* Fidélité */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4 text-yellow-600 group-hover:shadow-glow transition-smooth">
                  <Award className="h-6 w-6" />
              </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Programme de Fidélité</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Récompensez vos clients avec des points de fidélité. Créez des règles personnalisées et augmentez la rétention.
                </p>
              </CardContent>
            </Card>

            {/* Parrainage */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 text-green-600 group-hover:shadow-glow transition-smooth">
                  <Users className="h-6 w-6" />
            </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Parrainage</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Système de parrainage utilisateur avec codes de référence. Suivez les invitations et récompensez vos ambassadeurs.
                </p>
              </CardContent>
            </Card>

            {/* Messaging */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-600 group-hover:shadow-glow transition-smooth">
                  <MessageSquare className="h-6 w-6" />
              </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Messaging Intégré</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat direct entre vendeurs et clients avec upload de médias. Gérez vos conversations depuis le dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4 text-primary-foreground group-hover:shadow-glow transition-smooth">
                  <BarChart3 className="h-6 w-6" />
            </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Analytics Intégrés</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Google Analytics, Facebook Pixel, TikTok Pixel. Suivez vos conversions et optimisez vos campagnes marketing.
                </p>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-600 group-hover:shadow-glow transition-smooth">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Gestion d'Équipe</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Invitez des membres à votre équipe. Gérez les rôles et permissions pour collaborer efficacement.
                </p>
              </CardContent>
            </Card>

            {/* Litiges */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4 text-red-600 group-hover:shadow-glow transition-smooth">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Gestion de Litiges</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Système professionnel de gestion des disputes. Résolvez les conflits rapidement et équitablement.
                </p>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4 text-teal-600 group-hover:shadow-glow transition-smooth">
                  <HeadphonesIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Support 24/7</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat, email et téléphone. Notre équipe est disponible pour vous accompagner à chaque étape.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Carousel Optimisé Mobile */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-foreground px-2 sm:px-4 leading-tight tracking-tight">
              Ce que disent nos vendeurs
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4 font-medium">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Emarzona pour développer leur business en ligne.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-2 sm:px-4">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 sm:-ml-4">
                {[
                  {
                    name: "Amadou Diallo",
                    role: "Vendeur de produits digitaux",
                    content: "Emarzona m'a permis de vendre mes formations en ligne en quelques jours. L'interface est intuitive et les paiements en FCFA sont un vrai plus !",
                    avatar: testimonial1
                  },
                  {
                    name: "Fatou Sarr",
                    role: "Boutique de vêtements",
                    content: "La gestion d'inventaire et l'intégration FedEx simplifient vraiment mon travail. Je peux me concentrer sur mon business plutôt que sur la logistique.",
                    avatar: testimonial2
                  },
                  {
                    name: "Ibrahim Traoré",
                    role: "Coach en ligne",
                    content: "Le système de réservation pour mes services est parfait. Mes clients peuvent réserver facilement et je reçois toutes les notifications nécessaires.",
                    avatar: testimonial3
                  }
                ].map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Card className="bg-card border-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 h-full backdrop-blur-sm">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex items-center gap-1 mb-3 sm:mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" fill="currentColor" />
                          ))}
                        </div>
                        <p className="text-foreground mb-4 sm:mb-6 leading-relaxed text-xs sm:text-sm md:text-base font-medium">
                          "{testimonial.content}"
                        </p>
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <OptimizedImg
                            src={testimonial.avatar}
                            alt={`Photo de ${testimonial.name}`}
                            width={48}
                            height={48}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
                            style={{ aspectRatio: '1/1' }}
                            priority={index === 0}
                            decoding="async"
                          />
                          <div>
                            <p className="font-bold text-sm sm:text-base text-foreground">{testimonial.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{testimonial.role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <SecurityMockup />
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-xs md:text-sm font-medium text-accent">Sécurité Maximale</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Vos données sont protégées
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                SSL 256-bit, conformité RGPD, intégrations sécurisées avec les meilleurs services. Vos données et celles de vos clients sont en sécurité.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm text-foreground">SSL 256-bit pour toutes les transactions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm text-foreground">Conformité RGPD complète</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm text-foreground">Intégrations certifiées PCI-DSS</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm text-foreground">Sauvegardes automatiques quotidiennes</span>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  En savoir plus
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <HeadphonesIcon className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-primary">Support 24/7</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Une équipe à votre écoute
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Notre équipe est disponible 24/7 pour vous accompagner. Chat en direct, email ou téléphone, nous répondons rapidement à toutes vos questions.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">98%</div>
                  <div className="text-xs text-muted-foreground">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">2min</div>
                  <div className="text-xs text-muted-foreground">Temps réponse</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                  <div className="text-xs text-muted-foreground">Disponibilité</div>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Contacter le support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div>
              <SupportMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section id="coverage" className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              Une couverture mondiale
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Vendez partout dans le monde avec support de 50+ pays et 15+ devises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto items-center">
            <div>
              <CoverageMapMockup />
                </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Afrique de l'Ouest</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Support natif pour le FCFA, PayDunya et Moneroo. Optimisé pour les marchés ouest-africains.
                </p>
              </div>
          </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">International</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Stripe, PayPal, Flutterwave. Acceptez les paiements de partout dans le monde avec conversion automatique.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Conformité</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Conforme aux réglementations locales et internationales. RGPD, PCI-DSS et standards de sécurité.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Optimisé Mobile */}
      <section id="pricing" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30 scroll-mt-20" ref={pricingRef} aria-label="Tarification">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-foreground px-2 sm:px-4 leading-tight tracking-tight">
              Tarification simple et transparente
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4 font-medium">
              Démarrez gratuitement. Payez uniquement une commission sur les ventes réussies.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border/50 shadow-2xl hover:shadow-glow transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 border border-primary/20">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" fill="currentColor" />
                  <span className="text-xs sm:text-sm font-semibold text-primary">Gratuit pour toujours</span>
                </div>
                
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Plan Gratuit
                </h3>
                
                <div className="mb-6 sm:mb-8">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    0 FCFA
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-semibold">
                    Pas de frais d'abonnement, jamais
                  </p>
                </div>

                <div className="bg-accent/10 backdrop-blur-sm border border-accent/30 rounded-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-lg">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">10%</span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-foreground font-bold">
                    Commission uniquement sur les ventes réussies
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 font-medium">
                    Pas de commission si vous ne vendez pas
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 text-left">
                  <div>
                    <h4 className="font-extrabold text-base sm:text-lg mb-3 sm:mb-4 text-foreground">Fonctionnalités incluses</h4>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {[
                        "5 types de produits (Digital, Physique, Services, Cours, Oeuvres d'artiste)",
                        "Marketplace intégré pour vendre et acheter",
                        "Paiements multi-devises (FCFA, EUR, USD, etc.)",
                        "Email marketing complet",
                        "Shipping FedEx intégré",
                        "Analytics et rapports",
                        "Support 24/7",
                        "Boutique personnalisable",
                        "SEO optimisé"
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-foreground font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base sm:text-lg mb-3 sm:mb-4 text-foreground text-center md:text-left">Avantages</h4>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {[
                        "Aucun frais caché",
                        "Pas de limite de produits",
                        "Pas de limite de ventes",
                        "Toutes les fonctionnalités incluses",
                        "Mises à jour gratuites",
                        "Documentation complète",
                        "API disponible",
                        "Intégrations illimitées"
                      ].map((advantage, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-foreground font-medium">{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link to="/auth">
                  <Button 
                    size="lg"
                    className="w-full md:w-auto gradient-accent text-accent-foreground font-bold text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 md:py-6 shadow-glow hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-2"
                  >
                    Démarrer gratuitement
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-2 sm:px-4 font-medium">
              Aucune carte bancaire requise. Commencez à vendre dès aujourd'hui.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section Premium - Optimisé Mobile */}
      <section className="relative py-6 sm:py-10 md:py-14 lg:py-20 overflow-hidden">
        <div className="gradient-hero relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] mx-3 sm:mx-4 md:mx-6 lg:mx-8 py-12 sm:py-14 md:py-16 lg:py-20">
          {/* Effets de lumière animés */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(30,58,138,0.4),transparent_50%)] rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(59,130,246,0.2),transparent_60%)] rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem]"></div>
          
          <div className="container mx-auto px-3 sm:px-4 md:px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4 sm:mb-6 text-white px-2 sm:px-4 leading-tight tracking-tight">
                Prêt à lancer votre business en ligne ?
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/85 sm:text-white/90 mb-6 sm:mb-8 px-2 sm:px-4 font-medium">
                Rejoignez des milliers d'entrepreneurs qui font confiance à Emarzona. Démarrez gratuitement en moins de 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-4">
                <Link to="/auth" className="w-full sm:w-auto group">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shadow-xl hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-2xl">
                    Créer mon compte gratuitement
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/marketplace" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/5 backdrop-blur-md text-white text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-2 border-white/30 hover:bg-white/10 hover:border-white/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-bold">
                    Explorer la marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12 md:py-16" role="contentinfo">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
            <div className="col-span-1 xs:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                {platformLogo ? (
                  <OptimizedImg
                    src={platformLogo}
                    alt="Emarzona"
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 object-contain"
                    priority={true}
                  />
                ) : (
                  <div className="h-8 w-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">E</span>
                  </div>
                )}
                <span className="text-lg md:text-xl font-bold text-foreground">Emarzona</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                La plateforme e-commerce la plus complète pour vendre produits digitaux, physiques, services et cours en ligne. Créez votre boutique ou vendez sur notre Marketplace pour toucher plus de clients.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">Produit</h4>
              <ul className="space-y-2.5 text-sm sm:text-base">
                <li><Link to="/marketplace" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Marketplace</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Fonctionnalités</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Tarifs</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Démo</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">Support</h4>
              <ul className="space-y-2.5 text-sm sm:text-base">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Documentation</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Guides</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Contact</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">Entreprise</h4>
              <ul className="space-y-2.5 text-sm sm:text-base">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">À propos</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Blog</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation">Carrières</Link></li>
                <li><Link to="/community" className="text-muted-foreground hover:text-primary hover:translate-x-1 block transition-smooth flex items-center gap-1 min-h-[44px] touch-manipulation">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Communauté
                </Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center">
            <p className="text-muted-foreground text-xs md:text-sm">
              © {new Date().getFullYear()} Emarzona. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
