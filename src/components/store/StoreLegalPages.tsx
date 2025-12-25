/**
 * StoreLegalPages Component
 * Composant pour la gestion des pages légales
 * Phase 1 - Fonctionnalités avancées
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Scale, Shield, Truck, RefreshCw, Cookie, AlertTriangle } from 'lucide-react';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { StoreLegalPages } from '@/hooks/useStores';

interface StoreLegalPagesProps {
  legalPages: StoreLegalPages | null;
  onChange: (field: keyof StoreLegalPages, value: string) => void;
}

const LEGAL_PAGES = [
  {
    key: 'terms_of_service' as keyof StoreLegalPages,
    label: 'Conditions générales de vente',
    icon: Scale,
    description: 'Définissez les conditions générales de vente de votre boutique',
    placeholder: 'Entrez vos conditions générales de vente...',
  },
  {
    key: 'privacy_policy' as keyof StoreLegalPages,
    label: 'Politique de confidentialité',
    icon: Shield,
    description: 'Expliquez comment vous collectez et utilisez les données personnelles',
    placeholder: 'Entrez votre politique de confidentialité...',
  },
  {
    key: 'return_policy' as keyof StoreLegalPages,
    label: 'Politique de retour',
    icon: RefreshCw,
    description: 'Définissez votre politique de retour et d\'échange',
    placeholder: 'Entrez votre politique de retour...',
  },
  {
    key: 'shipping_policy' as keyof StoreLegalPages,
    label: 'Politique de livraison',
    icon: Truck,
    description: 'Expliquez vos méthodes et délais de livraison',
    placeholder: 'Entrez votre politique de livraison...',
  },
  {
    key: 'refund_policy' as keyof StoreLegalPages,
    label: 'Politique de remboursement',
    icon: RefreshCw,
    description: 'Définissez les conditions de remboursement',
    placeholder: 'Entrez votre politique de remboursement...',
  },
  {
    key: 'cookie_policy' as keyof StoreLegalPages,
    label: 'Politique des cookies',
    icon: Cookie,
    description: 'Expliquez l\'utilisation des cookies sur votre site',
    placeholder: 'Entrez votre politique des cookies...',
  },
  {
    key: 'disclaimer' as keyof StoreLegalPages,
    label: 'Avertissement légal',
    icon: AlertTriangle,
    description: 'Ajoutez un avertissement ou disclaimer légal',
    placeholder: 'Entrez votre avertissement légal...',
  },
  {
    key: 'faq_content' as keyof StoreLegalPages,
    label: 'FAQ de la boutique',
    icon: FileText,
    description: 'Questions fréquemment posées sur votre boutique',
    placeholder: 'Entrez le contenu de votre FAQ...',
  },
];

export const StoreLegalPagesComponent: React.FC<StoreLegalPagesProps> = ({
  legalPages,
  onChange,
}) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  const getPageContent = (key: keyof StoreLegalPages): string => {
    return legalPages?.[key] || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pages légales et contenu
        </CardTitle>
        <CardDescription>
          Configurez les pages légales et le contenu informatif de votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 max-h-[400px] overflow-y-auto">
            {LEGAL_PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <TabsTrigger key={page.key} value={page.key} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{page.label}</span>
                  <span className="sm:hidden truncate">{page.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LEGAL_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <TabsContent key={page.key} value={page.key} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <Label htmlFor={page.key} className="text-base font-semibold">
                      {page.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {page.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Textarea
                    id={page.key}
                    value={getPageContent(page.key)}
                    onChange={(e) => onChange(page.key, e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder={page.placeholder}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez utiliser le formatage Markdown pour structurer votre contenu
                  </p>
                </div>

                {getPageContent(page.key) && (
                  <div className="border-t pt-4">
                    <Label>Aperçu</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm">
                          {getPageContent(page.key)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

