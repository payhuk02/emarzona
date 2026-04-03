import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Copy, ExternalLink, Save, X, Settings } from 'lucide-react';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore } from './types/store-form';
import { useStoreFormState } from '@/hooks/useStoreFormState';
import { StoreCustomizationWizard } from './StoreCustomizationWizard';
import { StoreLegalPagesComponent } from './StoreLegalPages';
import { StoreMarketingContentComponent } from './StoreMarketingContent';
import { StoreCommerceSettings } from './StoreCommerceSettings';
import { StoreNotificationSettings } from './StoreNotificationSettings';
import {
  StoreSettingsTab, StoreAppearanceTab, StoreSeoTab,
  StoreLocationTab, StoreUrlTab, StoreAnalyticsTab,
} from './tabs';

interface StoreDetailsProps {
  store: ExtendedStore;
}

const StoreDetails = ({ store }: StoreDetailsProps) => {
  const form = useStoreFormState(store);

  const {
    formState, setters, isEditing, setIsEditing, isSubmitting,
    showCancelConfirm, setShowCancelConfirm, lastSaved, currentTab, setCurrentTab,
    fieldTouched, storeUrl,
    handleSubmit, handleCancel, resetForm, handleCopyUrl, handleSlugUpdate,
    applyConfig, handleColorChange, handleTypographyChange, handleLayoutChange,
    handleSeoChange, handleAddressChange, handleFieldBlur, validateField,
    updateStore, checkSlugAvailability, toast,
  } = form;

  const renderTabContent = useCallback((tabKey: string) => {
    switch (tabKey) {
      case 'settings':
        return (
          <StoreSettingsTab
            store={store}
            formState={formState}
            setters={setters}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            lastSaved={lastSaved}
            fieldTouched={fieldTouched}
            handleFieldBlur={handleFieldBlur}
            validateField={validateField}
            handleSubmit={handleSubmit}
            applyConfig={applyConfig}
            toast={toast}
          />
        );

      case 'appearance':
        return (
          <StoreAppearanceTab
            store={store}
            formState={formState}
            setters={setters}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            applyConfig={applyConfig}
            handleColorChange={handleColorChange}
            handleTypographyChange={handleTypographyChange}
            handleLayoutChange={handleLayoutChange}
            toast={toast}
          />
        );

      case 'seo':
        return (
          <StoreSeoTab
            store={store}
            formState={formState}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            handleSeoChange={handleSeoChange}
          />
        );

      case 'location':
        return (
          <StoreLocationTab
            formState={formState}
            setters={setters}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            handleAddressChange={handleAddressChange}
          />
        );

      case 'legal':
        return (
          <StoreLegalPagesComponent
            legalPages={formState.legalPages}
            onChange={setters.setLegalPages}
          />
        );

      case 'url':
        return (
          <StoreUrlTab
            store={store}
            storeUrl={storeUrl}
            isSubmitting={isSubmitting}
            handleSlugUpdate={handleSlugUpdate}
            checkSlugAvailability={checkSlugAvailability}
            handleCopyUrl={handleCopyUrl}
            updateStore={updateStore}
          />
        );

      case 'marketing':
        return (
          <StoreMarketingContentComponent
            marketingContent={formState.marketingContent}
            onChange={setters.setMarketingContent}
          />
        );

      case 'analytics':
        return (
          <StoreAnalyticsTab
            storeId={store.id}
            formState={formState}
            setters={setters}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
          />
        );

      case 'commerce':
        return <StoreCommerceSettings storeId={store.id} />;

      case 'notifications':
        return <StoreNotificationSettings storeId={store.id} />;

      default:
        return <div>Contenu non disponible pour {tabKey}</div>;
    }
  }, [
    store, formState, setters, isEditing, isSubmitting, lastSaved, fieldTouched, storeUrl,
    handleSubmit, handleCancel, handleCopyUrl, handleSlugUpdate, applyConfig,
    handleColorChange, handleTypographyChange, handleLayoutChange, handleSeoChange,
    handleAddressChange, handleFieldBlur, validateField,
    updateStore, checkSlugAvailability, toast,
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 sm:p-6 border border-primary/20 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {formState.logoUrl || store.logo_url ? (
              <img src={formState.logoUrl || store.logo_url || ''} alt={`Logo ${store.name}`} className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border border-border shadow-sm" />
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-500/30">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{store.name}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Boutique en ligne</p>
              {store.description && <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{store.description}</p>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10" aria-label="Modifier la boutique">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Modifier</span>
                <span className="sm:hidden">Modif.</span>
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10" aria-label="Enregistrer les modifications">
                  {isSubmitting ? (
                    <><div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" /><span className="hidden sm:inline">Enregistrement...</span><span className="sm:hidden">Sauvegarde...</span></>
                  ) : (
                    <><Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Enregistrer</span><span className="sm:hidden">Sauver</span></>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSubmitting} className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10" aria-label="Annuler les modifications">
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Annuler</span>
                  <span className="sm:hidden">Annul.</span>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => window.open(`/stores/${store.slug}`, '_blank')} className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10" aria-label={`Ouvrir la boutique ${store.name}`}>
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Voir la boutique</span>
              <span className="sm:hidden">Voir</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyUrl} className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10" aria-label={`Copier le lien de la boutique ${store.name}`}>
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Copier le lien</span>
              <span className="sm:hidden">Copier</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Wizard with tabs */}
      <StoreCustomizationWizard
        store={store as Store}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        renderContent={renderTabContent}
      />

      {/* Social links (read-only card) */}
      {(store.facebook_url || store.instagram_url || store.twitter_url || store.linkedin_url ||
        store.youtube_url || store.tiktok_url || store.pinterest_url || store.snapchat_url ||
        store.discord_url || store.twitch_url) && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {[
                { url: store.facebook_url, label: 'Facebook' },
                { url: store.instagram_url, label: 'Instagram' },
                { url: store.twitter_url, label: 'Twitter' },
                { url: store.linkedin_url, label: 'LinkedIn' },
                { url: store.youtube_url, label: 'YouTube' },
                { url: store.tiktok_url, label: 'TikTok' },
                { url: store.pinterest_url, label: 'Pinterest' },
                { url: store.snapchat_url, label: 'Snapchat' },
                { url: store.discord_url, label: 'Discord' },
                { url: store.twitch_url, label: 'Twitch' },
              ].filter(s => s.url).map(s => (
                <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  {s.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel confirm dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler les modifications ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir les annuler ? Toutes vos modifications seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>Continuer l'édition</AlertDialogCancel>
            <AlertDialogAction onClick={resetForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Annuler les modifications</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoreDetails;
