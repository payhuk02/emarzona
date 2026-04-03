import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import StoreAnalytics from '../StoreAnalytics';
import { StoreAnalyticsSettings } from '../StoreAnalyticsSettings';
import type { StoreFormState } from '../types/store-form';

interface StoreAnalyticsTabProps {
  storeId: string;
  formState: Pick<StoreFormState,
    'googleAnalyticsId' | 'googleAnalyticsEnabled' |
    'facebookPixelId' | 'facebookPixelEnabled' |
    'googleTagManagerId' | 'googleTagManagerEnabled' |
    'tiktokPixelId' | 'tiktokPixelEnabled' |
    'customTrackingScripts' | 'customScriptsEnabled'
  >;
  setters: Record<string, (v: any) => void>;
  isEditing: boolean;
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export const StoreAnalyticsTab = ({ storeId, formState, setters, isEditing, isSubmitting, handleSubmit }: StoreAnalyticsTabProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">Analytics de votre boutique</CardTitle>
          <CardDescription className="text-sm sm:text-base">Suivez les performances de votre boutique avec des statistiques détaillées</CardDescription>
        </CardHeader>
        <CardContent className="store-card-content">
          <StoreAnalytics storeId={storeId} />
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="store-card">
          <CardHeader className="store-card-header">
            <CardTitle className="text-lg sm:text-xl font-semibold">Configuration du tracking</CardTitle>
            <CardDescription className="text-sm sm:text-base">Configurez vos outils de suivi et d'analyse</CardDescription>
          </CardHeader>
          <CardContent className="store-card-content">
            <StoreAnalyticsSettings
              googleAnalyticsId={formState.googleAnalyticsId} googleAnalyticsEnabled={formState.googleAnalyticsEnabled}
              onGoogleAnalyticsChange={(id, enabled) => { setters.setGoogleAnalyticsId(id); setters.setGoogleAnalyticsEnabled(enabled); }}
              facebookPixelId={formState.facebookPixelId} facebookPixelEnabled={formState.facebookPixelEnabled}
              onFacebookPixelChange={(id, enabled) => { setters.setFacebookPixelId(id); setters.setFacebookPixelEnabled(enabled); }}
              googleTagManagerId={formState.googleTagManagerId} googleTagManagerEnabled={formState.googleTagManagerEnabled}
              onGoogleTagManagerChange={(id, enabled) => { setters.setGoogleTagManagerId(id); setters.setGoogleTagManagerEnabled(enabled); }}
              tiktokPixelId={formState.tiktokPixelId} tiktokPixelEnabled={formState.tiktokPixelEnabled}
              onTiktokPixelChange={(id, enabled) => { setters.setTiktokPixelId(id); setters.setTiktokPixelEnabled(enabled); }}
              customScripts={formState.customTrackingScripts} customScriptsEnabled={formState.customScriptsEnabled}
              onCustomScriptsChange={(scripts, enabled) => { setters.setCustomTrackingScripts(scripts); setters.setCustomScriptsEnabled(enabled); }}
            />
            <div className="pt-4 border-t mt-6">
              <Button onClick={() => handleSubmit()} disabled={isSubmitting} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
