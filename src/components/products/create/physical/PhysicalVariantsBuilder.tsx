/**
 * Physical Product - Variants Builder (Step 2)
 * Date: 27 octobre 2025
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, X, Trash2 } from '@/components/icons';
import type { PhysicalProductFormData, PhysicalProductOption, PhysicalProductVariant } from '@/types/physical-product';

interface PhysicalVariantsBuilderProps {
  data: Partial<PhysicalProductFormData>;
  onUpdate: (data: Partial<PhysicalProductFormData>) => void;
}

export const PhysicalVariantsBuilder = ({ data, onUpdate }: PhysicalVariantsBuilderProps) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  const handleToggleVariants = (enabled: boolean) => {
    onUpdate({ has_variants: enabled });
    if (!enabled) {
      onUpdate({ options: [], variants: [] });
    }
  };

  const handleAddOption = () => {
    if (!newOptionName.trim()) return;

    const newOption: PhysicalProductOption = {
      name: newOptionName.trim(),
      values: [],
    };

    onUpdate({ options: [...(data.options || []), newOption] });
    setNewOptionName('');
  };

  const handleAddOptionValue = (optionIndex: number) => {
    if (!newOptionValue.trim()) return;

    const options = [...(data.options || [])];
    options[optionIndex].values.push(newOptionValue.trim());
    
    onUpdate({ options });
    setNewOptionValue('');
    
    // Regenerate variants
    generateVariants(options);
  };

  const handleRemoveOption = (optionIndex: number) => {
    const options = [...(data.options || [])];
    options.splice(optionIndex, 1);
    onUpdate({ options });
    generateVariants(options);
  };

  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    const options = [...(data.options || [])];
    options[optionIndex].values.splice(valueIndex, 1);
    onUpdate({ options });
    generateVariants(options);
  };

  const generateVariants = (options: PhysicalProductOption[]) => {
    if (options.length === 0) {
      onUpdate({ variants: [] });
      return;
    }

    const combinations: PhysicalProductVariant[] = [];

    const generateCombinations = (
      optionIndex: number,
      current: Partial<PhysicalProductVariant>
    ) => {
      if (optionIndex === options.length) {
        combinations.push({
          option1_value: current.option1_value!,
          option2_value: current.option2_value,
          option3_value: current.option3_value,
          price: data.price || 0,
          sku: `${data.sku || 'SKU'}-${combinations.length + 1}`,
          quantity: 0,
        });
        return;
      }

      const option = options[optionIndex];
      option.values.forEach((value) => {
        const next = { ...current };
        if (optionIndex === 0) next.option1_value = value;
        else if (optionIndex === 1) next.option2_value = value;
        else if (optionIndex === 2) next.option3_value = value;
        generateCombinations(optionIndex + 1, next);
      });
    };

    generateCombinations(0, {});
    onUpdate({ variants: combinations });
  };

  const handleUpdateVariant = (index: number, field: keyof PhysicalProductVariant, value: any) => {
    const variants = [...(data.variants || [])];
    variants[index] = { ...variants[index], [field]: value };
    onUpdate({ variants });
  };

  if (!data.has_variants) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variantes de produit</CardTitle>
              <CardDescription>
                Créez des variantes (tailles, couleurs, etc.)
              </CardDescription>
            </div>
            <Switch
              checked={false}
              onCheckedChange={handleToggleVariants}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Activez les variantes pour créer différentes versions de ce produit
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variantes de produit</CardTitle>
              <CardDescription>
                {data.options?.length || 0} option(s), {data.variants?.length || 0} variante(s)
              </CardDescription>
            </div>
            <Switch
              checked={true}
              onCheckedChange={handleToggleVariants}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>
            Ajoutez des options comme la taille, la couleur, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.options?.map((option, optionIndex) => (
            <div key={optionIndex} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{option.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(optionIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {option.values.map((value, valueIndex) => (
                  <Badge key={valueIndex} variant="secondary" className="gap-1">
                    {value}
                    <button
                      onClick={() => handleRemoveOptionValue(optionIndex, valueIndex)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nouvelle valeur"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOptionValue(optionIndex);
                    }
                  }}
                />
                <Button
                  onClick={() => handleAddOptionValue(optionIndex)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {(!data.options || data.options.length < 3) && (
            <div className="flex gap-2">
              <Input
                placeholder="Nom de l'option (ex: Taille)"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
              />
              <Button onClick={handleAddOption}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter option
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants Table */}
      {data.variants && data.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variantes générées</CardTitle>
            <CardDescription>
              Configurez le prix, SKU et stock pour chaque variante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variante</TableHead>
                    <TableHead>Prix (XOF)</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.variants.map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {variant.option1_value}
                        {variant.option2_value && ` / ${variant.option2_value}`}
                        {variant.option3_value && ` / ${variant.option3_value}`}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleUpdateVariant(index, 'price', parseFloat(e.target.value))}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.sku}
                          onChange={(e) => handleUpdateVariant(index, 'sku', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => handleUpdateVariant(index, 'quantity', parseInt(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
