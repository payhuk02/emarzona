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
import { useState, useEffect, useRef } from "react";
import payhukLogo from "@/assets/payhuk-logo.png";
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

const Landing = () => {
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm shadow-soft">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <img src={payhukLogo} alt="Payhuk" className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              Payhuk
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <Link to="/marketplace">
              <Button variant="ghost" className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base">
                Marketplace
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Comment ça marche
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Tarifs
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base"
              onClick={() => document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Couverture
            </Button>
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:text-primary transition-smooth text-sm xl:text-base">
                Se connecter
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-accent text-accent-foreground font-semibold shadow-glow hover:opacity-90 hover:scale-105 transition-smooth text-sm xl:text-base px-4 xl:px-6">
                Commencer
              </Button>
            </Link>
          </div>

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
          <div className="lg:hidden border-t bg-card/98 backdrop-blur-sm animate-fade-in-up">
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
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Comment ça marche
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
              <Button 
                variant="ghost" 
                className="w-full text-foreground hover:text-primary transition-smooth"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Couverture
              </Button>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground hover:text-primary transition-smooth">
                  Se connecter
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gradient-accent text-accent-foreground font-semibold shadow-glow hover:opacity-90 transition-smooth">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-3 md:px-4 py-2 rounded-full mb-6 border border-border">
              <Star className="h-4 w-4 text-accent" fill="currentColor" />
              <span className="text-xs md:text-sm text-foreground">La plateforme tout-en-un pour vendre vos produits digitaux</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-foreground px-2 sm:px-4 break-words">
              Vendez vos produits digitaux en toute simplicité
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 break-words">
              Créez votre boutique en ligne, gérez vos ventes en FCFA et autres devises, 
              et développez votre business en Afrique sans commission cachée.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gradient-accent text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-card/50 backdrop-blur-sm text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-border hover:bg-card hover:scale-105 transition-smooth">
                Voir la démo
              </Button>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-3xl mx-auto mb-8 sm:mb-12 px-2 sm:px-4">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-border">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0.5 sm:mb-1 break-words">
                  {animatedStats.users.toLocaleString()}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Utilisateurs</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-border">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-accent mb-0.5 sm:mb-1 break-words">
                  {animatedStats.sales.toLocaleString()}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Ventes</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-border">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0.5 sm:mb-1 break-words">
                  {animatedStats.stores}+
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Boutiques</div>
              </div>
            </div>

            {/* Mockup Placeholder */}
            <div className="relative mt-8 rounded-xl md:rounded-2xl overflow-hidden shadow-large border border-border bg-card/30 backdrop-blur-sm animate-float mx-4 md:mx-0">
              <div className="aspect-video bg-gradient-to-br from-secondary to-card p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-16 md:h-24 w-16 md:w-24 text-primary mx-auto mb-2 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base text-muted-foreground">Aperçu de votre future boutique</p>
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
              Ils réussissent avec Payhuk
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Rejoignez des centaines d'entrepreneurs qui développent leur business
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
                {[
                  {
                    name: "Amadou K.",
                    role: "Créateur de contenu",
                    content: "J'ai doublé mes revenus en 3 mois grâce à Payhuk. La plateforme est simple et les paiements en FCFA sont un vrai plus !",
                    avatar: testimonial1
                  },
                  {
                    name: "Fatou D.",
                    role: "Formatrice en ligne",
                    content: "Enfin une solution adaptée au marché africain ! Mes étudiants peuvent payer facilement et je gère tout depuis mon téléphone.",
                    avatar: testimonial2
                  },
                  {
                    name: "Ibrahim S.",
                    role: "Développeur",
                    content: "Interface moderne, fonctionnalités complètes et support réactif. Payhuk est la meilleure plateforme pour vendre en Afrique.",
                    avatar: testimonial3
                  }
                ].map((testimonial, index) => (
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
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                            loading="lazy"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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

      {/* Feature Sections */}
      <section className="py-16 md:py-20 bg-background">
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
                <span className="text-xs md:text-sm font-medium text-accent">Configuration rapide</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Votre boutique personnalisée en 2 minutes
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Créez votre boutique en ligne sans compétences techniques. 
                Personnalisez votre design, ajoutez vos produits et commencez à vendre immédiatement.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Créer ma boutique
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
                <span className="text-xs md:text-sm font-medium text-primary">Multi-devises</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Vendez partout, dans plusieurs devises
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Acceptez les paiements en FCFA, EUR, USD et bien plus. 
                Vos clients paient dans leur devise locale pour une meilleure expérience.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Découvrir les devises
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
                <span className="text-xs md:text-sm font-medium text-accent">Sécurité maximale</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Connectez vos outils préférés
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Intégrez facilement vos outils marketing, CRM et autres services. 
                Automatisez votre business pour vous concentrer sur l'essentiel.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Voir les intégrations
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
                <span className="text-xs md:text-sm font-medium text-primary">Analytics</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Suivez vos ventes et ajustez votre stratégie
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Tableau de bord complet avec statistiques en temps réel. 
                Analysez vos performances et optimisez vos ventes.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Voir le tableau de bord
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
                <span className="text-xs md:text-sm font-medium text-accent">Support 24/7</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                Une équipe à vos côtés 24h/24 et 7j/7
              </h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Notre équipe d'experts est disponible pour vous accompagner à chaque étape. 
                Chat en direct, email ou téléphone - nous sommes là pour vous.
              </p>
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth">
                  Contacter le support
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
              Fonctionnalités clés
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Tout ce dont vous avez besoin pour développer votre business
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <DollarSign className="h-5 w-5 md:h-6 md:w-6" />,
                title: "Paiements en FCFA",
                description: "Acceptez les paiements en FCFA (XOF) et autres devises africaines pour faciliter les transactions locales."
              },
              {
                icon: <Smartphone className="h-5 w-5 md:h-6 md:w-6" />,
                title: "Mobile-first",
                description: "Interface optimisée pour mobile. Gérez votre boutique depuis n'importe où, à tout moment."
              },
              {
                icon: <Lock className="h-5 w-5 md:h-6 md:w-6" />,
                title: "Sécurisé",
                description: "Paiements sécurisés et protection avancée de vos données. Vos transactions sont 100% protégées."
              },
              {
                icon: <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />,
                title: "Statistiques",
                description: "Tableau de bord complet avec analytics en temps réel pour suivre vos performances."
              },
              {
                icon: <Globe className="h-5 w-5 md:h-6 md:w-6" />,
                title: "Multi-langues",
                description: "Interface disponible en français et autres langues pour servir tous vos clients."
              },
              {
                icon: <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />,
                title: "Sans commission",
                description: "Pas de commission cachée. Gardez 100% de vos revenus avec des frais transparents."
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
              Comment ça marche ?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Lancez votre boutique en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Inscrivez-vous",
                description: "Créez votre compte gratuitement en quelques secondes. Aucune carte bancaire requise.",
                icon: <Users className="h-8 w-8" />
              },
              {
                step: "2",
                title: "Configurez votre boutique",
                description: "Personnalisez votre boutique, ajoutez vos produits et configurez vos moyens de paiement.",
                icon: <Package className="h-8 w-8" />
              },
              {
                step: "3",
                title: "Commencez à vendre",
                description: "Partagez le lien de votre boutique et commencez à recevoir des paiements immédiatement.",
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
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 bg-secondary/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Commencez gratuitement, payez uniquement sur vos ventes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border shadow-large hover:shadow-glow transition-smooth">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-6">
                  <Star className="h-4 w-4 text-primary" fill="currentColor" />
                  <span className="text-sm font-medium text-primary">100% Gratuit</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Plateforme entièrement gratuite
                </h3>
                
                <div className="mb-8">
                  <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                    0 FCFA
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Aucun frais d'inscription, aucun abonnement mensuel
                  </p>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <DollarSign className="h-6 w-6 text-accent" />
                    <span className="text-2xl md:text-3xl font-bold text-accent">10%</span>
                  </div>
                  <p className="text-base md:text-lg text-foreground">
                    Commission uniquement sur les ventes réalisées
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vous ne payez que si vous vendez !
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
                  <div>
                    <h4 className="font-semibold text-lg mb-4 text-foreground">Fonctionnalités incluses</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Boutique personnalisée</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Produits illimités</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Paiements en FCFA et autres devises</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Tableau de bord analytics</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-4 text-foreground text-center">Avantages</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Gestion des commandes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Support client réactif</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Paiements sécurisés</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Mises à jour gratuites</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Link to="/auth">
                  <Button 
                    size="lg"
                    className="w-full md:w-auto gradient-accent text-accent-foreground font-semibold text-lg px-10 py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth inline-flex items-center justify-center gap-2"
                  >
                    Commencer gratuitement
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6 px-4">
              Aucune carte bancaire requise • Aucun engagement • Résiliez quand vous voulez
            </p>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section id="coverage" className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground px-4">
              Couverture internationale
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Acceptez des paiements du monde entier avec des devises locales
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
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Afrique de l'Ouest</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Paiements en FCFA (XOF) disponibles dans toute la zone UEMOA : Sénégal, Côte d'Ivoire, Mali, Bénin, Burkina Faso, Niger, Togo, Guinée-Bissau
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Devises internationales</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Acceptez également les paiements en EUR, USD, GBP et autres devises majeures pour servir vos clients internationaux
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">Conformité locale</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Solution 100% conforme aux réglementations locales et internationales pour des transactions sécurisées
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <Button 
                  onClick={() => setShowCountries(!showCountries)}
                  className="gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-smooth"
                >
                  {showCountries ? 'Masquer' : 'Voir tous les pays couverts'}
                  <ArrowRight className={`ml-2 h-4 w-4 transition-transform ${showCountries ? 'rotate-90' : ''}`} />
                </Button>
              </div>

              {/* Liste complète des pays */}
              {showCountries && (
                <div className="mt-6 p-6 bg-card rounded-lg border border-border shadow-medium animate-fade-in-up">
                  <h4 className="font-semibold text-lg mb-4 text-foreground">Pays couverts par zone géographique</h4>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold text-primary mb-2">Afrique de l'Ouest (Zone UEMOA - FCFA XOF)</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Sénégal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Côte d'Ivoire</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Mali</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Bénin</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Burkina Faso</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Niger</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Togo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Guinée-Bissau</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-primary mb-2">Afrique Centrale (Zone CEMAC - FCFA XAF)</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Cameroun</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Gabon</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Congo-Brazzaville</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Tchad</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>RCA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Guinée Équatoriale</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-primary mb-2">Afrique du Nord</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Maroc (MAD)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Algérie (DZD)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Tunisie (TND)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Égypte (EGP)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-primary mb-2">Afrique de l'Est</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Kenya (KES)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Tanzanie (TZS)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Ouganda (UGX)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Rwanda (RWF)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Éthiopie (ETB)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-primary mb-2">Afrique Australe</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Afrique du Sud (ZAR)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Nigeria (NGN)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Ghana (GHS)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Zimbabwe (ZWL)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-primary mb-2">International (Devises majeures)</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Zone Euro (EUR)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>États-Unis (USD)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Royaume-Uni (GBP)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Canada (CAD)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span>Suisse (CHF)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-4 italic">
                    + 180 autres pays et territoires dans le monde entier
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
              Commencez à vendre des produits digitaux dès aujourd'hui !
            </h2>
            <p className="text-base md:text-xl text-muted-foreground mb-8 px-4">
              Rejoignez des centaines d'entrepreneurs africains qui ont déjà fait confiance à Payhuk
            </p>
            <div className="px-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto gradient-accent text-accent-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-glow hover:opacity-90 hover:scale-105 transition-smooth">
                  Créer mon compte gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={payhukLogo} alt="Payhuk" className="h-8 w-8" />
                <span className="text-lg md:text-xl font-bold text-foreground">Payhuk</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                La plateforme e-commerce moderne pour entrepreneurs africains.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Fonctionnalités</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Tarifs</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Démo</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Documentation</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Guides</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-sm md:text-base">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">À propos</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Blog</Link></li>
                <li><Link to="/auth" className="text-muted-foreground hover:text-primary hover:translate-x-1 inline-block transition-smooth">Carrières</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center">
            <p className="text-muted-foreground text-xs md:text-sm">© 2025 Payhuk. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
