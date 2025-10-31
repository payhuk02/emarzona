import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Shield, 
  Globe, 
  ShoppingCart, 
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
  CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import payhukLogo from "@/assets/payhuk-logo.png";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
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
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Landing = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    sales: 0,
    stores: 0
  });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  // Animated counters for stats
  useEffect(() => {
    const targetStats = { users: 2500, sales: 150000, stores: 850 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        users: Math.floor(targetStats.users * progress),
        sales: Math.floor(targetStats.sales * progress),
        stores: Math.floor(targetStats.stores * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(targetStats);
      }
    }, interval);

    return () => clearInterval(timer);
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
        title={t('landing.hero.title')}
        description={t('landing.hero.subtitle')}
        keywords="payhuk, marketplace, e-commerce, produits digitaux, afrique, mobile money, paiement XOF, CFA"
        url={baseUrl}
        canonical={baseUrl}
        image={`${baseUrl}/og-landing.jpg`}
        imageAlt="Payhuk - Marketplace de produits digitaux en Afrique"
        type="website"
        locale="fr_FR"
      />

      {/* Schema.org Website Data */}
      <WebsiteSchema />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm shadow-soft" role="banner">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <img src={payhukLogo} alt="Payhuk" className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              Payhuk
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3" aria-label="Navigation principale">
            <Link to="/marketplace">
              <Button variant="ghost" className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base">
                {t('landing.nav.marketplace')}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('landing.nav.howItWorks')}
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('landing.nav.pricing')}
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base"
              onClick={() => document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('common.coverage', 'Couverture')}
            </Button>
            <LanguageSwitcher variant="ghost" showLabel={false} />
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base">
                {t('landing.nav.login')}
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-accent text-accent-foreground font-semibold shadow-glow hover:opacity-90 hover:scale-105 transition-smooth text-sm xl:text-base px-4 xl:px-6">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground hover:text-primary transition-smooth"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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
                  {t('landing.nav.marketplace')}
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full text-foreground hover:text-primary transition-smooth"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('landing.nav.howItWorks')}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-foreground hover:text-primary transition-smooth"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('landing.nav.pricing')}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-foreground hover:text-primary transition-smooth"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('common.coverage', 'Couverture')}
              </Button>
              <div className="border-t pt-3">
                <LanguageSwitcher variant="outline" showLabel={true} className="w-full" />
              </div>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground hover:text-primary transition-smooth">
                  {t('landing.nav.login')}
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gradient-accent text-accent-foreground font-semibold shadow-glow hover:opacity-90 transition-smooth">
                  {t('landing.nav.getStarted')}
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32" ref={heroRef} aria-label="Section principale">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-3 md:px-4 py-2 rounded-full mb-6 border border-border">
              <Star className="h-4 w-4 text-accent" fill="currentColor" />
              <span className="text-xs md:text-sm text-foreground">{t('landing.hero.badge')}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-foreground px-2 sm:px-4 break-words">
              {t('landing.hero.title')}
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 break-words">
              {t('landing.hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gradient-accent text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth">
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-card/50 backdrop-blur-sm text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-border hover:bg-card hover:scale-105 transition-smooth">
                {t('landing.hero.ctaSecondary')}
              </Button>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-3xl mx-auto mb-8 sm:mb-12 px-2 sm:px-4">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-border">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0.5 sm:mb-1 break-words">
                  {animatedStats.users.toLocaleString()}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{t('landing.stats.users')}</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-border">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-accent mb-0.5 sm:mb-1 break-words">
                  {animatedStats.sales.toLocaleString()}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{t('landing.stats.sales')}</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-border">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0.5 sm:mb-1 break-words">
                  {animatedStats.stores}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{t('landing.stats.stores')}</div>
              </div>
            </div>

            {/* Mockup Placeholder */}
            <div className="relative mt-8 rounded-xl md:rounded-2xl overflow-hidden shadow-large border border-border bg-card/30 backdrop-blur-sm animate-float mx-4 md:mx-0">
              <div className="aspect-video bg-gradient-to-br from-secondary to-card p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-16 md:h-24 w-16 md:w-24 text-primary mx-auto mb-2 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base text-muted-foreground">{t('landing.hero.mockupPreview')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Carousel */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('landing.testimonials.subtitle')}
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-4">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {(() => {
                  const testimonials = t('landing.testimonials.items', { returnObjects: true }) as any[];
                  const avatars = [testimonial1, testimonial2, testimonial3];
                  
                  return testimonials.map((testimonial, index) => (
                    <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                      <Card className="bg-card border-border shadow-medium hover:shadow-large hover:scale-105 transition-smooth h-full">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-accent" fill="currentColor" />
                            ))}
                          </div>
                          <p className="text-foreground mb-6 leading-relaxed text-sm md:text-base">
                            "{testimonial.content}"
                          </p>
                          <div className="flex items-center gap-3">
                            <OptimizedImage
                              src={avatars[index]}
                              alt={`Photo de ${testimonial.name}`}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                              priority={index === 0}
                            />
                            <div>
                              <p className="font-semibold text-foreground">{testimonial.name}</p>
                              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ));
                })()}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 md:py-20 bg-background" ref={featuresRef} aria-label="Fonctionnalités">
        <div className="container mx-auto px-4 space-y-20 md:space-y-32">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 border border-border shadow-medium hover:shadow-large transition-smooth">
                <div className="aspect-video bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-16 md:h-20 w-16 md:w-20 text-primary opacity-50 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-xs md:text-sm font-medium text-accent">{t('landing.featureSections.feature1.badge')}</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                {t('landing.featureSections.feature1.title')}
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('landing.featureSections.feature1.description')}
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  {t('landing.featureSections.feature1.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-primary">{t('landing.featureSections.feature2.badge')}</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                {t('landing.featureSections.feature2.title')}
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('landing.featureSections.feature2.description')}
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  {t('landing.featureSections.feature2.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div>
              <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 border border-border shadow-medium hover:shadow-large transition-smooth">
                <div className="aspect-video bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center">
                  <Globe className="h-16 md:h-20 w-16 md:w-20 text-primary opacity-50 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 border border-border shadow-medium hover:shadow-large transition-smooth">
                <div className="aspect-video bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center">
                  <Lock className="h-16 md:h-20 w-16 md:w-20 text-primary opacity-50 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-xs md:text-sm font-medium text-accent">{t('landing.featureSections.feature3.badge')}</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                {t('landing.featureSections.feature3.title')}
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('landing.featureSections.feature3.description')}
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  {t('landing.featureSections.feature3.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-primary">{t('landing.featureSections.feature4.badge')}</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                {t('landing.featureSections.feature4.title')}
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('landing.featureSections.feature4.description')}
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  {t('landing.featureSections.feature4.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div>
              <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 border border-border shadow-medium hover:shadow-large transition-smooth">
                <div className="aspect-video bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-16 md:h-20 w-16 md:w-20 text-primary opacity-50 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 border border-border shadow-medium hover:shadow-large transition-smooth">
                <div className="aspect-video bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center">
                  <Users className="h-16 md:h-20 w-16 md:w-20 text-primary opacity-50 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/20 px-3 md:px-4 py-2 rounded-full mb-4">
                <Users className="h-4 w-4 text-accent" />
                <span className="text-xs md:text-sm font-medium text-accent">{t('landing.featureSections.feature5.badge')}</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                {t('landing.featureSections.feature5.title')}
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('landing.featureSections.feature5.description')}
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  {t('landing.featureSections.feature5.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              {t('landing.keyFeatures.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('landing.keyFeatures.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <DollarSign className="h-5 w-5 md:h-6 md:w-6" />,
                title: t('landing.keyFeatures.items.fcfaPayments.title'),
                description: t('landing.keyFeatures.items.fcfaPayments.description')
              },
              {
                icon: <Smartphone className="h-5 w-5 md:h-6 md:w-6" />,
                title: t('landing.keyFeatures.items.mobileFirst.title'),
                description: t('landing.keyFeatures.items.mobileFirst.description')
              },
              {
                icon: <Lock className="h-5 w-5 md:h-6 md:w-6" />,
                title: t('landing.keyFeatures.items.secure.title'),
                description: t('landing.keyFeatures.items.secure.description')
              },
              {
                icon: <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />,
                title: t('landing.keyFeatures.items.statistics.title'),
                description: t('landing.keyFeatures.items.statistics.description')
              },
              {
                icon: <Globe className="h-5 w-5 md:h-6 md:w-6" />,
                title: t('landing.keyFeatures.items.multiLanguage.title'),
                description: t('landing.keyFeatures.items.multiLanguage.description')
              },
              {
                icon: <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />,
                title: t('landing.keyFeatures.items.noCommission.title'),
                description: t('landing.keyFeatures.items.noCommission.description')
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-card border-border shadow-soft hover:shadow-medium hover:scale-105 transition-smooth group">
                <CardContent className="p-5 md:p-6 text-center">
                  <div className="h-11 w-11 md:h-12 md:w-12 rounded-lg gradient-accent flex items-center justify-center mb-4 mx-auto text-accent-foreground group-hover:shadow-glow transition-smooth">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              {t('landing.howItWorksDetailed.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('landing.howItWorksDetailed.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
            {[
              {
                step: t('landing.howItWorksDetailed.steps.step1.number'),
                title: t('landing.howItWorksDetailed.steps.step1.title'),
                description: t('landing.howItWorksDetailed.steps.step1.description'),
                icon: <Users className="h-8 w-8" />
              },
              {
                step: t('landing.howItWorksDetailed.steps.step2.number'),
                title: t('landing.howItWorksDetailed.steps.step2.title'),
                description: t('landing.howItWorksDetailed.steps.step2.description'),
                icon: <Package className="h-8 w-8" />
              },
              {
                step: t('landing.howItWorksDetailed.steps.step3.number'),
                title: t('landing.howItWorksDetailed.steps.step3.title'),
                description: t('landing.howItWorksDetailed.steps.step3.description'),
                icon: <TrendingUp className="h-8 w-8" />
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full gradient-accent text-accent-foreground text-xl md:text-2xl font-bold mb-6 shadow-glow group-hover:scale-110 transition-smooth">
                  {item.step}
                </div>
                <div className="mb-4 flex justify-center text-primary opacity-70 group-hover:opacity-100 transition-smooth">
                  {item.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 px-4">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto gradient-accent text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth">
                {t('landing.howItWorksDetailed.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 bg-secondary/30 scroll-mt-20" ref={pricingRef} aria-label="Tarification">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              {t('landing.pricingDetailed.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('landing.pricingDetailed.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border shadow-large hover:shadow-glow transition-smooth">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-6">
                  <Star className="h-4 w-4 text-primary" fill="currentColor" />
                  <span className="text-sm font-medium text-primary">{t('landing.pricingDetailed.free.badge')}</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  {t('landing.pricingDetailed.free.title')}
                </h3>
                
                <div className="mb-8">
                  <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                    {t('landing.pricingDetailed.free.price')}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {t('landing.pricingDetailed.free.subtitle')}
                  </p>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <DollarSign className="h-6 w-6 text-accent" />
                    <span className="text-2xl md:text-3xl font-bold text-accent">{t('landing.pricingDetailed.free.commission.percentage')}</span>
                  </div>
                  <p className="text-base md:text-lg text-foreground">
                    {t('landing.pricingDetailed.free.commission.title')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('landing.pricingDetailed.free.commission.subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
                  <div>
                    <h4 className="font-semibold text-lg mb-4 text-foreground">{t('landing.pricingDetailed.free.featuresTitle')}</h4>
                    <ul className="space-y-3">
                      {(t('landing.pricingDetailed.free.features', { returnObjects: true }) as string[]).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-4 text-foreground text-center">{t('landing.pricingDetailed.free.advantagesTitle')}</h4>
                    <ul className="space-y-3">
                      {(t('landing.pricingDetailed.free.advantages', { returnObjects: true }) as string[]).map((advantage, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link to="/auth">
                  <Button 
                    size="lg"
                    className="w-full md:w-auto gradient-accent text-accent-foreground font-semibold text-lg px-10 py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth inline-flex items-center justify-center gap-2"
                  >
                    {t('landing.pricingDetailed.free.cta')}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6 px-4">
              {t('landing.pricingDetailed.free.note')}
            </p>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section id="coverage" className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              {t('landing.coverage.title')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t('landing.coverage.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto items-center">
            <div>
              <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 border border-border shadow-medium">
                <div className="aspect-square bg-gradient-to-br from-secondary to-card rounded-lg flex items-center justify-center">
                  <Globe className="h-20 md:h-32 w-20 md:w-32 text-primary opacity-50 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">{t('landing.coverage.regions.westAfrica.title')}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {t('landing.coverage.regions.westAfrica.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">{t('landing.coverage.regions.international.title')}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {t('landing.coverage.regions.international.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">{t('landing.coverage.regions.compliance.title')}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {t('landing.coverage.regions.compliance.description')}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <Button 
                  onClick={() => setShowCountries(!showCountries)}
                  className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth"
                >
                  {showCountries ? t('landing.coverage.cta.hide') : t('landing.coverage.cta.show')}
                  <ArrowRight className={`ml-2 h-4 w-4 transition-transform ${showCountries ? 'rotate-90' : ''}`} />
                </Button>
              </div>

              {/* Liste complète des pays */}
              {showCountries && (
                <div className="mt-6 p-6 bg-card rounded-lg border border-border shadow-medium animate-fade-in-up">
                  <h4 className="font-semibold text-lg mb-4 text-foreground">{t('landing.coverage.detailedCoverage.title')}</h4>
                  
                  <div className="space-y-6">
                    {(() => {
                      const zones = t('landing.coverage.detailedCoverage.zones', { returnObjects: true }) as Record<string, { title: string; countries: string[] }>;
                      
                      return Object.entries(zones).map(([key, zone]) => (
                        <div key={key}>
                          <h5 className="font-semibold text-primary mb-2">{zone.title}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            {zone.countries.map((country, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-accent" />
                                <span>{country}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  <p className="text-sm text-muted-foreground mt-4 italic">
                    {t('landing.coverage.detailedCoverage.note')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground px-4">
              {t('landing.finalCta.title')}
            </h2>
            <p className="text-base md:text-xl text-muted-foreground mb-8 px-4">
              {t('landing.finalCta.subtitle')}
            </p>
            <div className="px-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto gradient-accent text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth">
                  {t('landing.finalCta.button')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12 md:py-16" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={payhukLogo} alt="Payhuk" className="h-8 w-8" />
                <span className="text-lg md:text-xl font-bold text-foreground">Payhuk</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('landing.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.features')}</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.pricing')}</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.demo')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">{t('landing.footer.support')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.documentation')}</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.guides')}</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.contact')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.about')}</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.blog')}</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">{t('landing.footer.links.careers')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center">
            <p className="text-muted-foreground text-xs md:text-sm">{t('landing.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
