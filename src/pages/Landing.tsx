import { Button } from '@/components/ui/button';
import {
  Shield,
  Globe,
  DollarSign,
  BarChart3,
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
  Rocket,
  Building2,
  HeadphonesIcon,
  Palette,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import testimonial1 from '@/assets/testimonial-1.jpg';
import testimonial2 from '@/assets/testimonial-2.jpg';
import testimonial3 from '@/assets/testimonial-3.jpg';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  StoreDashboardMockup,
  MultiCurrencyMockup,
  SecurityMockup,
  AnalyticsMockup,
  SupportMockup,
  CoverageMapMockup,
} from '@/components/landing/LandingMockups';

const Landing = () => {
  const platformLogo = usePlatformLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    sales: 0,
    stores: 0,
    products: 0,
  });
  const [statsAnimationStarted, setStatsAnimationStarted] = useState(false);

  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  // Animated counters for stats - Optimisé avec requestAnimationFrame
  useEffect(() => {
    const targetStats = { users: 2500, sales: 150000, stores: 850, products: 12000 };
    // Respecter le "reduced motion" (meilleure UX/perf sur mobile)
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedStats(targetStats);
      return;
    }

    // Attendre que la section hero soit visible avant d'animer (évite du travail offscreen sur mobile)
    if (!statsAnimationStarted) return;

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
        products: Math.floor(targetStats.products * easedProgress),
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
  }, [statsAnimationStarted]);

  const baseUrl = window.location.origin;

  // Animations au scroll pour les sections
  const heroRef = useScrollAnimation<HTMLDivElement>();
  const pricingRef = useScrollAnimation<HTMLDivElement>();

  // Démarrer l'animation stats uniquement quand le hero est visible (1 seule fois)
  useEffect(() => {
    if (statsAnimationStarted) return;
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setStatsAnimationStarted(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -20% 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [statsAnimationStarted, heroRef]);

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
      <header
        className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg"
        role="banner"
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-4 flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <Link
            to="/"
            className="relative flex items-center justify-start gap-1.5 sm:gap-2 flex-shrink-0 min-w-0"
          >
            <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 flex-shrink-0">
              {platformLogo ? (
                <OptimizedImage
                  src={platformLogo}
                  alt="Emarzona"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain rounded-lg"
                  priority
                  showPlaceholder={false}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-xs sm:text-sm font-bold text-white">E</span>
                </div>
              )}
            </div>
            <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold text-foreground tracking-tight truncate">
              Emarzona
            </span>
          </Link>

          {/* Desktop Navigation Premium */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2"
            aria-label="Navigation principale"
          >
            <Link to="/marketplace">
              <Button
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4"
              >
                Marketplace
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4"
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Fonctionnalités
            </Button>
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4"
              onClick={() =>
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Tarifs
            </Button>
            <LanguageSwitcher variant="ghost" showLabel={false} />
            <Link to="/auth">
              <Button
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm xl:text-base font-medium px-3 xl:px-4"
              >
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
            className="lg:hidden p-2.5 text-foreground hover:text-primary active:text-primary/80 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-primary/5 active:bg-primary/10 touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav
            className="lg:hidden border-t bg-card/98 backdrop-blur-sm animate-fade-in-up max-h-[calc(100vh-80px)] overflow-y-auto"
            aria-label="Menu mobile"
          >
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-2 sm:gap-3">
              <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium"
                >
                  Marketplace
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Fonctionnalités
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Tarifs
              </Button>
              <div className="border-t border-border/50 pt-2 sm:pt-3 mt-1">
                <LanguageSwitcher
                  variant="outline"
                  showLabel={true}
                  className="w-full min-h-[44px]"
                />
              </div>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="w-full mt-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 min-h-[44px] text-sm sm:text-base font-medium"
                >
                  Connexion
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button className="w-full gradient-accent text-accent-foreground font-semibold shadow-glow hover:opacity-90 active:opacity-80 transition-all duration-200 min-h-[44px] text-sm sm:text-base">
                  Démarrer gratuitement
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section - Design Premium Pleine Largeur */}
      <section
        className="relative py-0 overflow-hidden"
        ref={heroRef}
        aria-label="Section principale"
      >
        {/* Background avec gradient animé et effets de lumière - Pleine largeur */}
        <div className="gradient-hero relative overflow-hidden w-full py-16 sm:py-20 md:py-28 lg:py-36 xl:py-44">
          {/* Effets de lumière animés */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(30,58,138,0.4),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.2),transparent_60%)]"></div>

          {/* Grille de fond subtile */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          ></div>

          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 relative z-10">
            <div className="max-w-5xl mx-auto text-center animate-fade-in-up">
              {/* Badge Premium */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-full mb-5 sm:mb-6 md:mb-8 lg:mb-10 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 max-w-[95vw] sm:max-w-none">
                <Rocket className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white flex-shrink-0" />
                <span className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg text-white font-bold tracking-wide break-words leading-tight">
                  La plateforme e-commerce la plus complète d'Afrique
                </span>
              </div>

              {/* Titre Principal - Typographie Premium Internationale */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-5 md:mb-6 leading-[1.1] text-white px-2 sm:px-4 break-words tracking-tight">
                <span className="block mb-2 sm:mb-3">Vendez 5 types de produits</span>
                <span className="block bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent">
                  sur une seule plateforme
                </span>
              </h1>

              {/* Sous-titre Premium */}
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4 break-words font-normal">
                Produits digitaux, physiques, services, cours en ligne et œuvres d'artiste. Créez
                votre boutique, vendez sur notre Marketplace ou les deux ! Tout ce dont vous avez
                besoin pour créer et développer votre business en ligne.
              </p>

              {/* CTAs Premium avec meilleure hiérarchie */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-stretch sm:items-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 px-3 sm:px-4">
                <Link to="/auth" className="w-full sm:w-auto group flex-shrink-0">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-gray-900 font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl shadow-2xl hover:bg-gray-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out whitespace-nowrap border-0 relative overflow-hidden group min-h-[44px] sm:min-h-[48px] md:min-h-[52px] touch-manipulation"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Démarrer gratuitement
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
                <Link to="/marketplace" className="w-full sm:w-auto flex-shrink-0">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-white/95 backdrop-blur-md text-gray-900 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl border-2 border-white/60 hover:bg-white hover:border-white hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out font-bold whitespace-nowrap relative overflow-hidden group min-h-[44px] sm:min-h-[48px] md:min-h-[52px] touch-manipulation"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Explorer la marketplace
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
              </div>

              {/* Stats Counter Premium - Design Moderne */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-5xl mx-auto mb-6 sm:mb-8 md:mb-10 px-4">
                <div className="group bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out hover:bg-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1.5 break-words relative z-10">
                    {animatedStats.users.toLocaleString()}+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-bold leading-tight relative z-10">
                    Vendeurs actifs
                  </div>
                </div>
                <div className="group bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out hover:bg-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1.5 break-words relative z-10">
                    {animatedStats.products.toLocaleString()}+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-bold leading-tight relative z-10">
                    Produits disponibles
                  </div>
                </div>
                <div className="group bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out hover:bg-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1.5 break-words relative z-10">
                    {animatedStats.sales.toLocaleString()}+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-bold leading-tight relative z-10">
                    Ventes réalisées
                  </div>
                </div>
                <div className="group bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out hover:bg-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1.5 break-words relative z-10">
                    {animatedStats.stores}+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-bold leading-tight relative z-10">
                    Boutiques créées
                  </div>
                </div>
              </div>

              {/* Dashboard Mockup Premium avec animation améliorée */}
              <div className="relative mt-6 sm:mt-8 md:mt-10 mx-2 sm:mx-4 md:mx-0 hidden sm:block">
                <div className="animate-float hover:scale-[1.02] transition-transform duration-500">
                  <StoreDashboardMockup />
                </div>
              </div>
              {/* Mobile alternative for Dashboard Mockup */}
              <div className="relative mt-6 sm:hidden">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-gradient-to-br from-white via-slate-50/50 to-white backdrop-blur-xl p-4">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-xl">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-base font-bold text-foreground">
                        Tableau de bord complet
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Analytics', icon: TrendingUp },
                        { label: 'Commandes', icon: ShoppingCart },
                        { label: 'Produits', icon: Package },
                        { label: 'Clients', icon: Users },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={i}
                            className="bg-card/50 rounded-lg p-3 border border-border flex flex-col items-center gap-2"
                          >
                            <Icon className="h-5 w-5 text-primary" />
                            <div className="text-xs font-semibold text-foreground">
                              {item.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Types Section - Optimisé Mobile */}
      <section
        id="features"
        className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background scroll-mt-20"
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full mb-8 sm:mb-10 border border-primary/20">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
              <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                5 Types de Produits
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground px-4 leading-tight tracking-tight">
              Vendez tout ce que vous voulez
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed font-normal">
              Une plateforme unique pour gérer tous vos produits : digitaux, physiques, services,
              cours en ligne et œuvres d'artiste. Vendez depuis votre boutique ou exposez vos
              produits sur notre Marketplace pour toucher plus de clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Note: Sur mobile, chaque carte prend toute la largeur. Sur tablette (sm), 2 colonnes. Sur desktop (lg), 3 colonnes. Sur très grand écran (xl), 5 colonnes pour montrer tous les types de produits */}
            {/* Digital Products */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 md:p-10 text-left relative z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl gradient-primary flex items-center justify-center mb-5 sm:mb-6 mx-auto text-primary-foreground group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Produits Digitaux
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-5 sm:mb-6 font-normal">
                  eBooks, logiciels, templates, formations numériques. Protection des
                  téléchargements, système de licences et analytics intégrés.
                </p>
                <ul className="text-left space-y-2.5 sm:space-y-3 text-sm sm:text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Upload illimité de fichiers</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Système de licences avancé</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Protection anti-piratage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Physical Products */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-accent/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 md:p-10 text-left relative z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl gradient-accent flex items-center justify-center mb-5 sm:mb-6 mx-auto text-accent-foreground group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Truck className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Produits Physiques
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-5 sm:mb-6 font-normal">
                  Gestion d'inventaire avancée, variants, tracking de stock. Intégration FedEx pour
                  calcul de frais de port et génération d'étiquettes.
                </p>
                <ul className="text-left space-y-2.5 sm:space-y-3 text-sm sm:text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Gestion d'inventaire en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Shipping FedEx intégré</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Variants et lots</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 md:p-10 text-left relative z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5 sm:mb-6 mx-auto text-purple-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Services
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-5 sm:mb-6 font-normal">
                  Système de réservation avec calendrier moderne, gestion de disponibilité, staff
                  assignment et notifications automatiques.
                </p>
                <ul className="text-left space-y-2.5 sm:space-y-3 text-sm sm:text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Calendrier de réservation</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Gestion de disponibilité</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Assignation de staff</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Courses */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-orange-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 md:p-10 text-left relative z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-5 sm:mb-6 mx-auto text-orange-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Cours en Ligne
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-5 sm:mb-6 font-normal">
                  Plateforme LMS complète avec modules, leçons, quiz, progression, certificats et
                  gamification pour vos étudiants.
                </p>
                <ul className="text-left space-y-2.5 sm:space-y-3 text-sm sm:text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Éditeur de curriculum</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Quizzes et examens</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Certificats de fin</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Artist Works */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-pink-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 md:p-10 text-left relative z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-5 sm:mb-6 mx-auto text-pink-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Palette className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Oeuvres d'Artiste
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-5 sm:mb-6 font-normal">
                  Vendez vos créations artistiques : peintures, sculptures, livres, musique,
                  designs. Gestion d'éditions limitées, certificats d'authenticité et profils
                  artistes dédiés.
                </p>
                <ul className="text-left space-y-2.5 sm:space-y-3 text-sm sm:text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">5 types d'artistes supportés</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Éditions limitées & originaux</span>
                  </li>
                  <li className="flex items-start gap-2.5 sm:gap-3 group/item">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="font-medium">Certificats d'authenticité</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
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
                      <h4 className="text-base font-bold text-foreground">
                        Paiements Multi-Devises
                      </h4>
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
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full mb-4 sm:mb-6 border border-primary/20">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                  Paiements Multi-Devises
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight tracking-tight">
                Acceptez les paiements du monde entier
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-normal">
                Intégrations natives avec PayDunya, Moneroo, Stripe, PayPal et Flutterwave. Acceptez
                les paiements en FCFA, EUR, USD et 50+ autres devises. Paiement intégral, par
                acompte ou sécurisé (escrow).
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    50+
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
                    Devises supportées
                  </div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1">
                    5
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
                    Passerelles de paiement
                  </div>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Configurer les paiements
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section - Optimisé Mobile */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full mb-4 sm:mb-6 border border-primary/20">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                  Marketplace Intégré
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight tracking-tight">
                Découvrez notre Marketplace
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-normal">
                Explorez des milliers de produits de vendeurs vérifiés. Achetez des produits
                digitaux, physiques, services et cours en ligne en toute sécurité. Recherche
                avancée, filtres intelligents et recommandations personnalisées pour trouver
                exactement ce que vous cherchez.
              </p>
              <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Catalogue Complet
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Des milliers de produits de tous types : digitaux, physiques, services et
                      cours
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Recherche Intelligente
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Recherche avancée avec filtres par catégorie, prix, note et disponibilité
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Recommandations Personnalisées
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Découvrez des produits adaptés à vos préférences et historique d'achat
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Achat Sécurisé
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Paiements sécurisés avec escrow, garanties et système de notation
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    {animatedStats.products.toLocaleString()}+
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
                    Produits disponibles
                  </div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1">
                    {animatedStats.users.toLocaleString()}+
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
                    Vendeurs vérifiés
                  </div>
                </div>
              </div>
              <Link to="/marketplace">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Explorer la marketplace
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
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
                      {
                        name: 'Formation E-commerce',
                        price: '25 000 FCFA',
                        rating: 4.8,
                        type: 'Cours',
                      },
                      {
                        name: 'Template WordPress',
                        price: '15 000 FCFA',
                        rating: 4.9,
                        type: 'Digital',
                      },
                      {
                        name: 'Consultation SEO',
                        price: '50 000 FCFA',
                        rating: 5.0,
                        type: 'Service',
                      },
                    ].map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border hover:shadow-md transition-smooth"
                      >
                        <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-foreground truncate">
                            {product.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-accent fill-current" />
                              <span className="text-xs text-muted-foreground">
                                {product.rating}
                              </span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full mb-4 sm:mb-6 border border-accent/20">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-accent" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-accent">
                  Email Marketing Avancé
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight tracking-tight">
                Automatisez votre marketing email
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-normal">
                Campagnes ciblées, séquences automatisées, workflows conditionnels, segmentation
                avancée et analytics en temps réel. Tout ce dont vous avez besoin pour convertir vos
                visiteurs en clients.
              </p>
              <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Campagnes & Séquences
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Créez des campagnes ciblées et des séquences d'emails automatisées
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Segmentation Avancée
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Segments statiques et dynamiques basés sur le comportement
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Workflows Automatisés
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Déclencheurs basés sur les événements et actions conditionnelles
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground">
                      Analytics Complets
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Suivez les ouvertures, clics, conversions et ROI en temps réel
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Découvrir l'email marketing
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-border shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                      FedEx Integration
                    </h4>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      Shipping professionnel
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                    <span className="text-xs sm:text-sm md:text-base text-foreground font-medium">
                      Calcul de frais en temps réel
                    </span>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                    <span className="text-xs sm:text-sm md:text-base text-foreground font-medium">
                      Génération d'étiquettes
                    </span>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                    <span className="text-xs sm:text-sm md:text-base text-foreground font-medium">
                      Tracking automatique
                    </span>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 border border-primary/20">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                  Shipping Professionnel
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight tracking-tight">
                Livraison simplifiée avec FedEx
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-normal">
                Intégration native avec FedEx pour calculer automatiquement les frais de port,
                générer des étiquettes d'expédition et suivre vos colis en temps réel. Vos clients
                reçoivent des notifications automatiques à chaque étape.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Configurer le shipping
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Features Showcase - Toutes les fonctionnalités */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-16 sm:mb-20 md:mb-24 lg:mb-28">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full mb-8 sm:mb-10 border border-primary/20">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
              <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                Plateforme Complète
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground px-4 leading-tight tracking-tight">
              Tout ce dont vous avez besoin pour réussir
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed font-normal">
              Plus de 50 fonctionnalités professionnelles intégrées pour créer, vendre et développer
              votre business en ligne.
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* E-commerce Core */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  E-commerce Core
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  'Gestion multi-produits (5 types)',
                  "Panier d'achat intelligent",
                  'Processus de checkout fluide',
                  'Gestion des commandes avancée',
                  'Facturation automatique (PDF)',
                  'Historique des achats complet',
                  'Wishlist et favoris',
                  'Comparaison de produits',
                  'Recherche avancée avec filtres',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-card/90 backdrop-blur-md rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out group/item"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-medium leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paiements & Finance */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl gradient-accent flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  Paiements & Finance
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  '5 passerelles de paiement (PayDunya, Moneroo, Stripe, PayPal, Flutterwave)',
                  '50+ devises supportées',
                  'Paiement intégral',
                  'Paiement par acompte (%)',
                  'Paiement sécurisé (escrow)',
                  'Gestion des remboursements',
                  'Dashboard paiements complet',
                  'Multi-devises automatique',
                  'Conversion de devises en temps réel',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketing & Growth */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-600" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  Marketing & Growth
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  'Email marketing avancé',
                  'Campagnes ciblées et séquences automatisées',
                  'Segmentation avancée (statique et dynamique)',
                  'Workflows conditionnels',
                  'Analytics email en temps réel',
                  "Programme d'affiliation complet",
                  'Cartes cadeaux',
                  'Programme de fidélité avec points',
                  'Système de parrainage',
                  'Promotions et codes promo',
                  'Google Analytics intégré',
                  'Facebook Pixel & TikTok Pixel',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplace & Distribution */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  Marketplace & Distribution
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  'Marketplace intégré multi-vendeurs',
                  'Boutique personnalisable',
                  'Vendre sur les deux canaux simultanément',
                  'Catalogue complet de produits',
                  'Recherche intelligente avec filtres',
                  'Recommandations personnalisées',
                  'Système de notation et avis',
                  'Vendeurs vérifiés',
                  'Achat sécurisé avec escrow',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication & Support */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  Communication & Support
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  'Messaging intégré vendeur-client',
                  'Chat en temps réel avec upload de médias',
                  'Notifications multi-canaux',
                  'Support 24/7 (chat, email, téléphone)',
                  "Centre d'aide et documentation",
                  'FAQ intégrée par produit',
                  'Système de tickets',
                  "Communauté d'utilisateurs",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:border-blue-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gestion & Administration */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  Gestion & Administration
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  "Gestion d'équipe avec rôles",
                  'Permissions granulaires',
                  'Dashboard analytics complet',
                  'Rapports personnalisables',
                  'Export CSV/Excel',
                  'Gestion de litiges professionnelle',
                  'Système de modération',
                  "Logs d'activité",
                  'Multi-langue (i18n)',
                  'Mode sombre',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sécurité & Conformité */}
            <div>
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-600" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                  Sécurité & Conformité
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[
                  'SSL 256-bit pour toutes les transactions',
                  'Conformité RGPD complète',
                  'Intégrations certifiées PCI-DSS',
                  'Row Level Security (RLS) Supabase',
                  'Sauvegardes automatiques quotidiennes',
                  'Protection CSRF',
                  'Validation des inputs',
                  'Authentification 2FA',
                  'Gestion des rôles sécurisée',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 hover:border-red-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg text-foreground font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-16 sm:mt-20 md:mt-24">
            <Link to="/auth">
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground font-bold text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 shadow-glow hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Découvrir toutes les fonctionnalités
                <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground px-4 leading-tight tracking-tight">
              Fonctionnalités avancées pour développer votre business
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed font-normal">
              Tout ce dont vous avez besoin pour créer, vendre et développer votre activité en
              ligne.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 max-w-7xl mx-auto">
            {/* Affiliation */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-accent/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-accent flex items-center justify-center mb-6 text-accent-foreground group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Programme d'Affiliation
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Créez un programme d'affiliation avec commissions personnalisées. Gérez vos
                  affiliés et suivez leurs performances.
                </p>
              </CardContent>
            </Card>

            {/* Cartes Cadeaux */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-pink-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Gift className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Cartes Cadeaux
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Vendez et acceptez les cartes cadeaux. Gérez les codes, les montants et les dates
                  d'expiration.
                </p>
              </CardContent>
            </Card>

            {/* Fidélité */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-yellow-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-6 text-yellow-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Award className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Programme de Fidélité
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Récompensez vos clients avec des points de fidélité. Créez des règles
                  personnalisées et augmentez la rétention.
                </p>
              </CardContent>
            </Card>

            {/* Parrainage */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-green-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 text-green-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Users className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Parrainage
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Système de parrainage utilisateur avec codes de référence. Suivez les invitations
                  et récompensez vos ambassadeurs.
                </p>
              </CardContent>
            </Card>

            {/* Messaging */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-blue-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <MessageSquare className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Messaging Intégré
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Chat direct entre vendeurs et clients avec upload de médias. Gérez vos
                  conversations depuis le dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 text-primary-foreground group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BarChart3 className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Analytics Intégrés
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Google Analytics, Facebook Pixel, TikTok Pixel. Suivez vos conversions et
                  optimisez vos campagnes marketing.
                </p>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-indigo-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Building2 className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Gestion d'Équipe
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Invitez des membres à votre équipe. Gérez les rôles et permissions pour collaborer
                  efficacement.
                </p>
              </CardContent>
            </Card>

            {/* Litiges */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-red-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6 text-red-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Shield className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Gestion de Litiges
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Système professionnel de gestion des disputes. Résolvez les conflits rapidement et
                  équitablement.
                </p>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-teal-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 relative z-10">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-6 text-teal-600 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <HeadphonesIcon className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-foreground tracking-tight">
                  Support 24/7
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
                  Chat, email et téléphone. Notre équipe est disponible pour vous accompagner à
                  chaque étape.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Carousel Optimisé Mobile */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground px-4 leading-tight tracking-tight">
              Ce que disent nos vendeurs
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed font-normal">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Emarzona pour développer
              leur business en ligne.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 sm:-ml-4 md:-ml-6">
                {[
                  {
                    name: 'Amadou Diallo',
                    role: 'Vendeur de produits digitaux',
                    content:
                      "Emarzona m'a permis de vendre mes formations en ligne en quelques jours. L'interface est intuitive et les paiements en FCFA sont un vrai plus !",
                    avatar: testimonial1,
                  },
                  {
                    name: 'Fatou Sarr',
                    role: 'Boutique de vêtements',
                    content:
                      "La gestion d'inventaire et l'intégration FedEx simplifient vraiment mon travail. Je peux me concentrer sur mon business plutôt que sur la logistique.",
                    avatar: testimonial2,
                  },
                  {
                    name: 'Ibrahim Traoré',
                    role: 'Coach en ligne',
                    content:
                      'Le système de réservation pour mes services est parfait. Mes clients peuvent réserver facilement et je reçois toutes les notifications nécessaires.',
                    avatar: testimonial3,
                  },
                ].map((testimonial, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-2 sm:pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <Card className="bg-card/95 backdrop-blur-md border border-border/60 shadow-md hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 ease-out h-full overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 relative z-10">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-accent group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                              fill="currentColor"
                              style={{ transitionDelay: `${i * 50}ms` }}
                            />
                          ))}
                        </div>
                        <p className="text-foreground mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg font-normal">
                          "{testimonial.content}"
                        </p>
                        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 pt-3 sm:pt-4 border-t border-border/50">
                          <OptimizedImage
                            src={testimonial.avatar}
                            alt={`Photo de ${testimonial.name}`}
                            priority={index === 0}
                            width={56}
                            height={56}
                            className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 flex-shrink-0 transition-all duration-300"
                            showPlaceholder={false}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-foreground truncate">
                              {testimonial.name}
                            </p>
                            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-normal truncate">
                              {testimonial.role}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6 md:hidden">
                <CarouselPrevious className="relative left-0 right-0 translate-y-0 min-h-[44px] min-w-[44px] touch-manipulation" />
                <CarouselNext className="relative left-0 right-0 translate-y-0 min-h-[44px] min-w-[44px] touch-manipulation" />
              </div>
              <div className="hidden md:block">
                <CarouselPrevious className="left-0 min-h-[44px] min-w-[44px]" />
                <CarouselNext className="right-0 min-h-[44px] min-w-[44px]" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <SecurityMockup />
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 border border-accent/20">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-accent" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-accent">
                  Sécurité Maximale
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight tracking-tight">
                Vos données sont protégées
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-normal">
                SSL 256-bit, conformité RGPD, intégrations sécurisées avec les meilleurs services.
                Vos données et celles de vos clients sont en sécurité.
              </p>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg text-foreground font-medium">
                    SSL 256-bit pour toutes les transactions
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg text-foreground font-medium">
                    Conformité RGPD complète
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg text-foreground font-medium">
                    Intégrations certifiées PCI-DSS
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg text-foreground font-medium">
                    Sauvegardes automatiques quotidiennes
                  </span>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  En savoir plus
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 border border-primary/20">
                <HeadphonesIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                  Support 24/7
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground leading-tight tracking-tight">
                Une équipe à votre écoute
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed font-normal">
                Notre équipe est disponible 24/7 pour vous accompagner. Chat en direct, email ou
                téléphone, nous répondons rapidement à toutes vos questions.
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                <div className="text-center bg-card/50 rounded-xl p-3 sm:p-4 md:p-5 border border-border/50 hover:bg-card/70 transition-colors">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-primary mb-1 sm:mb-2">
                    98%
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                    Satisfaction
                  </div>
                </div>
                <div className="text-center bg-card/50 rounded-xl p-3 sm:p-4 md:p-5 border border-border/50 hover:bg-card/70 transition-colors">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-accent mb-1 sm:mb-2">
                    2min
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                    Temps réponse
                  </div>
                </div>
                <div className="text-center bg-card/50 rounded-xl p-3 sm:p-4 md:p-5 border border-border/50 hover:bg-card/70 transition-colors">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-primary mb-1 sm:mb-2">
                    24/7
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                    Disponibilité
                  </div>
                </div>
              </div>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Contacter le support
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <SupportMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section
        id="coverage"
        className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background scroll-mt-20"
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground px-4 leading-tight tracking-tight">
              Une couverture mondiale
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed font-normal">
              Vendez partout dans le monde avec support de 50+ pays et 15+ devises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-6xl mx-auto items-center">
            <div className="order-2 md:order-1">
              <CoverageMapMockup />
            </div>

            <div className="order-1 md:order-2 space-y-6 sm:space-y-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl gradient-accent flex items-center justify-center shrink-0">
                  <Globe className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 sm:mb-3 text-foreground tracking-tight">
                    Afrique de l'Ouest
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-normal leading-relaxed">
                    Support natif pour le FCFA, PayDunya et Moneroo. Optimisé pour les marchés
                    ouest-africains.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 sm:mb-3 text-foreground tracking-tight">
                    International
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-normal leading-relaxed">
                    Stripe, PayPal, Flutterwave. Acceptez les paiements de partout dans le monde
                    avec conversion automatique.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl gradient-accent flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 sm:mb-3 text-foreground tracking-tight">
                    Conformité
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-normal leading-relaxed">
                    Conforme aux réglementations locales et internationales. RGPD, PCI-DSS et
                    standards de sécurité.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Optimisé Mobile */}
      <section
        id="pricing"
        className="py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/30 scroll-mt-20"
        ref={pricingRef}
        aria-label="Tarification"
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground px-4 leading-tight tracking-tight">
              Tarification simple et transparente
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed font-normal">
              Démarrez gratuitement. Payez uniquement une commission sur les ventes réussies.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border/50 shadow-2xl hover:shadow-glow transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 border border-primary/20">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" fill="currentColor" />
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    Gratuit pour toujours
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-foreground tracking-tight">
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
                    <span className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                      10%
                    </span>
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
                    <h4 className="font-extrabold text-base sm:text-lg mb-3 sm:mb-4 text-foreground">
                      Fonctionnalités incluses
                    </h4>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {[
                        "5 types de produits (Digital, Physique, Services, Cours, Oeuvres d'artiste)",
                        'Marketplace intégré pour vendre et acheter',
                        'Paiements multi-devises (FCFA, EUR, USD, etc.)',
                        'Email marketing complet',
                        'Shipping FedEx intégré',
                        'Analytics et rapports',
                        'Support 24/7',
                        'Boutique personnalisable',
                        'SEO optimisé',
                      ].map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-foreground font-medium">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base sm:text-lg mb-3 sm:mb-4 text-foreground text-center md:text-left">
                      Avantages
                    </h4>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {[
                        'Aucun frais caché',
                        'Pas de limite de produits',
                        'Pas de limite de ventes',
                        'Toutes les fonctionnalités incluses',
                        'Mises à jour gratuites',
                        'Documentation complète',
                        'API disponible',
                        'Intégrations illimitées',
                      ].map((advantage, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-foreground font-medium">
                            {advantage}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link to="/auth" className="w-full md:w-auto">
                  <Button
                    size="lg"
                    className="w-full md:w-auto gradient-accent text-accent-foreground font-bold text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 lg:py-6 shadow-glow hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] touch-manipulation"
                  >
                    Démarrer gratuitement
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
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

      {/* CTA Section Premium - Pleine Largeur */}
      <section className="relative py-0 overflow-hidden">
        <div className="gradient-hero relative overflow-hidden w-full py-16 sm:py-20 md:py-28 lg:py-36 xl:py-44">
          {/* Effets de lumière animés */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(30,58,138,0.4),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(59,130,246,0.2),transparent_60%)]"></div>

          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 text-white px-2 sm:px-4 leading-tight tracking-tight break-words">
                Prêt à lancer votre business en ligne ?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4 font-normal leading-relaxed">
                Rejoignez des milliers d'entrepreneurs qui font confiance à Emarzona. Démarrez
                gratuitement en moins de 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-stretch sm:items-center px-3 sm:px-4 md:px-6">
                <Link to="/auth" className="w-full sm:w-auto group flex-shrink-0">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-gray-900 font-bold text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl shadow-2xl hover:bg-gray-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out whitespace-nowrap border-0 relative overflow-hidden group min-h-[44px] sm:min-h-[48px] md:min-h-[52px] touch-manipulation"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Créer mon compte gratuitement
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
                <Link to="/marketplace" className="w-full sm:w-auto flex-shrink-0">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-white/95 backdrop-blur-md text-gray-900 text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl border-2 border-white/60 hover:bg-white hover:border-white hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out font-bold whitespace-nowrap relative overflow-hidden group min-h-[44px] sm:min-h-[48px] md:min-h-[52px] touch-manipulation"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Explorer la marketplace
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black py-12 md:py-16" role="contentinfo">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
            <div className="col-span-1 xs:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                {platformLogo ? (
                  <OptimizedImage
                    src={platformLogo}
                    alt="Emarzona"
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 object-contain"
                    priority
                    showPlaceholder={false}
                  />
                ) : (
                  <div className="h-8 w-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">E</span>
                  </div>
                )}
                <span className="text-lg md:text-xl font-bold text-white">Emarzona</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                La plateforme e-commerce la plus complète pour vendre produits digitaux, physiques,
                services et cours en ligne. Créez votre boutique ou vendez sur notre Marketplace
                pour toucher plus de clients.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white text-sm md:text-base">Produit</h4>
              <ul className="space-y-2.5 text-sm sm:text-base">
                <li>
                  <Link
                    to="/marketplace"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Démo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white text-sm md:text-base">Support</h4>
              <ul className="space-y-2.5 text-sm sm:text-base">
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Guides
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white text-sm md:text-base">Entreprise</h4>
              <ul className="space-y-2.5 text-sm sm:text-base">
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    À propos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth min-h-[44px] flex items-center touch-manipulation"
                  >
                    Carrières
                  </Link>
                </li>
                <li>
                  <Link
                    to="/community"
                    className="text-gray-400 hover:text-primary hover:translate-x-1 block transition-smooth flex items-center gap-1 min-h-[44px] touch-manipulation"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    Communauté
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-xs md:text-sm">
              © {new Date().getFullYear()} Emarzona. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
