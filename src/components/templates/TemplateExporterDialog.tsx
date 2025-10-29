/**
 * 📤 TEMPLATE EXPORTER DIALOG COMPONENT
 * Modern UI for exporting templates
 * 
 * Design Inspiration: VS Code Export, Figma Export, Webflow Export
 * 
 * Features:
 * - Multiple export formats (JSON, File Download, Copy to Clipboard)
 * - Export options (include metadata, minify, etc.)
 * - Export preview
 * - Batch export
 * - Share link generation
 */

import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileJson,
  Link2,
  Package,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateV2 } from '@/types/templates-v2';
import {
  exportTemplateAsJSON,
  exportTemplateAsFile,
  exportTemplatesAsZip,
} from '@/lib/template-exporter';

// ============================================================================
// TYPES
// ============================================================================

interface TemplateExporterDialogProps {
  templates: TemplateV2[];
  isOpen: boolean;
  onClose: () => void;
}

interface ExportOptions {
  includeMetadata: boolean;
  includeAnalytics: boolean;
  minify: boolean;
  addChecksum: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateExporterDialog({
  templates,
  isOpen,
  onClose,
}: TemplateExporterDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeAnalytics: false,
    minify: false,
    addChecksum: true,
  });
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const isSingleTemplate = templates.length === 1;
  const template = isSingleTemplate ? templates[0] : null;

  // Generate preview JSON
  const generatePreviewJSON = () => {
    if (!template) return '[]';

    const exported = exportTemplateAsJSON(template, {
      includeAnalytics: exportOptions.includeAnalytics,
      addChecksum: exportOptions.addChecksum,
    });

    return exportOptions.minify
      ? JSON.stringify(exported, null, 0)
      : JSON.stringify(exported, null, 2);
  };

  // Handle copy JSON
  const handleCopyJSON = async () => {
    const json = generatePreviewJSON();
    await navigator.clipboard.writeText(json);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  // Handle download as file
  const handleDownloadFile = async () => {
    setIsExporting(true);
    try {
      if (isSingleTemplate && template) {
        await exportTemplateAsFile(template, {
          includeAnalytics: exportOptions.includeAnalytics,
          addChecksum: exportOptions.addChecksum,
        });
      } else {
        await exportTemplatesAsZip(templates, `templates-export-${Date.now()}.zip`, {
          includeAnalytics: exportOptions.includeAnalytics,
          addChecksum: exportOptions.addChecksum,
        });
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle generate share link
  const handleGenerateLink = async () => {
    if (!template) return;

    const json = generatePreviewJSON();
    const base64 = btoa(json);
    const shareLink = `${window.location.origin}/templates/import?data=${base64}`;

    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Exporter {isSingleTemplate ? 'le template' : `${templates.length} templates`}
          </DialogTitle>
          <DialogDescription>
            {isSingleTemplate
              ? `Exporter "${template?.metadata.name}" dans différents formats`
              : `Exporter ${templates.length} templates en lot`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Export Rapide</TabsTrigger>
            <TabsTrigger value="advanced">Options Avancées</TabsTrigger>
          </TabsList>

          {/* Quick Export */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            <div className="grid gap-3">
              {/* Copy JSON */}
              <Card
                icon={FileJson}
                title="Copier en JSON"
                description="Copier le template au format JSON dans le presse-papiers"
                action={
                  <Button
                    variant="outline"
                    onClick={handleCopyJSON}
                    disabled={copiedJSON}
                  >
                    {copiedJSON ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier
                      </>
                    )}
                  </Button>
                }
              />

              {/* Download File */}
              <Card
                icon={Download}
                title={
                  isSingleTemplate
                    ? 'Télécharger le fichier'
                    : 'Télécharger en ZIP'
                }
                description={
                  isSingleTemplate
                    ? 'Télécharger le template au format .json'
                    : `Télécharger ${templates.length} templates dans une archive ZIP`
                }
                action={
                  <Button onClick={handleDownloadFile} disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </>
                    )}
                  </Button>
                }
              />

              {/* Share Link */}
              {isSingleTemplate && (
                <Card
                  icon={Link2}
                  title="Générer un lien de partage"
                  description="Créer un lien pour partager ce template"
                  action={
                    <Button
                      variant="outline"
                      onClick={handleGenerateLink}
                      disabled={copiedLink}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Générer
                        </>
                      )}
                    </Button>
                  }
                />
              )}
            </div>

            {exportSuccess && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Export réussi ! Le fichier a été téléchargé.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Advanced Options */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Options d'export</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="metadata">Inclure les métadonnées</Label>
                    <p className="text-xs text-muted-foreground">
                      ID, version, auteur, dates
                    </p>
                  </div>
                  <Switch
                    id="metadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeMetadata: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Inclure les analytics</Label>
                    <p className="text-xs text-muted-foreground">
                      Vues, téléchargements, note
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={exportOptions.includeAnalytics}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeAnalytics: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="minify">Minifier le JSON</Label>
                    <p className="text-xs text-muted-foreground">
                      Réduire la taille du fichier
                    </p>
                  </div>
                  <Switch
                    id="minify"
                    checked={exportOptions.minify}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, minify: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="checksum">Ajouter un checksum</Label>
                    <p className="text-xs text-muted-foreground">
                      Vérification d'intégrité
                    </p>
                  </div>
                  <Switch
                    id="checksum"
                    checked={exportOptions.addChecksum}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, addChecksum: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Preview */}
              {isSingleTemplate && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Aperçu JSON</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Masquer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Afficher
                        </>
                      )}
                    </Button>
                  </div>

                  {showAdvanced && (
                    <ScrollArea className="h-48 w-full rounded-md border bg-muted/30 p-3">
                      <pre className="text-xs font-mono">{generatePreviewJSON()}</pre>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleDownloadFile} disabled={isExporting} className="flex-1">
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Export...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyJSON}
                  disabled={copiedJSON}
                  className="flex-1"
                >
                  {copiedJSON ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier JSON
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

interface CardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: React.ReactNode;
}

function Card({ icon: Icon, title, description, action }: CardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="ml-4">{action}</div>
    </div>
  );
}

export default TemplateExporterDialog;

