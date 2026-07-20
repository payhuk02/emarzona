import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  buildAppearanceQualityChecks,
  contrastRatioLabel,
} from '@/lib/storefront/store-quality-checklist';
import type { StoreAppearanceFormDraft } from '@/lib/storefront/store-preview-draft';

interface StoreAppearanceQualityChecklistProps {
  formDraft: StoreAppearanceFormDraft;
}

export function StoreAppearanceQualityChecklist({
  formDraft,
}: StoreAppearanceQualityChecklistProps) {
  const { t } = useTranslation();
  const checks = useMemo(() => buildAppearanceQualityChecks(formDraft), [formDraft]);

  const textBg = contrastRatioLabel(
    formDraft.textColor || '#1f2937',
    formDraft.backgroundColor || '#ffffff'
  );

  return (
    <div
      className="rounded-lg border bg-muted/30 p-3 space-y-2"
      data-testid="store-appearance-quality-checklist"
    >
      <p className="text-sm font-medium">{t('store.quality.checklistTitle')}</p>
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
              {check.id === 'textContrast' ? ` (${textBg})` : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
