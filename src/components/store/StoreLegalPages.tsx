/**
 * StoreLegalPages Component
 * Composant pour la gestion des pages légales
 * Phase 1 - Fonctionnalités avancées
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, Scale, Shield, Truck, RefreshCw, Cookie, AlertTriangle, Save, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { StoreLegalPages } from '@/hooks/useStores';

interface StoreLegalPagesProps {
  legalPages: StoreLegalPages | null;
  onChange: (field: keyof StoreLegalPages, value: string) => void;
  onSave?: () => void | Promise<void>;
  currentTab?: keyof StoreLegalPages;
  onTabChange?: (tab: keyof StoreLegalPages) => void;
  onCompleteSubSteps?: () => void;
  isSubmitting?: boolean;
}

const LEGAL_PAGES = [
  {
    key: 'terms_of_service' as keyof StoreLegalPages,
    label: 'Conditions générales',
    shortLabel: 'CGV',
    icon: Scale,
    description: 'Définissez les conditions générales de vente de votre boutique',
    placeholder: 'Entrez vos conditions générales de vente...',
  },
  {
    key: 'privacy_policy' as keyof StoreLegalPages,
    label: 'Politique de confidentialité',
    shortLabel: 'Confidentialité',
    icon: Shield,
    description: 'Expliquez comment vous collectez et utilisez les données personnelles',
    placeholder: 'Entrez votre politique de confidentialité...',
  },
  {
    key: 'return_policy' as keyof StoreLegalPages,
    label: 'Politique de retour',
    shortLabel: 'Retour',
    icon: RefreshCw,
    description: 'Définissez votre politique de retour et d\'échange',
    placeholder: 'Entrez votre politique de retour...',
  },
  {
    key: 'shipping_policy' as keyof StoreLegalPages,
    label: 'Politique de livraison',
    shortLabel: 'Livraison',
    icon: Truck,
    description: 'Expliquez vos méthodes et délais de livraison',
    placeholder: 'Entrez votre politique de livraison...',
  },
  {
    key: 'refund_policy' as keyof StoreLegalPages,
    label: 'Politique de remboursement',
    shortLabel: 'Remboursement',
    icon: RefreshCw,
    description: 'Définissez les conditions de remboursement',
    placeholder: 'Entrez votre politique de remboursement...',
  },
  {
    key: 'cookie_policy' as keyof StoreLegalPages,
    label: 'Politique des cookies',
    shortLabel: 'Cookies',
    icon: Cookie,
    description: 'Expliquez l\'utilisation des cookies sur votre site',
    placeholder: 'Entrez votre politique des cookies...',
  },
  {
    key: 'disclaimer' as keyof StoreLegalPages,
    label: 'Avertissement légal',
    shortLabel: 'Avertissement',
    icon: AlertTriangle,
    description: 'Ajoutez un avertissement ou disclaimer légal',
    placeholder: 'Entrez votre avertissement légal...',
  },
  {
    key: 'faq_content' as keyof StoreLegalPages,
    label: 'FAQ de la boutique',
    shortLabel: 'FAQ',
    icon: FileText,
    description: 'Questions fréquemment posées sur votre boutique',
    placeholder: 'Entrez le contenu de votre FAQ...',
  },
];

export const DEFAULT_LEGAL_TAB = LEGAL_PAGES[0].key;

export const StoreLegalPagesComponent : React.FC<StoreLegalPagesProps> = ({
  legalPages,
  onChange,
  onSave,
  currentTab = DEFAULT_LEGAL_TAB,
  onTabChange,
  onCompleteSubSteps,
  isSubmitting = false,
}) => {
  const [localPages, setLocalPages] = useState<StoreLegalPages>(
    legalPages || {
      terms_of_service: '',
      privacy_policy: '',
      return_policy: '',
      shipping_policy: '',
      refund_policy: '',
      cookie_policy: '',
      disclaimer: '',
      faq_content: '',
    }
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync local state with prop changes
  React.useEffect(() => {
    if (legalPages) {
      setLocalPages(legalPages);
    }
  }, [legalPages]);

  const getPageContent = (key: keyof StoreLegalPages): string => {
    const value = localPages[key];
    return typeof value === 'string' ? value : '';
  };

  const handleChange = (key: keyof StoreLegalPages, value: string) => {
    setLocalPages(prev => ({ ...prev, [key]: value }));
    onChange(key, value);
  };

  const handleSaveAndContinue = async () => {
    if (onSave) {
      await onSave();
    }
    const currentIndex = LEGAL_PAGES.findIndex(page => page.key === currentTab);
    if (currentIndex < LEGAL_PAGES.length - 1 && onTabChange) {
      onTabChange(LEGAL_PAGES[currentIndex + 1].key);
    } else if (onCompleteSubSteps) {
      onCompleteSubSteps();
    }
  };

  const currentIndex = LEGAL_PAGES.findIndex(page => page.key === currentTab);

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
        <Tabs value={currentTab} onValueChange={value => onTabChange?.(value as keyof StoreLegalPages)} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {LEGAL_PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <TabsTrigger 
                  key={page.key} 
                  value={page.key} 
                  className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs h-auto py-2 sm:py-2.5 bg-muted hover:bg-muted/80 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:hover:bg-orange-600"
                >
                  <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{page.label}</span>
                  <span className="sm:hidden truncate leading-tight">{page.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LEGAL_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <TabsContent key={page.key} value={page.key} className="space-y-3 mt-20">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {page.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <Textarea
                    id={page.key}
                    value={getPageContent(page.key)}
                    onChange={(e) => handleChange(page.key, e.target.value)}
                    placeholder={page.placeholder}
                    rows={8}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez utiliser le formatage Markdown pour structurer votre contenu
                  </p>
                </div>

                {getPageContent(page.key) && (
                  <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 text-xs">
                        {previewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Aperçu
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-xs">
                            {getPageContent(page.key)}
                          </pre>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => void handleSaveAndContinue()}
                    className="gap-2 h-9 text-sm"
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer et continuer'}
                    {!isSubmitting && <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};








