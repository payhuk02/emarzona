/**
 * Page principale pour l'éditeur de templates email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
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

export const EmailTemplateEditorPage = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [subject, setSubject] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'blocks' | 'preview'>('editor');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: 'Template sauvegardé',
        description: 'Le template a été sauvegardé avec succès.',
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
    } catch (error: any) {
      logger.error('Failed to save template', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la sauvegarde du template.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleInsertBlock = (html: string) => {
    setHtmlContent((prev) => prev + '\n' + html);
    setActiveTab('editor');
    toast({
      title: 'Bloc inséré',
      description: 'Le bloc a été inséré dans votre template.',
    });
  };

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
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Éditeur de Templates Email
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                  Créez et personnalisez vos templates email avec un éditeur visuel
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">
              Éditeur de Templates Email
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Utilisez l&apos;éditeur pour créer vos templates email. Vous pouvez insérer des
              blocs prédéfinis, utiliser des variables dynamiques, et prévisualiser le résultat
              sur mobile et desktop.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor" className="text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Éditeur</span>
                <span className="sm:hidden">Édit</span>
              </TabsTrigger>
              <TabsTrigger value="blocks" className="text-xs sm:text-sm">
                <Blocks className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Blocs</span>
                <span className="sm:hidden">Bloc</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs sm:text-sm">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Prévisualisation</span>
                <span className="sm:hidden">Aperçu</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Éditeur */}
            <TabsContent value="editor">
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
            <TabsContent value="blocks">
              <TemplateBlockLibrary onInsertBlock={handleInsertBlock} />
            </TabsContent>

            {/* Onglet Prévisualisation */}
            <TabsContent value="preview">
              <TemplatePreview
                htmlContent={htmlContent}
                subject={subject}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};
