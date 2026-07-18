import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import StoreAnalytics from '../StoreAnalytics';
import { StoreAnalyticsSettings } from '../StoreAnalyticsSettings';
import type { StoreFormState } from '../types/store-form';

interface StoreAnalyticsTabProps {
  storeId: string;
  formState: Pick<
    StoreFormState,
    | 'googleAnalyticsId'
    | 'googleAnalyticsEnabled'
    | 'facebookPixelId'
    | 'facebookPixelEnabled'
    | 'googleTagManagerId'
    | 'googleTagManagerEnabled'
    | 'tiktokPixelId'
    | 'tiktokPixelEnabled'
    | 'customTrackingScripts'
    | 'customScriptsEnabled'
  >;
  setters: Record<string, (v: string | boolean | null) => void>;
  isEditing: boolean;
}

export const StoreAnalyticsTab = ({
  storeId,
  formState,
  setters,
  isEditing,
}: StoreAnalyticsTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            {t('store.tabs.analytics.title')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('store.tabs.analytics.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="store-card-content">
          <StoreAnalytics storeId={storeId} />
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="store-card">
          <CardHeader className="store-card-header">
            <CardTitle className="text-lg sm:text-xl font-semibold">
              {t('store.tabs.analytics.trackingTitle')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('store.tabs.analytics.trackingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="store-card-content">
            <StoreAnalyticsSettings
              googleAnalyticsId={formState.googleAnalyticsId}
              googleAnalyticsEnabled={formState.googleAnalyticsEnabled}
              onGoogleAnalyticsChange={(id, enabled) => {
                setters.setGoogleAnalyticsId(id);
                setters.setGoogleAnalyticsEnabled(enabled);
              }}
              facebookPixelId={formState.facebookPixelId}
              facebookPixelEnabled={formState.facebookPixelEnabled}
              onFacebookPixelChange={(id, enabled) => {
                setters.setFacebookPixelId(id);
                setters.setFacebookPixelEnabled(enabled);
              }}
              googleTagManagerId={formState.googleTagManagerId}
              googleTagManagerEnabled={formState.googleTagManagerEnabled}
              onGoogleTagManagerChange={(id, enabled) => {
                setters.setGoogleTagManagerId(id);
                setters.setGoogleTagManagerEnabled(enabled);
              }}
              tiktokPixelId={formState.tiktokPixelId}
              tiktokPixelEnabled={formState.tiktokPixelEnabled}
              onTiktokPixelChange={(id, enabled) => {
                setters.setTiktokPixelId(id);
                setters.setTiktokPixelEnabled(enabled);
              }}
              customScripts={formState.customTrackingScripts}
              customScriptsEnabled={formState.customScriptsEnabled}
              onCustomScriptsChange={(scripts, enabled) => {
                setters.setCustomTrackingScripts(scripts);
                setters.setCustomScriptsEnabled(enabled);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
