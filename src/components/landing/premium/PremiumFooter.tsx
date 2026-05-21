import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { EmarzonaBrandLogo } from './EmarzonaBrandLogo';

const columns = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#fonctionnalites' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Tarifs', href: '#tarifs' },
      { label: 'Intégrations', href: '#ressources' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Blog', href: '#ressources' },
      { label: 'Documentation', href: '#ressources' },
      { label: "Centre d'aide", href: '#ressources' },
      { label: 'Communauté', href: '/community' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '#apropos' },
      { label: 'Contact', href: 'mailto:contact@emarzona.com' },
      { label: 'Carrières', href: '#apropos' },
      { label: 'Presse', href: '#apropos' },
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
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              La plateforme e-commerce tout-en-un pour vendre, gérer et développer votre activité en
              ligne.
            </p>
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
            {columns.map(col => (
              <div key={col.title} className="min-w-0">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white sm:text-xs">
                  {col.title}
                </h4>
                <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link
                          to={link.href}
                          className="text-xs text-white/90 transition-colors hover:text-white sm:text-sm"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-xs text-white/90 transition-colors hover:text-white sm:text-sm"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div id="ressources" className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Newsletter
            </h4>
            <p className="mt-4 text-sm">Conseils e-commerce et nouveautés produit.</p>
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
                placeholder="Votre e-mail"
                required
                className="h-11 min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-base text-white placeholder:text-white/30 focus:border-[var(--lp-blue)]/50 focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                className="lp-btn-primary inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold sm:w-auto"
              >
                S&apos;inscrire
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Emarzona. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/legal/terms" className="hover:text-white">
              Conditions d&apos;utilisation
            </Link>
            <Link to="/legal/privacy" className="hover:text-white">
              Confidentialité
            </Link>
            <Link to="/legal/cookies" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
