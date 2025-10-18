import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  orderCount: number;
}

interface TopProductsCardProps {
  products: Product[];
}

export const TopProductsCard = ({ products }: TopProductsCardProps) => {
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Produits populaires</CardTitle>
          <CardDescription>Vos produits les plus vendus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucun produit vendu pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Produits populaires</CardTitle>
            <CardDescription>Top 5 des produits les plus vendus</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard/products")}
            className="gap-1"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-smooth cursor-pointer"
              onClick={() => navigate("/dashboard/products")}
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
                {index + 1}
              </div>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-12 w-12 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.orderCount} vente{product.orderCount > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold">{product.price.toLocaleString()} FCFA</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
