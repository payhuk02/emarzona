/**
 * StoreThemeTemplateSelector Component
 * Sélecteur de templates de thème prédéfinis
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';
import { STORE_THEME_TEMPLATES, type StoreThemeTemplate } from '@/lib/store-theme-templates';
import { cn } from '@/lib/utils';

interface StoreThemeTemplateSelectorProps {
  onSelectTemplate: (template: StoreThemeTemplate) => void;
  currentTemplateId?: string;
}

export const StoreThemeTemplateSelector: React.FC<StoreThemeTemplateSelectorProps> = ({
  onSelectTemplate,
  currentTemplateId,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Templates de Thème Prédéfinis
        </CardTitle>
        <CardDescription>
          Choisissez un thème prédéfini pour appliquer rapidement une personnalisation professionnelle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STORE_THEME_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                currentTemplateId === template.id
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Preview colors */}
                  <div className="flex gap-1 h-12 rounded-md overflow-hidden">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.preview.primaryColor }}
                      title="Couleur principale"
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.preview.secondaryColor }}
                      title="Couleur secondaire"
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.preview.accentColor }}
                      title="Couleur d'accent"
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.preview.backgroundColor }}
                      title="Couleur de fond"
                    />
                  </div>
                  
                  {/* Template info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      {currentTemplateId === template.id && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  
                  {/* Apply button */}
                  <Button
                    variant={currentTemplateId === template.id ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}
                  >
                    {currentTemplateId === template.id ? "Thème actif" : "Appliquer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


