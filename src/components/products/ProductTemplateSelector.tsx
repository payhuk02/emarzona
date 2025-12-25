/**
 * Product Template Selector
 * Date: 28 Janvier 2025
 * 
 * Composant pour sélectionner un template de produit
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  TrendingUp,
  FileText,
  Package,
  Wrench,
  GraduationCap,
  Palette,
} from 'lucide-react';
import { getProductTemplates, type ProductTemplate, type ProductType } from '@/lib/products/product-templates';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ProductTemplateSelectorProps {
  productType: ProductType;
  onSelect: (template: ProductTemplate) => void;
  onSkip?: () => void;
}

const TYPE_ICONS: Record<ProductType, any> = {
  digital: FileText,
  physical: Package,
  service: Wrench,
  course: GraduationCap,
  artist: Palette,
};

export const ProductTemplateSelector = ({
  productType,
  onSelect,
  onSkip,
}: ProductTemplateSelectorProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [productType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getProductTemplates(productType);
      setTemplates(data);
    } catch (error) {
      logger.error('Error loading templates', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (template: ProductTemplate) => {
    setSelectedTemplate(template.id);
    onSelect(template);
  };

  const TypeIcon = TYPE_ICONS[productType] || FileText;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choisir un template</h2>
        <p className="text-muted-foreground">
          Commencez avec un template pré-configuré pour gagner du temps
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un template..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Aucun template trouvé' : 'Aucun template disponible'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const isSelected = selectedTemplate === template.id;
            const Icon = template.icon ? (
              <span className="text-2xl">{template.icon}</span>
            ) : (
              <TypeIcon className="h-6 w-6" />
            );

            return (
              <Card
                key={template.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-lg',
                  isSelected && 'ring-2 ring-primary shadow-lg'
                )}
                onClick={() => handleSelect(template)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {Icon}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Utilisations</span>
                      <Badge variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {template.usage_count}
                      </Badge>
                    </div>
                    {template.category && (
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Passer cette étape
        </Button>
        {selectedTemplate && (
          <Button onClick={() => {
            const template = templates.find(t => t.id === selectedTemplate);
            if (template) onSelect(template);
          }}>
            Utiliser ce template
          </Button>
        )}
      </div>
    </div>
  );
};

