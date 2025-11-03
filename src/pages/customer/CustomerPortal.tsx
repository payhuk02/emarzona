/**
 * Page Customer Portal - Dashboard client complet
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Vue d'ensemble tous achats (4 types)
 * - Statistiques personnelles
 * - Navigation vers sections détaillées
 * - Support complet 4 types produits
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Download,
  BookOpen,
  Calendar,
  Package,
  TrendingUp,
  FileText,
  User,
  MapPin,
  CreditCard,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  digitalProducts: number;
  physicalProducts: number;
  services: number;
  courses: number;
  activeSubscriptions: number;
}

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch customer statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['customer-stats', user?.id],
    queryFn: async (): Promise<CustomerStats> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      // Total spent
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, payment_status')
        .eq('customer_id', user.id)
        .eq('payment_status', 'completed');

      const totalSpent = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Count by product type
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_type')
        .in('order_id', 
          await supabase
            .from('orders')
            .select('id')
            .eq('customer_id', user.id)
            .then(({ data }) => data?.map(o => o.id) || [])
        );

      const typeCounts = {
        digital: orderItems?.filter(item => item.product_type === 'digital').length || 0,
        physical: orderItems?.filter(item => item.product_type === 'physical').length || 0,
        service: orderItems?.filter(item => item.product_type === 'service').length || 0,
        course: orderItems?.filter(item => item.product_type === 'course').length || 0,
      };

      // Active subscriptions (if exists)
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or('status.eq.trialing,status.eq.past_due');

      return {
        totalOrders: ordersCount || 0,
        totalSpent,
        digitalProducts: typeCounts.digital,
        physicalProducts: typeCounts.physical,
        services: typeCounts.service,
        courses: typeCounts.course,
        activeSubscriptions: subscriptionsCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (statsLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <User className="h-8 w-8" />
                Mon Espace Client
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos achats, téléchargements et informations personnelles
              </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Commandes passées</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats?.totalSpent || 0).toLocaleString('fr-FR')} XOF
                  </div>
                  <p className="text-xs text-muted-foreground">Depuis le début</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits Digitaux</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.digitalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Achetés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cours En Ligne</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.courses || 0}</div>
                  <p className="text-xs text-muted-foreground">Inscrit(e)s</p>
                </CardContent>
              </Card>
            </div>

            {/* Sections principales */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="downloads">Téléchargements</TabsTrigger>
                <TabsTrigger value="courses">Mes Cours</TabsTrigger>
                <TabsTrigger value="wishlist">Ma Wishlist</TabsTrigger>
                <TabsTrigger value="profile">Mon Profil</TabsTrigger>
              </TabsList>

              {/* Vue d'ensemble */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Mes Commandes */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/orders')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Mes Commandes
                      </CardTitle>
                      <CardDescription>
                        Consultez toutes vos commandes et leur statut
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Voir toutes mes commandes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Téléchargements */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/downloads')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Mes Téléchargements
                      </CardTitle>
                      <CardDescription>
                        Accédez à vos produits digitaux achetés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Accéder aux téléchargements
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Cours */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/courses')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Mes Cours
                      </CardTitle>
                      <CardDescription>
                        Continuez votre apprentissage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Voir mes cours
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Réservations */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/bookings')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Mes Réservations
                      </CardTitle>
                      <CardDescription>
                        Gérez vos réservations de services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Voir mes réservations
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Factures */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/invoices')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Mes Factures
                      </CardTitle>
                      <CardDescription>
                        Téléchargez vos factures et reçus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Voir mes factures
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Ma Wishlist */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/wishlist')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Ma Wishlist
                      </CardTitle>
                      <CardDescription>
                        Consultez vos produits favoris
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Voir ma wishlist
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mon Profil */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account/profile')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Mon Profil
                      </CardTitle>
                      <CardDescription>
                        Gérez vos informations personnelles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between">
                        Modifier mon profil
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Redirections vers pages détaillées */}
              <TabsContent value="orders">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirection vers Mes Commandes...</p>
                </div>
              </TabsContent>
              <TabsContent value="downloads">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirection vers Mes Téléchargements...</p>
                </div>
              </TabsContent>
              <TabsContent value="courses">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirection vers Mes Cours...</p>
                </div>
              </TabsContent>
              <TabsContent value="wishlist">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirection vers Ma Wishlist...</p>
                </div>
              </TabsContent>
              <TabsContent value="profile">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirection vers Mon Profil...</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

