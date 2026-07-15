/**
 * Store Member Invite Dialog Component
 * Date: 2 Février 2025
 *
 * Dialog pour inviter un nouveau membre à rejoindre l'équipe
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStoreMemberInvite } from '@/hooks/useStoreMembers';
import { useStore } from '@/hooks/useStore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, UserPlus } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z
    .union([z.enum(['manager', 'staff', 'support', 'viewer']), z.literal('')])
    .transform(v => (v === '' ? 'staff' : v)) as z.ZodType<
    'manager' | 'staff' | 'support' | 'viewer'
  >,
  message: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface StoreMemberInviteDialogProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  {
    value: 'manager' as const,
    label: 'Gestionnaire',
    description: 'Accès complet sauf suppression',
  },
  { value: 'staff' as const, label: 'Employé', description: 'Gestion produits et commandes' },
  { value: 'support' as const, label: 'Support', description: 'Commandes et clients uniquement' },
  { value: 'viewer' as const, label: 'Observateur', description: 'Lecture seule' },
];

export const StoreMemberInviteDialog = ({ open, onClose }: StoreMemberInviteDialogProps) => {
  const { store } = useStore();
  const inviteMember = useStoreMemberInvite();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'staff',
      message: '',
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      onClose();
    } else {
      onClose(); // This shouldn't happen via onOpenChange normally, but just in case
    }
  };

  const onSubmit = async (values: InviteFormValues) => {
    if (!store) return;

    setIsSubmitting(true);
    try {
      await inviteMember.mutateAsync({
        storeId: store.id,
        inviteData: {
          email: values.email,
          role: values.role || 'staff',
          message: values.message || undefined,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un membre
          </DialogTitle>
          <DialogDescription>
            Invitez un utilisateur à rejoindre votre équipe. Il recevra un email d'invitation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="exemple@email.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    L'utilisateur doit déjà avoir un compte sur la plateforme
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || 'staff'}
                    value={field.value || 'staff'}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          </div>
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message personnalisé (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez un message personnalisé à l'invitation..."
                      {...field}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? (
                  'Envoi...'
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
