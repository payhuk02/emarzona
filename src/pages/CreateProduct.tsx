import { useStore } from "@/hooks/useStore";
import { ProductCreationRouter } from "@/components/products/ProductCreationRouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateProduct = () => {
  const { store, loading } = useStore();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Aucune boutique trouvée</h2>
          <p className="text-muted-foreground">
            Veuillez d'abord créer une boutique pour ajouter des produits
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <ProductCreationRouter 
            storeId={store.id} 
            storeSlug={store.slug}
            onSuccess={() => navigate('/products')}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateProduct;
