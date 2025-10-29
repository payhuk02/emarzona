/**
 * DEMO FILE - Physical Components Showcase
 * Pour tester visuellement les nouveaux composants
 * À supprimer avant production
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InventoryStockIndicator,
  CompactStockIndicator,
  DetailedStockIndicator,
  StockBadge,
} from './InventoryStockIndicator';
import {
  ShippingInfoDisplay,
  CompactShippingInfo,
  DetailedShippingInfo,
  ShippingStatusBadge,
} from './ShippingInfoDisplay';
import type { ShippingInfo } from './ShippingInfoDisplay';

export function PhysicalComponentsDemo() {
  // Sample shipping data
  const sampleShipping: ShippingInfo = {
    status: 'in_transit',
    trackingNumber: 'TRK123456789',
    carrier: 'DHL Express',
    shippingMethod: 'Express International',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    shippingCost: 15000,
    currency: 'XOF',
    weight: 2.5,
    weightUnit: 'kg',
    dimensions: {
      length: 30,
      width: 20,
      height: 15,
      unit: 'cm',
    },
    originAddress: {
      city: 'Paris',
      country: 'France',
    },
    destinationAddress: {
      street: '123 Rue Example',
      city: 'Ouagadougou',
      postalCode: '01 BP 1234',
      country: 'Burkina Faso',
    },
    trackingUrl: 'https://www.dhl.com/tracking',
    notes: 'Livraison entre 9h et 18h',
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Physical Components Demo</h1>
        <p className="text-muted-foreground">
          Showcase des nouveaux composants pour produits physiques
        </p>
      </div>

      {/* Inventory Stock Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Stock Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Variants</h3>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Compact (in stock)</p>
              <CompactStockIndicator quantity={50} lowStockThreshold={10} />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Default (low stock)</p>
              <InventoryStockIndicator quantity={5} lowStockThreshold={10} />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Detailed (out of stock)</p>
              <DetailedStockIndicator 
                quantity={0} 
                lowStockThreshold={10}
                totalSold={45}
                showProgress={true}
                showTrend={true}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Stock Badges</p>
              <div className="flex gap-2">
                <StockBadge quantity={100} lowStockThreshold={10} />
                <StockBadge quantity={8} lowStockThreshold={10} />
                <StockBadge quantity={0} lowStockThreshold={10} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Info Display */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Info Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Variants</h3>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Compact</p>
              <CompactShippingInfo shipping={sampleShipping} />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Default</p>
              <ShippingInfoDisplay shipping={sampleShipping} />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Detailed</p>
              <DetailedShippingInfo shipping={sampleShipping} />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status Badges</p>
              <div className="flex flex-wrap gap-2">
                <ShippingStatusBadge status="pending" />
                <ShippingStatusBadge status="processing" />
                <ShippingStatusBadge status="shipped" />
                <ShippingStatusBadge status="in_transit" />
                <ShippingStatusBadge status="out_for_delivery" />
                <ShippingStatusBadge status="delivered" />
                <ShippingStatusBadge status="failed" />
                <ShippingStatusBadge status="returned" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined Example */}
      <Card>
        <CardHeader>
          <CardTitle>Combined Example - Product Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Stock Information</h4>
              <DetailedStockIndicator 
                quantity={25} 
                lowStockThreshold={10}
                totalSold={15}
                showProgress={true}
                showTrend={true}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Shipping Information</h4>
              <ShippingInfoDisplay 
                shipping={{
                  ...sampleShipping,
                  status: 'delivered',
                  actualDelivery: new Date().toISOString(),
                }} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

