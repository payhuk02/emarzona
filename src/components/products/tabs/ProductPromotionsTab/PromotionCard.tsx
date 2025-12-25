import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Interface pour une promotion
 */
export interface Promotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "buy_x_get_y";
  value: number;
  start_date: Date | null;
  end_date: Date | null;
  min_quantity: number;
  max_uses: number | null;
  customer_limit: number | null;
  is_active: boolean;
}

interface PromotionCardProps {
  promotion: Promotion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onUpdate: (field: keyof Promotion, value: any) => void;
  currencySymbol?: string;
}

/**
 * Carte pour afficher et éditer une promotion
 */
const PromotionCardComponent = ({
  promotion,
  index,
  isEditing,
  onEdit,
  onDelete,
  onToggleActive,
  onUpdate,
  currencySymbol = "FCFA"
}: PromotionCardProps) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage": return "Pourcentage";
      case "fixed": return "Montant fixe";
      case "buy_x_get_y": return "Acheter X obtenir Y";
      default: return type;
    }
  };

  return (
    <Card className={cn(
      "border-2 transition-all",
      promotion.is_active 
        ? "border-gray-700 bg-gray-800/50" 
        : "border-gray-700/50 bg-gray-800/30 opacity-70"
    )} style={{ willChange: 'transform' }}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base text-white">
              {promotion.name || `Promotion ${index + 1}`}
            </CardTitle>
            <Badge 
              className={cn(
                "text-xs",
                promotion.is_active 
                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                  : "bg-gray-700 text-gray-400"
              )}
            >
              {promotion.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30">
              {getTypeLabel(promotion.type)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={promotion.is_active}
              onCheckedChange={onToggleActive}
              aria-label={`${promotion.is_active ? 'Désactiver' : 'Activer'} la promotion ${promotion.name || index + 1}`}
              className="touch-manipulation"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px] min-w-[44px]"
              aria-label={`Éditer la promotion ${promotion.name || index + 1}`}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 min-h-[44px] min-w-[44px]"
              aria-label={`Supprimer la promotion ${promotion.name || index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isEditing && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label 
                htmlFor={`promotion-name-${promotion.id}`}
                className="text-sm font-medium text-white"
              >
                Nom de la promotion
              </Label>
              <Input
                id={`promotion-name-${promotion.id}`}
                value={promotion.name}
                onChange={(e) => onUpdate("name", e.target.value)}
                placeholder="Ex: Réduction de lancement"
                aria-label="Nom de la promotion"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label 
                htmlFor={`promotion-type-${promotion.id}`}
                className="text-sm font-medium text-white"
              >
                Type de promotion
              </Label>
              <Select 
                value={promotion.type} 
                onValueChange={(value) => onUpdate("type", value)}
              >
                <SelectTrigger 
                  id={`promotion-type-${promotion.id}`}
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="percentage" className="text-white hover:bg-gray-700">Pourcentage</SelectItem>
                  <SelectItem value="fixed" className="text-white hover:bg-gray-700">Montant fixe</SelectItem>
                  <SelectItem value="buy_x_get_y" className="text-white hover:bg-gray-700">Acheter X obtenir Y</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label 
                htmlFor={`promotion-value-${promotion.id}`}
                className="text-sm font-medium text-white"
              >
                {promotion.type === "percentage" ? "Pourcentage (%)" : 
                 promotion.type === "fixed" ? "Montant fixe" : "Valeur"}
              </Label>
              <div className="relative">
                <Input
                  id={`promotion-value-${promotion.id}`}
                  type="number"
                  value={promotion.value}
                  onChange={(e) => onUpdate("value", parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step={promotion.type === "percentage" ? "1" : "0.01"}
                  aria-label="Valeur de la promotion"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px] pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {promotion.type === "percentage" ? "%" : currencySymbol}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label 
                htmlFor={`promotion-min-quantity-${promotion.id}`}
                className="text-sm font-medium text-white"
              >
                Quantité minimum
              </Label>
              <Input
                id={`promotion-min-quantity-${promotion.id}`}
                type="number"
                value={promotion.min_quantity}
                onChange={(e) => onUpdate("min_quantity", parseInt(e.target.value) || 1)}
                placeholder="1"
                min="1"
                aria-label="Quantité minimum"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label 
                htmlFor={`promotion-max-uses-${promotion.id}`}
                className="text-sm font-medium text-white"
              >
                Utilisations max
              </Label>
              <Input
                id={`promotion-max-uses-${promotion.id}`}
                type="number"
                value={promotion.max_uses || ""}
                onChange={(e) => onUpdate("max_uses", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Illimité"
                min="1"
                aria-label="Nombre maximum d'utilisations"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label 
                htmlFor={`promotion-customer-limit-${promotion.id}`}
                className="text-sm font-medium text-white"
              >
                Limite par client
              </Label>
              <Input
                id={`promotion-customer-limit-${promotion.id}`}
                type="number"
                value={promotion.customer_limit || ""}
                onChange={(e) => onUpdate("customer_limit", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Illimité"
                min="1"
                aria-label="Limite par client"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]",
                      !promotion.start_date && "text-gray-400"
                    )}
                    aria-label="Sélectionner la date de début"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {promotion.start_date ? format(promotion.start_date, "PPP", { locale: fr }) : "Sélectionner"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start" sideOffset={5}>
                  <Calendar
                    mode="single"
                    selected={promotion.start_date || undefined}
                    onSelect={(date) => onUpdate("start_date", date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]",
                      !promotion.end_date && "text-gray-400"
                    )}
                    aria-label="Sélectionner la date de fin"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {promotion.end_date ? format(promotion.end_date, "PPP", { locale: fr }) : "Sélectionner"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start" sideOffset={5}>
                  <Calendar
                    mode="single"
                    selected={promotion.end_date || undefined}
                    onSelect={(date) => onUpdate("end_date", date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      )}
      
      {/* Résumé (mode non édition) */}
      {!isEditing && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Valeur:</span>
              <p className="text-white font-medium">
                {promotion.value}{promotion.type === "percentage" ? "%" : ` ${currencySymbol}`}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Qté min:</span>
              <p className="text-white font-medium">{promotion.min_quantity}</p>
            </div>
            <div>
              <span className="text-gray-400">Début:</span>
              <p className="text-white font-medium">
                {promotion.start_date ? format(promotion.start_date, "dd/MM/yyyy", { locale: fr }) : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Fin:</span>
              <p className="text-white font-medium">
                {promotion.end_date ? format(promotion.end_date, "dd/MM/yyyy", { locale: fr }) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PromotionCard = React.memo(PromotionCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.promotion.id === nextProps.promotion.id &&
    prevProps.promotion.name === nextProps.promotion.name &&
    prevProps.promotion.type === nextProps.promotion.type &&
    prevProps.promotion.value === nextProps.promotion.value &&
    prevProps.promotion.is_active === nextProps.promotion.is_active &&
    prevProps.promotion.start_date?.getTime() === nextProps.promotion.start_date?.getTime() &&
    prevProps.promotion.end_date?.getTime() === nextProps.promotion.end_date?.getTime() &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.index === nextProps.index &&
    prevProps.currencySymbol === nextProps.currencySymbol &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onToggleActive === nextProps.onToggleActive &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});

PromotionCard.displayName = 'PromotionCard';

