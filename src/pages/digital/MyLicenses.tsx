/**
 * My Licenses Page - Customer View
 * Date: 27 octobre 2025
 * 
 * Page pour gérer les licenses des produits digitaux
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useUserLicenses, useLicenseActivations, useDeactivateLicense } from '@/hooks/digital/useLicenses';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Search,
  Smartphone,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Monitor,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { DigitalLicensesGrid } from '@/components/digital';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export const MyLicenses = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const { data: licenses, isLoading, error, refetch } = useUserLicenses();
  const { toast } = useToast();
  
  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const licensesRef = useScrollAnimation<HTMLDivElement>();

  /**
   * Filter licenses
   */
  const filteredLicenses = useMemo(() => {
    if (!licenses) return [];
    if (!debouncedSearch.trim()) return licenses;
    
    return licenses.filter((license) => {
      const productName = license.digital_product?.product?.name || '';
      return productName.toLowerCase().includes(debouncedSearch.toLowerCase());
    });
  }, [licenses, debouncedSearch]);

  /**
   * Calculate stats
   */
  const stats = useMemo(() => {
    if (!licenses) {
      return {
        total: 0,
        active: 0,
        expired: 0,
        suspended: 0,
      };
    }
    
    return {
      total: licenses.length,
      active: licenses.filter((l) => l.status === 'active').length,
      expired: licenses.filter((l) => l.status === 'expired').length,
      suspended: licenses.filter((l) => l.status === 'suspended').length,
    };
  }, [licenses]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    logger.info('Licenses refreshed', {});
    toast({
      title: 'Actualisé',
      description: 'Les licenses ont été actualisées.',
    });
  }, [refetch, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-licenses')?.focus();
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-licenses') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mr-1 sm:mr-2" />
                <div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Mes Licenses
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    Gérez vos licenses de produits digitaux
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  className="h-9 sm:h-10 transition-all hover:scale-105 text-xs sm:text-sm"
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
                  <span className="hidden sm:inline">Rafraîchir</span>
                </Button>
              </div>
            </div>

            {/* Error Alert - Style Inventaire */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error ? error.message : 'Erreur lors du chargement des licenses'}
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards - Style Inventaire (Gradients) */}
            <div 
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                { label: 'Total', value: stats.total, icon: Shield, color: "from-purple-600 to-pink-600", subtitle: 'Licenses' },
                { label: 'Actives', value: stats.active, icon: CheckCircle2, color: "from-green-600 to-emerald-600", subtitle: 'Licenses actives' },
                { label: 'Expirées', value: stats.expired, icon: XCircle, color: "from-red-600 to-rose-600", subtitle: 'Licenses expirées' },
                { label: 'Suspendues', value: stats.suspended, icon: AlertTriangle, color: "from-yellow-600 to-orange-600", subtitle: 'Licenses suspendues' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        ) : (
                          stat.value
                        )}
                      </div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        {stat.subtitle}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Search - Style Inventaire */}
            <Card ref={filtersRef} className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      id="search-licenses"
                      placeholder="Rechercher une license..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-8 sm:pl-10 pr-8 sm:pr-20 h-9 sm:h-10 text-xs sm:text-sm"
                      aria-label="Rechercher une license"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {searchInput && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => setSearchInput('')}
                          aria-label="Effacer"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                    {/* Keyboard shortcut indicator */}
                    <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        ⌘K
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Licenses Grid */}
            <div ref={licensesRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredLicenses.length === 0 && !isLoading ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardContent className="py-8 sm:py-12 md:py-16 lg:py-20 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="p-3 sm:p-4 rounded-full bg-muted/50 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 md:mb-6 flex items-center justify-center">
                        <Shield className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-1.5 sm:mb-2 md:mb-3">
                        Aucune license
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 md:mb-8">
                        {searchInput.trim() 
                          ? 'Aucune license ne correspond à votre recherche.'
                          : 'Vos licenses de produits digitaux apparaîtront ici'}
                      </p>
                      {searchInput.trim() && (
                        <Button 
                          onClick={() => setSearchInput('')}
                          size="lg"
                          variant="outline"
                          className="min-h-[44px] px-6 sm:px-8 touch-manipulation"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Réinitialiser la recherche
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <DigitalLicensesGrid
                  licenses={filteredLicenses}
                  loading={isLoading}
                  onManageLicense={(licenseId) => setSelectedLicenseId(licenseId)}
                />
              )}
            </div>

            {/* License Management Dialog */}
            {selectedLicenseId && (
              <LicenseManagementDialog
                licenseId={selectedLicenseId}
                open={!!selectedLicenseId}
                onClose={() => setSelectedLicenseId(null)}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

/**
 * License Management Dialog
 */
const LicenseManagementDialog = ({
  licenseId,
  open,
  onClose,
}: {
  licenseId: string;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: activations, isLoading } = useLicenseActivations(licenseId);
  const deactivate = useDeactivateLicense();
  const { toast } = useToast();

  const handleDeactivate = useCallback(async (activationId: string) => {
    try {
      await deactivate.mutateAsync({
        licenseId,
        activationId,
      });
      toast({
        title: 'Succès',
        description: 'Appareil désactivé',
      });
      logger.info('Appareil désactivé', { licenseId, activationId });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver',
        variant: 'destructive',
      });
      logger.error(error instanceof Error ? error : 'Erreur lors de la désactivation', { error, licenseId, activationId });
    }
  }, [deactivate, licenseId, toast]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xs sm:text-sm md:text-base lg:text-lg">Gérer les activations</DialogTitle>
          <DialogDescription className="text-[10px] sm:text-xs md:text-sm">
            Activations de cette license sur vos appareils
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !activations || activations.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune activation
                </p>
              </div>
            </Card>
          ) : (
            activations.map((activation: LicenseActivation) => (
              <Card key={activation.id} className={!activation.is_active ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <Monitor className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h4 className="font-medium truncate text-xs sm:text-sm md:text-base">
                            {activation.device_name || 'Appareil sans nom'}
                          </h4>
                          <Badge variant={activation.is_active ? 'default' : 'secondary'} className="text-[9px] sm:text-[10px] md:text-xs">
                            {activation.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                          {activation.os_name && (
                            <p>{activation.os_name} {activation.os_version}</p>
                          )}
                          <p>IP: {activation.ip_address}</p>
                          {activation.country && (
                            <p>Pays: {activation.country}</p>
                          )}
                          <p className="text-xs">
                            Activé le {format(new Date(activation.activated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {activation.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(activation.id)}
                        disabled={deactivate.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyLicenses;








