import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ShoppingBag, Store, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import payhukLogo from "@/assets/payhuk-logo.png";

const MarketplaceHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md shadow-soft transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <img src={payhukLogo} alt="Payhuk" className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Payhuk</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 flex-1 justify-center">
            <Link to="/marketplace">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary transition-all">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary transition-all">
                <Store className="h-4 w-4 mr-2" />
                Ma Boutique
              </Button>
            </Link>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary transition-all">
                <UserCircle className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-accent text-accent-foreground font-semibold hover:shadow-glow">
                Créer ma boutique
              </Button>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="touch-manipulation"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] animate-in slide-in-from-right duration-300">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <img src={payhukLogo} alt="Payhuk" className="h-7 w-7" />
                      <span className="text-xl font-bold">Payhuk</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      className="touch-manipulation"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col gap-2 flex-1">
                    <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start h-12 text-base touch-manipulation hover:translate-x-1 transition-transform">
                        <ShoppingBag className="h-5 w-5 mr-3" />
                        Marketplace
                      </Button>
                    </Link>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start h-12 text-base touch-manipulation hover:translate-x-1 transition-transform">
                        <Store className="h-5 w-5 mr-3" />
                        Ma Boutique
                      </Button>
                    </Link>
                    <div className="h-px bg-border my-4" />
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start h-12 text-base touch-manipulation hover:translate-x-1 transition-transform">
                        <UserCircle className="h-5 w-5 mr-3" />
                        Se connecter
                      </Button>
                    </Link>
                  </nav>

                  {/* CTA Button */}
                  <div className="pt-4 border-t">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-12 gradient-accent text-accent-foreground font-semibold touch-manipulation hover:shadow-glow">
                        Créer ma boutique
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
