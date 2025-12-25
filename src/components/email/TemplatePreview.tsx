/**
 * Composant de prévisualisation de template email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Monitor, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
  htmlContent: string;
  subject?: string;
  previewData?: Record<string, string>;
}

export const TemplatePreview = ({
  htmlContent,
  subject = "Aperçu de l'email",
  previewData = {},
}: TemplatePreviewProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Remplacer les variables par les données de prévisualisation
  const processHtml = (html: string) => {
    let processed = html;
    const defaultData: Record<string, string> = {
      user_name: 'Jean Dupont',
      user_email: 'jean@example.com',
      order_id: 'ORD-12345',
      order_total: '25 000 XOF',
      product_name: 'Produit Exemple',
      store_name: 'Ma Boutique',
      unsubscribe_link: '#',
      preferences_link: '#',
      logo_url: '/emarzona-logo.png',
      image_url: '/placeholder.svg',
      image_alt: 'Image',
      cta_url: '#',
      cta_text: 'Cliquez ici',
      title: "Titre de l'email",
      text_content: "Contenu de l'email",
      year: new Date().getFullYear().toString(),
      ...previewData,
    };

    Object.entries(defaultData).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return processed;
  };

  const processedHtml = processHtml(htmlContent);
  const processedSubject = subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const defaultData: Record<string, string> = {
      user_name: 'Jean Dupont',
      order_id: 'ORD-12345',
      product_name: 'Produit Exemple',
      store_name: 'Ma Boutique',
      ...previewData,
    };
    return defaultData[key] || match;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prévisualisation</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={viewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button
              type="button"
              variant={viewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="mb-2">
                <Badge variant="outline" className="mb-2">
                  <Mail className="h-3 w-3 mr-1" />
                  De: noreply@example.com
                </Badge>
                <Badge variant="outline" className="ml-2">
                  À: jean@example.com
                </Badge>
              </div>
              <p className="font-semibold text-sm mb-4">Sujet: {processedSubject}</p>
            </div>

            <div
              className={cn(
                'border rounded-lg bg-white overflow-auto',
                viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
              )}
              style={{
                maxHeight: '600px',
                ...(viewMode === 'mobile' && { maxWidth: '375px' }),
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: processedHtml }}
                style={{
                  width: viewMode === 'mobile' ? '375px' : '100%',
                  minHeight: '400px',
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="html">
            <Card>
              <CardContent className="p-4">
                <pre className="text-xs overflow-auto max-h-[600px]">
                  <code>{processedHtml}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
