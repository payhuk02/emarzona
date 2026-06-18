import { cn } from '@/lib/utils';

type EmarzonaBrandNameProps = {
  className?: string;
};

/** Mot-symbole « Emarzona » aux couleurs du logo (Emar orange, zona bleu). */
export function EmarzonaBrandName({ className }: EmarzonaBrandNameProps) {
  return (
    <span
      data-testid="emarzona-brand-name"
      aria-label="Emarzona"
      className={cn('emarzona-brand-name inline', className)}
    >
      <span className="emarzona-brand-emar" aria-hidden>
        Emar
      </span>
      <span className="emarzona-brand-zona" aria-hidden>
        zona
      </span>
    </span>
  );
}
