/**
 * Template Selector Component
 * Interface principale pour sélectionner et prévisualiser des templates
 */

import { useState, useMemo } from 'react';
import { Template, ProductType, TemplateCategory } from '@/types/templates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Star,
  Download,
  Eye,
  Check,
  Crown,
  Filter,
  Sparkles,
  FileText,
  ShoppingBag,
  Wrench,
  GraduationCap,
} from 'lucide-react';
import {
  getTemplatesByProductType,
  getFreeTemplates,
  getPremiumTemplates,
  searchTemplates,
} from '@/data/templates';

interface TemplateSelectorProps {
  productType: ProductType;
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
  open: boolean;
}

export const TemplateSelector = ({
  productType,
  onSelectTemplate,
  onClose,
  open,
}: TemplateSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  // Obtenir les templates pour le type de produit
  const templates = useMemo(() => {
    let filtered = getTemplatesByProductType(productType);

    // Appliquer filtre gratuit/premium
    if (filter === 'free') {
      filtered = filtered.filter(t => !t.metadata.premium);
    } else if (filter === 'premium') {
      filtered = filtered.filter(t => t.metadata.premium);
    }

    // Appliquer recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.metadata.name.toLowerCase().includes(query) ||
          t.metadata.description.toLowerCase().includes(query) ||
          t.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [productType, filter, searchQuery]);

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const getProductTypeIcon = (type: ProductType) => {
    switch (type) {
      case 'digital':
        return <FileText className="h-5 w-5" />;
      case 'physical':
        return <ShoppingBag className="h-5 w-5" />;
      case 'service':
        return <Wrench className="h-5 w-5" />;
      case 'course':
        return <GraduationCap className="h-5 w-5" />;
    }
  };

  const getProductTypeLabel = (type: ProductType) => {
    const labels = {
      digital: 'Produit Digital',
      physical: 'Produit Physique',
      service: 'Service',
      course: 'Cours en Ligne',
    };
    return labels[type];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Choisir un Template
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un template pré-configuré pour {getProductTypeLabel(productType).toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="free">Gratuits</TabsTrigger>
                <TabsTrigger value="premium">Premium</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Liste des templates */}
          <div className="grid md:grid-cols-2 gap-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun template trouvé</p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <Card
                      key={template.metadata.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.metadata.id === template.metadata.id
                          ? 'ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {template.metadata.name}
                              {template.metadata.premium && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              {selectedTemplate?.metadata.id === template.metadata.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {template.metadata.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {template.metadata.rating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {template.metadata.downloads}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.metadata.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Prévisualisation */}
            <div className="border rounded-lg">
              {selectedTemplate ? (
                <ScrollArea className="h-[500px] p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">
                          {selectedTemplate.metadata.name}
                        </h3>
                        {selectedTemplate.metadata.premium && (
                          <Badge variant="default" className="gap-1">
                            <Crown className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.metadata.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {selectedTemplate.metadata.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>{selectedTemplate.metadata.downloads} téléchargements</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Ce que vous obtiendrez</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>Configuration complète pré-remplie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>Description professionnelle</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>SEO optimisé</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>FAQs pré-écrites</span>
                        </li>
                        {selectedTemplate.data.basicInfo?.features && (
                          selectedTemplate.data.basicInfo.features.slice(0, 3).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    {selectedTemplate.data.basicInfo?.specifications && (
                      <div>
                        <h4 className="font-semibold mb-2">Spécifications</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {selectedTemplate.data.basicInfo.specifications.slice(0, 4).map((spec, i) => (
                            <div key={i} className="border-l-2 border-primary pl-2">
                              <div className="font-medium">{spec.label}</div>
                              <div className="text-muted-foreground text-xs">{spec.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.metadata.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
                  <Eye className="h-16 w-16 mb-4 opacity-20" />
                  <p>Sélectionnez un template pour voir la prévisualisation</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSelectTemplate}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Utiliser ce Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

