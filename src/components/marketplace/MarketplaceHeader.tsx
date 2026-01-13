import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, ShoppingBag, Store, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';

const MarketplaceHeader = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const platformLogo = usePlatformLogo();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md shadow-soft transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Retour à l'accueil Emarzona"
          >
            {platformLogo ? (
              <div className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center">
                <img
                  src={platformLogo}
                  alt="Logo Emarzona"
                  width={32}
                  height={32}
                  className="max-w-full max-h-full object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            ) : (
              <div
                className="h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <span className="text-xs sm:text-sm font-bold text-primary-foreground">E</span>
              </div>
            )}
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              Emarzona
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-4 flex-1 justify-center"
            aria-label="Navigation principale"
          >
            <Link to="/marketplace" aria-label="Accéder à la marketplace">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary transition-all"
              >
                <ShoppingBag className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('nav.marketplace')}
              </Button>
            </Link>
            <Link to="/dashboard" aria-label="Accéder au tableau de bord">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary transition-all"
              >
                <Store className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('nav.dashboard')}
              </Button>
            </Link>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher variant="outline" showLabel={false} />
            <ThemeToggle />
            <Link to="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary transition-all"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                {t('nav.login')}
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="sm"
                className="gradient-accent text-accent-foreground font-semibold hover:shadow-glow"
              >
                {t('auth.signup.title')}
              </Button>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="ghost" showLabel={false} />
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 touch-manipulation min-h-[44px] min-w-[44px]"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[280px] sm:w-[320px] animate-in slide-in-from-right duration-300"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      {platformLogo ? (
                        <img
                          src={platformLogo}
                          alt="Emarzona"
                          width={28}
                          height={28}
                          className="h-7 w-7 flex-shrink-0 object-contain"
                          loading="eager"
                        />
                      ) : (
                        <div className="h-7 w-7 bg-primary rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-foreground">E</span>
                        </div>
                      )}
                      <span className="text-xl font-bold">Emarzona</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-10 w-10 touch-manipulation min-h-[44px] min-w-[44px]"
                      aria-label="Fermer le menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation */}
                  <nav
                    className="flex flex-col gap-2 flex-1"
                    aria-label="Menu de navigation mobile"
                  >
                    <Link
                      to="/marketplace"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Accéder à la marketplace"
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px] hover:translate-x-1 transition-transform focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <ShoppingBag className="h-5 w-5 mr-3" aria-hidden="true" />
                        {t('nav.marketplace')}
                      </Button>
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Accéder au tableau de bord"
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px] hover:translate-x-1 transition-transform focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Store className="h-5 w-5 mr-3" aria-hidden="true" />
                        {t('nav.dashboard')}
                      </Button>
                    </Link>
                    <div className="h-px bg-border my-4" aria-hidden="true" />
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Se connecter ou créer un compte"
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px] hover:translate-x-1 transition-transform focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <UserCircle className="h-5 w-5 mr-3" aria-hidden="true" />
                        {t('nav.login')}
                      </Button>
                    </Link>
                  </nav>

                  {/* CTA Button */}
                  <div className="pt-4 border-t">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-12 gradient-accent text-accent-foreground font-semibold touch-manipulation hover:shadow-glow">
                        {t('auth.signup.title')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MarketplaceHeader;
