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
import { FileText, Blocks, Eye, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { EmailTemplate } from '@/types/email';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useEmailTemplates } from '@/hooks/useEmail';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export const EmailTemplateEditorPage = () => {
  const { t } = useTranslation();
  const [htmlContent, setHtmlContent] = useState('');
  const [subject, setSubject] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'blocks' | 'preview'>('editor');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('__new__');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tabsRef = useScrollAnimation<HTMLDivElement>();
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();

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
      if (templateData.slug) {
        const saved = templates?.find(tpl => tpl.slug === templateData.slug);
        if (saved) {
          setEditingTemplate(saved);
          setSelectedTemplateId(saved.id);
        }
      }
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
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="template-picker">
              {t('emails.templateEditor.selectTemplate', 'Template à modifier')}
            </Label>
            <Select
              value={selectedTemplateId}
              onValueChange={value => {
                setSelectedTemplateId(value);
                if (value === '__new__') {
                  setEditingTemplate(null);
                  setHtmlContent('');
                  setSubject('');
                  return;
                }
                const tpl = templates?.find(item => item.id === value);
                if (tpl) {
                  setEditingTemplate(tpl);
                  setHtmlContent(
                    tpl.html_content?.fr || Object.values(tpl.html_content || {})[0] || ''
                  );
                  setSubject(tpl.subject?.fr || Object.values(tpl.subject || {})[0] || '');
                }
              }}
            >
              <SelectTrigger id="template-picker">
                <SelectValue
                  placeholder={t(
                    'emails.templateEditor.selectTemplatePlaceholder',
                    'Choisir un template'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__">
                  {t('emails.templateEditor.newTemplate', '+ Nouveau template')}
                </SelectItem>
                {templates?.map(tpl => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templatesLoading && (
              <p className="text-sm text-muted-foreground">
                {t('common.loading', 'Chargement...')}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedTemplateId('__new__');
              setEditingTemplate(null);
              setHtmlContent('');
              setSubject('');
              setActiveTab('editor');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('emails.templateEditor.newTemplate', 'Nouveau')}
          </Button>
        </CardContent>
      </Card>

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
              key={editingTemplate?.id ?? 'new'}
              template={editingTemplate}
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
