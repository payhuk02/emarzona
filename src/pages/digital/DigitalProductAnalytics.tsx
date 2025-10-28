/**
 * Digital Product Analytics Page
 * Date: 28 octobre 2025
 * 
 * Wrapper page pour Digital Analytics Dashboard
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DigitalAnalyticsDashboard } from '@/components/digital/DigitalAnalyticsDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DigitalProductAnalytics() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  // Fetch digital product to get digitalProductId
  const { data: digitalProduct, isLoading, error } = useQuery({
    queryKey: ['digital-product-for-analytics', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select(`
          id,
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Chargement des analytics...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !digitalProduct) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <Alert variant="destructive">
                <AlertDescription>
                  Produit digital non trouvé
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <h1 className="text-3xl font-bold">Analytics - {digitalProduct.product.name}</h1>
                <p className="text-muted-foreground mt-1">
                  Statistiques détaillées de téléchargements et licenses
                </p>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <DigitalAnalyticsDashboard
              productId={productId!}
              digitalProductId={digitalProduct.id}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

