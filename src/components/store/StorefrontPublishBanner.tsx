import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Save, Upload } from 'lucide-react';
import {
  getStorefrontPublishMode,
  isDraftAndPublishTab,
  tabToContentDomain,
} from '@/lib/storefront/storefront-publish-model';

interface StorefrontPublishBannerProps {
  currentTab: string;
  hasUnpublishedAppearanceDraft: boolean;
  hasUnpublishedContentDraft?: boolean;
  isSubmitting?: boolean;
  onSaveAppearanceDraft?: () => void | Promise<void>;
  onPublishAppearance?: () => void | Promise<void>;
  onSaveContentDraft?: () => void | Promise<void>;
  onPublishContent?: () => void | Promise<void>;
}

export function StorefrontPublishBanner({
  currentTab,
  hasUnpublishedAppearanceDraft,
  hasUnpublishedContentDraft = false,
  isSubmitting = false,
  onSaveAppearanceDraft,
  onPublishAppearance,
  onSaveContentDraft,
  onPublishContent,
}: StorefrontPublishBannerProps) {
  const { t } = useTranslation();
  const publishMode = getStorefrontPublishMode(currentTab);
  const contentDomain = tabToContentDomain(currentTab);

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

  if (contentDomain && hasUnpublishedContentDraft) {
    return (
      <Alert
        data-testid="storefront-publish-banner-unpublished-content"
        variant="default"
        className="border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20"
      >
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>{t('store.publishBanner.unpublishedContentTitle')}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t('store.publishBanner.unpublishedContentDescription')}</p>
          <div className="flex flex-wrap gap-2">
            {onSaveContentDraft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => void onSaveContentDraft()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? t('store.customization.saving') : t('store.content.saveDraft')}
              </Button>
            )}
            {onPublishContent && (
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={() => void onPublishContent()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isSubmitting ? t('store.content.publishing') : t('store.content.publish')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isDraftAndPublishTab(currentTab) && publishMode === 'draft_and_publish') {
    const hintKey =
      currentTab === 'appearance'
        ? 'store.publishBanner.appearanceDraftHint'
        : 'store.publishBanner.contentDraftHint';
    return (
      <Alert data-testid="storefront-publish-banner-draft-hint">
        <Info className="h-4 w-4" />
        <AlertDescription>{t(hintKey)}</AlertDescription>
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
