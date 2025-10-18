import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import ProductCard from "@/components/marketplace/ProductCard";

interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  created_at: string;
  stores?: {
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
}

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  // --- 🔄 Chargement initial + abonnement temps réel ---
  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("realtime:products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("🔁 Changement détecté sur products :", payload);

          if (payload.eventType === "INSERT") {
            setProducts((prev) => [payload.new as Product, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Product) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setProducts((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 🧠 Fonction de récupération des produits ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products" as any)
        .select(
          `
          *,
          stores!inner (
            name,
            slug,
            logo_url
          )
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des produits :", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 🧩 Catégories uniques ---
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  // --- 🎯 Filtres et tri ---
  let filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.stores?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    let matchesPrice = true;
    if (priceRange === "0-5000") matchesPrice = product.price <= 5000;
    else if (priceRange === "5000-15000")
      matchesPrice = product.price > 5000 && product.price <= 15000;
    else if (priceRange === "15000+") matchesPrice = product.price > 15000;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (sortBy === "price-asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === "popular") {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "recent") {
    filteredProducts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- 🧱 UI ---
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-12 border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Marketplace Payhuk
          </h1>
          <p className="text-muted-foreground mb-8">
            Découvrez des milliers de produits digitaux : formations, ebooks,
            templates, logiciels et plus encore.
          </p>

          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un produit ou un vendeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base bg-card border-border shadow"
            />
          </div>

          <MarketplaceFilters
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categories={categories}
          />
        </div>
      </section>

      {/* Produits */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">Tous les produits</h2>
          <p className="text-muted-foreground mb-6">
            {filteredProducts.length} produit
            {filteredProducts.length !== 1 ? "s" : ""} disponible
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[480px] rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={product.stores?.slug || ""}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                Aucun produit disponible
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Essayez d'autres mots-clés ou filtres"
                  : "Soyez le premier à vendre vos produits sur notre marketplace !"}
              </p>
              <Link to="/auth">
                <Button className="gradient-accent text-accent-foreground font-semibold h-12 px-8">
                  Créer ma boutique gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-hero border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Rejoignez des centaines d'entrepreneurs qui développent leur
            business avec Payhuk.
          </p>
          <Link to="/auth">
            <Button className="gradient-accent text-accent-foreground font-semibold px-8 py-4 text-lg">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
};

export default Marketplace;
