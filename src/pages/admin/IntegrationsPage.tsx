/**
 * Integrations Configuration Page
 * Date: 30 Janvier 2025
 *
 * Page de configuration pour toutes les intégrations (Zoom, OpenAI, Shipping APIs)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Video,
  Brain,
  Truck,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface StoreIntegration {
  id: string;
  store_id: string;
  integration_type: string;
  display_name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  is_enabled: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function IntegrationsPage() {
  const { store, isLoading: storeLoading } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<StoreIntegration | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');

  // Fetch integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['store-integrations', store?.id],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StoreIntegration[];
    },
    enabled: !!store?.id,
  });

  // Create/Update integration
  const saveIntegration = useMutation({
    mutationFn: async ({
      integration,
      isNew,
    }: {
      integration: Partial<StoreIntegration>;
      isNew: boolean;
    }) => {
      if (!store?.id) throw new Error('Store ID manquant');

      if (isNew) {
        const { data, error } = await supabase
          .from('store_integrations')
          .insert([
            {
              ...integration,
              store_id: store.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('store_integrations')
          .update(integration)
          .eq('id', selectedIntegration?.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      setIsDialogOpen(false);
      setSelectedIntegration(null);
      setSelectedType('');
      toast({
        title: '✅ Intégration sauvegardée',
        description: 'La configuration a été sauvegardée avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de sauvegarder la configuration',
        variant: 'destructive',
      });
    },
  });

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.from('store_integrations').delete().eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast({
        title: '✅ Intégration supprimée',
        description: "L'intégration a été supprimée avec succès",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || "Impossible de supprimer l'intégration",
        variant: 'destructive',
      });
    },
  });

  // Toggle integration
  const toggleIntegration = useMutation({
    mutationFn: async ({
      integrationId,
      isActive,
    }: {
      integrationId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from('store_integrations')
        .update({ is_active: isActive })
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast({
        title: '✅ Statut mis à jour',
        description: "Le statut de l'intégration a été mis à jour",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });

  const integrationTypes = [
    {
      value: 'zoom',
      label: 'Zoom',
      icon: Video,
      description: 'Video conferencing pour services en ligne',
    },
    { value: 'openai', label: 'OpenAI', icon: Brain, description: 'Génération de contenu IA' },
    { value: 'shipping_fedex', label: 'FedEx', icon: Truck, description: 'Livraison FedEx' },
    { value: 'shipping_dhl', label: 'DHL', icon: Truck, description: 'Livraison DHL' },
    { value: 'shipping_ups', label: 'UPS', icon: Truck, description: 'Livraison UPS' },
  ];

  const getIntegrationByType = (type: string) => {
    return integrations.find(i => i.integration_type === type);
  };

  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
                <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
                <Skeleton className="h-96 w-full" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="text-center py-12 sm:py-16">
                      <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                        <Settings className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                      </div>
                      <p className="text-sm sm:text-base text-foreground font-medium">
                        Aucune boutique trouvée. Veuillez créer une boutique pour configurer les
                        intégrations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              {/* Header - Responsive & Animated */}
              <div ref={headerRef} className="animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Settings
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Intégrations
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Configurez vos intégrations tierces (Zoom, OpenAI, Shipping APIs)
                </p>
              </div>

              <Tabs defaultValue="zoom" className="w-full">
                <div
                  ref={tabsRef}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <TabsList className="grid w-full grid-cols-3 gap-2 overflow-x-auto">
                    <TabsTrigger value="zoom" className="text-xs sm:text-sm min-h-[44px]">
                      <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Video Conferencing</span>
                      <span className="sm:hidden">Video</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs sm:text-sm min-h-[44px]">
                      <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">AI Features</span>
                      <span className="sm:hidden">AI</span>
                    </TabsTrigger>
                    <TabsTrigger value="shipping" className="text-xs sm:text-sm min-h-[44px]">
                      <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Shipping APIs</span>
                      <span className="sm:hidden">Shipping</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Zoom Tab */}
                <TabsContent
                  value="zoom"
                  className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                          <CardTitle className="text-base sm:text-lg">
                            Zoom Video Conferencing
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Configurez Zoom pour créer automatiquement des réunions pour vos
                            services
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedIntegration(getIntegrationByType('zoom') || null);
                            setSelectedType('zoom');
                            setIsDialogOpen(true);
                          }}
                          className="min-h-[44px] h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          {getIntegrationByType('zoom') ? (
                            <>
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                              <span className="text-xs sm:text-sm">Modifier</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                              <span className="text-xs sm:text-sm">Configurer</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {getIntegrationByType('zoom') ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                                <Video className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-medium text-sm sm:text-base">
                                  {getIntegrationByType('zoom')?.display_name}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground">
                                  {getIntegrationByType('zoom')?.is_active ? 'Actif' : 'Inactif'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={getIntegrationByType('zoom')?.is_active}
                                onCheckedChange={checked => {
                                  toggleIntegration.mutate({
                                    integrationId: getIntegrationByType('zoom')!.id,
                                    isActive: checked,
                                  });
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deleteIntegration.mutate(getIntegrationByType('zoom')!.id)
                                }
                                className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 sm:py-16">
                          <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                            <Video className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                          </div>
                          <p className="text-sm sm:text-base text-foreground font-medium mb-2">
                            Aucune configuration Zoom
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Cliquez sur "Configurer" pour commencer.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Tab */}
                <TabsContent
                  value="ai"
                  className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                          <CardTitle className="text-base sm:text-lg">AI Features</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Configurez OpenAI pour la génération de contenu intelligent
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedIntegration(getIntegrationByType('openai') || null);
                            setSelectedType('openai');
                            setIsDialogOpen(true);
                          }}
                          className="min-h-[44px] h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          {getIntegrationByType('openai') ? (
                            <>
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                              <span className="text-xs sm:text-sm">Modifier</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                              <span className="text-xs sm:text-sm">Configurer</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {getIntegrationByType('openai') ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                              </div>
                              <div>
                                <div className="font-medium text-sm sm:text-base">
                                  {getIntegrationByType('openai')?.display_name}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground">
                                  {getIntegrationByType('openai')?.is_active ? 'Actif' : 'Inactif'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={getIntegrationByType('openai')?.is_active}
                                onCheckedChange={checked => {
                                  toggleIntegration.mutate({
                                    integrationId: getIntegrationByType('openai')!.id,
                                    isActive: checked,
                                  });
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deleteIntegration.mutate(getIntegrationByType('openai')!.id)
                                }
                                className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 sm:py-16">
                          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                            <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                          </div>
                          <p className="text-sm sm:text-base text-foreground font-medium mb-2">
                            Aucune configuration OpenAI
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Cliquez sur "Configurer" pour commencer.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Shipping Tab */}
                <TabsContent
                  value="shipping"
                  className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Shipping APIs</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Configurez vos transporteurs (FedEx, DHL, UPS)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 sm:space-y-4">
                        {['shipping_fedex', 'shipping_dhl', 'shipping_ups'].map(type => {
                          const integration = getIntegrationByType(type);
                          const typeLabel = type.replace('shipping_', '').toUpperCase();
                          return (
                            <div
                              key={type}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm sm:text-base">
                                    {integration?.display_name || typeLabel}
                                  </div>
                                  <div className="text-xs sm:text-sm text-muted-foreground">
                                    {integration
                                      ? integration.is_active
                                        ? 'Actif'
                                        : 'Inactif'
                                      : 'Non configuré'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {integration && (
                                  <Switch
                                    checked={integration.is_active}
                                    onCheckedChange={checked => {
                                      toggleIntegration.mutate({
                                        integrationId: integration.id,
                                        isActive: checked,
                                      });
                                    }}
                                  />
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedIntegration(integration || null);
                                    setSelectedType(type);
                                    setIsDialogOpen(true);
                                  }}
                                  className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                                >
                                  {integration ? (
                                    <>
                                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                      Modifier
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                      Configurer
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Configuration Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                      {selectedIntegration ? "Modifier l'intégration" : "Configurer l'intégration"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Configurez les paramètres de l'intégration {selectedType}
                    </DialogDescription>
                  </DialogHeader>
                  <IntegrationConfigForm
                    integration={selectedIntegration}
                    integrationType={selectedType}
                    onSubmit={data => {
                      saveIntegration.mutate({
                        integration: data,
                        isNew: !selectedIntegration,
                      });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Integration Config Form Component
const IntegrationConfigForm = ({
  integration,
  integrationType,
  onSubmit,
}: {
  integration: StoreIntegration | null;
  integrationType: string;
  onSubmit: (data: Partial<StoreIntegration>) => void;
}) => {
  const [formData, setFormData] = useState<Partial<StoreIntegration>>({
    integration_type: integrationType,
    display_name:
      integration?.display_name || integrationType.replace('shipping_', '').toUpperCase(),
    config: integration?.config || {},
    is_active: integration?.is_active ?? true,
    is_enabled: integration?.is_enabled ?? true,
  });

  const getConfigFields = () => {
    switch (integrationType) {
      case 'zoom':
        return (
          <>
            <div>
              <Label className="text-xs sm:text-sm">API Key</Label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, api_key: e.target.value },
                  })
                }
                placeholder="Zoom API Key"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">API Secret</Label>
              <Input
                type="password"
                value={formData.config?.api_secret || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, api_secret: e.target.value },
                  })
                }
                placeholder="Zoom API Secret"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Account ID (optionnel)</Label>
              <Input
                value={formData.config?.account_id || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, account_id: e.target.value },
                  })
                }
                placeholder="Zoom Account ID (pour OAuth)"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
          </>
        );
      case 'openai':
        return (
          <>
            <div>
              <Label className="text-xs sm:text-sm">API Key</Label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, api_key: e.target.value },
                  })
                }
                placeholder="OpenAI API Key"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Model (optionnel)</Label>
              <Input
                value={formData.config?.model || 'gpt-4-turbo-preview'}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, model: e.target.value },
                  })
                }
                placeholder="gpt-4-turbo-preview"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
          </>
        );
      case 'shipping_fedex':
      case 'shipping_dhl':
      case 'shipping_ups':
        return (
          <>
            <div>
              <Label className="text-xs sm:text-sm">API Key</Label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, api_key: e.target.value },
                  })
                }
                placeholder="Shipping API Key"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">API Secret / Password</Label>
              <Input
                type="password"
                value={formData.config?.api_secret || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, api_secret: e.target.value },
                  })
                }
                placeholder="Shipping API Secret"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Account Number</Label>
              <Input
                value={formData.config?.account_number || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, account_number: e.target.value },
                  })
                }
                placeholder="Account Number"
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <Label className="text-xs sm:text-sm">Nom d'affichage</Label>
        <Input
          value={formData.display_name}
          onChange={e => setFormData({ ...formData, display_name: e.target.value })}
          placeholder="Nom de l'intégration"
          className="h-9 sm:h-10 text-xs sm:text-sm"
        />
      </div>
      {getConfigFields()}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs sm:text-sm">Activer l'intégration</Label>
          <p className="text-xs text-muted-foreground">Activez ou désactivez cette intégration</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
        />
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => {}}
          className="w-full sm:w-auto min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
        >
          Annuler
        </Button>
        <Button
          onClick={() => onSubmit(formData)}
          className="w-full sm:w-auto min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {integration ? 'Modifier' : 'Créer'}
        </Button>
      </DialogFooter>
    </div>
  );
};
