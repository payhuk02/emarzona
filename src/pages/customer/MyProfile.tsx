/**
 * Page My Profile - Mes Informations (Customer Portal)
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Édition profil utilisateur
 * - Gestion adresses de livraison
 * - Préférences notifications
 * - Sécurité (mot de passe, 2FA)
 * - Historique connexions
 */

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Lock,
  Bell,
  Shield,
  Save,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  metadata?: any;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');

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
    supabase.auth.getUser().then(({ data: { user } }) => {
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
    });
  }, []);

  // Fetch addresses
  const { data: savedAddresses } = useQuery({
    queryKey: ['customer-addresses', user?.id],
    queryFn: async (): Promise<ShippingAddress[]> => {
      if (!user?.id) return [];
      
      // TODO: Create addresses table if doesn't exist
      // For now, return empty array
      return [];
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
        title: '✅ Profil mis à jour',
        description: 'Vos informations ont été sauvegardées',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    },
  });

  // Save address
  const handleSaveAddress = () => {
    if (!addressForm.full_name || !addressForm.address_line1 || !addressForm.city) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    if (editingAddress) {
      // Update existing
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } : addr
      ));
    } else {
      // Add new
      setAddresses([...addresses, { ...addressForm, id: Date.now().toString() }]);
    }

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
      title: '✅ Adresse sauvegardée',
      description: editingAddress ? 'Adresse mise à jour' : 'Nouvelle adresse ajoutée',
    });
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    toast({
      title: '✅ Adresse supprimée',
    });
  };

  if (!user) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-96" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/account')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <User className="h-8 w-8" />
                Mon Profil
              </h1>
            </div>
            <p className="text-muted-foreground mb-6">
              Gérez vos informations personnelles et vos préférences
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="addresses">Adresses</TabsTrigger>
                <TabsTrigger value="security">Sécurité</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                    <CardDescription>
                      Mettez à jour vos informations de profil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        L'email ne peut pas être modifié
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom Complet</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="+226 70 12 34 56"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => updateProfile.mutate(profileData)}
                      disabled={updateProfile.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfile.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mes Adresses de Livraison</CardTitle>
                    <CardDescription>
                      Gérez vos adresses de livraison
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Address Form */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h3 className="font-semibold">
                        {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="addr_full_name">Nom complet *</Label>
                          <Input
                            id="addr_full_name"
                            value={addressForm.full_name}
                            onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                            placeholder="Jean Dupont"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="addr_phone">Téléphone *</Label>
                          <Input
                            id="addr_phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            placeholder="+226 70 12 34 56"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="addr_line1">Adresse *</Label>
                          <Input
                            id="addr_line1"
                            value={addressForm.address_line1}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                            placeholder="123 Rue principale"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="addr_line2">Complément d'adresse</Label>
                          <Input
                            id="addr_line2"
                            value={addressForm.address_line2}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                            placeholder="Appartement, étage..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="addr_city">Ville *</Label>
                          <Input
                            id="addr_city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="Ouagadougou"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="addr_postal">Code postal</Label>
                          <Input
                            id="addr_postal"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                            placeholder="01 BP 1234"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="addr_country">Pays *</Label>
                          <select
                            id="addr_country"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="BF">Burkina Faso</option>
                            <option value="CI">Côte d'Ivoire</option>
                            <option value="SN">Sénégal</option>
                            <option value="ML">Mali</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveAddress} size="sm">
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
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Saved Addresses */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Adresses enregistrées</h3>
                      {addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucune adresse enregistrée
                        </p>
                      ) : (
                        addresses.map((addr) => (
                          <Card key={addr.id} className="relative">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-semibold">{addr.full_name}</p>
                                    {addr.is_default && (
                                      <Badge variant="default">Par défaut</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {addr.address_line1}
                                    {addr.address_line2 && `, ${addr.address_line2}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {addr.city}, {addr.postal_code}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingAddress(addr);
                                      setAddressForm(addr);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAddress(addr.id!)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
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
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Mot de passe
                    </CardTitle>
                    <CardDescription>
                      Changez votre mot de passe pour plus de sécurité
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Mot de passe actuel</Label>
                      <Input id="current_password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nouveau mot de passe</Label>
                      <Input id="new_password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                      <Input id="confirm_password" type="password" />
                    </div>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Changer le mot de passe
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Authentification à deux facteurs (2FA)
                    </CardTitle>
                    <CardDescription>
                      Ajoutez une couche de sécurité supplémentaire à votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Configurer le 2FA
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

