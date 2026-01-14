/**
 * Page de Gestion des Dashboards Analytics Personnalisables
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour créer, éditer et gérer les dashboards analytics personnalisables
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Settings,
  Share2,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Copy,
  Star,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  useAdvancedDashboards,
  useCreateAdvancedDashboard,
  useAnalyticsAlerts,
  useAnalyticsGoals,
  useCreateAnalyticsAlert,
  useCreateAnalyticsGoal,
  type AdvancedAnalyticsDashboard,
  type AnalyticsAlert,
  type AnalyticsGoal,
} from '@/hooks/analytics/useAdvancedAnalytics';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AnalyticsDashboardsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const { user } = useAuth();
  const { data: dashboards = [], isLoading: dashboardsLoading } = useAdvancedDashboards(store?.id);
  const { data: alerts = [] } = useAnalyticsAlerts(store?.id);
  const { data: goals = [] } = useAnalyticsGoals(store?.id);
  const createDashboard = useCreateAdvancedDashboard();
  const createAlert = useCreateAnalyticsAlert();
  const createGoal = useCreateAnalyticsGoal();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
  const [deletingDashboardId, setDeletingDashboardId] = useState<string | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<AdvancedAnalyticsDashboard>>({
    name: '',
    description: '',
    date_range_type: 'last_7_days',
    auto_refresh: true,
    refresh_interval: 60,
    is_active: true,
    is_default: false,
    is_shared: false,
    layout: {},
    widgets: [],
  });

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Filtered dashboards
  const filteredDashboards = useMemo(() => {
    if (!searchQuery) return dashboards;
    const query = searchQuery.toLowerCase();
    return dashboards.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
    );
  }, [dashboards, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: dashboards.length,
      active: dashboards.filter((d) => d.is_active).length,
      shared: dashboards.filter((d) => d.is_shared).length,
      default: dashboards.filter((d) => d.is_default).length,
    };
  }, [dashboards]);

  // Handlers
  const handleCreateDashboard = async () => {
    if (!store?.id || !user?.id) {
      toast({
        title: 'Erreur',
        description: 'Store ou utilisateur non trouvé',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createDashboard.mutateAsync({
        ...formData,
        store_id: store.id,
        user_id: user.id,
      });
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        date_range_type: 'last_7_days',
        auto_refresh: true,
        refresh_interval: 60,
        is_active: true,
        is_default: false,
        is_shared: false,
        layout: {},
        widgets: [],
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer le dashboard',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      const { error } = await supabase
        .from('advanced_analytics_dashboards')
        .delete()
        .eq('id', dashboardId);

      if (error) throw error;

      setDeletingDashboardId(null);
      toast({
        title: '✅ Dashboard supprimé',
        description: 'Le dashboard a été supprimé avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le dashboard',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (dashboardId: string) => {
    try {
      // Désactiver tous les autres dashboards par défaut
      await supabase
        .from('advanced_analytics_dashboards')
        .update({ is_default: false })
        .eq('store_id', store?.id)
        .neq('id', dashboardId);

      // Activer celui-ci comme défaut
      await supabase
        .from('advanced_analytics_dashboards')
        .update({ is_default: true })
        .eq('id', dashboardId);

      toast({
        title: '✅ Dashboard par défaut',
        description: 'Le dashboard a été défini comme défaut',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de définir le dashboard par défaut',
        variant: 'destructive',
      });
    }
  };

  if (storeLoading || dashboardsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Dashboards Analytics Personnalisables
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Créez et gérez vos dashboards analytics personnalisés avec widgets configurables
                </p>
              </div>
              <Button onSelect={() => setIsCreateDialogOpen(true)} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Dashboard
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Actifs</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Partagés</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.shared}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Par Défaut</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.default}</div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un dashboard..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dashboards List */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboards ({filteredDashboards.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredDashboards.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'Aucun dashboard ne correspond à votre recherche' : 'Aucun dashboard créé'}
                    </p>
                    {!searchQuery && (
                      <Button onSelect={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer votre premier dashboard
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Période</TableHead>
                          <TableHead>Widgets</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDashboards.map((dashboard) => (
                          <TableRow key={dashboard.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{dashboard.name}</div>
                                {dashboard.is_default && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                )}
                                {dashboard.is_shared && (
                                  <Share2 className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {dashboard.description || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{dashboard.date_range_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {(dashboard.widgets || []).length} widget{(dashboard.widgets || []).length > 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {dashboard.is_active ? (
                                <Badge variant="default" className="bg-green-600">Actif</Badge>
                              ) : (
                                <Badge variant="secondary">Inactif</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Select>
                                <SelectTrigger
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </SelectTrigger>
                                <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                  <SelectItem value="edit" onSelect onSelect={() => navigate(`/dashboard/analytics/${dashboard.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir
                                  </SelectItem>
                                  {!dashboard.is_default && (
                                    <SelectItem value="delete" onSelect onSelect={() => handleSetDefault(dashboard.id)}>
                                      <Star className="h-4 w-4 mr-2" />
                                      Définir par défaut
                                    </SelectItem>
                                  )}
                                  <SelectItem value="copy" onSelect onSelect={() => setEditingDashboardId(dashboard.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Éditer
                                  </SelectItem>
                                  <SelectItem value="view" onSelect
                                    onSelect={() => setDeletingDashboardId(dashboard.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateDialogOpen || !!editingDashboardId} onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingDashboardId(null);
                setFormData({
                  name: '',
                  description: '',
                  date_range_type: 'last_7_days',
                  auto_refresh: true,
                  refresh_interval: 60,
                  is_active: true,
                  is_default: false,
                  is_shared: false,
                  layout: {},
                  widgets: [],
                });
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDashboardId ? 'Éditer le Dashboard' : 'Créer un Nouveau Dashboard'}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez votre dashboard analytics personnalisé
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du Dashboard *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Dashboard Ventes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description du dashboard"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_range_type">Période par Défaut</Label>
                      <Select
                        value={formData.date_range_type}
                        onValueChange={(value: string) => setFormData({ ...formData, date_range_type: value })}
                      >
                        <SelectTrigger id="date_range_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="yesterday">Hier</SelectItem>
                          <SelectItem value="last_7_days">7 derniers jours</SelectItem>
                          <SelectItem value="last_30_days">30 derniers jours</SelectItem>
                          <SelectItem value="last_90_days">90 derniers jours</SelectItem>
                          <SelectItem value="this_month">Ce mois</SelectItem>
                          <SelectItem value="last_month">Mois dernier</SelectItem>
                          <SelectItem value="this_year">Cette année</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refresh_interval">Intervalle de Rafraîchissement (s)</Label>
                      <Input
                        id="refresh_interval"
                        type="number"
                        value={formData.refresh_interval}
                        onChange={(e) => setFormData({ ...formData, refresh_interval: parseInt(e.target.value) || 60 })}
                        min={10}
                        max={3600}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_refresh"
                      checked={formData.auto_refresh}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_refresh: checked })}
                    />
                    <Label htmlFor="auto_refresh">Rafraîchissement automatique</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Actif</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                    <Label htmlFor="is_default">Dashboard par défaut</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_shared"
                      checked={formData.is_shared}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
                    />
                    <Label htmlFor="is_shared">Partagé</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onSelect={() => {
                    setIsCreateDialogOpen(false);
                    setEditingDashboardId(null);
                  }}>
                    Annuler
                  </Button>
                  <Button onSelect={handleCreateDashboard} disabled={!formData.name || createDashboard.isPending}>
                    {editingDashboardId ? 'Sauvegarder' : 'Créer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deletingDashboardId} onOpenChange={(open) => !open && setDeletingDashboardId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce dashboard ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le dashboard sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onSelect={() => deletingDashboardId && handleDeleteDashboard(deletingDashboardId)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







