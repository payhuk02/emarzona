/**
 * Page principale pour la gestion des segments email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { 
  EmailSegmentManager, 
  EmailSegmentBuilder,
  SegmentPreview,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Info, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmailSegment } from '@/lib/email/email-segment-service';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const EmailSegmentsPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<EmailSegment | null>(null);
  const [previewingSegment, setPreviewingSegment] = useState<EmailSegment | null>(null);
  const [currentTab, setCurrentTab] = useState<'list' | 'preview'>('list');
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setBuilderOpen(true);
  };

  const handleEditSegment = (segment: EmailSegment) => {
    setEditingSegment(segment);
    setBuilderOpen(true);
  };

  const handlePreviewSegment = (segment: EmailSegment) => {
    setPreviewingSegment(segment);
    setCurrentTab('preview');
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingSegment(null);
  };

  const handleSuccess = () => {
    setBuilderOpen(false);
    setEditingSegment(null);
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
                  {t('emails.segments.noStore')}
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
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t('emails.segments.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('emails.segments.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            <AlertTitle className="text-xs sm:text-sm md:text-base text-blue-900 dark:text-blue-100">
              {t('emails.segments.alert.title')}
            </AlertTitle>
            <AlertDescription className="text-[10px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-200">
              {t('emails.segments.alert.description')}
            </AlertDescription>
          </Alert>

          {/* Main Content with Tabs */}
          <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'list' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                <TabsTrigger 
                  value="list" 
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t('emails.segments.tabs.list')}
                </TabsTrigger>
                {previewingSegment && (
                  <TabsTrigger 
                    value="preview" 
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden sm:inline">{t('emails.segments.previewLabel')}</span>
                    <span className="truncate">{previewingSegment.name}</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <EmailSegmentManager
                  storeId={store.id}
                  onCreateSegment={handleCreateSegment}
                  onEditSegment={handleEditSegment}
                  onPreviewSegment={handlePreviewSegment}
                />
              </TabsContent>

              {previewingSegment && (
                <TabsContent value="preview" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewingSegment(null);
                        setCurrentTab('list');
                      }}
                      className="min-h-[44px] text-xs sm:text-sm"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">{t('emails.segments.backToList')}</span>
                      <span className="sm:hidden">{t('emails.segments.back')}</span>
                    </Button>
                  </div>
                  <SegmentPreview
                    segment={previewingSegment}
                    onClose={() => {
                      setPreviewingSegment(null);
                      setCurrentTab('list');
                    }}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Segment Builder Dialog */}
          <EmailSegmentBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            segment={editingSegment}
            onSuccess={handleSuccess}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

