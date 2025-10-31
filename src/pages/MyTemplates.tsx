/**
 * 📋 Mes Templates - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion des templates sauvegardés avec recherche, filtres, tri et actions
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layout,
  Package,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Download,
  Trash2,
  Share2,
  Eye,
  Sparkles,
  Search,
  Grid3x3,
  List,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Keyboard,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TemplateType = "digital" | "physical" | "service" | "course";
type SortOption = "recent" | "name" | "usage" | "category";
type ViewMode = "grid" | "list";

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  category: string;
  savedAt: string;
  usageCount: number;
  description?: string;
  thumbnail?: string;
}

export default function MyTemplates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const templatesRef = useScrollAnimation<HTMLDivElement>();

  // Templates sauvegardés (exemple - à connecter avec DB)
  const savedTemplates: Template[] = useMemo(() => [
    {
      id: "1",
      name: "E-book Premium",
      type: "digital",
      category: "E-book",
      savedAt: "2025-10-25",
      usageCount: 3,
      description: "Template professionnel pour e-books avec mise en page élégante",
    },
    {
      id: "2",
      name: "Fashion Apparel",
      type: "physical",
      category: "Vêtements",
      savedAt: "2025-10-28",
      usageCount: 1,
      description: "Template pour produits de mode et vêtements",
    },
    {
      id: "3",
      name: "Business Consulting",
      type: "service",
      category: "Consulting",
      savedAt: "2025-10-20",
      usageCount: 5,
      description: "Template pour services de conseil professionnel",
    },
  ], []);

  // Statistiques
  const stats = useMemo(() => {
    const total = savedTemplates.length;
    const digital = savedTemplates.filter((t) => t.type === "digital").length;
    const physical = savedTemplates.filter((t) => t.type === "physical").length;
    const service = savedTemplates.filter((t) => t.type === "service").length;
    const course = savedTemplates.filter((t) => t.type === "course").length;

    return { total, digital, physical, service, course };
  }, [savedTemplates]);

  // Filtrer et trier les templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = savedTemplates.filter((template) => {
      // Filtre par type
      if (selectedType !== "all" && template.type !== selectedType) {
        return false;
      }

      // Filtre par recherche
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(searchLower);
        const matchesCategory = template.category.toLowerCase().includes(searchLower);
        const matchesDescription = template.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCategory && !matchesDescription) {
          return false;
        }
      }

      return true;
    });

    // Tri
    const sorted = [...filtered];
    switch (sortBy) {
      case "recent":
        return sorted.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "usage":
        return sorted.sort((a, b) => b.usageCount - a.usageCount);
      case "category":
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sorted;
    }
  }, [savedTemplates, selectedType, debouncedSearch, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTemplates.length / itemsPerPage);
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedTemplates.slice(start, end);
  }, [filteredAndSortedTemplates, currentPage, itemsPerPage]);

  // Handlers
  const getTypeIcon = useCallback((type: string) => {
    const iconClass = "h-4 w-4 sm:h-5 sm:w-5";
    switch (type) {
      case "digital":
        return <Download className={iconClass} />;
      case "physical":
        return <Package className={iconClass} />;
      case "service":
        return <Briefcase className={iconClass} />;
      case "course":
        return <GraduationCap className={iconClass} />;
      default:
        return <Layout className={iconClass} />;
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case "digital":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "physical":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
      case "service":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "course":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  }, []);

  const handleUseTemplate = useCallback((template: Template) => {
    logger.info('Template utilisé', { templateId: template.id, templateName: template.name });
    navigate("/dashboard/products/new", { state: { templateType: template.type } });
  }, [navigate]);

  const handlePreviewTemplate = useCallback((template: Template) => {
    logger.info('Aperçu template', { templateId: template.id });
    navigate("/demo/templates-ui", { state: { previewTemplateId: template.id } });
  }, [navigate]);

  const handleShareTemplate = useCallback(async (template: Template) => {
    try {
      const shareData = {
        title: template.name,
        text: `Découvrez ce template: ${template.name}`,
        url: `${window.location.origin}/demo/templates-ui?template=${template.id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        logger.info('Template partagé', { templateId: template.id });
      } else {
        // Fallback: copier le lien
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: t('templates.linkCopied', 'Lien copié !'),
          description: t('templates.linkCopiedDesc', 'Le lien a été copié dans le presse-papiers'),
        });
        logger.info('Lien template copié', { templateId: template.id });
      }
    } catch (error) {
      logger.error('Erreur lors du partage', error);
    }
  }, [toast, t]);

  const handleDeleteTemplate = useCallback((template: Template) => {
    logger.info('Suppression template demandée', { templateId: template.id });
    toast({
      title: t('templates.deleteConfirm', 'Supprimer le template ?'),
      description: t('templates.deleteConfirmDesc', 'Cette action est irréversible.'),
      variant: "destructive",
    });
    // TODO: Implémenter la suppression réelle
  }, [toast, t]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    logger.info('Recherche effacée');
  }, []);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    logger.info('Rafraîchissement des templates');
    toast({
      title: t('templates.refreshed', 'Actualisé'),
      description: t('templates.refreshedDesc', 'Les templates ont été actualisés'),
    });
  }, [toast, t]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      // Ctrl/Cmd + K pour focus recherche
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Ctrl/Cmd + G pour basculer vue
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
        logger.info('Mode d\'affichage changé', { mode: viewMode === "grid" ? "list" : "grid" });
      }

      // Escape pour effacer recherche
      if (e.key === "Escape" && searchInput) {
        handleClearSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInput, viewMode, handleClearSearch]);

  // Logging on mount
  useEffect(() => {
    logger.info('Page Mes Templates chargée', { 
      totalTemplates: savedTemplates.length,
      stats 
    });
  }, [savedTemplates.length, stats]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, debouncedSearch, sortBy]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('templates.myTemplates', 'Mes Templates')}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('templates.subtitle', 'Gérez vos templates sauvegardés pour créer rapidement des produits')}
                </p>
              </div>
              <Button 
                onClick={() => {
                  navigate("/demo/templates-ui");
                  logger.info('Navigation vers Marketplace Templates');
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="sm"
              >
                <Layout className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('templates.marketplace', 'Marketplace Templates')}</span>
                <span className="sm:hidden">{t('templates.marketplaceShort', 'Marketplace')}</span>
              </Button>
            </div>

            {/* Stats Cards - Responsive */}
            <div 
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                { label: t('templates.totalSaved', 'Total Sauvegardés'), value: stats.total, icon: Sparkles, color: "from-purple-600 to-pink-600" },
                { label: t('templates.digital', 'Digitaux'), value: stats.digital, icon: Download, color: "from-blue-600 to-cyan-600" },
                { label: t('templates.physical', 'Physiques'), value: stats.physical, icon: Package, color: "from-green-600 to-emerald-600" },
                { label: t('templates.services', 'Services'), value: stats.service, icon: Briefcase, color: "from-purple-600 to-violet-600" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Search, Filters & View Toggle - Responsive */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('templates.searchPlaceholder', 'Rechercher des templates...')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                      aria-label={t('templates.search', 'Rechercher')}
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                        onClick={handleClearSearch}
                        aria-label={t('common.clear', 'Effacer')}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    {/* Keyboard shortcut indicator */}
                    <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        ⌘K
                      </Badge>
                    </div>
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(v) => {
                    setSortBy(v as SortOption);
                    logger.info('Tri changé', { sortBy: v });
                  }}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{t('templates.sortRecent', 'Plus récent')}</SelectItem>
                      <SelectItem value="name">{t('templates.sortName', 'Nom (A-Z)')}</SelectItem>
                      <SelectItem value="usage">{t('templates.sortUsage', 'Plus utilisé')}</SelectItem>
                      <SelectItem value="category">{t('templates.sortCategory', 'Catégorie')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <Tabs value={viewMode} onValueChange={(v) => {
                    setViewMode(v as ViewMode);
                    logger.info('Mode d\'affichage changé', { mode: v });
                  }}>
                    <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1">
                      <TabsTrigger 
                        value="grid" 
                        className="gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t('templates.grid', 'Grille')}</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="list" 
                        className="gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t('templates.list', 'Liste')}</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-9 sm:h-10"
                    aria-label={t('templates.refresh', 'Rafraîchir')}
                  >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filters Tabs - Responsive */}
            <Tabs value={selectedType} onValueChange={(v) => {
              setSelectedType(v);
              logger.info('Type de template filtré', { type: v });
            }}>
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto p-1 bg-muted/50 backdrop-blur-sm overflow-x-auto">
                <TabsTrigger 
                  value="all" 
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('templates.all', 'Tous')}
                </TabsTrigger>
                <TabsTrigger 
                  value="digital" 
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('templates.digital', 'Digitaux')}
                </TabsTrigger>
                <TabsTrigger 
                  value="physical" 
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('templates.physical', 'Physiques')}
                </TabsTrigger>
                <TabsTrigger 
                  value="service" 
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('templates.services', 'Services')}
                </TabsTrigger>
                <TabsTrigger 
                  value="course" 
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('templates.courses', 'Cours')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedType} className="mt-4 sm:mt-6">
                {paginatedTemplates.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                    <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                      <Layout className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        {t('templates.noTemplatesInCategory', 'Aucun template sauvegardé dans cette catégorie')}
                      </p>
                      <Button
                        onClick={() => {
                          navigate("/demo/templates-ui");
                          logger.info('Navigation vers Marketplace depuis état vide');
                        }}
                        variant="outline"
                        className="mt-4"
                      >
                        {t('templates.exploreTemplates', 'Explorer les Templates')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div
                      ref={templatesRef}
                      className={cn(
                        viewMode === "grid"
                          ? "grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                          : "flex flex-col gap-3 sm:gap-4",
                        "animate-in fade-in slide-in-from-bottom-4 duration-700"
                      )}
                    >
                      {paginatedTemplates.map((template, index) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          viewMode={viewMode}
                          getTypeIcon={getTypeIcon}
                          getTypeColor={getTypeColor}
                          onUse={() => handleUseTemplate(template)}
                          onPreview={() => handlePreviewTemplate(template)}
                          onShare={() => handleShareTemplate(template)}
                          onDelete={() => handleDeleteTemplate(template)}
                          animationDelay={index * 50}
                          t={t}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span>
                            {t('templates.showing', 'Affichage de')} {(currentPage - 1) * itemsPerPage + 1} {t('templates.to', 'à')}{" "}
                            {Math.min(currentPage * itemsPerPage, filteredAndSortedTemplates.length)} {t('templates.of', 'sur')}{" "}
                            {filteredAndSortedTemplates.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(v) => {
                              setItemsPerPage(Number(v));
                              setCurrentPage(1);
                            }}
                          >
                            <SelectTrigger className="w-[80px] sm:w-[100px] h-9 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="18">18</SelectItem>
                              <SelectItem value="27">27</SelectItem>
                              <SelectItem value="36">36</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="h-9 w-9"
                              aria-label={t('templates.previousPage', 'Page précédente')}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1 px-2">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="h-9 w-9 text-xs sm:text-sm"
                                  aria-label={t('templates.goToPage', 'Aller à la page {{page}}', { page })}
                                >
                                  {page}
                                </Button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="h-9 w-9"
                              aria-label={t('templates.nextPage', 'Page suivante')}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

            {/* Keyboard Shortcuts Help - Desktop Only */}
            <div className="hidden lg:flex items-center justify-center gap-4 p-3 border-t border-border/50 bg-muted/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" aria-hidden="true" />
                <span>{t('common.shortcuts', 'Raccourcis')}:</span>
                <Badge variant="outline" className="text-[10px] font-mono">⌘K</Badge>
                <span className="text-muted-foreground">{t('templates.shortcuts.search', 'Rechercher')}</span>
                <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘G</Badge>
                <span className="text-muted-foreground">{t('templates.shortcuts.toggleView', 'Basculer vue')}</span>
                <Badge variant="outline" className="text-[10px] font-mono ml-2">Esc</Badge>
                <span className="text-muted-foreground">{t('templates.shortcuts.clear', 'Effacer')}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: Template;
  viewMode: ViewMode;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  onUse: () => void;
  onPreview: () => void;
  onShare: () => void;
  onDelete: () => void;
  animationDelay?: number;
  t: (key: string, defaultValue?: string) => string;
}

function TemplateCard({
  template,
  viewMode,
  getTypeIcon,
  getTypeColor,
  onUse,
  onPreview,
  onShare,
  onDelete,
  animationDelay = 0,
  t,
}: TemplateCardProps) {
  if (viewMode === "list") {
    return (
      <Card
        className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-left-4 touch-manipulation"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0">
              {getTypeIcon(template.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <CardTitle className="text-base sm:text-lg font-semibold truncate">{template.name}</CardTitle>
                <Badge variant="outline" className={cn("flex-shrink-0", getTypeColor(template.type))}>
                  {template.type}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">{template.category}</CardDescription>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {t('templates.used', 'Utilisé')} {template.usageCount} {t('templates.times', 'fois')}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(template.savedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={onUse}
              size="sm"
              className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">{t('templates.use', 'Utiliser')}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 sm:h-10 w-9 sm:w-10 p-0">
                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('templates.preview', 'Aperçu')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('templates.share', 'Partager')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('templates.delete', 'Supprimer')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="hover:shadow-xl transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {getTypeIcon(template.type)}
            </div>
            <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">{template.name}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("flex-shrink-0", getTypeColor(template.type))}>
            {template.type}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm">{template.category}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {template.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t('templates.used', 'Utilisé')} {template.usageCount} {t('templates.times', 'fois')}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {new Date(template.savedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onUse}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('templates.use', 'Utiliser')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 sm:h-10 w-full sm:w-auto sm:px-3">
                <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="mr-2 h-4 w-4" />
                {t('templates.preview', 'Aperçu')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                {t('templates.share', 'Partager')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('templates.delete', 'Supprimer')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
