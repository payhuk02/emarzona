/**
 * Platform Customization - Page d'administration centralisée
 * Permet de personnaliser tous les éléments de la plateforme
 * Date: 2025-01-30
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Palette,
  Settings,
  Globe,
  Shield,
  Bell,
  FileText,
  Zap,
  Save,
  Eye,
  RefreshCw,
  Layout,
  Home,
  PanelBottom,
  Download,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DesignBrandingSection } from '@/components/admin/customization/DesignBrandingSection';
import { PlatformSettingsSection } from '@/components/admin/customization/PlatformSettingsSection';
import { ContentManagementSection } from '@/components/admin/customization/ContentManagementSection';
import { IntegrationsSection } from '@/components/admin/customization/IntegrationsSection';
import { SecuritySection } from '@/components/admin/customization/SecuritySection';
import { FeaturesSection } from '@/components/admin/customization/FeaturesSection';
import { NotificationsSection } from '@/components/admin/customization/NotificationsSection';
import { PagesCustomizationSection } from '@/components/admin/customization/PagesCustomizationSection';
import { LandingPageCustomizationSection } from '@/components/admin/customization/LandingPageCustomizationSection';
import { FooterCustomizationSection } from '@/components/admin/customization/FooterCustomizationSection';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { exportCustomization, importCustomization } from '@/lib/platform-customization-export';
import { logger } from '@/lib/logger';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type CustomizationSection =
  | 'design'
  | 'settings'
  | 'content'
  | 'integrations'
  | 'security'
  | 'features'
  | 'notifications'
  | 'landing'
  | 'footer'
  | 'pages';

interface SectionConfig {
  id: CustomizationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const sections: SectionConfig[] = [
  {
    id: 'design',
    label: 'Design & Branding',
    icon: Palette,
    description: 'Couleurs, logos, typographie, thème',
    badge: 'Visuel',
  },
  {
    id: 'settings',
    label: 'Paramètres Plateforme',
    icon: Settings,
    description: 'Commissions, retraits, limites',
  },
  {
    id: 'content',
    label: 'Contenu & Textes',
    icon: FileText,
    description: 'Textes, emails, notifications',
  },
  {
    id: 'integrations',
    label: 'Intégrations',
    icon: Globe,
    description: 'APIs, webhooks, services externes',
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: Shield,
    description: '2FA, permissions, audit',
  },
  {
    id: 'features',
    label: 'Fonctionnalités',
    icon: Zap,
    description: 'Activer/désactiver des fonctionnalités',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Configuration des notifications',
  },
  {
    id: 'landing',
    label: "Page d'accueil",
    icon: Home,
    description: "Personnalisez tous les éléments de la page d'accueil",
    badge: 'Important',
  },
  {
    id: 'footer',
    label: 'Pied de page',
    icon: PanelBottom,
    description: 'Liens, newsletter, réseaux sociaux et mentions légales',
    badge: 'Sync',
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: Layout,
    description: 'Personnalisation de chaque page',
    badge: 'Nouveau',
  },
];

function isValidSection(value: string | null): value is CustomizationSection {
  return value != null && sections.some(section => section.id === value);
}

export const PlatformCustomization = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<CustomizationSection>(() => {
    const param = searchParams.get('section');
    return isValidSection(param) ? param : 'design';
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    saveAll,
    isSaving,
    previewMode,
    togglePreview,
    load,
    customizationData,
    setCustomizationData,
  } = usePlatformCustomization();

  // Charger les données au montage
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await load();
      } catch (error) {
        logger.warn('Error loading customization data', {
          error: error instanceof Error ? error.message : String(error),
          level: 'section',
          extra: { error },
        });
        toast({
          title: 'Avertissement',
          description:
            'Impossible de charger les paramètres de personnalisation. Utilisation des valeurs par défaut.',
          variant: 'default',
        });
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [load, toast]);

  // Sync URL → state (retour navigateur, lien direct)
  useEffect(() => {
    const param = searchParams.get('section');
    const next: CustomizationSection = isValidSection(param) ? param : 'design';
    setActiveSection(current => (current === next ? current : next));
  }, [searchParams]);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    // Cette logique sera gérée par chaque section via onChange
  }, [customizationData]);

  const handleSave = async () => {
    if (previewMode) {
      toast({
        title: '⚠️ Mode aperçu actif',
        description: 'Désactivez le mode aperçu pour sauvegarder les modifications.',
        variant: 'default',
      });
      return;
    }

    try {
      await saveAll();
      setHasUnsavedChanges(false);
      toast({
        title: '✅ Sauvegarde réussie',
        description: 'Toutes les modifications ont été enregistrées.',
      });
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de sauvegarder les modifications.',
        variant: 'destructive',
      });
    }
  };

  const handleSectionChange = useCallback(
    (section: string) => {
      if (!isValidSection(section)) return;
      setActiveSection(section);
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('section', section);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleExport = useCallback(() => {
    try {
      exportCustomization(customizationData);
      toast({
        title: '✅ Export réussi',
        description: 'Les personnalisations ont été exportées avec succès.',
      });
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      toast({
        title: "❌ Erreur d'export",
        description: errorMessage || "Impossible d'exporter les personnalisations.",
        variant: 'destructive',
      });
    }
  }, [customizationData, toast]);

  const handleImportFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const result = await importCustomization(file);

        if (!result.valid) {
          toast({
            title: "❌ Erreur d'import",
            description: result.errors?.join(', ') || 'Le fichier importé contient des erreurs.',
            variant: 'destructive',
          });
          return;
        }

        if (result.data) {
          setCustomizationData(result.data);
          setHasUnsavedChanges(true);
          toast({
            title: '✅ Import réussi',
            description:
              "Les personnalisations ont été importées avec succès. N'oubliez pas de sauvegarder.",
          });
          setShowImportDialog(false);
          setImportFile(null);
        }
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : String(_error);
        toast({
          title: "❌ Erreur d'import",
          description: errorMessage || "Impossible d'importer le fichier.",
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    },
    [setCustomizationData, toast]
  );

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportDialog(true);
    }
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (importFile) {
      await handleImportFile(importFile);
    }
  }, [importFile, handleImportFile]);

  const activeSectionConfig = sections.find(s => s.id === activeSection);

  return (
    <AdminLayout>
      <Tabs
        value={activeSection}
        onValueChange={handleSectionChange}
        className="flex min-h-[600px] h-[calc(100vh-4rem)] flex-col overflow-hidden lg:flex-row"
      >
        {/* Sidebar interne — Radix Tabs (navigation fiable) */}
        <aside
          id="platform-customization-nav"
          className="relative z-30 flex w-full shrink-0 flex-col border-r bg-card/50 backdrop-blur-sm lg:w-64 lg:max-h-[calc(100vh-4rem)]"
        >
          <div className="shrink-0 border-b p-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Personnalisation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configurez tous les aspects de la plateforme
            </p>
          </div>

          <TabsList className="platform-customization-tabs-list flex h-auto min-h-0 flex-1 flex-col items-stretch justify-start gap-1 overflow-y-auto rounded-none border-0 bg-transparent p-2">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className={cn(
                    'h-auto w-full justify-start gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium',
                    'data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-left">{section.label}</span>
                  {section.badge ? (
                    <Badge variant="secondary" className="hidden shrink-0 text-xs sm:inline-flex">
                      {section.badge}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="shrink-0 space-y-2 border-t p-4">
            <Button
              onClick={togglePreview}
              variant={previewMode ? 'default' : 'outline'}
              className="w-full"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Quitter l'aperçu" : 'Aperçu'}
            </Button>
            {previewMode && (
              <p className="text-xs text-amber-600 text-center mt-1">
                Mode aperçu actif - Les modifications ne seront pas sauvegardées
              </p>
            )}
            <Button
              onClick={handleSave}
              disabled={(!hasUnsavedChanges && !previewMode) || isSaving || previewMode}
              className="w-full"
              size="sm"
              variant={previewMode ? 'secondary' : 'default'}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : previewMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mode aperçu actif
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Panneau de contenu */}
        <div
          id="platform-customization-panel"
          role="tabpanel"
          className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="container mx-auto max-w-6xl p-4 sm:p-6">
              {/* Header - Responsive */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 flex-wrap">
                        {activeSectionConfig && (
                          <>
                            <activeSectionConfig.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary shrink-0" />
                            <span className="truncate">{activeSectionConfig.label}</span>
                          </>
                        )}
                      </h1>
                      {hasUnsavedChanges && !previewMode && (
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">Modifications non sauvegardées</span>
                          <span className="sm:hidden">Non sauvegardé</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                      {activeSectionConfig?.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={value => {
                        if (value === 'export') handleExport();
                        if (value === 'import') fileInputRef.current?.click();
                      }}
                    >
                      <SelectTrigger className="gap-2 min-h-[44px]">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Actions</span>
                      </SelectTrigger>
                      <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                        <SelectItem value="export" className="cursor-pointer">
                          <Download className="h-4 w-4 mr-2" />
                          Exporter JSON
                        </SelectItem>
                        <SelectItem value="import" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Importer JSON
                        </SelectItem>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
              </div>

              <div className="space-y-4 sm:space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Chargement des paramètres...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <TabsContent value="design" className="mt-0 focus-visible:outline-none">
                      <DesignBrandingSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
                      <PlatformSettingsSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="content" className="mt-0 focus-visible:outline-none">
                      <ContentManagementSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="integrations" className="mt-0 focus-visible:outline-none">
                      <IntegrationsSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                      <SecuritySection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="features" className="mt-0 focus-visible:outline-none">
                      <FeaturesSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
                      <NotificationsSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="landing" className="mt-0 focus-visible:outline-none">
                      <LandingPageCustomizationSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="footer" className="mt-0 focus-visible:outline-none">
                      <FooterCustomizationSection onChange={handleChange} />
                    </TabsContent>
                    <TabsContent value="pages" className="mt-0 focus-visible:outline-none">
                      <PagesCustomizationSection onChange={handleChange} />
                    </TabsContent>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Dialog d'import */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importer des personnalisations</AlertDialogTitle>
            <AlertDialogDescription>
              {importFile ? (
                <>
                  Vous êtes sur le point d'importer le fichier <strong>{importFile.name}</strong>.
                  <br />
                  <br />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Attention : Cette action remplacera toutes vos personnalisations actuelles.
                  </span>
                  <br />
                  <br />
                  Assurez-vous d'avoir exporté vos personnalisations actuelles avant de continuer.
                </>
              ) : (
                'Sélectionnez un fichier JSON de personnalisation à importer.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportConfirm}
              disabled={!importFile || isImporting}
              className="bg-primary text-primary-foreground"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};
