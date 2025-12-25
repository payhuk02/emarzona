/**
 * Store Tasks List Component
 * Date: 2 Février 2025
 * 
 * Affiche la liste des tâches d'une boutique
 */

import { useState, useCallback } from 'react';
import { useStoreTasks, type StoreTask, type TaskFilters } from '@/hooks/useStoreTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { StoreTaskCreateDialog } from './StoreTaskCreateDialog';
import { StoreTaskCard } from './StoreTaskCard';
import { StoreTasksKanban } from './StoreTasksKanban';
import { StoreTaskCalendarExport } from './StoreTaskCalendarExport';

interface StoreTasksListProps {
  storeId: string;
}

const PRIORITY_LABELS: Record<StoreTask['priority'], string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const STATUS_LABELS: Record<StoreTask['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  review: 'En révision',
  completed: 'Terminée',
  cancelled: 'Annulée',
  on_hold: 'En pause',
};

export const StoreTasksList = ({ storeId }: StoreTasksListProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const { data: tasks, isLoading, error } = useStoreTasks(storeId, {
    ...filters,
    search: searchQuery || undefined,
  });

  const handleFilterChange = useCallback((key: keyof TaskFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Erreur lors du chargement des tâches</p>
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
              <CheckSquare className="h-5 w-5" />
              Tâches de l'équipe
            </CardTitle>
            <CardDescription>
              {tasks?.length || 0} tâche{tasks && tasks.length > 1 ? 's' : ''} au total
            </CardDescription>
          </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <StoreTaskCalendarExport storeId={storeId} />
              <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Créer une tâche
              </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-2 p-4 bg-muted/30 rounded-lg border">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Liste ou Kanban des tâches */}
          {viewMode === 'kanban' ? (
            <StoreTasksKanban storeId={storeId} filters={{ ...filters, search: searchQuery || undefined }} />
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <StoreTaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Aucune tâche</p>
              <p className="text-sm mb-4">
                {hasActiveFilters
                  ? 'Aucune tâche ne correspond aux filtres sélectionnés'
                  : 'Commencez par créer votre première tâche'}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une tâche
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <StoreTaskCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

