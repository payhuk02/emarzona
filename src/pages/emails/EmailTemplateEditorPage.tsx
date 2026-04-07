/**
 * Page principale pour l'éditeur de templates email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import {
  EmailTemplateEditor,
  TemplateBlockLibrary,
  TemplatePreview,
} from '@/components/email';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Info, Blocks, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { EmailTemplate } from '@/types/email';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const EmailTemplateEditorPage = () => {
  const { t } = useTranslation();
  const [htmlContent, setHtmlContent] = useState('');
  const [subject, setSubject] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'blocks' | 'preview'>('editor');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  const handleSave = async (templateData: Partial<EmailTemplate>) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert({
          ...templateData,
          is_active: true,
        }, {
          onConflict: 'slug',
        });

      if (error) {
        logger.error('Error saving template', { error });
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: t('emails.templateEditor.toast.saved'),
        description: t('emails.templateEditor.toast.savedDescription'),
      });

      // Mettre à jour le state local pour la prévisualisation
      if (templateData.html_content) {
        const html = templateData.html_content['fr'] || Object.values(templateData.html_content)[0] || '';
        setHtmlContent(html);
      }
      if (templateData.subject) {
        const subj = templateData.subject['fr'] || Object.values(templateData.subject)[0] || '';
        setSubject(subj);
      }
    } catch ( _error: any) {
      logger.error('Failed to save template', { error });
      toast({
        title: t('emails.templateEditor.toast.error'),
        description: error.message || t('emails.templateEditor.toast.errorDescription'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleInsertBlock = (html: string) => {
    setHtmlContent((prev) => prev + '\n' + html);
    setActiveTab('editor');
    toast({
      title: t('emails.templateEditor.toast.blockInserted'),
      description: t('emails.templateEditor.toast.blockInsertedDescription'),
    });
  };

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
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t('emails.templateEditor.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('emails.templateEditor.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            <AlertTitle className="text-xs sm:text-sm md:text-base text-blue-900 dark:text-blue-100">
              {t('emails.templateEditor.alert.title')}
            </AlertTitle>
            <AlertDescription className="text-[10px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-200">
              {t('emails.templateEditor.alert.description')}
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                <TabsTrigger 
                  value="editor" 
                  className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('emails.templateEditor.tabs.editor')}</span>
                  <span className="sm:hidden">{t('emails.templateEditor.tabs.editorShort')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="blocks" 
                  className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <Blocks className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('emails.templateEditor.tabs.blocks')}</span>
                  <span className="sm:hidden">{t('emails.templateEditor.tabs.blocksShort')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('emails.templateEditor.tabs.preview')}</span>
                  <span className="sm:hidden">{t('emails.templateEditor.tabs.previewShort')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Onglet Éditeur */}
              <TabsContent value="editor" className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <EmailTemplateEditor
                  template={null}
                  onSave={handleSave}
                  onChange={(data) => {
                    setHtmlContent(data.htmlContent);
                    setSubject(data.subject);
                  }}
                  language="fr"
                />
              </TabsContent>

              {/* Onglet Blocs */}
              <TabsContent value="blocks" className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <TemplateBlockLibrary onInsertBlock={handleInsertBlock} />
              </TabsContent>

              {/* Onglet Prévisualisation */}
              <TabsContent value="preview" className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <TemplatePreview
                  htmlContent={htmlContent}
                  subject={subject}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};






