/**
 * Formulaire de création/édition de numéro de série
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
import { useCreateSerialNumber, useUpdateSerialNumber, useSerialNumber } from '@/hooks/physical/useSerialTracking';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const serialFormSchema = z.object({
  serial_number: z.string().min(1, 'Le numéro de série est requis'),
  imei: z.string().optional(),
  mac_address: z.string().optional(),
  barcode: z.string().optional(),
  qr_code: z.string().optional(),
  status: z.enum(['manufactured', 'in_stock', 'reserved', 'sold', 'shipped', 'delivered', 'returned', 'refurbished', 'warranty_repair', 'damaged', 'scrapped']).default('in_stock'),
  warehouse_id: z.string().optional(),
  bin_location: z.string().optional(),
  current_location: z.string().optional(),
  manufacturing_date: z.string().optional(),
  manufacturing_location: z.string().optional(),
  batch_number: z.string().optional(),
  warranty_start_date: z.string().optional(),
  warranty_end_date: z.string().optional(),
  warranty_duration_months: z.number().optional(),
  warranty_type: z.string().optional(),
  notes: z.string().optional(),
});

type SerialFormValues = z.infer<typeof serialFormSchema>;

interface SerialNumberFormProps {
  serialNumberId?: string;
  physicalProductId: string;
  variantId?: string;
  onSuccess: () => void;
}

export function SerialNumberForm({ serialNumberId, physicalProductId, variantId, onSuccess }: SerialNumberFormProps) {
  const { data: existingSerial } = useSerialNumber(serialNumberId || '');
  const createSerial = useCreateSerialNumber();
  const updateSerial = useUpdateSerialNumber();

  const form = useForm<SerialFormValues>({
    resolver: zodResolver(serialFormSchema),
    defaultValues: {
      status: 'in_stock',
    },
  });

  useEffect(() => {
    if (existingSerial) {
      form.reset({
        serial_number: existingSerial.serial_number,
        imei: existingSerial.imei || '',
        mac_address: existingSerial.mac_address || '',
        barcode: existingSerial.barcode || '',
        qr_code: existingSerial.qr_code || '',
        status: existingSerial.status,
        warehouse_id: existingSerial.warehouse_id || '',
        bin_location: existingSerial.bin_location || '',
        current_location: existingSerial.current_location || '',
        manufacturing_date: existingSerial.manufacturing_date || '',
        manufacturing_location: existingSerial.manufacturing_location || '',
        batch_number: existingSerial.batch_number || '',
        warranty_start_date: existingSerial.warranty_start_date || '',
        warranty_end_date: existingSerial.warranty_end_date || '',
        warranty_duration_months: existingSerial.warranty_duration_months || undefined,
        warranty_type: existingSerial.warranty_type || '',
        notes: existingSerial.notes || '',
      });
    }
  }, [existingSerial, form]);

  const onSubmit = async (values: SerialFormValues) => {
    try {
      const serialData = {
        physical_product_id: physicalProductId,
        variant_id: variantId || null,
        serial_number: values.serial_number,
        imei: values.imei || null,
        mac_address: values.mac_address || null,
        barcode: values.barcode || null,
        qr_code: values.qr_code || null,
        status: values.status,
        warehouse_id: values.warehouse_id || null,
        bin_location: values.bin_location || null,
        current_location: values.current_location || null,
        manufacturing_date: values.manufacturing_date || null,
        manufacturing_location: values.manufacturing_location || null,
        batch_number: values.batch_number || null,
        warranty_start_date: values.warranty_start_date || null,
        warranty_end_date: values.warranty_end_date || null,
        warranty_duration_months: values.warranty_duration_months || null,
        warranty_type: values.warranty_type || null,
        notes: values.notes || null,
      };

      if (serialNumberId) {
        await updateSerial.mutateAsync({ serialNumberId, updates: serialData as any });
      } else {
        await createSerial.mutateAsync(serialData as any);
      }

      onSuccess();
    } catch (error) {
      logger.error('Error saving serial number', { error });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Série *</FormLabel>
                <FormControl>
                  <Input placeholder="SN-123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manufactured">Fabriqué</SelectItem>
                    <SelectItem value="in_stock">En Stock</SelectItem>
                    <SelectItem value="reserved">Réservé</SelectItem>
                    <SelectItem value="sold">Vendu</SelectItem>
                    <SelectItem value="shipped">Expédié</SelectItem>
                    <SelectItem value="delivered">Livré</SelectItem>
                    <SelectItem value="returned">Retourné</SelectItem>
                    <SelectItem value="refurbished">Reconditionné</SelectItem>
                    <SelectItem value="warranty_repair">Réparation Garantie</SelectItem>
                    <SelectItem value="damaged">Endommagé</SelectItem>
                    <SelectItem value="scrapped">Mis au Rebut</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imei"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IMEI</FormLabel>
                <FormControl>
                  <Input placeholder="IMEI pour appareils mobiles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mac_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse MAC</FormLabel>
                <FormControl>
                  <Input placeholder="AA:BB:CC:DD:EE:FF" {...field} />
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
            name="warranty_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Début Garantie</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warranty_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fin Garantie</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warranty_duration_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée Garantie (mois)</FormLabel>
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
          <Button type="submit" disabled={createSerial.isPending || updateSerial.isPending}>
            {serialNumberId ? 'Mettre à jour' : 'Créer le Numéro de Série'}
          </Button>
        </div>
      </form>
    </Form>
  );
}



