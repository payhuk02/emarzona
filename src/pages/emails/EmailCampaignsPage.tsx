/**
 * Page principale pour la gestion des campagnes email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { EmailCampaignManager, CampaignBuilder } from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { EmailCampaign } from '@/lib/email/email-campaign-service';

export const EmailCampaignsPage = () => {
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setBuilderOpen(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setBuilderOpen(true);
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingCampaign(null);
  };

  const handleSuccess = () => {
    setBuilderOpen(false);
    setEditingCampaign(null);
  };

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Veuillez sélectionner une boutique
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger 
                aria-label="Toggle sidebar"
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] lg:hidden"
              />
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 flex-shrink-0">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Campagnes Email
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                  Créez et gérez vos campagnes email marketing
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">
              Système d'Emailing Avancé
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Créez des campagnes email ciblées pour vos clients. Programmez des envois,
              segmentez votre audience et suivez les performances en temps réel.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <EmailCampaignManager
            storeId={store.id}
            onCreateCampaign={handleCreateCampaign}
            onEditCampaign={handleEditCampaign}
          />

          {/* Campaign Builder Dialog */}
          <CampaignBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            campaign={editingCampaign}
            onSuccess={handleSuccess}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

