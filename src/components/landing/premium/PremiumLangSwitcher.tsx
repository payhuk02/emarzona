import { useCallback, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface PremiumLangSwitcherProps {
  className?: string;
}

export function PremiumLangSwitcher({ className }: PremiumLangSwitcherProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = AVAILABLE_LANGUAGES.find(l => l.code === i18n.language) ?? AVAILABLE_LANGUAGES[0];

  const changeLanguage = useCallback(
    (code: LanguageCode) => {
      i18n.changeLanguage(code);
      localStorage.setItem('emarzona_language', code);
      document.documentElement.lang = code;
      setOpen(false);
    },
    [i18n]
  );

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'lp-lang-switcher flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-all duration-300',
          open
            ? 'border-[var(--lp-gold)]/45 bg-white/[0.08] text-white'
            : 'border-white/12 bg-white/[0.04] text-white/80 hover:border-[var(--lp-gold)]/30 hover:bg-white/[0.06] hover:text-white'
        )}
        aria-label={`Langue : ${current.name}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--lp-gold)]/80" strokeWidth={1.5} />
        <span className="text-base leading-none" aria-hidden>
          {current.flag}
        </span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide sm:inline">
          {current.code}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 opacity-50 transition-transform',
            open && 'rotate-180'
          )}
          strokeWidth={2}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-[60] mt-2 min-w-[148px] overflow-hidden rounded-xl border border-white/10 bg-[#12121a]/98 py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          {AVAILABLE_LANGUAGES.map(lang => (
            <li key={lang.code} role="option" aria-selected={lang.code === current.code}>
              <button
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors',
                  lang.code === current.code
                    ? 'bg-[var(--lp-gold)]/12 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-white/35">
                  {lang.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
