/**
 * Portail client — Œuvres d'artiste (achats, certificats)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useUserArtistCertificates } from '@/hooks/artist/useArtistCertificates';
import { Loader2, Palette, FileCheck, ShoppingBag, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ArtistOrderRow {
  id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
  items: Array<{
    product_name: string;
    product_id: string;
  }>;
}

export default function CustomerArtistPortal() {
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<ArtistOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const { data: certificates = [], isLoading: certsLoading } = useUserArtistCertificates(
    userId ?? undefined
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const { data, error } = await supabase.rpc('list_my_artist_orders');

        if (error) throw error;

        const rows = Array.isArray(data) ? data : [];
        setOrders(rows as ArtistOrderRow[]);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Palette className="h-8 w-8 text-pink-500" />
                Mon espace Artiste
              </h1>
              <p className="text-muted-foreground mt-1">
                Vos achats d&apos;œuvres et certificats d&apos;authenticité
              </p>
            </div>

            <Tabs defaultValue="purchases">
              <TabsList className="mb-4">
                <TabsTrigger value="purchases">Mes achats</TabsTrigger>
                <TabsTrigger value="certificates">Certificats ({certificates.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="purchases">
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>Aucun achat d&apos;œuvre pour le moment.</p>
                      <Button asChild className="mt-4" variant="secondary">
                        <Link to="/collections">Explorer les collections</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-base">
                              Commande {order.order_number}
                            </CardTitle>
                            <Badge
                              variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                            >
                              {order.payment_status}
                            </Badge>
                          </div>
                          <CardDescription>
                            {format(new Date(order.created_at), 'PPP', { locale: fr })} —{' '}
                            {order.total_amount.toLocaleString('fr-FR')} {order.currency}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {order.items.map(item => (
                            <div
                              key={`${order.id}-${item.product_id}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{item.product_name}</span>
                              <Button asChild variant="link" className="h-auto p-0">
                                <Link to={`/artist/${item.product_id}`}>Voir l&apos;œuvre</Link>
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="certificates">
                {certsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : certificates.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>Aucun certificat disponible pour le moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {certificates.map(cert => (
                      <Card key={cert.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{cert.artwork_title}</CardTitle>
                          <CardDescription>
                            {cert.artist_name} — N° {cert.certificate_number}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          {cert.certificate_pdf_url && (
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={cert.certificate_pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                PDF
                              </a>
                            </Button>
                          )}
                          {cert.verification_code && (
                            <>
                              <Badge variant="outline">Code: {cert.verification_code}</Badge>
                              <Button asChild size="sm" variant="secondary">
                                <Link to={`/verify/${cert.verification_code}`}>
                                  Vérifier en ligne
                                </Link>
                              </Button>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
