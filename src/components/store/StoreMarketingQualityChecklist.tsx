import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { buildMarketingQualityChecks } from '@/lib/storefront/store-quality-checklist';
import type { StoreMarketingContent } from '@/hooks/useStores';

interface StoreMarketingQualityChecklistProps {
  content: StoreMarketingContent | null | undefined;
}

export function StoreMarketingQualityChecklist({ content }: StoreMarketingQualityChecklistProps) {
  const { t } = useTranslation();
  const checks = useMemo(() => buildMarketingQualityChecks(content), [content]);

  return (
    <div
      className="rounded-lg border bg-muted/30 p-3 space-y-2"
      data-testid="store-marketing-quality-checklist"
    >
      <p className="text-sm font-medium">{t('store.quality.marketingChecklistTitle')}</p>
      <ul className="space-y-1.5">
        {checks.map(check => (
          <li key={check.id} className="flex items-start gap-2 text-sm">
            {check.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  check.level === 'required' ? 'text-amber-600' : 'text-muted-foreground'
                }`}
              />
            )}
            <span className={check.ok ? 'text-muted-foreground' : undefined}>
              {t(check.labelKey)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
