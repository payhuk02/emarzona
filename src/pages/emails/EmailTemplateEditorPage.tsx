/**
 * Page principale pour l'éditeur de templates email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EmailTemplateEditor,
  TemplateBlockLibrary,
  TemplatePreview,
  EmailDashboardLayout,
} from '@/components/email';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Blocks, Eye } from 'lucide-react';
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
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  const handleSave = async (templateData: Partial<EmailTemplate>) => {
    try {
      const { error } = await supabase.from('email_templates').upsert(
        {
          ...templateData,
          is_active: true,
        },
        {
          onConflict: 'slug',
        }
      );

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
        const html =
          templateData.html_content['fr'] || Object.values(templateData.html_content)[0] || '';
        setHtmlContent(html);
      }
      if (templateData.subject) {
        const subj = templateData.subject['fr'] || Object.values(templateData.subject)[0] || '';
        setSubject(subj);
      }
    } catch (caught: unknown) {
      logger.error('Failed to save template', { error: caught });
      const message =
        caught instanceof Error
          ? caught.message
          : t('emails.templateEditor.toast.errorDescription');
      toast({
        title: t('emails.templateEditor.toast.error'),
        description: message,
        variant: 'destructive',
      });
      throw caught instanceof Error ? caught : new Error(message);
    }
  };

  const handleInsertBlock = (html: string) => {
    setHtmlContent(prev => prev + '\n' + html);
    setActiveTab('editor');
    toast({
      title: t('emails.templateEditor.toast.blockInserted'),
      description: t('emails.templateEditor.toast.blockInsertedDescription'),
    });
  };

  return (
    <EmailDashboardLayout
      title={t('emails.templateEditor.title')}
      subtitle={t('emails.templateEditor.subtitle')}
      icon={FileText}
      noStoreMessage={t('emails.templateEditor.noStore', 'Veuillez sélectionner une boutique')}
      infoAlert={{
        title: t('emails.templateEditor.alert.title'),
        description: t('emails.templateEditor.alert.description'),
      }}
    >
      <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as typeof activeTab)}
          className="space-y-4 sm:space-y-6"
        >
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
          <TabsContent
            value="editor"
            className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <EmailTemplateEditor
              template={null}
              onSave={handleSave}
              onChange={data => {
                setHtmlContent(data.htmlContent);
                setSubject(data.subject);
              }}
              language="fr"
            />
          </TabsContent>

          {/* Onglet Blocs */}
          <TabsContent
            value="blocks"
            className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <TemplateBlockLibrary onInsertBlock={handleInsertBlock} />
          </TabsContent>

          {/* Onglet Prévisualisation */}
          <TabsContent
            value="preview"
            className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <TemplatePreview htmlContent={htmlContent} subject={subject} />
          </TabsContent>
        </Tabs>
      </div>
    </EmailDashboardLayout>
  );
};
