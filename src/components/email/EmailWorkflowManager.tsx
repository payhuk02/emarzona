/**
 * Composant pour lister et gérer les workflows email
 * Date: 1er Février 2025
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Plus, MoreHorizontal, Edit, Trash2, Play, Pause, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  useEmailWorkflows,
  useDeleteEmailWorkflow,
  useUpdateEmailWorkflow,
} from '@/hooks/email/useEmailWorkflows';
import type {
  EmailWorkflow,
  WorkflowStatus,
  WorkflowTriggerType,
} from '@/lib/email/email-workflow-service';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkflowDashboard } from './WorkflowDashboard';

interface EmailWorkflowManagerProps {
  storeId: string;
  onCreateWorkflow?: () => void;
  onEditWorkflow?: (workflow: EmailWorkflow) => void;
}

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  active: 'Actif',
  paused: 'En pause',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<WorkflowStatus, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  archived: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  event: 'Événement',
  time: 'Temps',
  condition: 'Condition',
};

export const EmailWorkflowManager = ({
  storeId,
  onCreateWorkflow,
  onEditWorkflow,
}: EmailWorkflowManagerProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');
  const [triggerFilter, setTriggerFilter] = useState<WorkflowTriggerType | 'all'>('all');
  const [showDashboard, setShowDashboard] = useState(true);

  const { data: workflows, isLoading, refetch } = useEmailWorkflows(storeId);
  const deleteWorkflow = useDeleteEmailWorkflow();
  const updateWorkflow = useUpdateEmailWorkflow();

  const filteredWorkflows = useMemo(() => {
    if (!workflows) return [];

    return workflows.filter(workflow => {
      const matchesSearch =
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
      const matchesTrigger = triggerFilter === 'all' || workflow.trigger_type === triggerFilter;

      return matchesSearch && matchesStatus && matchesTrigger;
    });
  }, [workflows, searchQuery, statusFilter, triggerFilter]);

  const handleDelete = async () => {
    if (!workflowToDelete) return;
    await deleteWorkflow.mutateAsync({
      workflowId: workflowToDelete,
      storeId,
    });
    setDeleteDialogOpen(false);
    setWorkflowToDelete(null);
    refetch();
  };

  const handleToggleStatus = async (workflow: EmailWorkflow) => {
    const newStatus: WorkflowStatus = workflow.status === 'active' ? 'paused' : 'active';
    await updateWorkflow.mutateAsync({
      workflowId: workflow.id,
      payload: { status: newStatus, is_active: newStatus === 'active' },
    });
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement des workflows...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Dashboard */}
      {showDashboard && <WorkflowDashboard storeId={storeId} />}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Workflows Email</CardTitle>
              <CardDescription>
                Gérez vos workflows automatisés ({filteredWorkflows.length} /{' '}
                {workflows?.length || 0})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDashboard(!showDashboard)}>
                {showDashboard ? 'Masquer' : 'Afficher'} Dashboard
              </Button>
              <Button onClick={onCreateWorkflow}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau workflow
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un workflow..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={value => setStatusFilter(value as WorkflowStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={triggerFilter}
              onValueChange={value => setTriggerFilter(value as WorkflowTriggerType | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Déclencheur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les déclencheurs</SelectItem>
                <SelectItem value="event">Événement</SelectItem>
                <SelectItem value="time">Temps</SelectItem>
                <SelectItem value="condition">Condition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!workflows || workflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun workflow pour le moment</p>
              <Button onClick={onCreateWorkflow}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier workflow
              </Button>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Aucun workflow ne correspond aux filtres</p>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type de déclencheur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Exécutions</TableHead>
                  <TableHead>Dernière exécution</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map(workflow => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>
                      {TRIGGER_TYPE_LABELS[workflow.trigger_type] || workflow.trigger_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(STATUS_COLORS[workflow.status])}>
                        {STATUS_LABELS[workflow.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{workflow.execution_count}</span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.success_count} réussies, {workflow.error_count} erreurs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {workflow.last_executed_at
                        ? format(new Date(workflow.last_executed_at), 'dd MMM yyyy HH:mm', {
                            locale: fr,
                          })
                        : 'Jamais'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditWorkflow?.(workflow)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(workflow)}>
                            {workflow.status === 'active' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" /> Mettre en pause
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" /> Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setWorkflowToDelete(workflow.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement ce workflow et
              toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
