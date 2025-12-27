/**
 * Page de Gestion des Cohorts de Cours
 * Date: 1 Février 2025
 * 
 * Interface complète pour gérer les cohorts de cours :
 * - Liste des cohorts
 * - Création et édition
 * - Gestion des inscriptions
 * - Analytics
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  UserCheck,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import {
  useStoreCohorts,
  useCreateCohort,
  useUpdateCohort,
  useDeleteCohort,
  type CourseCohort,
} from '@/hooks/courses/useAdvancedCohorts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CohortsManagementPage() {
  const { courseId } = useParams<{ courseId?: string }>();
  const { store } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<CourseCohort | null>(null);

  const { data: cohorts, isLoading } = useStoreCohorts(store?.id || '');
  const createCohort = useCreateCohort();
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();

  // Filtrer par cours si courseId est fourni
  const filteredCohorts = courseId
    ? cohorts?.filter((c) => c.course_id === courseId)
    : cohorts;

  const handleCreateCohort = async (formData: Partial<CourseCohort>) => {
    if (!store?.id) return;

    try {
      await createCohort.mutateAsync({
        ...formData,
        store_id: store.id,
      } as CourseCohort);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    const  variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      open: 'default',
      full: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };

    const  labels: Record<string, string> = {
      draft: 'Brouillon',
      open: 'Inscriptions ouvertes',
      full: 'Complet',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Users className="h-8 w-8" />
                  Gestion des Cohorts
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérez les cohorts (groupes d'étudiants) pour vos cours
                </p>
              </div>
              <div className="flex gap-2">
                {courseId && (
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au cours
                  </Button>
                )}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau Cohort
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer un Nouveau Cohort</DialogTitle>
                      <DialogDescription>
                        Créez un nouveau groupe d'étudiants pour un cours
                      </DialogDescription>
                    </DialogHeader>
                    <CreateCohortForm
                      courseId={courseId}
                      onSubmit={handleCreateCohort}
                      onCancel={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredCohorts?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En cours</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredCohorts?.filter((c) => c.status === 'in_progress').length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inscriptions ouvertes</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredCohorts?.filter((c) => c.status === 'open').length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredCohorts?.reduce((sum, c) => sum + c.current_students, 0) || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cohorts List */}
            {filteredCohorts && filteredCohorts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Cohorts</CardTitle>
                  <CardDescription>Tous vos cohorts de cours</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cours</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Étudiants</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCohorts.map((cohort) => (
                        <TableRow key={cohort.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {cohort.products?.image_url && (
                                <img
                                  src={cohort.products.image_url}
                                  alt={cohort.products.name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{cohort.products?.name || 'Cours'}</p>
                                <p className="text-xs text-muted-foreground">
                                  #{cohort.cohort_number || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{cohort.cohort_name}</p>
                            {cohort.cohort_description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {cohort.cohort_description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>Début: {format(new Date(cohort.start_date), 'PP', { locale: fr })}</p>
                              {cohort.end_date && (
                                <p>Fin: {format(new Date(cohort.end_date), 'PP', { locale: fr })}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{cohort.current_students}</span>
                              {cohort.max_students && (
                                <span className="text-muted-foreground">/ {cohort.max_students}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(cohort.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/dashboard/cohorts/${cohort.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCohort(cohort)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer ce cohort ?')) {
                                    deleteCohort.mutate(cohort.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun cohort</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Créez votre premier cohort pour organiser vos étudiants en groupes
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un cohort
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Edit Cohort Dialog */}
            {selectedCohort && (
              <EditCohortDialog
                cohort={selectedCohort}
                onClose={() => setSelectedCohort(null)}
                onUpdate={updateCohort.mutateAsync}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function CreateCohortForm({
  courseId,
  onSubmit,
  onCancel,
}: {
  courseId?: string;
  onSubmit: (data: Partial<CourseCohort>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<CourseCohort>>({
    course_id: courseId || '',
    status: 'draft',
    is_public: true,
    allow_late_enrollment: false,
    auto_start: true,
    waitlist_enabled: false,
    waitlist_capacity: 0,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      {!courseId && (
        <div className="space-y-2">
          <Label htmlFor="course_id">Cours *</Label>
          <Input
            id="course_id"
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            placeholder="ID du cours"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cohort_name">Nom du cohort *</Label>
        <Input
          id="cohort_name"
          value={formData.cohort_name || ''}
          onChange={(e) => setFormData({ ...formData, cohort_name: e.target.value })}
          placeholder="Cohort 1 - Janvier 2025"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cohort_description">Description</Label>
        <Textarea
          id="cohort_description"
          value={formData.cohort_description || ''}
          onChange={(e) => setFormData({ ...formData, cohort_description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cohort_number">Numéro de cohort</Label>
          <Input
            id="cohort_number"
            type="number"
            value={formData.cohort_number || ''}
            onChange={(e) => setFormData({ ...formData, cohort_number: parseInt(e.target.value) || undefined })}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_students">Capacité maximale</Label>
          <Input
            id="max_students"
            type="number"
            value={formData.max_students || ''}
            onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || undefined })}
            placeholder="50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date de début *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Date de fin</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="enrollment_start_date">Début inscriptions</Label>
          <Input
            id="enrollment_start_date"
            type="date"
            value={formData.enrollment_start_date ? format(new Date(formData.enrollment_start_date), 'yyyy-MM-dd') : ''}
            onChange={(e) => setFormData({ ...formData, enrollment_start_date: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="enrollment_end_date">Fin inscriptions</Label>
          <Input
            id="enrollment_end_date"
            type="date"
            value={formData.enrollment_end_date ? format(new Date(formData.enrollment_end_date), 'yyyy-MM-dd') : ''}
            onChange={(e) => setFormData({ ...formData, enrollment_end_date: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="open">Inscriptions ouvertes</SelectItem>
            <SelectItem value="full">Complet</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_public">Public</Label>
        <Switch
          id="is_public"
          checked={formData.is_public}
          onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="allow_late_enrollment">Inscriptions tardives</Label>
        <Switch
          id="allow_late_enrollment"
          checked={formData.allow_late_enrollment}
          onCheckedChange={(checked) => setFormData({ ...formData, allow_late_enrollment: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="waitlist_enabled">Liste d'attente</Label>
        <Switch
          id="waitlist_enabled"
          checked={formData.waitlist_enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, waitlist_enabled: checked })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Créer</Button>
      </div>
    </form>
  );
}

function EditCohortDialog({
  cohort,
  onClose,
  onUpdate,
}: {
  cohort: CourseCohort;
  onClose: () => void;
  onUpdate: (data: Partial<CourseCohort> & { id: string }) => Promise<CourseCohort>;
}) {
  const [formData, setFormData] = useState(cohort);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate({ id: cohort.id, ...formData });
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={!!cohort} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le Cohort</DialogTitle>
          <DialogDescription>Modifiez les paramètres du cohort</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="open">Inscriptions ouvertes</SelectItem>
                <SelectItem value="full">Complet</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_public">Public</Label>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow_late_enrollment">Inscriptions tardives</Label>
            <Switch
              id="allow_late_enrollment"
              checked={formData.allow_late_enrollment}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_late_enrollment: checked })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}







