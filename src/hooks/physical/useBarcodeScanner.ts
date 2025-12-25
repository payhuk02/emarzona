/**
 * Hook pour la gestion du scan de codes-barres
 * Date: 28 Janvier 2025
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: Date;
}

export interface UseBarcodeScannerOptions {
  onScanSuccess?: (result: BarcodeScanResult) => void;
  onScanError?: (error: Error) => void;
  autoStop?: boolean; // Arrêter automatiquement après un scan réussi
}

export function useBarcodeScanner(options: UseBarcodeScannerOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<BarcodeScanResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleScanSuccess = useCallback(
    (result: BarcodeScanResult) => {
      setLastScan(result);
      options.onScanSuccess?.(result);
      
      if (options.autoStop) {
        setIsScanning(false);
      }

      toast({
        title: 'Code-barres scanné',
        description: `Code: ${result.code}`,
      });
    },
    [options, toast]
  );

  const handleScanError = useCallback(
    (error: Error) => {
      options.onScanError?.(error);
      toast({
        title: 'Erreur de scan',
        description: error.message,
        variant: 'destructive',
      });
    },
    [options, toast]
  );

  return {
    isScanning,
    setIsScanning,
    lastScan,
    handleScanSuccess,
    handleScanError,
  };
}

/**
 * Recherche un produit par code-barres
 */
export function useProductByBarcode(barcode: string | null) {
  return useQuery({
    queryKey: ['product-by-barcode', barcode],
    queryFn: async () => {
      if (!barcode) return null;

      // Recherche dans serial_numbers
      const { data: serial, error: serialError } = await supabase
        .from('serial_numbers')
        .select(`
          *,
          physical_product:physical_products!inner(
            id,
            product:products!inner(
              id,
              name,
              store_id
            )
          )
        `)
        .eq('barcode', barcode)
        .maybeSingle();

      if (!serialError && serial) {
        return {
          type: 'serial' as const,
          data: serial,
        };
      }

      // Recherche dans inventory_items (si barcode stocké)
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          physical_product:physical_products!inner(
            id,
            product:products!inner(
              id,
              name,
              store_id
            )
          )
        `)
        .eq('barcode', barcode)
        .maybeSingle();

      if (!inventoryError && inventory) {
        return {
          type: 'inventory' as const,
          data: inventory,
        };
      }

      return null;
    },
    enabled: !!barcode && barcode.length > 0,
  });
}

/**
 * Mise à jour du stock via code-barres
 */
export function useUpdateStockByBarcode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      barcode,
      quantity,
      movementType,
      notes,
    }: {
      barcode: string;
      quantity: number;
      movementType: 'adjustment' | 'receipt' | 'sale';
      notes?: string;
    }) => {
      // Trouver l'inventory_item par barcode
      const { data: inventory, error: findError } = await supabase
        .from('inventory_items')
        .select('id, quantity_available')
        .eq('barcode', barcode)
        .single();

      if (findError || !inventory) {
        throw new Error('Produit non trouvé avec ce code-barres');
      }

      // Calculer la nouvelle quantité
      let newQuantity = inventory.quantity_available;
      if (movementType === 'receipt') {
        newQuantity += quantity;
      } else if (movementType === 'sale') {
        newQuantity -= quantity;
      } else {
        newQuantity = quantity; // adjustment
      }

      // Mettre à jour le stock
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity_available: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventory.id);

      if (updateError) throw updateError;

      // Enregistrer le mouvement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          inventory_item_id: inventory.id,
          movement_type: movementType,
          quantity: quantity,
          notes: notes || `Mise à jour via scan code-barres: ${barcode}`,
        });

      if (movementError) throw movementError;

      return { success: true, newQuantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['product-by-barcode'] });
      toast({
        title: 'Stock mis à jour',
        description: 'Le stock a été mis à jour avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}


