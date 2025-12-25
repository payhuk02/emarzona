import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AdvancedProfileSettings } from "@/components/settings/AdvancedProfileSettings";
import { StoreSettings } from "@/components/settings/StoreSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DomainSettings } from "@/components/settings/DomainSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ImportExportManager } from "@/components/import-export/ImportExportManager";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const action = searchParams.get('action');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    // Si on vient de la page Boutique avec action=create, on passe l'info au composant StoreSettings
    if (tab === 'store' && action === 'create') {
      // L'action sera gérée par le composant StoreSettings
    }
  }, [searchParams]);

  return (
    <MainLayout layoutType="settings">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 animate-in zoom-in duration-500">
                  <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                    {t('settings.title')}
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    {t('settings.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs - Fully Responsive */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 h-auto gap-2 overflow-x-auto">
                <TabsTrigger value="profile" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  {t('settings.tabs.profile')}
                </TabsTrigger>
                <TabsTrigger value="store" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  {t('settings.tabs.store')}
                </TabsTrigger>
                <TabsTrigger value="domain" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  {t('settings.tabs.domain')}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  {t('settings.tabs.notifications')}
                </TabsTrigger>
                <TabsTrigger value="appearance" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  Apparence
                </TabsTrigger>
                <TabsTrigger value="import-export" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  Import/Export
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs sm:text-sm min-h-[44px] py-2 sm:py-2.5 lg:py-3">
                  {t('settings.tabs.security')}
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{t('settings.profile.cardTitle')}</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      {t('settings.profile.cardDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                    <AdvancedProfileSettings />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Store Tab */}
              <TabsContent value="store" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{t('settings.store.cardTitle')}</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      {t('settings.store.cardDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                    <StoreSettings action={searchParams.get('action')} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Domain Tab */}
              <TabsContent value="domain" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-3 sm:space-y-4">
                  <DomainSettings />
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{t('settings.notifications.cardTitle')}</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      {t('settings.notifications.cardDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                    <NotificationSettings />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AppearanceSettings />
              </TabsContent>

              {/* Import/Export Tab */}
              <TabsContent value="import-export" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">Import/Export de données</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Importez ou exportez vos produits, commandes et clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                    <ImportExportManager />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{t('settings.security.cardTitle')}</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      {t('settings.security.cardDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                    <SecuritySettings />
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
    </MainLayout>
  );
};

export default Settings;
