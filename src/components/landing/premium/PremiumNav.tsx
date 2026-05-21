import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { EMARZONA_DEFAULT_LOGO } from '@/lib/brand/emarzona-logo';
import { PremiumLangSwitcher } from './PremiumLangSwitcher';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string; route?: boolean };

const navLinks: NavItem[] = [
  { label: 'Marketplace', href: '/marketplace', route: true },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Ressources', href: '#ressources' },
  { label: 'À propos', href: '#apropos' },
];

function NavLinkItem({
  item,
  onClick,
  className,
}: {
  item: NavItem;
  onClick?: () => void;
  className?: string;
}) {
  const location = useLocation();
  const isActive = item.route && location.pathname === item.href;

  const cls = cn(
    'whitespace-nowrap text-sm transition-colors duration-300',
    isActive ? 'text-[var(--lp-gold)]' : 'text-white/65 hover:text-white',
    className
  );

  if (item.route) {
    return (
      <Link to={item.href} className={cls} onClick={onClick}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} className={cls} onClick={onClick}>
      {item.label}
    </a>
  );
}

export function PremiumNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#08080a]/88 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:h-[72px] sm:gap-4 sm:px-5 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center">
          <img
            src={EMARZONA_DEFAULT_LOGO}
            alt="Emarzona — plateforme e-commerce"
            className="h-11 w-auto max-w-[168px] object-contain object-left sm:h-12 sm:max-w-[200px] lg:max-w-[220px]"
            width={220}
            height={52}
            fetchPriority="high"
          />
        </Link>

        <nav
          className="hidden min-w-0 items-center justify-center gap-4 lg:flex lg:gap-6 xl:gap-7"
          aria-label="Navigation principale"
        >
          {navLinks.map(item => (
            <NavLinkItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-2 sm:gap-3 lg:flex">
          <PremiumLangSwitcher />
          <Link
            to="/login"
            className="hidden whitespace-nowrap text-sm font-medium text-white/70 transition-colors hover:text-white md:inline"
          >
            Me connecter
          </Link>
          <Link
            to="/register"
            className="lp-btn-primary whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Démarrer gratuitement
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 lg:hidden">
          <PremiumLangSwitcher />
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/90 transition-colors hover:border-white/20 hover:bg-white/5"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-[#0a0a0c] px-5 py-6 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map(item => (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/5"
                />
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6">
              <Link
                to="/login"
                className="lp-btn-outline rounded-full py-3 text-center text-sm"
                onClick={() => setOpen(false)}
              >
                Me connecter
              </Link>
              <Link
                to="/register"
                className="lp-btn-primary rounded-full py-3.5 text-center text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                Démarrer gratuitement
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
