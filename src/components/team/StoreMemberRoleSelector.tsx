/**
 * Store Member Role Selector Component
 * Date: 2 Février 2025
 * 
 * Dialog pour modifier le rôle d'un membre
 */

import { useState } from 'react';
import { useStoreMemberUpdate, type StoreMember } from '@/hooks/useStoreMembers';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';

interface StoreMemberRoleSelectorProps {
  open: boolean;
  onClose: () => void;
  member: StoreMember;
}

const ROLE_OPTIONS = [
  { value: 'manager' as const, label: 'Gestionnaire', description: 'Accès complet sauf suppression' },
  { value: 'staff' as const, label: 'Employé', description: 'Gestion produits et commandes' },
  { value: 'support' as const, label: 'Support', description: 'Commandes et clients uniquement' },
  { value: 'viewer' as const, label: 'Observateur', description: 'Lecture seule' },
];

export const StoreMemberRoleSelector = ({
  open,
  onClose,
  member,
}: StoreMemberRoleSelectorProps) => {
  const { store } = useStore();
  const updateMember = useStoreMemberUpdate();
  const [selectedRole, setSelectedRole] = useState<StoreMember['role']>(member.role);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!store || selectedRole === member.role) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMember.mutateAsync({
        storeId: store.id,
        memberId: member.id,
        updateData: {
          role: selectedRole,
        },
      });
      onClose();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ne pas permettre de modifier le rôle du propriétaire
  if (member.role === 'owner') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rôle du membre
            </DialogTitle>
            <DialogDescription>
              Le rôle de propriétaire ne peut pas être modifié.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Modifier le rôle
          </DialogTitle>
          <DialogDescription>
            Modifiez le rôle de {member.user?.email || 'ce membre'} dans votre équipe.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as StoreMember['role'])}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedRole === member.role}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

