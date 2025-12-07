/**
 * Store Members List Component
 * Date: 2 Février 2025
 * 
 * Affiche la liste des membres d'équipe d'une boutique
 */

import { useState, useMemo, useCallback } from 'react';
import { useStoreMembers, useStoreMemberRemove, type StoreMember } from '@/hooks/useStoreMembers';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, UserPlus, MoreVertical, Trash2, Edit, Mail, Clock } from 'lucide-react';
import { StoreMemberInviteDialog } from './StoreMemberInviteDialog';
import { StoreMemberRoleSelector } from './StoreMemberRoleSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<StoreMember['role'], string> = {
  owner: 'Propriétaire',
  manager: 'Gestionnaire',
  staff: 'Employé',
  support: 'Support',
  viewer: 'Observateur',
};

const ROLE_COLORS: Record<StoreMember['role'], string> = {
  owner: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  staff: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  support: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  viewer: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const STATUS_LABELS: Record<StoreMember['status'], string> = {
  pending: 'En attente',
  active: 'Actif',
  inactive: 'Inactif',
  removed: 'Retiré',
};

export const StoreMembersList = () => {
  const { store } = useStore();
  const { data: members, isLoading, error } = useStoreMembers(store?.id || null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StoreMember | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<StoreMember | null>(null);
  const removeMember = useStoreMemberRemove();
  const { toast } = useToast();

  const handleEditRole = useCallback((member: StoreMember) => {
    setSelectedMember(member);
    setRoleDialogOpen(true);
  }, []);

  const handleRemove = useCallback((member: StoreMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  }, []);

  const confirmRemove = useCallback(async () => {
    if (!memberToRemove || !store) return;

    try {
      await removeMember.mutateAsync({
        storeId: store.id,
        memberId: memberToRemove.id,
      });
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }, [memberToRemove, store, removeMember]);

  // Tous les hooks doivent être appelés avant les early returns
  const activeMembers = useMemo(
    () => members?.filter((m) => m.status === 'active') || [],
    [members]
  );
  const pendingMembers = useMemo(
    () => members?.filter((m) => m.status === 'pending') || [],
    [members]
  );

  const getDisplayName = (member: StoreMember): string => {
    if (member.user?.user_metadata?.display_name) {
      return member.user.user_metadata.display_name;
    }
    return member.user?.email || 'Utilisateur inconnu';
  };

  const getInitials = (member: StoreMember): string => {
    const name = getDisplayName(member);
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!store) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune boutique sélectionnée
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Erreur lors du chargement des membres</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres de l'équipe
            </CardTitle>
            <CardDescription>
              {activeMembers.length} membre{activeMembers.length > 1 ? 's' : ''} actif
              {pendingMembers.length > 0 && `, ${pendingMembers.length} invitation${pendingMembers.length > 1 ? 's' : ''} en attente`}
            </CardDescription>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter un membre
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {members && members.length > 0 ? (
            <>
              {/* Membres actifs */}
              {activeMembers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Membres actifs</h3>
                  {activeMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={member.user?.user_metadata?.avatar_url}
                            alt={getDisplayName(member)}
                          />
                          <AvatarFallback>{getInitials(member)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{getDisplayName(member)}</p>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', ROLE_COLORS[member.role])}
                            >
                              {ROLE_LABELS[member.role]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.user?.email}
                          </p>
                          {member.joined_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour ${member.user?.email || member.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRole(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier le rôle
                          </DropdownMenuItem>
                          {member.role !== 'owner' && (
                            <DropdownMenuItem
                              onClick={() => handleRemove(member)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Retirer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}

              {/* Invitations en attente */}
              {pendingMembers.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Invitations en attente
                  </h3>
                  {pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            <Mail className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{member.user?.email}</p>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_LABELS[member.status]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', ROLE_COLORS[member.role])}
                            >
                              {ROLE_LABELS[member.role]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Invité le {new Date(member.invited_at).toLocaleDateString('fr-FR')}
                            {member.invitation_expires_at && (
                              <> • Expire le {new Date(member.invitation_expires_at).toLocaleDateString('fr-FR')}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour ${member.user?.email || member.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRole(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier le rôle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemove(member)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Annuler l'invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Aucun membre</p>
              <p className="text-sm mb-4">Commencez par inviter des membres à rejoindre votre équipe</p>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter un membre
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <StoreMemberInviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
      />

      {selectedMember && (
        <StoreMemberRoleSelector
          open={roleDialogOpen}
          onClose={() => {
            setRoleDialogOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
        />
      )}

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer {memberToRemove?.user?.email || 'ce membre'} de
              l'équipe ? Cette action peut être annulée plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={removeMember.isPending}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending ? 'Suppression...' : 'Retirer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

