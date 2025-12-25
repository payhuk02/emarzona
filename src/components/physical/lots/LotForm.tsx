/**
 * Formulaire de création/édition de lot
 * Date: 28 Janvier 2025
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateLot, useUpdateLot, useLot } from '@/hooks/physical/useLotsExpiration';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const lotFormSchema = z.object({
  lot_number: z.string().min(1, 'Le numéro de lot est requis'),
  batch_number: z.string().optional(),
  serial_number: z.string().optional(),
  manufacturing_date: z.string().optional(),
  expiration_date: z.string().optional(),
  best_before_date: z.string().optional(),
  received_date: z.string().optional(),
  initial_quantity: z.number().min(1, 'La quantité initiale doit être supérieure à 0'),
  unit_cost: z.number().optional(),
  rotation_method: z.enum(['FIFO', 'LIFO', 'FEFO', 'manual']).default('FIFO'),
  quality_status: z.enum(['good', 'acceptable', 'poor', 'rejected']).default('good'),
  bin_location: z.string().optional(),
  shelf_location: z.string().optional(),
  supplier_batch_number: z.string().optional(),
  certificate_of_analysis: z.string().optional(),
  notes: z.string().optional(),
});

type LotFormValues = z.infer<typeof lotFormSchema>;

interface LotFormProps {
  lotId?: string;
  physicalProductId: string;
  variantId?: string;
  warehouseId?: string;
  onSuccess: () => void;
}

export function LotForm({ lotId, physicalProductId, variantId, warehouseId, onSuccess }: LotFormProps) {
  const { data: existingLot } = useLot(lotId || '');
  const createLot = useCreateLot();
  const updateLot = useUpdateLot();

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      lot_number: '',
      rotation_method: 'FIFO',
      quality_status: 'good',
      initial_quantity: 0,
      received_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (existingLot) {
      form.reset({
        lot_number: existingLot.lot_number,
        batch_number: existingLot.batch_number || '',
        serial_number: existingLot.serial_number || '',
        manufacturing_date: existingLot.manufacturing_date || '',
        expiration_date: existingLot.expiration_date || '',
        best_before_date: existingLot.best_before_date || '',
        received_date: existingLot.received_date || new Date().toISOString().split('T')[0],
        initial_quantity: existingLot.initial_quantity,
        unit_cost: existingLot.unit_cost || undefined,
        rotation_method: existingLot.rotation_method,
        quality_status: existingLot.quality_status,
        bin_location: existingLot.bin_location || '',
        shelf_location: existingLot.shelf_location || '',
        supplier_batch_number: existingLot.supplier_batch_number || '',
        certificate_of_analysis: existingLot.certificate_of_analysis || '',
        notes: existingLot.notes || '',
      });
    }
  }, [existingLot, form]);

  const onSubmit = async (values: LotFormValues) => {
    try {
      const lotData = {
        physical_product_id: physicalProductId,
        variant_id: variantId || null,
        warehouse_id: warehouseId || null,
        lot_number: values.lot_number,
        batch_number: values.batch_number || null,
        serial_number: values.serial_number || null,
        manufacturing_date: values.manufacturing_date || null,
        expiration_date: values.expiration_date || null,
        best_before_date: values.best_before_date || null,
        received_date: values.received_date || new Date().toISOString().split('T')[0],
        initial_quantity: values.initial_quantity,
        current_quantity: lotId ? existingLot?.current_quantity || values.initial_quantity : values.initial_quantity,
        unit_cost: values.unit_cost || null,
        rotation_method: values.rotation_method,
        quality_status: values.quality_status,
        bin_location: values.bin_location || null,
        shelf_location: values.shelf_location || null,
        supplier_batch_number: values.supplier_batch_number || null,
        certificate_of_analysis: values.certificate_of_analysis || null,
        notes: values.notes || null,
      };

      if (lotId) {
        await updateLot.mutateAsync({ lotId, updates: lotData });
      } else {
        await createLot.mutateAsync(lotData as any);
      }

      onSuccess();
    } catch (error) {
      logger.error('Error saving lot', { error });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="lot_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Lot *</FormLabel>
                <FormControl>
                  <Input placeholder="LOT-2025-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batch_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Batch</FormLabel>
                <FormControl>
                  <Input placeholder="BATCH-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Série</FormLabel>
                <FormControl>
                  <Input placeholder="SN-123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initial_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité Initiale *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="received_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de Réception</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturing_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de Fabrication</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiration_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date d'Expiration</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>
                  Les alertes seront générées automatiquement 30 jours avant l'expiration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="best_before_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de Consommation Préférentielle</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût Unitaire</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rotation_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Méthode de Rotation</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une méthode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO - Premier entré, premier sorti</SelectItem>
                    <SelectItem value="LIFO">LIFO - Dernier entré, premier sorti</SelectItem>
                    <SelectItem value="FEFO">FEFO - Premier expiré, premier sorti</SelectItem>
                    <SelectItem value="manual">Manuel</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quality_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut Qualité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="good">Bon</SelectItem>
                    <SelectItem value="acceptable">Acceptable</SelectItem>
                    <SelectItem value="poor">Médiocre</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bin_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emplacement (Bin)</FormLabel>
                <FormControl>
                  <Input placeholder="A-12-3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shelf_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emplacement (Étagère)</FormLabel>
                <FormControl>
                  <Input placeholder="Étagère 5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Notes supplémentaires..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createLot.isPending || updateLot.isPending}>
            {lotId ? 'Mettre à jour' : 'Créer le Lot'}
          </Button>
        </div>
      </form>
    </Form>
  );
}



