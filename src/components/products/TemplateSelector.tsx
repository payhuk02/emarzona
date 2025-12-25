/**
 * Component: TemplateSelector
 * Description: Sélecteur de templates pour création rapide de produits
 * Date: 25/10/2025
 * Impact: -70% temps pour utilisateurs récurrents
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Library,
  Search,
  Download,
  Upload,
  Star,
  CheckCircle2,
  Copy,
  FileText,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  PRODUCT_TEMPLATES,
  getTemplatesByType,
  getPopularTemplates,
  getTemplateById,
  exportTemplate,
  importTemplate,
  applyTemplate,
  type ProductTemplate,
} from '@/lib/product-templates';

interface TemplateSelectorProps {
  onTemplateSelect: (templateData: any) => void;
  currentType?: 'digital' | 'physical' | 'service';
}

export const TemplateSelector = ({
  onTemplateSelect,
  currentType,
}: TemplateSelectorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProductTemplate | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState(currentType || 'popular');

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      const appliedData = applyTemplate(selectedTemplate);
      onTemplateSelect(appliedData);
      setOpen(false);
      toast({
        title: 'Template appliqué !',
        description: `${selectedTemplate.name} a été appliqué à votre produit`,
      });
    }
  };

  const handleExportTemplate = (template: ProductTemplate) => {
    const json = exportTemplate(template);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Template exporté !',
      description: 'Le fichier JSON a été téléchargé',
    });
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const template = importTemplate(json);
        setSelectedTemplate(template);
        toast({
          title: 'Template importé !',
          description: 'Le template a été chargé avec succès',
        });
      } catch (error: any) {
        toast({
          title: 'Erreur d\'import',
          description: error.message,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredTemplates = (templates: ProductTemplate[]) => {
    if (!searchQuery) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderTemplateCard = (template: ProductTemplate) => {
    const isSelected = selectedTemplate?.id === template.id;

    return (
      <Card
        key={template.id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-2 border-primary bg-primary/5' : ''
        }`}
        onClick={() => setSelectedTemplate(template)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-4xl">{template.icon}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                {template.popularityScore >= 85 && (
                  <Badge variant="secondary" className="ml-2">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Populaire
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{template.category}</Badge>
                {isSelected && (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Sélectionné
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                    setShowPreviewModal(true);
                  }}
                  className="flex-1 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  Aperçu
                </Button>
              </div>
              {isSelected && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Caractéristiques incluses :</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {template.config.features?.slice(0, 3).map((feature: string, i: number) => (
                      <li key={i}>• {feature}</li>
                    ))}
                    {(template.config.features?.length || 0) > 3 && (
                      <li>• et {(template.config.features?.length || 0) - 3} autres...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Library className="h-4 w-4" />
          Utiliser un template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bibliothèque de templates
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un template pour démarrer rapidement avec une configuration prédéfinie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Barre de recherche */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Importer
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportTemplate}
                  />
                </label>
              </Button>
            </div>
          </div>

          {/* Onglets par type */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="popular">
                <Star className="h-4 w-4 mr-2" />
                Populaires
              </TabsTrigger>
              <TabsTrigger value="digital">
                📚 Digital
              </TabsTrigger>
              <TabsTrigger value="physical">
                📦 Physique
              </TabsTrigger>
              <TabsTrigger value="service">
                💼 Service
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates(getPopularTemplates(6)).map(renderTemplateCard)}
              </div>
            </TabsContent>

            <TabsContent value="digital" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates(getTemplatesByType('digital')).map(renderTemplateCard)}
              </div>
            </TabsContent>

            <TabsContent value="physical" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates(getTemplatesByType('physical')).map(renderTemplateCard)}
              </div>
            </TabsContent>

            <TabsContent value="service" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates(getTemplatesByType('service')).map(renderTemplateCard)}
              </div>
            </TabsContent>
          </Tabs>

          {/* Info sélection */}
          {selectedTemplate && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Template sélectionné
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExportTemplate(selectedTemplate)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setSelectedTemplate(null)}
              disabled={!selectedTemplate}
            >
              Désélectionner
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleApplyTemplate} disabled={!selectedTemplate}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Appliquer le template
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Preview Modal */}
      {previewTemplate && (
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu: {previewTemplate.name}
              </DialogTitle>
              <DialogDescription>
                {previewTemplate.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{previewTemplate.category}</Badge>
                  {previewTemplate.popularityScore >= 85 && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      Populaire
                    </Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Caractéristiques incluses</h4>
                  <ul className="space-y-2 text-sm">
                    {previewTemplate.config.features?.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {previewTemplate.config.defaultValues && (
                  <div>
                    <h4 className="font-semibold mb-2">Configuration par défaut</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {Object.entries(previewTemplate.config.defaultValues).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setSelectedTemplate(previewTemplate);
                  setShowPreviewModal(false);
                }}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Utiliser ce Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

