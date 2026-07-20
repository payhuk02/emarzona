import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Save, Upload } from 'lucide-react';
import {
  getStorefrontPublishMode,
  isDraftAndPublishTab,
} from '@/lib/storefront/storefront-publish-model';

interface StorefrontPublishBannerProps {
  currentTab: string;
  hasUnpublishedAppearanceDraft: boolean;
  isSubmitting?: boolean;
  onSaveAppearanceDraft?: () => void | Promise<void>;
  onPublishAppearance?: () => void | Promise<void>;
}

export function StorefrontPublishBanner({
  currentTab,
  hasUnpublishedAppearanceDraft,
  isSubmitting = false,
  onSaveAppearanceDraft,
  onPublishAppearance,
}: StorefrontPublishBannerProps) {
  const { t } = useTranslation();
  const publishMode = getStorefrontPublishMode(currentTab);

  if (hasUnpublishedAppearanceDraft) {
    return (
      <Alert
        data-testid="storefront-publish-banner-unpublished"
        variant="default"
        className="border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20"
      >
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>{t('store.publishBanner.unpublishedAppearanceTitle')}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t('store.publishBanner.unpublishedAppearanceDescription')}</p>
          <div className="flex flex-wrap gap-2">
            {onSaveAppearanceDraft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => void onSaveAppearanceDraft()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? t('store.customization.saving') : t('store.appearance.saveDraft')}
              </Button>
            )}
            {onPublishAppearance && (
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={() => void onPublishAppearance()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isSubmitting ? t('store.appearance.publishing') : t('store.appearance.publish')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isDraftAndPublishTab(currentTab) && publishMode === 'draft_and_publish') {
    return (
      <Alert data-testid="storefront-publish-banner-appearance-hint">
        <Info className="h-4 w-4" />
        <AlertDescription>{t('store.publishBanner.appearanceDraftHint')}</AlertDescription>
      </Alert>
    );
  }

  if (publishMode === 'immediate') {
    return (
      <Alert data-testid="storefront-publish-banner-immediate">
        <Info className="h-4 w-4" />
        <AlertDescription>{t('store.publishBanner.immediateHint')}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
