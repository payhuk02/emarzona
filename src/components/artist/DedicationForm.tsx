/**
 * Dedication Form Component
 * Date: 1 Février 2025
 * 
 * Formulaire pour créer une dédicace personnalisée
 */

import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2 } from 'lucide-react';

const dedicationFormSchema = z.object({
  dedication_text: z
    .string()
    .min(5, 'La dédicace doit contenir au moins 5 caractères')
    .max(500, 'La dédicace ne peut pas dépasser 500 caractères'),
  recipient_name: z.string().optional(),
  font_style: z.enum(['standard', 'elegant', 'casual', 'formal']).default('standard'),
  text_position: z.enum(['top', 'center', 'bottom']).default('center'),
  notes: z.string().optional(),
});

type DedicationFormValues = z.infer<typeof dedicationFormSchema>;

interface DedicationFormProps {
  artistProductId: string;
  productId: string;
  orderId?: string;
  onSubmit: (data: DedicationFormValues) => Promise<void>;
  onPreview?: (data: DedicationFormValues) => void;
  defaultValues?: Partial<DedicationFormValues>;
  className?: string;
}

export const DedicationForm = ({
  artistProductId,
  productId,
  orderId,
  onSubmit,
  onPreview,
  defaultValues,
  className,
}: DedicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<DedicationFormValues>({
    resolver: zodResolver(dedicationFormSchema),
    defaultValues: {
      dedication_text: '',
      recipient_name: '',
      font_style: 'standard',
      text_position: 'center',
      notes: '',
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: DedicationFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    const data = form.getValues();
    if (onPreview) {
      onPreview(data);
    }
    setShowPreview(true);
  };

  const currentData = form.watch();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Dédicace Personnalisée</CardTitle>
        <CardDescription>
          Ajoutez une dédicace personnalisée à votre commande
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Nom du destinataire (optionnel) */}
            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du destinataire (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Jean Dupont"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Le nom de la personne à qui la dédicace est destinée
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Texte de la dédicace */}
            <FormField
              control={form.control}
              name="dedication_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texte de la dédicace *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Pour Jean, avec toute mon affection..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 500 caractères
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Style de police */}
            <FormField
              control={form.control}
              name="font_style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style de police</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="elegant">Élégant</SelectItem>
                      <SelectItem value="casual">Décontracté</SelectItem>
                      <SelectItem value="formal">Formel</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choisissez le style de police pour la dédicace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Position du texte */}
            <FormField
              control={form.control}
              name="text_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position du texte</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="top">Haut</SelectItem>
                      <SelectItem value="center">Centre</SelectItem>
                      <SelectItem value="bottom">Bas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Position de la dédicace sur l'œuvre
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes additionnelles */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes additionnelles (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instructions spéciales pour l'artiste..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ajoutez des notes ou instructions pour l'artiste
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Confirmer la dédicace'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="mr-2 h-4 w-4" />
                Aperçu
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

