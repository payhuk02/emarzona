/**
 * Variant Selector Component
 * Date: 28 octobre 2025
 * 
 * Sélecteur de variantes pour produits physiques
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ProductVariant } from '@/hooks/physical/usePhysicalProducts';

interface VariantSelectorProps {
  variants: ProductVariant[];
  option1Name?: string;
  option2Name?: string;
  option3Name?: string;
  selectedVariantId?: string;
  onVariantChange?: (variant: ProductVariant) => void;
}

export const VariantSelector = ({
  variants,
  option1Name = 'Option 1',
  option2Name,
  option3Name,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) => {
  const [selectedOptions, setSelectedOptions] = useState<{
    option1?: string;
    option2?: string;
    option3?: string;
  }>({});

  // Extract unique option values
  const option1Values = [...new Set(variants.map((v) => v.option1_value))];
  const option2Values = option2Name
    ? [...new Set(variants.map((v) => v.option2_value).filter(Boolean))]
    : [];
  const option3Values = option3Name
    ? [...new Set(variants.map((v) => v.option3_value).filter(Boolean))]
    : [];

  // Find matching variant
  const selectedVariant = variants.find(
    (v) =>
      v.option1_value === selectedOptions.option1 &&
      (!option2Name || v.option2_value === selectedOptions.option2) &&
      (!option3Name || v.option3_value === selectedOptions.option3)
  );

  // Check if an option is available
  const isOptionAvailable = (
    optionLevel: 'option1' | 'option2' | 'option3',
    value: string
  ) => {
    const matchingVariants = variants.filter((v) => {
      if (optionLevel === 'option1') {
        return v.option1_value === value;
      } else if (optionLevel === 'option2') {
        return (
          v.option1_value === selectedOptions.option1 && v.option2_value === value
        );
      } else {
        return (
          v.option1_value === selectedOptions.option1 &&
          v.option2_value === selectedOptions.option2 &&
          v.option3_value === value
        );
      }
    });

    return matchingVariants.some((v) => v.is_available && v.quantity > 0);
  };

  const handleOptionChange = (
    optionLevel: 'option1' | 'option2' | 'option3',
    value: string
  ) => {
    const newSelection = { ...selectedOptions, [optionLevel]: value };

    // Reset subsequent options
    if (optionLevel === 'option1') {
      newSelection.option2 = undefined;
      newSelection.option3 = undefined;
    } else if (optionLevel === 'option2') {
      newSelection.option3 = undefined;
    }

    setSelectedOptions(newSelection);

    // Find and emit the complete variant
    const variant = variants.find(
      (v) =>
        v.option1_value === newSelection.option1 &&
        (!option2Name || v.option2_value === newSelection.option2) &&
        (!option3Name || v.option3_value === newSelection.option3)
    );

    if (variant && onVariantChange) {
      onVariantChange(variant);
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rupture
        </Badge>
      );
    } else if (quantity < 5) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Stock faible ({quantity})
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          En stock ({quantity})
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Option 1 */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{option1Name}</Label>
        <RadioGroup
          value={selectedOptions.option1}
          onValueChange={(value) => handleOptionChange('option1', value)}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {option1Values.map((value) => {
              const available = isOptionAvailable('option1', value);
              return (
                <label
                  key={value}
                  className={`
                    relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedOptions.option1 === value ? 'border-primary bg-primary/5' : 'border-muted'}
                    ${!available ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
                  `}
                >
                  <RadioGroupItem
                    value={value}
                    disabled={!available}
                    className="sr-only"
                  />
                  <span className="font-medium">{value}</span>
                  {!available && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-destructive rotate-45" />
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Option 2 */}
      {option2Name && selectedOptions.option1 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">{option2Name}</Label>
          <RadioGroup
            value={selectedOptions.option2}
            onValueChange={(value) => handleOptionChange('option2', value)}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {option2Values.map((value) => {
                const available = isOptionAvailable('option2', value as string);
                return (
                  <label
                    key={value}
                    className={`
                      relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedOptions.option2 === value ? 'border-primary bg-primary/5' : 'border-muted'}
                      ${!available ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
                    `}
                  >
                    <RadioGroupItem
                      value={value as string}
                      disabled={!available}
                      className="sr-only"
                    />
                    <span className="font-medium">{value}</span>
                    {!available && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-destructive rotate-45" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Option 3 */}
      {option3Name && selectedOptions.option2 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">{option3Name}</Label>
          <RadioGroup
            value={selectedOptions.option3}
            onValueChange={(value) => handleOptionChange('option3', value)}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {option3Values.map((value) => {
                const available = isOptionAvailable('option3', value as string);
                return (
                  <label
                    key={value}
                    className={`
                      relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedOptions.option3 === value ? 'border-primary bg-primary/5' : 'border-muted'}
                      ${!available ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
                    `}
                  >
                    <RadioGroupItem
                      value={value as string}
                      disabled={!available}
                      className="sr-only"
                    />
                    <span className="font-medium">{value}</span>
                    {!available && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-destructive rotate-45" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {selectedVariant.option1_value}
                  {selectedVariant.option2_value && ` / ${selectedVariant.option2_value}`}
                  {selectedVariant.option3_value && ` / ${selectedVariant.option3_value}`}
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {selectedVariant.price.toLocaleString()} XOF
                </p>
                {selectedVariant.compare_at_price && (
                  <p className="text-sm line-through text-muted-foreground">
                    {selectedVariant.compare_at_price.toLocaleString()} XOF
                  </p>
                )}
              </div>
              <div>{getStockBadge(selectedVariant.quantity)}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

