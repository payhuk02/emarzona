import { useState, useEffect } from "react";
import { Check, AlertCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  is_active?: boolean;
  attributes: {
    [key: string]: string;
  };
}

interface ProductVariantSelectorProps {
  variants: Variant[];
  basePrice: number;
  currency: string;
  onVariantChange?: (variant: Variant | null, price: number) => void;
}

export const ProductVariantSelector = ({
  variants,
  basePrice,
  currency,
  onVariantChange,
}: ProductVariantSelectorProps) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});

  // Extraire tous les types d'attributs disponibles
  const attributeTypes = Array.from(
    new Set(
      variants.flatMap((v) => Object.keys(v.attributes))
    )
  );

  // Obtenir les valeurs uniques pour chaque type d'attribut
  const getAttributeValues = (attributeType: string): string[] => {
    return Array.from(
      new Set(
        variants
          .filter((v) => v.is_active !== false)
          .map((v) => v.attributes[attributeType])
          .filter(Boolean)
      )
    );
  };

  // Vérifier si une combinaison d'attributs est disponible
  const isAttributeAvailable = (attributeType: string, value: string): boolean => {
    const tempSelection = { ...selectedAttributes, [attributeType]: value };
    return variants.some(
      (v) =>
        v.is_active !== false &&
        Object.entries(tempSelection).every(
          ([key, val]) => !val || v.attributes[key] === val
        )
    );
  };

  // Obtenir le stock d'une combinaison
  const getStock = (attributeType: string, value: string): number | undefined => {
    const tempSelection = { ...selectedAttributes, [attributeType]: value };
    const variant = variants.find(
      (v) =>
        v.is_active !== false &&
        Object.entries(tempSelection).every(
          ([key, val]) => v.attributes[key] === val
        )
    );
    return variant?.stock;
  };

  // Gérer la sélection d'un attribut
  const handleAttributeSelect = (attributeType: string, value: string) => {
    const newSelection = { ...selectedAttributes, [attributeType]: value };
    setSelectedAttributes(newSelection);

    // Trouver la variante correspondante
    const matchingVariant = variants.find(
      (v) =>
        v.is_active !== false &&
        Object.entries(newSelection).every(
          ([key, val]) => v.attributes[key] === val
        )
    );

    setSelectedVariant(matchingVariant || null);
    if (onVariantChange) {
      const finalPrice = matchingVariant?.price ?? basePrice;
      onVariantChange(matchingVariant || null, finalPrice);
    }
  };

  // Prix final
  const finalPrice = selectedVariant?.price ?? basePrice;

  // Stock final
  const finalStock = selectedVariant?.stock;

  // Affichage des labels selon le type d'attribut
  const getAttributeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      color: "Couleur",
      colour: "Couleur",
      size: "Taille",
      material: "Matière",
      pattern: "Motif",
      finish: "Finition",
      dimension: "Dimension",
      weight: "Poids",
      style: "Style",
    };
    return labels[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 pt-6 border-t border-border">
      <div className="space-y-4">
        {attributeTypes.map((attributeType) => {
          const values = getAttributeValues(attributeType);
          if (values.length === 0) return null;

          return (
            <div key={attributeType} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">
                  {getAttributeLabel(attributeType)}
                </label>
                {selectedAttributes[attributeType] && (
                  <span className="text-sm text-muted-foreground">
                    {selectedAttributes[attributeType]}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const isSelected = selectedAttributes[attributeType] === value;
                  const isAvailable = isAttributeAvailable(attributeType, value);
                  const stock = getStock(attributeType, value);
                  const isLowStock = stock !== undefined && stock < 5 && stock > 0;

                  return (
                    <Button
                      key={value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => handleAttributeSelect(attributeType, value)}
                      className={cn(
                        "relative",
                        isSelected && "ring-2 ring-primary ring-offset-2",
                        !isAvailable && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      {value}
                      {isLowStock && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 px-1 text-xs"
                        >
                          {stock}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informations sur la variante sélectionnée */}
      {selectedVariant && (
        <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
          {/* Prix */}
          {selectedVariant.price !== undefined && selectedVariant.price !== basePrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prix variante:</span>
              <span className="text-lg font-bold">
                {finalPrice.toLocaleString()} {currency}
              </span>
            </div>
          )}

          {/* Stock */}
          {finalStock !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Package className="h-4 w-4" />
                Disponibilité:
              </span>
              <div className="flex items-center gap-2">
                {finalStock > 0 ? (
                  <>
                    <Badge
                      variant={finalStock < 5 ? "destructive" : "secondary"}
                      className={finalStock < 5 ? "animate-pulse" : ""}
                    >
                      {finalStock} en stock
                    </Badge>
                    {finalStock < 5 && (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Stock limité
                      </span>
                    )}
                  </>
                ) : (
                  <Badge variant="destructive">Épuisé</Badge>
                )}
              </div>
            </div>
          )}

          {/* SKU */}
          {selectedVariant.sku && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Réf:</span>
              <span className="font-mono">{selectedVariant.sku}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

