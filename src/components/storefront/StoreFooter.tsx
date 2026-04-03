import { Facebook, Instagram, Twitter, Linkedin, Youtube, Music2, Image as ImageIcon, Camera, MessageCircle, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStoreTheme } from '@/hooks/useStoreTheme';
import type { Store } from '@/hooks/useStores';

interface StoreFooterProps {
  storeName: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  pinterest_url?: string;
  snapchat_url?: string;
  discord_url?: string;
  twitch_url?: string;
  store?: Store | null;
  storeSlug?: string;
}

const StoreFooter = ({
  storeName,
  facebook_url,
  instagram_url,
  twitter_url,
  linkedin_url,
  youtube_url,
  tiktok_url,
  pinterest_url,
  snapchat_url,
  discord_url,
  twitch_url,
  store,
  storeSlug,
}: StoreFooterProps) => {
  const { t } = useTranslation();
  const theme = useStoreTheme(store);
  const currentYear = new Date().getFullYear();
  
  // Déterminer la classe CSS selon le style du footer
  const footerStyleClass = `store-footer-${theme.footerStyle}`;

  return (
    <footer 
      className={`bg-gradient-dark mt-8 sm:mt-12 lg:mt-16 border-t border-border ${footerStyleClass}`}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        borderColor: theme.textSecondaryColor + '40',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Links */}
          <div>
            <h3 
              className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg"
              style={{ 
                color: theme.textColor,
                fontFamily: theme.headingFont,
              }}
            >
              Liens
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li>
                <a 
                  href="#products" 
                  className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                  style={{ color: theme.linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                >
                  Produits
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                  style={{ color: theme.linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                >
                  À propos
                </a>
              </li>
              <li>
                <a 
                  href="#reviews" 
                  className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                  style={{ color: theme.linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                >
                  Avis
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                  style={{ color: theme.linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 
              className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg"
              style={{ 
                color: theme.textColor,
                fontFamily: theme.headingFont,
              }}
            >
              {t('storefront.footer.legal')}
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {store?.legal_pages?.terms_of_service && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/terms`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    {t('storefront.footer.terms')}
                  </a>
                </li>
              )}
              {store?.legal_pages?.privacy_policy && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/privacy`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    {t('storefront.footer.privacy')}
                  </a>
                </li>
              )}
              {store?.legal_pages?.return_policy && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/returns`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    Politique de retour
                  </a>
                </li>
              )}
              {store?.legal_pages?.shipping_policy && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/shipping`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    Politique de livraison
                  </a>
                </li>
              )}
              {store?.legal_pages?.refund_policy && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/refund`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    {t('storefront.footer.refund')}
                  </a>
                </li>
              )}
              {store?.legal_pages?.cookie_policy && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/cookies`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    Politique des cookies
                  </a>
                </li>
              )}
              {store?.legal_pages?.faq_content && (
                <li>
                  <a 
                    href={`/stores/${storeSlug || store?.slug}/legal/faq`}
                    className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                    style={{ color: theme.linkColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                  >
                    FAQ
                  </a>
                </li>
              )}
              {/* Fallback si aucune page légale n'est configurée */}
              {!store?.legal_pages && (
                <>
                  <li>
                    <a 
                      href="#terms" 
                      className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                      style={{ color: theme.linkColor }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                    >
                      {t('storefront.footer.terms')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#privacy" 
                      className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                      style={{ color: theme.linkColor }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                    >
                      {t('storefront.footer.privacy')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#refund" 
                      className="hover:opacity-80 transition-colors touch-manipulation block py-1"
                      style={{ color: theme.linkColor }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                    >
                      {t('storefront.footer.refund')}
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Languages & Location */}
          <div>
            <h3 
              className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg"
              style={{ 
                color: theme.textColor,
                fontFamily: theme.headingFont,
              }}
            >
              {t('storefront.footer.location')}
            </h3>
            <ul 
              className="space-y-2 sm:space-y-3 text-xs sm:text-sm"
              style={{ color: theme.textSecondaryColor }}
            >
              <li className="flex items-center gap-2">
                <span>🌍</span> {t('storefront.footer.africa')}
              </li>
              <li className="flex items-center gap-2">
                <span>🗣️</span> {t('storefront.footer.french')}
              </li>
              <li className="flex items-center gap-2">
                <span>💰</span> {t('storefront.footer.multiCurrency')}
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 
              className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg"
              style={{ 
                color: theme.textColor,
                fontFamily: theme.headingFont,
              }}
            >
              Nous suivre
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {facebook_url && (
                <a
                  href={facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
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
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
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
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
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
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {youtube_url && (
                <a
                  href={youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {tiktok_url && (
                <a
                  href={tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="TikTok"
                >
                  <Music2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {pinterest_url && (
                <a
                  href={pinterest_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="Pinterest"
                >
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {snapchat_url && (
                <a
                  href={snapchat_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="Snapchat"
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {discord_url && (
                <a
                  href={discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="Discord"
                >
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
              {twitch_url && (
                <a
                  href={twitch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all flex items-center justify-center touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: theme.buttonSecondaryColor,
                    color: theme.buttonSecondaryText,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
                    e.currentTarget.style.color = theme.buttonPrimaryText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
                    e.currentTarget.style.color = theme.buttonSecondaryText;
                  }}
                  aria-label="Twitch"
                >
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div 
          className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t text-center"
          style={{
            borderColor: theme.textSecondaryColor + '40',
          }}
        >
          <p 
            className="text-xs sm:text-sm mb-2"
            style={{ color: theme.textSecondaryColor }}
          >
            © {currentYear} <span className="font-semibold" style={{ color: theme.textColor }}>{storeName}</span>. Tous droits réservés.
          </p>
          <p 
            className="text-[10px] sm:text-xs"
            style={{ color: theme.textSecondaryColor }}
          >
            Propulsé par <span className="font-semibold" style={{ color: theme.primaryColor }}>Emarzona</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;






