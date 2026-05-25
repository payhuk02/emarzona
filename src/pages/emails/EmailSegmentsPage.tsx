/**
 * Page principale pour la gestion des segments email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EmailSegmentManager,
  EmailSegmentBuilder,
  SegmentPreview,
  EmailDashboardLayout,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Users, ArrowLeft } from 'lucide-react';
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

  return (
    <EmailDashboardLayout
      title={t('emails.segments.title')}
      subtitle={t('emails.segments.subtitle')}
      icon={Users}
      noStoreMessage={t('emails.segments.noStore')}
      infoAlert={{
        title: t('emails.segments.alert.title'),
        description: t('emails.segments.alert.description'),
      }}
    >
      {store ? (
        <>
          {/* Main Content with Tabs */}
          <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs value={currentTab} onValueChange={v => setCurrentTab(v as 'list' | 'preview')}>
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

              <TabsContent
                value="list"
                className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <EmailSegmentManager
                  storeId={store.id}
                  onCreateSegment={handleCreateSegment}
                  onEditSegment={handleEditSegment}
                  onPreviewSegment={handlePreviewSegment}
                />
              </TabsContent>

              {previewingSegment && (
                <TabsContent
                  value="preview"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
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
        </>
      ) : null}
    </EmailDashboardLayout>
  );
};
