import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { BundleCard } from "./BundleCard";
import { Package, ArrowRight } from "lucide-react";

interface Bundle {
  id: string;
  name?: string;
  description?: string;
  discount_percentage?: number | null;
  savings_percentage?: number | null;
  stores?: { slug?: string } | null;
  [key: string]: unknown;
}

interface BundlesSectionProps {
  bundles: Bundle[];
}

export const BundlesSection: React.FC<BundlesSectionProps> = ({ bundles }) => {
  if (!bundles || bundles.length === 0) {
    return null;
  }

  const savingsPercentages = bundles.map((b) => {
    // Support à la fois savings_percentage et discount_percentage
    return (b.savings_percentage || b.discount_percentage || 0) as number;
  });
  const maxSavings = savingsPercentages.length > 0 ? Math.max(...savingsPercentages) : 0;

  return (
    <section className="py-8 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-600" />
              Bundles Exclusifs
            </h2>
            <p className="text-muted-foreground mt-1">
              Offres groupées à prix réduit - Économisez jusqu'à {maxSavings}%
            </p>
          </div>
          <Link to="/marketplace?type=bundle">
            <Button variant="outline">
              Voir tous les bundles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <ProductGrid>
          {bundles.slice(0, 6).map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              storeSlug={bundle.stores?.slug || 'default'}
            />
          ))}
        </ProductGrid>
      </div>
    </section>
  );
};

