/**
 * Page My Profile - Mes Informations (Customer Portal)
 * Date: 2 Février 2025
 *
 * Fonctionnalités:
 * - Édition profil utilisateur
 * - Gestion adresses de livraison
 * - Préférences notifications
 * - Sécurité (mot de passe, 2FA)
 * - Historique connexions
 * - Design responsive et moderne (style Inventaire/Mes Cours)
 */

import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Shield,
  Save,
  Trash2,
  Edit,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  metadata?: Record<string, unknown>;
}

interface ShippingAddress {
  id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
  is_default?: boolean;
}

export default function MyProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState<string | null>(null);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  // Profile form
  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
  });

  // Address form
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'BF',
    state: '',
    is_default: false,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          logger.error('Error fetching user:', userError);
          setError("Erreur lors du chargement de l'utilisateur");
          return;
        }
        setUser(user);
        if (user) {
          setProfileData({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            phone: user.user_metadata?.phone || '',
            avatar_url: user.user_metadata?.avatar_url,
          });
        }
      } catch (err) {
        logger.error('Error in fetchUser:', err);
        setError("Erreur lors du chargement de l'utilisateur");
      }
    };
    fetchUser();
  }, []);

  // Fetch addresses from database
  const { data: savedAddresses } = useQuery({
    queryKey: ['customer-addresses', user?.id],
    queryFn: async (): Promise<ShippingAddress[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching addresses:', error);
        // If table doesn't exist yet, return empty array
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return (data || []).map(addr => ({
        id: addr.id,
        full_name: addr.full_name,
        phone: addr.phone || '',
        address_line1: addr.address_line1,
        address_line2: addr.address_line2 || '',
        city: addr.city,
        postal_code: addr.postal_code || '',
        country: addr.country || 'BF',
        state: addr.state || '',
        is_default: addr.is_default || false,
      }));
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (savedAddresses) {
      setAddresses(savedAddresses);
    }
  }, [savedAddresses]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: UserProfile) => {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          phone: data.phone,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      logger.info('Profile updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    },
  });

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: ShippingAddress & { user_id: string }) => {
      if (editingAddress && editingAddress.id) {
        // Update existing address
        const { error } = await supabase
          .from('customer_addresses')
          .update({
            full_name: addressData.full_name,
            phone: addressData.phone || null,
            address_line1: addressData.address_line1,
            address_line2: addressData.address_line2 || null,
            city: addressData.city,
            postal_code: addressData.postal_code || null,
            country: addressData.country || 'BF',
            state: addressData.state || null,
            is_default: addressData.is_default || false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddress.id)
          .eq('user_id', addressData.user_id);

        if (error) throw error;
        return { id: editingAddress.id };
      } else {
        // Insert new address
        const { data, error } = await supabase
          .from('customer_addresses')
          .insert({
            user_id: addressData.user_id,
            full_name: addressData.full_name,
            phone: addressData.phone || null,
            address_line1: addressData.address_line1,
            address_line2: addressData.address_line2 || null,
            city: addressData.city,
            postal_code: addressData.postal_code || null,
            country: addressData.country || 'BF',
            state: addressData.state || null,
            is_default: addressData.is_default || false,
          })
          .select('id')
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', user?.id] });
      toast({
        title: editingAddress ? 'Adresse mise à jour' : 'Adresse ajoutée',
        description: 'Votre adresse a été sauvegardée avec succès',
      });
      logger.info('Address saved successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      logger.error('Error saving address:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', user?.id] });
      toast({
        title: 'Adresse supprimée',
        description: "L'adresse a été supprimée avec succès",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      logger.error('Error deleting address:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Save address
  const handleSaveAddress = useCallback(() => {
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour sauvegarder une adresse',
        variant: 'destructive',
      });
      return;
    }

    if (!addressForm.full_name || !addressForm.address_line1 || !addressForm.city) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    saveAddressMutation.mutate({
      ...addressForm,
      user_id: user.id,
    });

    setAddressForm({
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      postal_code: '',
      country: 'BF',
      state: '',
      is_default: false,
    });
    setEditingAddress(null);

    toast({
      title: 'Adresse sauvegardée',
      description: editingAddress ? 'Adresse mise à jour' : 'Nouvelle adresse ajoutée',
    });
  }, [addressForm, editingAddress, addresses, toast]);

  const handleDeleteAddress = useCallback(
    (id: string) => {
      if (!id) return;
      deleteAddressMutation.mutate(id);
      logger.info('Address deleted:', id);
    },
    [addresses, toast]
  );

  // Gérer le rafraîchissement
  const handleRefresh = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        logger.error('Error refreshing user:', userError);
        toast({
          title: 'Erreur',
          description: 'Impossible de rafraîchir les données.',
          variant: 'destructive',
        });
        return;
      }
      setUser(user);
      if (user) {
        setProfileData({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          avatar_url: user.user_metadata?.avatar_url,
        });
      }
      toast({
        title: 'Rafraîchissement réussi',
        description: 'Les données ont été mises à jour.',
      });
      logger.info('Profile refreshed');
    } catch (err) {
      logger.error('Error refreshing profile:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir les données.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  if (!user) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement du profil...</p>
              </div>
            </div>
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
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <User
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mon Profil
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez vos informations personnelles et vos préférences
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] h-11 sm:h-12 transition-all hover:scale-105 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Rafraîchir</span>
                  <span className="sm:hidden">Raf.</span>
                </Button>
              </div>
            </div>

            {/* Gestion d'erreurs */}
            {error && (
              <Alert
                variant="destructive"
                className="animate-in fade-in slide-in-from-top-4 duration-500"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tabs */}
            <div
              ref={tabsRef}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4 sm:space-y-6"
              >
                <TabsList className="w-full overflow-x-auto flex-nowrap justify-start h-auto p-1 bg-muted/50">
                  <TabsTrigger
                    value="profile"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Profil
                  </TabsTrigger>
                  <TabsTrigger
                    value="addresses"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Adresses
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Sécurité
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent
                  value="profile"
                  className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
                >
                  <div ref={contentRef}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                          Informations Personnelles
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                          Mettez à jour vos informations de profil
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs sm:text-sm">
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              disabled
                              className="pl-10 sm:pl-12 bg-muted min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            L'email ne peut pas être modifié
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-xs sm:text-sm">
                            Nom Complet
                          </Label>
                          <Input
                            id="full_name"
                            value={profileData.full_name}
                            onChange={e =>
                              setProfileData({ ...profileData, full_name: e.target.value })
                            }
                            onKeyDown={handleSpaceKeyDown}
                            placeholder="Jean Dupont"
                            className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs sm:text-sm">
                            Téléphone
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              value={profileData.phone}
                              onChange={e =>
                                setProfileData({ ...profileData, phone: e.target.value })
                              }
                              onKeyDown={handleSpaceKeyDown}
                              placeholder="+226 70 12 34 56"
                              className="pl-10 sm:pl-12 min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={() => updateProfile.mutate(profileData)}
                          disabled={updateProfile.isPending}
                          className="min-h-[44px] touch-manipulation w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
                        >
                          {updateProfile.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Sauvegarder
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent
                  value="addresses"
                  className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">
                        Mes Adresses de Livraison
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Gérez vos adresses de livraison
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {/* Address Form */}
                      <div className="space-y-4 p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/30">
                        <h3 className="font-semibold text-sm sm:text-base">
                          {editingAddress ? "Modifier l'adresse" : 'Nouvelle adresse'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="addr_full_name" className="text-xs sm:text-sm">
                              Nom complet *
                            </Label>
                            <Input
                              id="addr_full_name"
                              value={addressForm.full_name}
                              onChange={e =>
                                setAddressForm({ ...addressForm, full_name: e.target.value })
                              }
                              onKeyDown={handleSpaceKeyDown}
                              placeholder="Jean Dupont"
                              className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="addr_phone" className="text-xs sm:text-sm">
                              Téléphone *
                            </Label>
                            <Input
                              id="addr_phone"
                              value={addressForm.phone}
                              onChange={e =>
                                setAddressForm({ ...addressForm, phone: e.target.value })
                              }
                              onKeyDown={handleSpaceKeyDown}
                              placeholder="+226 70 12 34 56"
                              className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="addr_line1" className="text-xs sm:text-sm">
                              Adresse *
                            </Label>
                            <Input
                              id="addr_line1"
                              value={addressForm.address_line1}
                              onChange={e =>
                                setAddressForm({ ...addressForm, address_line1: e.target.value })
                              }
                              onKeyDown={handleSpaceKeyDown}
                              placeholder="123 Rue principale"
                              className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="addr_line2" className="text-xs sm:text-sm">
                              Complément d'adresse
                            </Label>
                            <Input
                              id="addr_line2"
                              value={addressForm.address_line2}
                              onChange={e =>
                                setAddressForm({ ...addressForm, address_line2: e.target.value })
                              }
                              placeholder="Appartement, étage..."
                              className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="addr_city" className="text-xs sm:text-sm">
                              Ville *
                            </Label>
                            <Input
                              id="addr_city"
                              value={addressForm.city}
                              onChange={e =>
                                setAddressForm({ ...addressForm, city: e.target.value })
                              }
                              onKeyDown={handleSpaceKeyDown}
                              placeholder="Ouagadougou"
                              className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="addr_postal" className="text-xs sm:text-sm">
                              Code postal
                            </Label>
                            <Input
                              id="addr_postal"
                              value={addressForm.postal_code}
                              onChange={e =>
                                setAddressForm({ ...addressForm, postal_code: e.target.value })
                              }
                              placeholder="01 BP 1234"
                              className="min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="addr_country" className="text-xs sm:text-sm">
                              Pays *
                            </Label>
                            <select
                              id="addr_country"
                              value={addressForm.country}
                              onChange={e =>
                                setAddressForm({ ...addressForm, country: e.target.value })
                              }
                              className="flex min-h-[44px] h-11 sm:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base touch-manipulation cursor-pointer"
                            >
                              <option value="BF">Burkina Faso</option>
                              <option value="CI">Côte d'Ivoire</option>
                              <option value="SN">Sénégal</option>
                              <option value="ML">Mali</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={handleSaveAddress}
                            size="sm"
                            className="min-h-[44px] touch-manipulation bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {editingAddress ? 'Mettre à jour' : 'Ajouter'}
                          </Button>
                          {editingAddress && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAddress(null);
                                setAddressForm({
                                  full_name: '',
                                  phone: '',
                                  address_line1: '',
                                  address_line2: '',
                                  city: '',
                                  postal_code: '',
                                  country: 'BF',
                                  state: '',
                                  is_default: false,
                                });
                              }}
                              className="min-h-[44px] touch-manipulation"
                            >
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Saved Addresses */}
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="font-semibold text-sm sm:text-base">
                          Adresses enregistrées
                        </h3>
                        {addresses.length === 0 ? (
                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-8 sm:p-12 text-center">
                              <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-in zoom-in duration-500" />
                              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                                Aucune adresse
                              </h3>
                              <p className="text-sm sm:text-base text-muted-foreground">
                                Aucune adresse enregistrée pour le moment
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          addresses.map(addr => (
                            <Card
                              key={addr.id}
                              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                            >
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-3 sm:gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <p className="font-semibold text-sm sm:text-base break-words">
                                        {addr.full_name}
                                      </p>
                                      {addr.is_default && (
                                        <Badge variant="default" className="text-xs">
                                          Par défaut
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                      {addr.address_line1}
                                      {addr.address_line2 && `, ${addr.address_line2}`}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                      {addr.city}, {addr.postal_code}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                      {addr.phone}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingAddress(addr);
                                        setAddressForm(addr);
                                      }}
                                      className="min-h-[44px] touch-manipulation"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteAddress(addr.id!)}
                                      className="min-h-[44px] touch-manipulation text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent
                  value="security"
                  className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                        Mot de passe
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Changez votre mot de passe pour plus de sécurité
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current_password" className="text-xs sm:text-sm">
                          Mot de passe actuel
                        </Label>
                        <Input
                          id="current_password"
                          type="password"
                          className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password" className="text-xs sm:text-sm">
                          Nouveau mot de passe
                        </Label>
                        <Input
                          id="new_password"
                          type="password"
                          className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password" className="text-xs sm:text-sm">
                          Confirmer le mot de passe
                        </Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="min-h-[44px] touch-manipulation w-full sm:w-auto"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Changer le mot de passe
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                        Authentification à deux facteurs (2FA)
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Ajoutez une couche de sécurité supplémentaire à votre compte
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="min-h-[44px] touch-manipulation w-full sm:w-auto"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Configurer le 2FA
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






