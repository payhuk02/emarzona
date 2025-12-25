import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Interface pour une variante de produit
 */
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
  image?: string;
  is_active: boolean;
}

interface VariantCardProps {
  variant: ProductVariant;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onUpdate: (field: keyof ProductVariant, value: any) => void;
  currencySymbol?: string;
}

/**
 * Carte pour afficher et éditer une variante de produit
 * Supporte le mode édition et l'affichage compact
 */
const VariantCardComponent = ({
  variant,
  index,
  isEditing,
  onEdit,
  onDelete,
  onToggleActive,
  onUpdate,
  currencySymbol = "FCFA"
}: VariantCardProps) => {
  return (
    <Card className={cn(
      "border-2 transition-all",
      variant.is_active 
        ? "border-gray-700 bg-gray-800/50" 
        : "border-gray-700/50 bg-gray-800/30 opacity-70"
    )} style={{ willChange: 'transform' }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 touch-manipulation">
            <GripVertical 
              className="h-5 w-5 text-gray-400 cursor-move" 
              aria-hidden="true"
            />
          </div>
          
          <div className="flex-1 space-y-4">
            {/* En-tête de la variante */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-semibold text-white">
                  Variante {index + 1}
                  {variant.name && `: ${variant.name}`}
                </h4>
                <Badge 
                  className={cn(
                    "text-xs",
                    variant.is_active 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  {variant.is_active ? "Active" : "Inactive"}
                </Badge>
                {variant.stock <= 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Rupture de stock
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={variant.is_active}
                  onCheckedChange={onToggleActive}
                  aria-label={`${variant.is_active ? 'Désactiver' : 'Activer'} la variante ${variant.name || index + 1}`}
                  className="touch-manipulation"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px] min-w-[44px]"
                  aria-label={`Éditer la variante ${variant.name || index + 1}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 min-h-[44px] min-w-[44px]"
                  aria-label={`Supprimer la variante ${variant.name || index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Formulaire d'édition */}
            {isEditing && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label 
                      htmlFor={`variant-name-${variant.id}`}
                      className="text-sm font-medium text-white"
                    >
                      Nom de la variante
                    </Label>
                    <Input
                      id={`variant-name-${variant.id}`}
                      value={variant.name}
                      onChange={(e) => onUpdate("name", e.target.value)}
                      placeholder="Ex: Rouge, Taille L, etc."
                      aria-label="Nom de la variante"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label 
                      htmlFor={`variant-sku-${variant.id}`}
                      className="text-sm font-medium text-white"
                    >
                      SKU
                    </Label>
                    <Input
                      id={`variant-sku-${variant.id}`}
                      value={variant.sku}
                      onChange={(e) => onUpdate("sku", e.target.value)}
                      placeholder="PROD-RED-L"
                      aria-label="SKU de la variante"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label 
                      htmlFor={`variant-price-${variant.id}`}
                      className="text-sm font-medium text-white"
                    >
                      Prix
                    </Label>
                    <div className="relative">
                      <Input
                        id={`variant-price-${variant.id}`}
                        type="number"
                        value={variant.price}
                        onChange={(e) => onUpdate("price", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        aria-label="Prix de la variante"
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px] pr-16"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {currencySymbol}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label 
                      htmlFor={`variant-stock-${variant.id}`}
                      className="text-sm font-medium text-white"
                    >
                      Stock
                    </Label>
                    <Input
                      id={`variant-stock-${variant.id}`}
                      type="number"
                      value={variant.stock}
                      onChange={(e) => onUpdate("stock", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      aria-label="Stock de la variante"
                      className={cn(
                        "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]",
                        variant.stock <= 0 && "border-red-500/50"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor={`variant-image-${variant.id}`}
                    className="text-sm font-medium text-white"
                  >
                    Image de la variante (URL)
                  </Label>
                  <Input
                    id={`variant-image-${variant.id}`}
                    value={variant.image || ""}
                    onChange={(e) => onUpdate("image", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    aria-label="URL de l'image de la variante"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {/* Résumé (mode non édition) */}
            {!isEditing && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">SKU:</span>
                  <p className="text-white font-medium">{variant.sku || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Prix:</span>
                  <p className="text-white font-medium">{variant.price.toLocaleString()} {currencySymbol}</p>
                </div>
                <div>
                  <span className="text-gray-400">Stock:</span>
                  <p className={cn(
                    "font-medium",
                    variant.stock > 10 ? "text-green-400" :
                    variant.stock > 0 ? "text-yellow-400" :
                    "text-red-400"
                  )}>
                    {variant.stock}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Statut:</span>
                  <p className={cn(
                    "font-medium",
                    variant.is_active ? "text-green-400" : "text-gray-500"
                  )}>
                    {variant.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const VariantCard = React.memo(VariantCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.variant.id === nextProps.variant.id &&
    prevProps.variant.name === nextProps.variant.name &&
    prevProps.variant.sku === nextProps.variant.sku &&
    prevProps.variant.price === nextProps.variant.price &&
    prevProps.variant.stock === nextProps.variant.stock &&
    prevProps.variant.is_active === nextProps.variant.is_active &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.index === nextProps.index &&
    prevProps.currencySymbol === nextProps.currencySymbol &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onToggleActive === nextProps.onToggleActive &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});

VariantCard.displayName = 'VariantCard';

