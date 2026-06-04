import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  Image as ImageIcon,
  Camera,
  MessageCircle,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { useStoreFooterT } from '@/hooks/useStoreFooterT';
import { useStoreFooterLinks } from '@/hooks/useStoreFooterLinks';
import { StoreFooterLinkItem } from '@/components/storefront/StoreFooterLinkItem';
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

type SocialEntry = { url?: string; icon: LucideIcon; label: string };

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
  const { t } = useStoreFooterT();
  const theme = useStoreTheme(store);
  const { navLinks, legalLinks, sectionTitles, locationItems } = useStoreFooterLinks({
    storeSlug: storeSlug || store?.slug,
    subdomain: store?.subdomain,
    legalPages: store?.legal_pages,
  });

  const currentYear = new Date().getFullYear();
  const footerStyleClass = `store-footer-${theme.footerStyle}`;

  const socials: SocialEntry[] = [
    { url: facebook_url, icon: Facebook, label: 'Facebook' },
    { url: instagram_url, icon: Instagram, label: 'Instagram' },
    { url: twitter_url, icon: Twitter, label: 'X' },
    { url: linkedin_url, icon: Linkedin, label: 'LinkedIn' },
    { url: youtube_url, icon: Youtube, label: 'YouTube' },
    { url: tiktok_url, icon: Music2, label: 'TikTok' },
    { url: pinterest_url, icon: ImageIcon, label: 'Pinterest' },
    { url: snapchat_url, icon: Camera, label: 'Snapchat' },
    { url: discord_url, icon: MessageCircle, label: 'Discord' },
    { url: twitch_url, icon: Radio, label: 'Twitch' },
  ].filter((s): s is SocialEntry & { url: string } => Boolean(s.url?.trim()));

  const headingStyle = {
    color: theme.textColor,
    fontFamily: theme.headingFont,
  };

  const renderSocialButton = ({ url, icon: Icon, label }: SocialEntry & { url: string }) => (
    <a
      key={label}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all touch-manipulation active:scale-95"
      style={{
        backgroundColor: theme.buttonSecondaryColor,
        color: theme.buttonSecondaryText,
        borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = theme.buttonPrimaryColor;
        e.currentTarget.style.color = theme.buttonPrimaryText;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = theme.buttonSecondaryColor;
        e.currentTarget.style.color = theme.buttonSecondaryText;
      }}
      aria-label={label}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </a>
  );

  const showLegalFallback = legalLinks.length === 0 && !store?.legal_pages;

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
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg" style={headingStyle}>
              {sectionTitles.links}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {navLinks.map(link => (
                <li key={link.linkKey}>
                  <StoreFooterLinkItem
                    link={link}
                    linkColor={theme.linkColor}
                    linkHoverColor={theme.linkHoverColor}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg" style={headingStyle}>
              {sectionTitles.legal}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {legalLinks.map(link => (
                <li key={link.linkKey}>
                  <StoreFooterLinkItem
                    link={link}
                    linkColor={theme.linkColor}
                    linkHoverColor={theme.linkHoverColor}
                  />
                </li>
              ))}
              {showLegalFallback &&
                (['terms', 'privacy', 'refund'] as const).map(key => (
                  <li key={key}>
                    <StoreFooterLinkItem
                      link={{
                        linkKey: key,
                        label: t(key),
                        href: `#${key}`,
                        type: 'anchor',
                      }}
                      linkColor={theme.linkColor}
                      linkHoverColor={theme.linkHoverColor}
                    />
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg" style={headingStyle}>
              {sectionTitles.location}
            </h3>
            <ul
              className="space-y-2 sm:space-y-3 text-xs sm:text-sm"
              style={{ color: theme.textSecondaryColor }}
            >
              {locationItems.map(item => (
                <li key={item.key} className="flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </li>
              ))}
            </ul>
          </div>

          {socials.length > 0 ? (
            <div>
              <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-lg" style={headingStyle}>
                {sectionTitles.followUs}
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">{socials.map(renderSocialButton)}</div>
            </div>
          ) : null}
        </div>

        <div
          className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t text-center"
          style={{ borderColor: theme.textSecondaryColor + '40' }}
        >
          <p className="text-xs sm:text-sm mb-2" style={{ color: theme.textSecondaryColor }}>
            {t('copyright', { year: currentYear, storeName })}
          </p>
          <p className="text-[10px] sm:text-xs" style={{ color: theme.textSecondaryColor }}>
            {t('poweredBy')}{' '}
            <span className="font-semibold" style={{ color: theme.primaryColor }}>
              Emarzona
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
