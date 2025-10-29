/**
 * DEMO FILE - Physical Products Day 2 Components
 * PhysicalProductsList + VariantManager
 * 
 * DO NOT USE IN PRODUCTION - TESTING ONLY
 */

import React, { useState } from 'react';
import { PhysicalProductsList } from './PhysicalProductsList';
import { VariantManager } from './VariantManager';
import type { VariantOption, ProductVariant } from './VariantManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PhysicalDay2Demo() {
  // Demo state for VariantManager
  const [options, setOptions] = useState<VariantOption[]>([
    {
      id: 'opt_1',
      name: 'Couleur',
      values: ['Rouge', 'Bleu', 'Vert', 'Noir'],
    },
    {
      id: 'opt_2',
      name: 'Taille',
      values: ['S', 'M', 'L', 'XL'],
    },
  ]);

  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: 'var_1',
      sku: 'TSH-RED-M',
      barcode: '123456789',
      option_values: { Couleur: 'Rouge', Taille: 'M' },
      price_adjustment: 0,
      quantity: 50,
      low_stock_threshold: 10,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'var_2',
      sku: 'TSH-BLU-L',
      option_values: { Couleur: 'Bleu', Taille: 'L' },
      price_adjustment: 500,
      quantity: 5,
      low_stock_threshold: 10,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'var_3',
      sku: 'TSH-GRN-S',
      option_values: { Couleur: 'Vert', Taille: 'S' },
      price_adjustment: -500,
      quantity: 0,
      low_stock_threshold: 10,
      is_active: false,
      created_at: new Date().toISOString(),
    },
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
          🔨 DEMO - Physical Products Day 2
          </CardTitle>
          <p className="text-muted-foreground">
            PhysicalProductsList + VariantManager Components
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">📋 Products List</TabsTrigger>
              <TabsTrigger value="variants">🎨 Variant Manager</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4 mt-6">
              <PhysicalProductsList
                storeId="demo-store-123"
                onCreateProduct={() => console.log('Create product')}
                onEditProduct={(id) => console.log('Edit product:', id)}
                onViewProduct={(id) => console.log('View product:', id)}
              />
            </TabsContent>

            <TabsContent value="variants" className="space-y-4 mt-6">
              <VariantManager
                basePrice={15000}
                currency="XOF"
                options={options}
                variants={variants}
                onOptionsChange={setOptions}
                onVariantsChange={setVariants}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs font-mono">
            <p>Options: {options.length}</p>
            <p>Variants: {variants.length}</p>
            <p>Active Variants: {variants.filter((v) => v.is_active).length}</p>
            <p>Out of Stock: {variants.filter((v) => v.quantity === 0).length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

