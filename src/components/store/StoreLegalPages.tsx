/**
 * StoreLegalPages Component
 * Composant pour la gestion des pages légales
 * Phase 1 - Fonctionnalités avancées
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FileText,
  Scale,
  Shield,
  Truck,
  RefreshCw,
  Cookie,
  AlertTriangle,
  Save,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  { key: 'terms_of_service' as keyof StoreLegalPages, icon: Scale },
  { key: 'privacy_policy' as keyof StoreLegalPages, icon: Shield },
  { key: 'return_policy' as keyof StoreLegalPages, icon: RefreshCw },
  { key: 'shipping_policy' as keyof StoreLegalPages, icon: Truck },
  { key: 'refund_policy' as keyof StoreLegalPages, icon: RefreshCw },
  { key: 'cookie_policy' as keyof StoreLegalPages, icon: Cookie },
  { key: 'disclaimer' as keyof StoreLegalPages, icon: AlertTriangle },
  { key: 'faq_content' as keyof StoreLegalPages, icon: FileText },
];

export const DEFAULT_LEGAL_TAB = LEGAL_PAGES[0].key;

export const StoreLegalPagesComponent: React.FC<StoreLegalPagesProps> = ({
  legalPages,
  onChange,
  onSave,
  currentTab = DEFAULT_LEGAL_TAB,
  onTabChange,
  onCompleteSubSteps,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('store.form.legal.title')}
        </CardTitle>
        <CardDescription>{t('store.form.legal.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={currentTab}
          onValueChange={value => onTabChange?.(value as keyof StoreLegalPages)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {LEGAL_PAGES.map(page => {
              const Icon = page.icon;
              return (
                <TabsTrigger
                  key={page.key}
                  value={page.key}
                  className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs h-auto py-2 sm:py-2.5 bg-muted hover:bg-muted/80 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:hover:bg-orange-600"
                >
                  <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">
                    {t(`store.form.legal.pages.${page.key}.label`)}
                  </span>
                  <span className="sm:hidden truncate leading-tight">
                    {t(`store.form.legal.pages.${page.key}.shortLabel`)}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LEGAL_PAGES.map(page => {
            return (
              <TabsContent key={page.key} value={page.key} className="space-y-3 mt-20">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t(`store.form.legal.pages.${page.key}.description`)}
                  </p>
                </div>

                <div className="space-y-1">
                  <Textarea
                    id={page.key}
                    value={getPageContent(page.key)}
                    onChange={e => handleChange(page.key, e.target.value)}
                    placeholder={t(`store.form.legal.pages.${page.key}.placeholder`)}
                    rows={8}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.legal.markdownHint')}
                  </p>
                </div>

                {getPageContent(page.key) && (
                  <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-8 text-xs"
                      >
                        {previewOpen ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {t('store.form.common.preview')}
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
                    {isSubmitting
                      ? t('store.form.common.saving')
                      : t('store.form.common.saveAndContinue')}
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
