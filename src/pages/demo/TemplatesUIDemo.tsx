/**
 * 🎨 TEMPLATES UI PAGE - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import {
  TemplateMarketplace,
  TemplatePreviewModal,
  TemplateExporterDialog,
  TemplateCustomizer,
  TemplateImporter,
} from '@/components/templates';
import { TemplateV2 } from '@/types/templates-v2';
import { digitalTemplatesV2 } from '@/data/templates/v2/digital';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export default function TemplatesUIDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateV2 | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateV2 | null>(null);
  const [exportTemplates, setExportTemplates] = useState<TemplateV2[]>([]);
  const [customizeTemplate, setCustomizeTemplate] = useState<TemplateV2 | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Handle template selection
  const handleSelectTemplate = useCallback((template: TemplateV2) => {
    setSelectedTemplate(template);
    logger.info('Template sélectionné', { templateId: template.metadata.id, templateName: template.metadata.name });
    toast.success(t('templates.selected', 'Template "{{name}}" sélectionné !', { name: template.metadata.name }));
  }, [t]);

  // Handle preview
  const handlePreviewTemplate = useCallback((template: TemplateV2) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
    logger.info('Aperçu template ouvert', { templateId: template.metadata.id });
  }, []);

  // Handle export
  const handleExportTemplates = useCallback((templates: TemplateV2[]) => {
    setExportTemplates(templates);
    setShowExportDialog(true);
    logger.info('Export templates initié', { count: templates.length });
  }, []);

  // Handle customize
  const handleCustomizeTemplate = useCallback((template: TemplateV2) => {
    setCustomizeTemplate(template);
    logger.info('Customization template ouvert', { templateId: template.metadata.id });
  }, []);

  // Navigate preview
  const handleNextPreview = useCallback(() => {
    if (!previewTemplate) return;
    const currentIndex = digitalTemplatesV2.findIndex(
      (t) => t.metadata.id === previewTemplate.metadata.id
    );
    if (currentIndex < digitalTemplatesV2.length - 1) {
      const nextTemplate = digitalTemplatesV2[currentIndex + 1];
      setPreviewTemplate(nextTemplate);
      logger.info('Navigation preview: suivant', { from: previewTemplate.metadata.id, to: nextTemplate.metadata.id });
    }
  }, [previewTemplate]);

  const handlePreviousPreview = useCallback(() => {
    if (!previewTemplate) return;
    const currentIndex = digitalTemplatesV2.findIndex(
      (t) => t.metadata.id === previewTemplate.metadata.id
    );
    if (currentIndex > 0) {
      const prevTemplate = digitalTemplatesV2[currentIndex - 1];
      setPreviewTemplate(prevTemplate);
      logger.info('Navigation preview: précédent', { from: previewTemplate.metadata.id, to: prevTemplate.metadata.id });
    }
  }, [previewTemplate]);

  const hasNext = useMemo(() => 
    previewTemplate
      ? digitalTemplatesV2.findIndex((t) => t.metadata.id === previewTemplate.metadata.id) <
        digitalTemplatesV2.length - 1
      : false,
    [previewTemplate]
  );

  const hasPrevious = useMemo(() =>
    previewTemplate
      ? digitalTemplatesV2.findIndex((t) => t.metadata.id === previewTemplate.metadata.id) > 0
      : false,
    [previewTemplate]
  );

  // Logging on mount
  useEffect(() => {
    logger.info('Templates UI page chargée', { totalTemplates: digitalTemplatesV2.length });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Responsive & Animated */}
      <div 
        ref={headerRef}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  navigate(-1);
                  logger.info('Navigation retour');
                }}
                className="h-8 w-8 sm:h-10 sm:w-10"
                aria-label={t('common.back', 'Retour')}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-left-4 duration-700">
                  {t('templates.title', 'Templates')}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  {t('templates.subtitle', 'Interface moderne pour le système de templates')}
                </p>
              </div>
            </div>

            {selectedTemplate && (
              <div className="text-left sm:text-right animate-in fade-in slide-in-from-right-4 duration-700">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('templates.selectedTemplate', 'Template sélectionné:')}
                </p>
                <p className="font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                  {selectedTemplate.metadata.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Responsive */}
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Tabs defaultValue="marketplace" className="space-y-3 sm:space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="marketplace" 
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <span className="hidden sm:inline">{t('templates.marketplace', 'Marketplace')}</span>
                <span className="sm:hidden">{t('templates.marketplaceShort', 'Marché')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="importer" 
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <span className="hidden sm:inline">{t('templates.importer', 'Importer')}</span>
                <span className="sm:hidden">{t('templates.importShort', 'Import')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="customizer" 
                disabled={!selectedTemplate}
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 disabled:opacity-50"
              >
                <span className="hidden sm:inline">
                  {t('templates.customizer', 'Customizer')} {!selectedTemplate && `(${t('templates.selectTemplate', 'Sélectionnez un template')})`}
                </span>
                <span className="sm:hidden">{t('templates.customizeShort', 'Personnaliser')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <span className="hidden sm:inline">{t('templates.about', 'À propos')}</span>
                <span className="sm:hidden">{t('templates.aboutShort', 'Info')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Marketplace */}
            <TabsContent 
              value="marketplace" 
              className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] mt-3 sm:mt-4 animate-in fade-in duration-500"
            >
              <TemplateMarketplace
                onSelectTemplate={handleSelectTemplate}
                onPreviewTemplate={handlePreviewTemplate}
                initialProductType="digital"
              />
            </TabsContent>

            {/* Importer */}
            <TabsContent 
              value="importer" 
              className="mt-3 sm:mt-4 animate-in fade-in duration-500"
            >
              <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8">
                <TemplateImporter
                  onImportSuccess={(result) => {
                    logger.info('Import templates réussi', { count: result.imported.length });
                    toast.success(t('templates.importSuccess', '{{count}} template(s) importé(s) !', { count: result.imported.length }));
                  }}
                  onImportError={(error) => {
                    logger.error('Erreur import templates', error);
                    toast.error(t('templates.importError', 'Erreur d\'import: {{message}}', { message: error.message }));
                  }}
                />
              </div>
            </TabsContent>

            {/* Customizer */}
            <TabsContent 
              value="customizer" 
              className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] mt-3 sm:mt-4 animate-in fade-in duration-500"
            >
              {selectedTemplate ? (
                <TemplateCustomizer
                  template={selectedTemplate}
                  onChange={(updated) => {
                    setSelectedTemplate(updated);
                    logger.info('Template personnalisé', { templateId: updated.metadata.id });
                  }}
                  onSave={(saved) => {
                    logger.info('Template sauvegardé', { templateId: saved.metadata.id });
                    toast.success(t('templates.saved', 'Template sauvegardé !'));
                  }}
                />
              ) : (
                <div className="text-center py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-500">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t('templates.selectTemplateToCustomize', 'Sélectionnez un template dans le Marketplace pour le personnaliser')}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* About */}
            <TabsContent 
              value="about" 
              className="mt-3 sm:mt-4 animate-in fade-in duration-500"
            >
              <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('templates.aboutTitle', 'Templates - Niveau Shopify')}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t('templates.aboutDescription', 'Système de templates professionnel avec interface utilisateur moderne, inspiré des meilleures plateformes du marché (Figma, Webflow, Canva, Shopify).')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      icon: '✨',
                      title: t('templates.marketplace', 'Marketplace'),
                      description: t('templates.marketplaceDesc', 'Grille de templates avec filtres avancés, recherche en temps réel, modes d\'affichage, et aperçu au survol.'),
                    },
                    {
                      icon: '🔍',
                      title: t('templates.previewModal', 'Preview Modal'),
                      description: t('templates.previewModalDesc', 'Aperçu fullscreen avec modes responsive (desktop/tablet/mobile), contrôles de zoom, et thèmes clair/sombre.'),
                    },
                    {
                      icon: '📤',
                      title: t('templates.exporter', 'Exporter'),
                      description: t('templates.exporterDesc', 'Export multi-formats (JSON, fichier, ZIP), options avancées, et génération de liens de partage.'),
                    },
                    {
                      icon: '🎨',
                      title: t('templates.customizer', 'Customizer'),
                      description: t('templates.customizerDesc', 'Éditeur visuel avec aperçu en temps réel, gestion des couleurs, typographie, images, et historique undo/redo.'),
                    },
                    {
                      icon: '📥',
                      title: t('templates.importer', 'Importer'),
                      description: t('templates.importerDesc', 'Import de templates par fichier, URL, ou JSON, avec drag & drop, validation, et migration automatique V1→V2.'),
                    },
                    {
                      icon: '⚡',
                      title: t('templates.templateEngine', 'Template Engine'),
                      description: t('templates.templateEngineDesc', 'Moteur de template avec interpolation, filtres, conditions, boucles, et 20+ filtres intégrés.'),
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-6 border rounded-lg bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <h3 className="font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                        <span className="text-lg sm:text-xl">{feature.icon}</span>
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-4 sm:p-6 border rounded-lg bg-muted/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                    {t('templates.stats', '📊 Statistiques')}
                  </h3>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <div className="animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: '100ms' }}>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {digitalTemplatesV2.length}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {t('templates.digitalTemplates', 'Templates Digitaux')}
                      </p>
                    </div>
                    <div className="animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: '200ms' }}>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        5
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {t('templates.uiComponents', 'Composants UI')}
                      </p>
                    </div>
                    <div className="animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: '300ms' }}>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        ~2,500
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {t('templates.linesOfCode', 'Lignes de Code')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <Button 
                    onClick={() => handleExportTemplates(digitalTemplatesV2)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {t('templates.exportAll', 'Exporter tous les templates')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      selectedTemplate && handleExportTemplates([selectedTemplate])
                    }
                    disabled={!selectedTemplate}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    {t('templates.exportSelected', 'Exporter le template sélectionné')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          logger.info('Aperçu template fermé');
        }}
        onUseTemplate={handleSelectTemplate}
        onExport={(template) => handleExportTemplates([template])}
        onNext={handleNextPreview}
        onPrevious={handlePreviousPreview}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
      />

      {/* Export Dialog */}
      <TemplateExporterDialog
        templates={exportTemplates}
        isOpen={showExportDialog}
        onClose={() => {
          setShowExportDialog(false);
          logger.info('Export dialog fermé');
        }}
      />
    </div>
  );
}
