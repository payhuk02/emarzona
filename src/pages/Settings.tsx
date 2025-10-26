import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AdvancedProfileSettings } from "@/components/settings/AdvancedProfileSettings";
import { StoreSettings } from "@/components/settings/StoreSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DomainSettings } from "@/components/settings/DomainSettings";
import { ProfileDebug } from "@/components/debug/ProfileDebug";
import { ProfileTest } from "@/components/debug/ProfileTest";
import { DatabaseMigrationInstructions } from "@/components/debug/DatabaseMigrationInstructions";
import { ResponsiveDesignTest } from "@/components/debug/ResponsiveDesignTest";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const tab = searchParams.get('tab');
    const action = searchParams.get('action');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    // Si on vient de la page Boutique avec action=create, on passe l'info au composant StoreSettings
    if (tab === 'boutique' && action === 'create') {
      // L'action sera gérée par le composant StoreSettings
    }
  }, [searchParams]);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="w-full h-full px-4 py-6 sm:px-6 md:px-8 lg:px-10">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
              {/* Header - Responsive */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  {t('settings.title')}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('settings.subtitle')}
                </p>
              </div>

              {/* Tabs - Fully Responsive */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                {/* Mobile: Dropdown, Tablet+: Horizontal tabs */}
                <div className="w-full">
                  {/* Mobile View (< 640px) */}
                  <div className="block sm:hidden">
                    <TabsList className="grid w-full grid-cols-2 h-auto gap-2">
                      <TabsTrigger value="profile" className="text-xs py-2">
                        {t('settings.tabs.profile')}
                      </TabsTrigger>
                      <TabsTrigger value="store" className="text-xs py-2">
                        {t('settings.tabs.store')}
                      </TabsTrigger>
                      <TabsTrigger value="domain" className="text-xs py-2">
                        {t('settings.tabs.domain')}
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="text-xs py-2">
                        {t('settings.tabs.notifications')}
                      </TabsTrigger>
                      <TabsTrigger value="security" className="text-xs py-2">
                        {t('settings.tabs.security')}
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="text-xs py-2">
                        {t('settings.tabs.debug')}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tablet View (640px - 1024px) */}
                  <div className="hidden sm:block lg:hidden">
                    <TabsList className="grid w-full grid-cols-3 h-auto gap-2">
                      <TabsTrigger value="profile" className="text-sm py-2.5">
                        {t('settings.tabs.profile')}
                      </TabsTrigger>
                      <TabsTrigger value="store" className="text-sm py-2.5">
                        {t('settings.tabs.store')}
                      </TabsTrigger>
                      <TabsTrigger value="domain" className="text-sm py-2.5">
                        {t('settings.tabs.domain')}
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="text-sm py-2.5">
                        {t('settings.tabs.notifications')}
                      </TabsTrigger>
                      <TabsTrigger value="security" className="text-sm py-2.5">
                        {t('settings.tabs.security')}
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="text-sm py-2.5">
                        {t('settings.tabs.debug')}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Desktop View (> 1024px) */}
                  <div className="hidden lg:block">
                    <TabsList className="grid w-full grid-cols-6 h-auto">
                      <TabsTrigger value="profile" className="py-3">
                        {t('settings.tabs.profile')}
                      </TabsTrigger>
                      <TabsTrigger value="store" className="py-3">
                        {t('settings.tabs.store')}
                      </TabsTrigger>
                      <TabsTrigger value="domain" className="py-3">
                        {t('settings.tabs.domain')}
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="py-3">
                        {t('settings.tabs.notifications')}
                      </TabsTrigger>
                      <TabsTrigger value="security" className="py-3">
                        {t('settings.tabs.security')}
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="py-3">
                        {t('settings.tabs.debug')}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">{t('settings.profile.cardTitle')}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t('settings.profile.cardDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <AdvancedProfileSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Store Tab */}
                <TabsContent value="store" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">{t('settings.store.cardTitle')}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t('settings.store.cardDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <StoreSettings action={searchParams.get('action')} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Domain Tab */}
                <TabsContent value="domain" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="space-y-3 sm:space-y-4">
                    <DomainSettings />
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">{t('settings.notifications.cardTitle')}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t('settings.notifications.cardDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <NotificationSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">{t('settings.security.cardTitle')}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t('settings.security.cardDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <SecuritySettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Debug Tab */}
                <TabsContent value="debug" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">{t('settings.debug.cardTitle')}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t('settings.debug.cardDescription')}
                      </CardDescription>
                    </CardHeader>
                            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                              <DatabaseMigrationInstructions />
                              <div className="mt-6">
                                <ProfileTest />
                              </div>
                                  <div className="mt-6">
                                    <ResponsiveDesignTest />
                                  </div>
                            </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
