/**
 * Composant pour prévisualiser les membres d'un segment
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Users, 
  Search, 
  Loader2,
  Info,
  Mail,
} from 'lucide-react';
import { useSegmentMembers, useCalculateSegmentMembers, useUpdateSegmentMemberCount } from '@/hooks/email/useEmailSegments';
import type { EmailSegment } from '@/lib/email/email-segment-service';
import { cn } from '@/lib/utils';

interface SegmentPreviewProps {
  segment: EmailSegment;
  onClose?: () => void;
}

export const SegmentPreview = ({ segment, onClose }: SegmentPreviewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { data: members, isLoading, refetch } = useSegmentMembers(
    segment.id,
    segment.type === 'dynamic'
  );
  
  const calculateMembers = useCalculateSegmentMembers();
  const updateMemberCount = useUpdateSegmentMemberCount();

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      await calculateMembers.mutateAsync(segment.id);
      await updateMemberCount.mutateAsync(segment.id);
      refetch();
    } finally {
      setIsCalculating(false);
    }
  };

  // Filtrer les membres selon la recherche
  const filteredMembers = members?.filter((member) =>
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const displayMembers = searchQuery ? filteredMembers : members || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Prévisualisation : {segment.name}
            </CardTitle>
            <CardDescription className="mt-2">
              {segment.type === 'dynamic'
                ? 'Membres calculés automatiquement selon les critères du segment'
                : 'Liste des membres du segment statique'}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer l'aperçu du segment">
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Membres</p>
                  <p className="text-2xl font-bold">{segment.member_count || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'mt-1',
                      segment.type === 'dynamic'
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    )}
                  >
                    {segment.type === 'dynamic' ? 'Dynamique' : 'Statique'}
                  </Badge>
                </div>
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          {segment.last_calculated_at && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {new Date(segment.last_calculated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        {segment.type === 'dynamic' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCalculate}
              disabled={isCalculating || calculateMembers.isPending}
            >
              {(isCalculating || calculateMembers.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalculer les membres
                </>
              )}
            </Button>
            <Alert className="flex-1">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Les segments dynamiques sont recalculés automatiquement. Utilisez ce bouton pour forcer un recalcul.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Recherche */}
        {displayMembers.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre par email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Liste des membres */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement des membres...</span>
          </div>
        ) : displayMembers.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchQuery
                ? 'Aucun membre trouvé pour cette recherche'
                : segment.type === 'dynamic'
                ? 'Aucun membre trouvé pour ce segment. Cliquez sur "Recalculer les membres" pour mettre à jour.'
                : 'Aucun membre dans ce segment. Ajoutez des membres manuellement.'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Effacer la recherche
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-muted/50">
              <p className="text-sm font-medium">
                {displayMembers.length} membre{displayMembers.length > 1 ? 's' : ''}
                {searchQuery && ` trouvé${displayMembers.length > 1 ? 's' : ''} sur ${members?.length || 0}`}
              </p>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Calculé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMembers.map((member, index) => (
                    <TableRow key={member.user_id || index}>
                      <TableCell className="font-medium">{member.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.calculated_at
                          ? new Date(member.calculated_at).toLocaleString('fr-FR')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {displayMembers.length >= 100 && (
              <div className="p-4 border-t bg-muted/50">
                <p className="text-xs text-muted-foreground text-center">
                  Affichage des 100 premiers membres. Utilisez la recherche pour trouver des membres spécifiques.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

