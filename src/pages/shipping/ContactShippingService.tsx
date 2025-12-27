/**
 * 📞 Contacter un Service de Livraison
 * Page permettant aux vendeurs de consulter et contacter les services de livraison disponibles
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Star,
  Loader2,
  Info,
  Settings,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useShippingServiceMessaging } from '@/hooks/shipping/useShippingServiceMessaging';
import { useStore } from '@/hooks/useStore';

interface GlobalShippingService {
  id: string;
  name: string;
  description?: string;
  carrier_type: 'DHL' | 'FedEx' | 'UPS' | 'Chronopost' | 'Custom' | 'Local';
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  website_url?: string;
  api_available: boolean;
  api_documentation_url?: string;
  supported_countries: string[];
  supported_regions: string[];
  is_active: boolean;
  is_featured: boolean;
  priority: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function ContactShippingService() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { store } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCarrierType, setSelectedCarrierType] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const { createConversation, isCreating } = useShippingServiceMessaging(store?.id);

  // Charger tous les services globaux actifs
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['global-shipping-services-contact'],
    queryFn: async () => {
      // Type assertion explicite pour la table global_shipping_services
      // qui peut ne pas être dans les types générés
      type GlobalShippingService = {
        id: string;
        name: string;
        description?: string;
        contact_email?: string;
        contact_phone?: string;
        website_url?: string;
        is_active: boolean;
        is_featured: boolean;
        priority: number;
        created_at: string;
        updated_at: string;
      };
      const { data, error } = await supabase
        .from('global_shipping_services')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('priority', { ascending: false })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []) as GlobalShippingService[];

      if (error) {
        // Si la table n'existe pas encore, retourner un tableau vide
        if (error.code === '42P01' || error.code === 'PGRST116') {
          logger.warn('Table global_shipping_services does not exist yet');
          return [] as GlobalShippingService[];
        }
        throw error;
      }
      // Conversion via unknown pour éviter les erreurs de type
      return (data || []) as unknown as GlobalShippingService[];
    },
  });

  // Extraire tous les pays uniques pour le filtre
  const allCountries = useMemo(() => {
    if (!services) return [];
    const countriesSet = new Set<string>();
    services.forEach((service) => {
      if (service.supported_countries) {
        service.supported_countries.forEach((country) => countriesSet.add(country));
      }
    });
    return Array.from(countriesSet).sort();
  }, [services]);

  // Extraire tous les types de transporteurs uniques
  const allCarrierTypes = useMemo(() => {
    if (!services) return [];
    const typesSet = new Set<string>();
    services.forEach((service) => {
      typesSet.add(service.carrier_type);
    });
    return Array.from(typesSet).sort();
  }, [services]);

  // Filtrer les services
  const filteredServices = useMemo(() => {
    if (!services) return [];

    return services.filter((service) => {
      // Recherche par nom ou description
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        !debouncedSearch ||
        service.name.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.contact_name?.toLowerCase().includes(searchLower);

      // Filtre par pays
      const matchesCountry =
        !selectedCountry ||
        !service.supported_countries ||
        service.supported_countries.length === 0 ||
        service.supported_countries.includes(selectedCountry);

      // Filtre par type de transporteur
      const matchesCarrierType =
        !selectedCarrierType || service.carrier_type === selectedCarrierType;

      return matchesSearch && matchesCountry && matchesCarrierType;
    });
  }, [services, debouncedSearch, selectedCountry, selectedCarrierType]);

  // Statistiques
  const stats = useMemo(() => {
    if (!services) return { total: 0, featured: 0, withApi: 0 };
    return {
      total: services.length,
      featured: services.filter((s) => s.is_featured).length,
      withApi: services.filter((s) => s.api_available).length,
    };
  }, [services]);

  const handleContactEmail = (email: string, serviceName: string) => {
    window.location.href = `mailto:${email}?subject=Demande de service de livraison - ${serviceName}`;
    toast({
      title: '📧 Email ouvert',
      description: `Ouverture de votre client email pour contacter ${serviceName}`,
    });
  };

  const handleContactPhone = (phone: string, serviceName: string) => {
    window.location.href = `tel:${phone}`;
    toast({
      title: '📞 Appel téléphonique',
      description: `Appel de ${serviceName}...`,
    });
  };

  const handleStartConversation = async (service: GlobalShippingService) => {
    if (!store?.id) {
      toast({
        title: '❌ Erreur',
        description: 'Vous devez avoir une boutique pour contacter un service.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const conversation = await createConversation({
        storeId: store.id,
        shippingServiceId: service.id,
        subject: `Demande de service - ${service.name}`,
      });

      if (conversation) {
        navigate(`/dashboard/shipping-service-messages/${conversation.id}`);
      }
    } catch ( _error: any) {
      logger.error('Error starting conversation', error);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-3 sm:space-y-4 px-4">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-primary" />
                <p className="text-sm sm:text-base text-muted-foreground">Chargement des services de livraison...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <Alert variant="destructive" className="mx-2 sm:mx-0">
              <AlertDescription className="text-sm sm:text-base">
                Erreur lors du chargement des services de livraison. Veuillez réessayer plus tard.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-4 px-1 sm:px-0">
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  <Link to="/dashboard/shipping-services" className="flex items-center">
                    <ArrowLeft className="h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline text-sm sm:text-sm">Retour</span>
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 backdrop-blur-sm border border-green-500/20 flex-shrink-0">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500 dark:text-green-400" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                      Contacter un Service de Livraison
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                    Consultez et contactez les services de livraison disponibles pour vos produits
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 w-full sm:w-auto flex-shrink-0 touch-manipulation min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
                >
                  <Link to="/dashboard/shipping-services" className="flex items-center justify-center">
                    <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Gérer mes Services</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span className="break-words">Services Disponibles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words">
                    {stats.total}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span className="break-words">Services Recommandés</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent break-words">
                    {stats.featured}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span className="break-words">Avec API</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
                    {stats.withApi}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Alert */}
            <Alert className="mx-1 sm:mx-0">
              <Info className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                Ces services de livraison sont gérés par l'administrateur de la plateforme. 
                Contactez-les directement pour discuter de vos besoins de livraison.
              </AlertDescription>
            </Alert>

            {/* Search and Filters */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-5">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Rechercher un service de livraison..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
                    />
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-sm sm:text-base font-medium block">Filtrer par pays</label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="flex h-11 sm:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Tous les pays</option>
                        {allCountries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm sm:text-base font-medium block">Filtrer par type</label>
                      <select
                        value={selectedCarrierType}
                        onChange={(e) => setSelectedCarrierType(e.target.value)}
                        className="flex h-11 sm:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Tous les types</option>
                        {allCarrierTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services List */}
            {!filteredServices || filteredServices.length === 0 ? (
              <Card className="mx-1 sm:mx-0">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Aucun service trouvé</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
                    {searchQuery || selectedCountry || selectedCarrierType
                      ? 'Aucun service ne correspond à vos critères de recherche.'
                      : 'Aucun service de livraison n\'est disponible pour le moment.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    className={`relative ${
                      service.is_featured
                        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20'
                        : 'border-border/50 bg-card/50 backdrop-blur-sm'
                    }`}
                  >
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="break-words">{service.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <Badge variant="outline" className="text-xs sm:text-xs">{service.carrier_type}</Badge>
                            {service.is_featured && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs sm:text-xs">
                                <Star className="h-3 w-3 mr-1 flex-shrink-0" />
                                Recommandé
                              </Badge>
                            )}
                            {service.api_available && (
                              <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs sm:text-xs">
                                <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                                API
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {service.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
                      )}

                      {/* Contact Information */}
                      <div className="space-y-2.5 sm:space-y-3 mb-4">
                        {service.contact_name && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-muted-foreground flex-shrink-0">Contact:</span>
                            <span className="font-medium break-words">{service.contact_name}</span>
                          </div>
                        )}

                        {/* Bouton de messagerie intégrée */}
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white touch-manipulation min-h-[44px] text-xs sm:text-sm"
                          onClick={() => handleStartConversation(service)}
                          disabled={isCreating || !store?.id}
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                          ) : (
                            <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                          )}
                          <span className="truncate">{isCreating ? 'Création...' : 'Démarrer une conversation'}</span>
                        </Button>

                        {service.contact_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start touch-manipulation min-h-[44px] text-xs sm:text-sm"
                            onClick={() => handleContactEmail(service.contact_email!, service.name)}
                          >
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{service.contact_email}</span>
                          </Button>
                        )}

                        {service.contact_phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start touch-manipulation min-h-[44px] text-xs sm:text-sm"
                            onClick={() => handleContactPhone(service.contact_phone!, service.name)}
                          >
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{service.contact_phone}</span>
                          </Button>
                        )}

                        {service.website_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start touch-manipulation min-h-[44px] text-xs sm:text-sm"
                            onClick={() => window.open(service.website_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Visiter le site web</span>
                          </Button>
                        )}

                        {service.contact_address && (
                          <div className="flex items-start gap-2 text-xs sm:text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground break-words leading-relaxed">{service.contact_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Supported Countries */}
                      {service.supported_countries && service.supported_countries.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Pays supportés:</p>
                          <div className="flex flex-wrap gap-1">
                            {service.supported_countries.slice(0, 6).map((country, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {country}
                              </Badge>
                            ))}
                            {service.supported_countries.length > 6 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                +{service.supported_countries.length - 6}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Supported Regions */}
                      {service.supported_regions && service.supported_regions.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Régions:</p>
                          <div className="flex flex-wrap gap-1">
                            {service.supported_regions.map((region, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                                {region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API Documentation */}
                      {service.api_available && service.api_documentation_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 touch-manipulation min-h-[44px] text-xs sm:text-sm"
                          onClick={() => window.open(service.api_documentation_url, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                          <span className="truncate">Documentation API</span>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results Count */}
            {filteredServices && filteredServices.length > 0 && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground px-2 sm:px-0">
                {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé
                {filteredServices.length !== stats.total && ` sur ${stats.total}`}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







