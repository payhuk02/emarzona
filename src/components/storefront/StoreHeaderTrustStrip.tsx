import type {
  StoreHeaderTrustBadge,
  StoreHeaderValueProp,
} from '@/lib/commerce/store-header-config';
import { cn } from '@/lib/utils';

type StoreHeaderTrustStripProps = {
  trustBadges: readonly StoreHeaderTrustBadge[];
  valueProps: readonly StoreHeaderValueProp[];
  className?: string;
};

export function StoreHeaderTrustStrip({
  trustBadges,
  valueProps,
  className,
}: StoreHeaderTrustStripProps) {
  if (!trustBadges.length && !valueProps.length) return null;

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-10 flex flex-col', className)}>
      {trustBadges.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2 p-3 sm:p-4 pr-16 sm:pr-20">
          {trustBadges.map(badge => (
            <div
              key={badge.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:text-xs"
            >
              <badge.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      )}

      {valueProps.length > 0 && (
        <div className="mt-auto flex justify-center px-3 pb-16 sm:pb-20 md:pb-24">
          <div className="grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {valueProps.map(prop => (
              <div
                key={prop.id}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/20 bg-black/30 px-2 py-2 text-center backdrop-blur-sm sm:px-3 sm:py-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 sm:h-9 sm:w-9">
                  <prop.icon className="h-4 w-4 text-white" aria-hidden />
                </div>
                <span className="text-[10px] font-medium leading-tight text-white sm:text-xs">
                  {prop.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
