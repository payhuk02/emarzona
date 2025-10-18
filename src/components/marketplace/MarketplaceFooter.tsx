import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone } from "lucide-react";
import payhukLogo from "@/assets/payhuk-logo.png";

const MarketplaceFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-dark border-t border-border py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={payhukLogo} alt="Payhuk" className="h-8 w-8" />
              <span className="text-xl sm:text-2xl font-bold">Payhuk</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              La plateforme tout-en-un pour vendre vos produits digitaux en Afrique
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Liens rapides</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li>
                <Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Créer ma boutique
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#terms" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  CGU
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Confidentialité
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:contact@payhuk.com" className="hover:text-primary transition-colors">
                  contact@payhuk.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+2250000000000" className="hover:text-primary transition-colors">
                  +225 00 00 00 00 00
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>🌍</span> Abidjan, Côte d'Ivoire
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {currentYear} <span className="font-semibold text-foreground">Payhuk</span>. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MarketplaceFooter;
