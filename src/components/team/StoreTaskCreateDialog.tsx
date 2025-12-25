/**
 * Store Task Create Dialog Component
 * Date: 2 Février 2025
 * 
 * Dialog pour créer une nouvelle tâche
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStoreTaskCreate } from '@/hooks/useStoreTasks';
import { useStore } from '@/hooks/useStore';
import { useStoreMembers } from '@/hooks/useStoreMembers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre est trop long'),
  description: z.string().optional(),
  category: z.enum(['product', 'order', 'customer', 'marketing', 'inventory', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface StoreTaskCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'product' as const, label: 'Produit' },
  { value: 'order' as const, label: 'Commande' },
  { value: 'customer' as const, label: 'Client' },
  { value: 'marketing' as const, label: 'Marketing' },
  { value: 'inventory' as const, label: 'Inventaire' },
  { value: 'other' as const, label: 'Autre' },
];

const PRIORITY_OPTIONS = [
  { value: 'low' as const, label: 'Basse' },
  { value: 'medium' as const, label: 'Moyenne' },
  { value: 'high' as const, label: 'Haute' },
  { value: 'urgent' as const, label: 'Urgente' },
];

export const StoreTaskCreateDialog = ({ open, onClose }: StoreTaskCreateDialogProps) => {
  const { store } = useStore();
  const { data: members } = useStoreMembers(store?.id || null);
  const createTask = useStoreTaskCreate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMembers = members?.filter((m) => m.status === 'active') || [];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      assigned_to: [],
      due_date: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: TaskFormValues) => {
    if (!store) return;

    setIsSubmitting(true);
    try {
      await createTask.mutateAsync({
        storeId: store.id,
        taskData: {
          title: values.title,
          description: values.description || undefined,
          category: values.category,
          priority: values.priority,
          assigned_to: values.assigned_to && values.assigned_to.length > 0 ? values.assigned_to : undefined,
          due_date: values.due_date || undefined,
          tags: values.tags && values.tags.length > 0 ? values.tags : undefined,
        },
      });
      form.reset();
      onClose();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Créer une tâche
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle tâche et assignez-la aux membres de votre équipe.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Créer un nouveau produit" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez la tâche en détail..."
                      {...field}
                      disabled={isSubmitting}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une priorité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'échéance</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isSubmitting}
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    />
                  </FormControl>
                  <FormDescription>Optionnel - Date limite pour terminer la tâche</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {activeMembers.length > 0 && (
              <FormField
                control={form.control}
                name="assigned_to"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Assigner à</FormLabel>
                      <FormDescription>
                        Sélectionnez les membres qui seront assignés à cette tâche
                      </FormDescription>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                      {activeMembers.map((member) => (
                        <FormField
                          key={member.id}
                          control={form.control}
                          name="assigned_to"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={member.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(member.user_id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), member.user_id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== member.user_id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {member.user?.email || 'Membre'}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Création...' : 'Créer la tâche'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

