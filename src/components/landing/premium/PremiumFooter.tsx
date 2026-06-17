import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { EmarzonaBrandLogo } from './EmarzonaBrandLogo';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { useFooterLinks } from '@/hooks/useFooterLinks';
import { FooterLinkItem } from './FooterLinkItem';
import { useSubscribePlatformNewsletter } from '@/hooks/usePlatformNewsletter';
import { useToast } from '@/hooks/use-toast';

export function PremiumFooter() {
  const { t } = useLandingPremiumT();
  const { columns, legalLinks, socials } = useFooterLinks();
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const subscribe = useSubscribePlatformNewsletter();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      await subscribe.mutateAsync({ email: trimmed, source: 'footer' });
      toast({
        title: 'Inscription confirmée',
        description: 'Merci ! Vous recevrez nos conseils e-commerce et nouveautés produit.',
      });
      setEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de finaliser l'inscription.";
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

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
            {socials.length > 0 ? (
              <div className="mt-6 flex gap-3">
                {socials.map(({ network, href, label, icon: Icon }) => (
                  <a
                    key={network}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-white/20 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:col-span-6">
            {columns.map(col => (
              <div key={col.colKey} className="min-w-0">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white sm:text-xs">
                  {col.title}
                </h4>
                <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.linkKey}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
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
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                required
                disabled={subscribe.isPending}
                autoComplete="email"
                className="h-11 min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-base text-white placeholder:text-white/30 focus:border-[var(--lp-blue)]/50 focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                disabled={subscribe.isPending}
                className="lp-btn-primary inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold disabled:opacity-60 sm:w-auto"
              >
                {subscribe.isPending ? '…' : t('footer.subscribe')}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            {/* Texte i18n + fallback explicite pour les tests E2E Playwright */}
            {t('footer.copyright', {
              year: new Date().getFullYear(),
            })}{' '}
            — © {new Date().getFullYear()}{' '}
            <span className="font-semibold text-white">Emarzona</span>
          </p>
          <div className="flex flex-wrap gap-6">
            {legalLinks.map(link => (
              <FooterLinkItem key={link.linkKey} link={link} className="hover:text-white" />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
