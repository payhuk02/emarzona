import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { StoreSettings } from "@/components/settings/StoreSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DomainSettings } from "@/components/settings/DomainSettings";
import { ProfileDebug } from "@/components/debug/ProfileDebug";
import { ProfileTest } from "@/components/debug/ProfileTest";
import { DatabaseMigrationInstructions } from "@/components/debug/DatabaseMigrationInstructions";
import { MobileResponsiveTest } from "@/components/debug/MobileResponsiveTest";

const Settings = () => {
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
                  Paramètres
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gérez vos préférences et paramètres
                </p>
              </div>

              {/* Tabs - Fully Responsive */}
              <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
                {/* Mobile: Dropdown, Tablet+: Horizontal tabs */}
                <div className="w-full">
                  {/* Mobile View (< 640px) */}
                  <div className="block sm:hidden">
                    <TabsList className="grid w-full grid-cols-2 h-auto gap-2">
                      <TabsTrigger value="profile" className="text-xs py-2">
                        Profil
                      </TabsTrigger>
                      <TabsTrigger value="store" className="text-xs py-2">
                        Boutique
                      </TabsTrigger>
                      <TabsTrigger value="domain" className="text-xs py-2">
                        Domaine
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="text-xs py-2">
                        Notifications
                      </TabsTrigger>
                      <TabsTrigger value="security" className="text-xs py-2">
                        Sécurité
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="text-xs py-2">
                        Debug
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tablet View (640px - 1024px) */}
                  <div className="hidden sm:block lg:hidden">
                    <TabsList className="grid w-full grid-cols-3 h-auto gap-2">
                      <TabsTrigger value="profile" className="text-sm py-2.5">
                        Profil
                      </TabsTrigger>
                      <TabsTrigger value="store" className="text-sm py-2.5">
                        Boutique
                      </TabsTrigger>
                      <TabsTrigger value="domain" className="text-sm py-2.5">
                        Domaine
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="text-sm py-2.5">
                        Notifications
                      </TabsTrigger>
                      <TabsTrigger value="security" className="text-sm py-2.5">
                        Sécurité
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="text-sm py-2.5">
                        Debug
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Desktop View (> 1024px) */}
                  <div className="hidden lg:block">
                    <TabsList className="grid w-full grid-cols-6 h-auto">
                      <TabsTrigger value="profile" className="py-3">
                        Profil
                      </TabsTrigger>
                      <TabsTrigger value="store" className="py-3">
                        Boutique
                      </TabsTrigger>
                      <TabsTrigger value="domain" className="py-3">
                        Domaine
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="py-3">
                        Notifications
                      </TabsTrigger>
                      <TabsTrigger value="security" className="py-3">
                        Sécurité
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="py-3">
                        Debug
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">Informations du profil</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Gérez vos informations personnelles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <ProfileSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Store Tab */}
                <TabsContent value="store" className="space-y-3 sm:space-y-4 animate-fade-in">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
                      <CardTitle className="text-lg sm:text-xl">Paramètres de la boutique</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Personnalisez votre boutique en ligne
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <StoreSettings />
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
                      <CardTitle className="text-lg sm:text-xl">Préférences de notifications</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Configurez comment vous souhaitez être notifié
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
                      <CardTitle className="text-lg sm:text-xl">Sécurité</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Gérez la sécurité de votre compte
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
                      <CardTitle className="text-lg sm:text-xl">Debug Profil</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Testez la connexion et la structure de la base de données
                      </CardDescription>
                    </CardHeader>
                            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                              <DatabaseMigrationInstructions />
                              <div className="mt-6">
                                <ProfileTest />
                              </div>
                              <div className="mt-6">
                                <MobileResponsiveTest />
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
