/**
 * Kit Assemblies Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des assemblages de kits
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKitAssemblies, useCreateKitAssembly, useUpdateAssemblyStatus, KitAssembly } from '@/hooks/physical/useProductKits';
import { useStore } from '@/hooks/useStore';
import { Package, Search, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const ASSEMBLY_STATUSES: { value: KitAssembly['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' },
];

export default function KitAssemblies() {
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: assemblies, isLoading } = useKitAssemblies(selectedKitId, {
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  });
  const updateStatus = useUpdateAssemblyStatus();

  const handleStatusUpdate = async (assemblyId: string, newStatus: KitAssembly['status']) => {
    const { data: { user } } = await supabase.auth.getUser();
    await updateStatus.mutateAsync({
      assemblyId,
      status: newStatus,
      userId: user?.id,
    });
  };

  const filteredAssemblies = assemblies?.filter(assembly =>
    assembly.assembly_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assembly.order as any)?.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assemblages de Kits</h2>
          <p className="text-muted-foreground">
            Suivez et gérez les assemblages de vos kits
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="ID du kit"
            value={selectedKitId}
            onChange={(e) => setSelectedKitId(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {!selectedKitId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Entrez l'ID d'un kit pour voir ses assemblages
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assemblages</CardTitle>
                <CardDescription>
                  {filteredAssemblies.length} assemblage{filteredAssemblies.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {ASSEMBLY_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Date programmée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date complétion</TableHead>
                    <TableHead>Qualité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssemblies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Aucun assemblage trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssemblies.map((assembly) => {
                      const status = ASSEMBLY_STATUSES.find(s => s.value === assembly.status);
                      return (
                        <TableRow key={assembly.id}>
                          <TableCell className="font-medium">{assembly.assembly_number}</TableCell>
                          <TableCell>
                            {(assembly.order as any)?.order_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {assembly.scheduled_date ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(assembly.scheduled_date), 'dd MMM yyyy', { locale: fr })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Non programmée</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={assembly.status}
                              onValueChange={(value: KitAssembly['status']) =>
                                handleStatusUpdate(assembly.id, value)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ASSEMBLY_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {assembly.completed_date ? (
                              format(new Date(assembly.completed_date), 'dd MMM yyyy', { locale: fr })
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assembly.quality_check_passed === null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : assembly.quality_check_passed ? (
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Échec</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Voir détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

