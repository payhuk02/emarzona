import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Package,
  Smartphone,
  Wrench,
  HelpCircle,
  CheckCircle2,
  Star,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

/**
 * Types de produits disponibles
 */
const PRODUCT_TYPES = [
  {
    value: "digital",
    label: "Produit Digital",
    icon: Smartphone,
    description: "Ebooks, formations, logiciels, templates, fichiers téléchargeables",
    features: ["Téléchargement instantané", "Pas de stock", "Livraison automatique"],
    color: "blue",
    popular: true,
  },
  {
    value: "course",
    label: "Cours en ligne",
    icon: GraduationCap,
    description: "Cours vidéo, masterclass, formations structurées avec quiz et certificats",
    features: ["Vidéos HD", "Quiz & Certificats", "Suivi progression"],
    color: "orange",
    popular: true,
  },
  {
    value: "physical",
    label: "Produit Physique",
    icon: Package,
    description: "Vêtements, accessoires, objets artisanaux, produits manufacturés",
    features: ["Livraison requise", "Gestion stock", "Adresse client"],
    color: "green",
    popular: false,
  },
  {
    value: "service",
    label: "Service",
    icon: Wrench,
    description: "Consultations, coaching, design, développement, maintenance",
    features: ["Rendez-vous", "Prestation", "Sur mesure"],
    color: "purple",
    popular: false,
  },
];

/**
 * Props pour le composant ProductTypeSelector
 */
interface ProductTypeSelectorProps {
  /** Type de produit actuellement sélectionné */
  selectedType: string;
  /** Callback appelé lors du changement de type */
  onTypeChange: (type: string) => void;
  /** Erreurs de validation pour ce champ */
  validationError?: string;
}

/**
 * Composant de sélection du type de produit
 * 
 * Permet de choisir entre quatre types de produits :
 * - Produit Digital (ebooks, logiciels, templates, etc.)
 * - Cours en ligne (formations vidéo structurées avec quiz)
 * - Produit Physique (vêtements, accessoires, etc.)
 * - Service (consultations, coaching, etc.)
 * 
 * @example
 * ```tsx
 * <ProductTypeSelector
 *   selectedType={formData.product_type}
 *   onTypeChange={(type) => handleTypeChangeRequest(type)}
 *   validationError={validationErrors.product_type}
 * />
 * ```
 */
export const ProductTypeSelector = ({
  selectedType,
  onTypeChange,
  validationError,
}: ProductTypeSelectorProps) => {
  return (
    <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">Type de produit</CardTitle>
              <CardDescription className="text-gray-400">
                Choisissez le type de produit que vous souhaitez vendre
              </CardDescription>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Le type de produit détermine les fonctionnalités disponibles</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {PRODUCT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;
            const colorClasses = {
              blue: isSelected
                ? "border-blue-400 bg-blue-400/10"
                : "border-gray-600 hover:border-blue-400",
              orange: isSelected
                ? "border-orange-400 bg-orange-400/10"
                : "border-gray-600 hover:border-orange-400",
              green: isSelected
                ? "border-green-400 bg-green-400/10"
                : "border-gray-600 hover:border-green-400",
              purple: isSelected
                ? "border-purple-400 bg-purple-400/10"
                : "border-gray-600 hover:border-purple-400",
            };
            const iconColorClasses = {
              blue: "text-blue-400",
              orange: "text-orange-400",
              green: "text-green-400",
              purple: "text-purple-400",
            };

            return (
              <Card
                key={type.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 touch-manipulation min-h-[140px] sm:min-h-[160px]",
                  colorClasses[type.color as keyof typeof colorClasses]
                )}
                role="button"
                tabIndex={0}
                aria-label={`Sélectionner le type de produit ${type.label}`}
                aria-pressed={selectedType === type.value}
                onClick={() => onTypeChange(type.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTypeChange(type.value);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-current/20" : "bg-gray-700"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            iconColorClasses[type.color as keyof typeof iconColorClasses]
                          )}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base">{type.label}</h3>
                        {type.popular && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Populaire
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  </div>

                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                    {type.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-gray-700/50 border-gray-600 text-gray-300"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {validationError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

