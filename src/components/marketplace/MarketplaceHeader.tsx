import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, ShoppingBag, Store, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import {
  getPlatformLoginUrl,
  getPlatformRegisterUrl,
  isOffPlatformHost,
  resolvePlatformNavTarget,
} from '@/lib/auth-routes';

function PlatformNavLink({
  to,
  children,
  className,
  onClick,
  'aria-label': ariaLabel,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  const { href, useSpaLink } = resolvePlatformNavTarget(to);

  if (useSpaLink) {
    return (
      <Link to={href} className={className} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

const MarketplaceHeader = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const platformLogo = usePlatformLogo();
  const offPlatform = isOffPlatformHost();
  const loginHref = offPlatform ? getPlatformLoginUrl() : '/login';
  const registerHref = offPlatform ? getPlatformRegisterUrl() : '/register';

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md shadow-soft transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-3 min-w-0">
          {/* Logo */}
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
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
                  style={{ objectFit: 'contain' }}
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
            <span className="truncate text-base font-bold text-foreground sm:text-lg md:text-xl lg:text-2xl">
              Emarzona
            </span>
          </Link>

          {/* Desktop / tablet navigation */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-3 flex-1 justify-center min-w-0"
            aria-label="Navigation principale"
          >
            <PlatformNavLink to="/marketplace" aria-label="Accéder à la marketplace">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary transition-all px-2 lg:px-3"
              >
                <ShoppingBag className="h-4 w-4 lg:mr-2 shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">{t('nav.marketplace')}</span>
              </Button>
            </PlatformNavLink>
            <PlatformNavLink to="/dashboard" aria-label="Accéder au tableau de bord">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary transition-all px-2 lg:px-3"
              >
                <Store className="h-4 w-4 lg:mr-2 shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">{t('nav.dashboard')}</span>
              </Button>
            </PlatformNavLink>
          </nav>

          {/* Desktop / tablet CTA */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0">
            <LanguageSwitcher variant="outline" showLabel={false} />
            <ThemeToggle />
            {offPlatform ? (
              <a href={loginHref} aria-label="Se connecter">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-primary transition-all px-2 lg:px-3"
                >
                  <UserCircle className="h-4 w-4 lg:mr-2 shrink-0" />
                  <span className="hidden lg:inline">{t('nav.login')}</span>
                </Button>
              </a>
            ) : (
              <Link to="/login" aria-label="Se connecter">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-primary transition-all px-2 lg:px-3"
                >
                  <UserCircle className="h-4 w-4 lg:mr-2 shrink-0" />
                  <span className="hidden lg:inline">{t('nav.login')}</span>
                </Button>
              </Link>
            )}
            {offPlatform ? (
              <a href={registerHref} aria-label="Créer un compte">
                <Button
                  size="sm"
                  className="gradient-accent text-accent-foreground font-semibold hover:shadow-glow px-2.5 lg:px-4 text-xs lg:text-sm whitespace-nowrap"
                >
                  <span className="lg:hidden">{t('nav.signupShort', "S'inscrire")}</span>
                  <span className="hidden lg:inline">{t('auth.signup.title')}</span>
                </Button>
              </a>
            ) : (
              <Link to="/register" aria-label="Créer un compte">
                <Button
                  size="sm"
                  className="gradient-accent text-accent-foreground font-semibold hover:shadow-glow px-2.5 lg:px-4 text-xs lg:text-sm whitespace-nowrap"
                >
                  <span className="lg:hidden">{t('nav.signupShort', "S'inscrire")}</span>
                  <span className="hidden lg:inline">{t('auth.signup.title')}</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
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
                className="w-[min(100vw-1rem,320px)] sm:w-[340px] animate-in slide-in-from-right duration-300"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 min-w-0">
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
                      <span className="text-xl font-bold truncate">Emarzona</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-10 w-10 touch-manipulation min-h-[44px] min-w-[44px] shrink-0"
                      aria-label="Fermer le menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <nav
                    className="flex flex-col gap-2 flex-1 overflow-y-auto"
                    aria-label="Menu de navigation mobile"
                  >
                    <PlatformNavLink
                      to="/marketplace"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Accéder à la marketplace"
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px]"
                      >
                        <ShoppingBag className="h-5 w-5 mr-3 shrink-0" aria-hidden="true" />
                        {t('nav.marketplace')}
                      </Button>
                    </PlatformNavLink>
                    <PlatformNavLink
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Accéder au tableau de bord"
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px]"
                      >
                        <Store className="h-5 w-5 mr-3 shrink-0" aria-hidden="true" />
                        {t('nav.dashboard')}
                      </Button>
                    </PlatformNavLink>
                    <div className="h-px bg-border my-4" aria-hidden="true" />
                    {offPlatform ? (
                      <a
                        href={loginHref}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Se connecter"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px]"
                        >
                          <UserCircle className="h-5 w-5 mr-3 shrink-0" aria-hidden="true" />
                          {t('nav.login')}
                        </Button>
                      </a>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Se connecter"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 text-base touch-manipulation min-h-[44px]"
                        >
                          <UserCircle className="h-5 w-5 mr-3 shrink-0" aria-hidden="true" />
                          {t('nav.login')}
                        </Button>
                      </Link>
                    )}
                  </nav>

                  <div className="pt-4 border-t mt-auto">
                    {offPlatform ? (
                      <a href={registerHref} onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full h-12 gradient-accent text-accent-foreground font-semibold touch-manipulation hover:shadow-glow">
                          {t('auth.signup.title')}
                        </Button>
                      </a>
                    ) : (
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full h-12 gradient-accent text-accent-foreground font-semibold touch-manipulation hover:shadow-glow">
                          {t('auth.signup.title')}
                        </Button>
                      </Link>
                    )}
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
