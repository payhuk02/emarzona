/**
 * Platform Customization - Page d'administration centralisée
 * Permet de personnaliser tous les éléments de la plateforme
 * Date: 2025-01-30
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Palette,
  Image,
  Type,
  Settings,
  Mail,
  Globe,
  Shield,
  Bell,
  DollarSign,
  Users,
  ShoppingCart,
  FileText,
  Zap,
  Save,
  Eye,
  RefreshCw,
  Layout,
  Home,
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
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import {
  exportCustomization,
  importCustomization,
  importCustomizationFromString,
} from '@/lib/platform-customization-export';
import { logger } from '@/lib/logger';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
    id: 'pages',
    label: 'Pages',
    icon: Layout,
    description: 'Personnalisation de chaque page',
    badge: 'Nouveau',
  },
];

export const PlatformCustomization = () => {
  const [activeSection, setActiveSection] = useState<CustomizationSection>('design');
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

  const handleSectionChange = useCallback((section: CustomizationSection) => {
    setActiveSection(section);
  }, []);

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

  const renderSectionContent = useMemo(() => {
    switch (activeSection) {
      case 'design':
        return <DesignBrandingSection onChange={handleChange} />;
      case 'settings':
        return <PlatformSettingsSection onChange={handleChange} />;
      case 'content':
        return <ContentManagementSection onChange={handleChange} />;
      case 'integrations':
        return <IntegrationsSection onChange={handleChange} />;
      case 'security':
        return <SecuritySection onChange={handleChange} />;
      case 'features':
        return <FeaturesSection onChange={handleChange} />;
      case 'notifications':
        return <NotificationsSection onChange={handleChange} />;
      case 'landing':
        return <LandingPageCustomizationSection onChange={handleChange} />;
      case 'pages':
        return <PagesCustomizationSection onChange={handleChange} />;
      default:
        return null;
    }
  }, [activeSection, handleChange]);

  const activeSectionConfig = sections.find(s => s.id === activeSection);

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
        {/* Sidebar - Responsive avec drawer mobile */}
        <aside className="w-full lg:w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col shrink-0 max-h-screen lg:max-h-[calc(100vh-4rem)]">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Personnalisation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configurez tous les aspects de la plateforme
            </p>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-1">
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onSelect={() => handleSectionChange(section.id)}
                    className={cn(
                      'w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                      'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                    aria-label={section.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon
                      className={cn('h-4 w-4 shrink-0', isActive && 'text-primary-foreground')}
                    />
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                        {section.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer avec actions */}
          <div className="p-4 border-t space-y-2">
            <Button
              onSelect={togglePreview}
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
              onSelect={handleSave}
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

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
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
                  <Select>
                    <SelectTrigger className="gap-2 min-h-[44px]">

                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Actions</span>
                      
</SelectTrigger>
                    <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                      <SelectItem value="edit" onSelect={handleExport} className="cursor-pointer">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter JSON
                      </SelectItem>
                      <SelectItem value="delete" onSelect={() => fileInputRef.current?.click()}
                        className="cursor-pointer"
                      >
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

            {/* Section Content */}
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
                renderSectionContent
              )}
            </div>
          </div>
        </main>
      </div>

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
              onSelect={handleImportConfirm}
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
