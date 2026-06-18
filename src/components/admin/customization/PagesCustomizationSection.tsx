/**
 * Section Personnalisation des Pages
 * Composant principal refactorisé - logique et config extraites dans des modules séparés
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGES_CONFIG } from './pages/pagesConfig';
import { PageElementEditor } from './pages/PageElementEditor';
import { usePageCustomization } from './pages/usePageCustomization';

interface PagesCustomizationSectionProps {
  onChange?: () => void;
}

export const PagesCustomizationSection = ({ onChange }: PagesCustomizationSectionProps) => {
  const [selectedPage, setSelectedPage] = useState<string>('landingPremium');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const { uploadingImages, isSyncing, handleElementChange, handleImageUpload, getElementValue } =
    usePageCustomization(onChange);

  const selectedPageConfig = useMemo(
    () => PAGES_CONFIG.find(p => p.id === selectedPage),
    [selectedPage]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sélection de la page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Sélectionner une page
          </CardTitle>
          <CardDescription>Choisissez la page que vous souhaitez personnaliser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAGES_CONFIG.map(page => {
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page.id);
                    setSelectedSection(page.sections[0]?.id || '');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPage === page.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">{page.name}</div>
                      <div className="text-xs text-muted-foreground">{page.route}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{page.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Éditeur de la page sélectionnée */}
      {selectedPageConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <selectedPageConfig.icon className="h-5 w-5" />
                  {selectedPageConfig.name}
                  {isSyncing && (
                    <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Synchronisation...</span>
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Personnalisez tous les éléments de cette page
                  {isSyncing && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      • Les modifications sont appliquées en temps réel
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant="outline">{selectedPageConfig.sections.length} sections</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedSection || selectedPageConfig.sections[0]?.id}
              onValueChange={setSelectedSection}
            >
              <div className="platform-customization-section-tabs mb-4 w-full overflow-x-auto rounded-md border">
                <TabsList className="inline-flex h-auto min-h-0 w-max min-w-full justify-start gap-1 rounded-none border-0 bg-transparent p-1">
                  {selectedPageConfig.sections.map(section => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="h-auto min-h-[2.5rem] shrink-0 px-2 py-1.5 text-xs sm:px-3 sm:text-sm"
                    >
                      {section.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {selectedPageConfig.sections.map(section => (
                <TabsContent key={section.id} value={section.id} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {section.elements.map(element => (
                      <div
                        key={element.id}
                        className={cn('space-y-2', element.type === 'richtext' && 'col-span-full')}
                      >
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor={`${selectedPage}-${element.id}`}
                            className="text-sm font-medium"
                          >
                            {element.label}
                          </Label>
                          {element.description && (
                            <Badge variant="secondary" className="text-xs">
                              {element.type}
                            </Badge>
                          )}
                        </div>
                        {element.description && (
                          <p className="text-xs text-muted-foreground">{element.description}</p>
                        )}
                        <PageElementEditor
                          pageId={selectedPage}
                          element={element}
                          value={getElementValue(selectedPage, element.key, element.defaultValue)}
                          uploading={!!uploadingImages[`${selectedPage}.${element.key}`]}
                          onChange={handleElementChange}
                          onImageUpload={handleImageUpload}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
