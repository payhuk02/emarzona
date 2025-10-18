import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

interface StoreFooterProps {
  storeName: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
}

const StoreFooter = ({
  storeName,
  facebook_url,
  instagram_url,
  twitter_url,
  linkedin_url,
}: StoreFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-dark text-foreground mt-8 sm:mt-12 lg:mt-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Links */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg">Liens</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li>
                <a href="#products" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Produits
                </a>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  À propos
                </a>
              </li>
              <li>
                <a href="#reviews" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Avis
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg">Légales</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
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
              <li>
                <a href="#refund" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation block py-1">
                  Remboursement
                </a>
              </li>
            </ul>
          </div>

          {/* Languages & Location */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg">Localisation</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>🌍</span> Afrique
              </li>
              <li className="flex items-center gap-2">
                <span>🗣️</span> Français
              </li>
              <li className="flex items-center gap-2">
                <span>💰</span> Multidevise
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg">Nous suivre</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {facebook_url && (
                <a
                  href={facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {instagram_url && (
                <a
                  href={instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {twitter_url && (
                <a
                  href={twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {linkedin_url && (
                <a
                  href={linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            © {currentYear} <span className="font-semibold text-foreground">{storeName}</span>. Tous droits réservés.
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Propulsé par <span className="text-primary font-semibold">Payhuk</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
