/**
 * 🎨 TEMPLATES UI DEMO PAGE
 * Demonstration page for all Template V2 UI components
 */

import React, { useState } from 'react';
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

export default function TemplatesUIDemo() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateV2 | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateV2 | null>(null);
  const [exportTemplates, setExportTemplates] = useState<TemplateV2[]>([]);
  const [customizeTemplate, setCustomizeTemplate] = useState<TemplateV2 | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Handle template selection
  const handleSelectTemplate = (template: TemplateV2) => {
    setSelectedTemplate(template);
    toast.success(`Template "${template.metadata.name}" sélectionné !`);
  };

  // Handle preview
  const handlePreviewTemplate = (template: TemplateV2) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  // Handle export
  const handleExportTemplates = (templates: TemplateV2[]) => {
    setExportTemplates(templates);
    setShowExportDialog(true);
  };

  // Handle customize
  const handleCustomizeTemplate = (template: TemplateV2) => {
    setCustomizeTemplate(template);
  };

  // Navigate preview
  const handleNextPreview = () => {
    if (!previewTemplate) return;
    const currentIndex = digitalTemplatesV2.findIndex(
      (t) => t.metadata.id === previewTemplate.metadata.id
    );
    if (currentIndex < digitalTemplatesV2.length - 1) {
      setPreviewTemplate(digitalTemplatesV2[currentIndex + 1]);
    }
  };

  const handlePreviousPreview = () => {
    if (!previewTemplate) return;
    const currentIndex = digitalTemplatesV2.findIndex(
      (t) => t.metadata.id === previewTemplate.metadata.id
    );
    if (currentIndex > 0) {
      setPreviewTemplate(digitalTemplatesV2[currentIndex - 1]);
    }
  };

  const hasNext = previewTemplate
    ? digitalTemplatesV2.findIndex((t) => t.metadata.id === previewTemplate.metadata.id) <
      digitalTemplatesV2.length - 1
    : false;

  const hasPrevious = previewTemplate
    ? digitalTemplatesV2.findIndex((t) => t.metadata.id === previewTemplate.metadata.id) > 0
    : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Templates UI V2 Demo</h1>
                <p className="text-sm text-muted-foreground">
                  Interface moderne pour le système de templates
                </p>
              </div>
            </div>

            {selectedTemplate && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Template sélectionné:</p>
                <p className="font-semibold">{selectedTemplate.metadata.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6">
        <Tabs defaultValue="marketplace" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="importer">Importer</TabsTrigger>
            <TabsTrigger value="customizer" disabled={!selectedTemplate}>
              Customizer {!selectedTemplate && '(Sélectionnez un template)'}
            </TabsTrigger>
            <TabsTrigger value="about">À propos</TabsTrigger>
          </TabsList>

          {/* Marketplace */}
          <TabsContent value="marketplace" className="h-[calc(100vh-12rem)]">
            <TemplateMarketplace
              onSelectTemplate={handleSelectTemplate}
              onPreviewTemplate={handlePreviewTemplate}
              initialProductType="digital"
            />
          </TabsContent>

          {/* Importer */}
          <TabsContent value="importer">
            <div className="max-w-4xl mx-auto py-8">
              <TemplateImporter
                onImportSuccess={(result) => {
                  toast.success(`${result.imported.length} template(s) importé(s) !`);
                }}
                onImportError={(error) => {
                  toast.error(`Erreur d'import: ${error.message}`);
                }}
              />
            </div>
          </TabsContent>

          {/* Customizer */}
          <TabsContent value="customizer" className="h-[calc(100vh-12rem)]">
            {selectedTemplate ? (
              <TemplateCustomizer
                template={selectedTemplate}
                onChange={(updated) => {
                  setSelectedTemplate(updated);
                }}
                onSave={(saved) => {
                  toast.success('Template sauvegardé !');
                  // In a real app, save to backend
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Sélectionnez un template dans le Marketplace pour le personnaliser
                </p>
              </div>
            )}
          </TabsContent>

          {/* About */}
          <TabsContent value="about">
            <div className="max-w-4xl mx-auto py-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Templates UI V2 - Niveau Shopify</h2>
                <p className="text-muted-foreground">
                  Système de templates professionnel avec interface utilisateur moderne, 
                  inspiré des meilleures plateformes du marché (Figma, Webflow, Canva, Shopify).
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">✨ Marketplace</h3>
                  <p className="text-sm text-muted-foreground">
                    Grille de templates avec filtres avancés, recherche en temps réel, 
                    modes d'affichage, et aperçu au survol.
                  </p>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">🔍 Preview Modal</h3>
                  <p className="text-sm text-muted-foreground">
                    Aperçu fullscreen avec modes responsive (desktop/tablet/mobile), 
                    contrôles de zoom, et thèmes clair/sombre.
                  </p>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">📤 Exporter</h3>
                  <p className="text-sm text-muted-foreground">
                    Export multi-formats (JSON, fichier, ZIP), options avancées, 
                    et génération de liens de partage.
                  </p>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">🎨 Customizer</h3>
                  <p className="text-sm text-muted-foreground">
                    Éditeur visuel avec aperçu en temps réel, gestion des couleurs, 
                    typographie, images, et historique undo/redo.
                  </p>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">📥 Importer</h3>
                  <p className="text-sm text-muted-foreground">
                    Import de templates par fichier, URL, ou JSON, avec drag & drop, 
                    validation, et migration automatique V1→V2.
                  </p>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">⚡ Template Engine</h3>
                  <p className="text-sm text-muted-foreground">
                    Moteur de template avec interpolation, filtres, conditions, 
                    boucles, et 20+ filtres intégrés.
                  </p>
                </div>
              </div>

              <div className="p-6 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">📊 Statistiques</h3>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-bold">{digitalTemplatesV2.length}</p>
                    <p className="text-sm text-muted-foreground">Templates Digitaux</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">Composants UI</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">~2,500</p>
                    <p className="text-sm text-muted-foreground">Lignes de Code</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleExportTemplates(digitalTemplatesV2)}>
                  Exporter tous les templates
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    selectedTemplate && handleExportTemplates([selectedTemplate])
                  }
                  disabled={!selectedTemplate}
                >
                  Exporter le template sélectionné
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
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
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}

