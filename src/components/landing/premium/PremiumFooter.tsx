import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { EmarzonaBrandLogo } from './EmarzonaBrandLogo';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const footerColumns = [
  {
    colKey: 'product' as const,
    links: [
      { linkKey: 'features', href: '#fonctionnalites' },
      { linkKey: 'marketplace', href: '/marketplace', route: true },
      { linkKey: 'pricing', href: '#tarifs' },
      { linkKey: 'integrations', href: '#ressources' },
    ],
  },
  {
    colKey: 'resources' as const,
    links: [
      { linkKey: 'blog', href: '#ressources' },
      { linkKey: 'docs', href: '#ressources' },
      { linkKey: 'help', href: '#ressources' },
      { linkKey: 'community', href: '/community', route: true },
    ],
  },
  {
    colKey: 'company' as const,
    links: [
      { linkKey: 'about', href: '#apropos' },
      { linkKey: 'contact', href: 'mailto:contact@emarzona.com' },
      { linkKey: 'careers', href: '#apropos' },
      { linkKey: 'press', href: '#apropos' },
    ],
  },
];

const socials = [
  { icon: Facebook, label: 'Facebook' },
  { icon: Twitter, label: 'X' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Youtube, label: 'YouTube' },
];

export function PremiumFooter() {
  const { t } = useLandingPremiumT();
  const [email, setEmail] = useState('');

  return (
    <footer
      id="apropos"
      className="relative overflow-visible border-t border-white/[0.06] bg-[#060608] text-[var(--lp-text-dim)]"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-12">
          <div className="relative isolate z-30 mb-1 lg:col-span-4">
            <Link to="/" className="lp-footer-logo inline-flex max-w-full">
              <EmarzonaBrandLogo variant="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{t('footer.tagline')}</p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:col-span-6">
            {footerColumns.map(col => (
              <div key={col.colKey} className="min-w-0">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white sm:text-xs">
                  {t(`footer.columns.${col.colKey}.title`)}
                </h4>
                <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                  {col.links.map(link => {
                    const label = t(`footer.columns.${col.colKey}.${link.linkKey}`);
                    return (
                      <li key={link.linkKey}>
                        {link.route ? (
                          <Link
                            to={link.href}
                            className="text-xs text-white/90 transition-colors hover:text-white sm:text-sm"
                          >
                            {label}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            className="text-xs text-white/90 transition-colors hover:text-white sm:text-sm"
                          >
                            {label}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div id="ressources" className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              {t('footer.newsletter')}
            </h4>
            <p className="mt-4 text-sm">{t('footer.newsletterDesc')}</p>
            <form
              className="lp-footer-newsletter mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-2"
              onSubmit={e => {
                e.preventDefault();
                setEmail('');
              }}
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                required
                className="h-11 min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-base text-white placeholder:text-white/30 focus:border-[var(--lp-blue)]/50 focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                className="lp-btn-primary inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold sm:w-auto"
              >
                {t('footer.subscribe')}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/legal/terms" className="hover:text-white">
              {t('footer.terms')}
            </Link>
            <Link to="/legal/privacy" className="hover:text-white">
              {t('footer.privacy')}
            </Link>
            <Link to="/legal/cookies" className="hover:text-white">
              {t('footer.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
