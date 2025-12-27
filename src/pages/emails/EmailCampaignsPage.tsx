/**
 * Page principale pour la gestion des campagnes email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { EmailCampaignManager, CampaignBuilder } from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { EmailCampaign } from '@/lib/email/email-campaign-service';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const EmailCampaignsPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const headerRef = useScrollAnimation<HTMLDivElement>();

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
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 sm:p-12 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('emails.campaigns.noStore')}
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
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div 
            ref={headerRef}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger 
                aria-label="Toggle sidebar"
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px]"
              />
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20 flex-shrink-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t('emails.campaigns.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('emails.campaigns.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            <AlertTitle className="text-xs sm:text-sm md:text-base text-blue-900 dark:text-blue-100">
              {t('emails.campaigns.alert.title')}
            </AlertTitle>
            <AlertDescription className="text-[10px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-200">
              {t('emails.campaigns.alert.description')}
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







