/**
 * Page de Détail d'un Cohort
 * Date: 1 Février 2025
 * 
 * Interface complète pour gérer un cohort :
 * - Informations du cohort
 * - Gestion des inscriptions
 * - Analytics et progression
 * - Snapshots de progression
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  UserCheck,
  Award,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCohort,
  useCohortEnrollments,
  useCohortAnalytics,
  useCalculateCohortAnalytics,
  useUpdateEnrollmentStatus,
  type CohortEnrollment,
} from '@/hooks/courses/useAdvancedCohorts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function CohortDetailPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEnrollment, setSelectedEnrollment] = useState<CohortEnrollment | null>(null);

  const { data: cohort, isLoading: cohortLoading } = useCohort(cohortId || '');
  const { data: enrollments, isLoading: enrollmentsLoading } = useCohortEnrollments(cohortId || '');
  const { data: analytics, isLoading: analyticsLoading } = useCohortAnalytics(cohortId || '');
  const calculateAnalytics = useCalculateCohortAnalytics();
  const updateEnrollmentStatus = useUpdateEnrollmentStatus();

  const handleCalculateAnalytics = async () => {
    if (!cohortId) return;
    try {
      await calculateAnalytics.mutateAsync({ cohortId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateEnrollmentStatus = async (
    enrollmentId: string,
    status: CohortEnrollment['enrollment_status']
  ) => {
    try {
      await updateEnrollmentStatus.mutateAsync({ enrollmentId, status });
      setSelectedEnrollment(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (cohortLoading) {
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

  if (!cohort) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cohort introuvable</h3>
                <Button onClick={() => navigate('/dashboard/cohorts')}>Retour aux cohorts</Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const latestAnalytics = analytics?.[0];
  const enrollmentStats = {
    total: enrollments?.length || 0,
    active: enrollments?.filter((e) => e.enrollment_status === 'active').length || 0,
    completed: enrollments?.filter((e) => e.enrollment_status === 'completed').length || 0,
    dropped: enrollments?.filter((e) => e.enrollment_status === 'dropped').length || 0,
    pending: enrollments?.filter((e) => e.enrollment_status === 'pending').length || 0,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Users className="h-8 w-8" />
                  {cohort.cohort_name}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {cohort.cohort_description || 'Gestion du cohort'}
                </p>
              </div>
              <Button onClick={handleCalculateAnalytics} disabled={calculateAnalytics.isPending}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Calculer Analytics
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enrollmentStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {cohort.max_students ? `${cohort.current_students}/${cohort.max_students}` : 'Sans limite'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{enrollmentStats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminés</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{enrollmentStats.completed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progression Moyenne</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestAnalytics?.average_progress.toFixed(1) || '0'}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="enrollments">Inscriptions ({enrollmentStats.total})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Cours</p>
                        <p className="font-medium">{cohort.products?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Statut</p>
                        <Badge>{cohort.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date de début</p>
                        <p className="font-medium">
                          {format(new Date(cohort.start_date), 'PP', { locale: fr })}
                        </p>
                      </div>
                      {cohort.end_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Date de fin</p>
                          <p className="font-medium">
                            {format(new Date(cohort.end_date), 'PP', { locale: fr })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Public</p>
                        <p className="font-medium">{cohort.is_public ? 'Oui' : 'Non'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Inscriptions tardives</span>
                        <Badge variant={cohort.allow_late_enrollment ? 'default' : 'secondary'}>
                          {cohort.allow_late_enrollment ? 'Autorisées' : 'Non autorisées'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Démarrage automatique</span>
                        <Badge variant={cohort.auto_start ? 'default' : 'secondary'}>
                          {cohort.auto_start ? 'Activé' : 'Désactivé'}
                        </Badge>
                      </div>
                      {cohort.waitlist_enabled && (
                        <div>
                          <p className="text-sm text-muted-foreground">Liste d'attente</p>
                          <p className="font-medium">Capacité: {cohort.waitlist_capacity}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {latestAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics Récentes</CardTitle>
                      <CardDescription>
                        Dernière mise à jour: {format(new Date(latestAnalytics.analytics_date), 'PP', { locale: fr })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Taux de rétention</p>
                          <p className="text-2xl font-bold">
                            {latestAnalytics.retention_rate?.toFixed(1) || '0'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Taux de réussite</p>
                          <p className="text-2xl font-bold">
                            {latestAnalytics.pass_rate?.toFixed(1) || '0'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Note moyenne</p>
                          <p className="text-2xl font-bold">
                            {latestAnalytics.average_grade?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Temps moyen</p>
                          <p className="text-2xl font-bold">
                            {latestAnalytics.average_time_spent_minutes || 0} min
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="enrollments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inscriptions</CardTitle>
                    <CardDescription>Gérez les inscriptions au cohort</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {enrollmentsLoading ? (
                      <Skeleton className="h-32" />
                    ) : enrollments && enrollments.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Étudiant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Progression</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead>Inscrit le</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrollments.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {enrollment.student?.user_metadata?.full_name ||
                                      enrollment.student?.email ||
                                      'Étudiant'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {enrollment.student?.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    enrollment.enrollment_status === 'active'
                                      ? 'default'
                                      : enrollment.enrollment_status === 'completed'
                                      ? 'default'
                                      : enrollment.enrollment_status === 'dropped'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {enrollment.enrollment_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-secondary rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${enrollment.progress_percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {enrollment.progress_percentage.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {enrollment.final_grade ? (
                                  <span className="font-semibold">{enrollment.final_grade.toFixed(1)}/20</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {format(new Date(enrollment.enrolled_at), 'PP', { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEnrollment(enrollment)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Aucune inscription</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <CohortAnalyticsTab
                  cohortId={cohortId || ''}
                  analytics={analytics || []}
                  isLoading={analyticsLoading}
                />
              </TabsContent>
            </Tabs>

            {/* Enrollment Status Dialog */}
            {selectedEnrollment && (
              <EnrollmentStatusDialog
                enrollment={selectedEnrollment}
                onClose={() => setSelectedEnrollment(null)}
                onUpdate={handleUpdateEnrollmentStatus}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function CohortAnalyticsTab({
  cohortId,
  analytics,
  isLoading,
}: {
  cohortId: string;
  analytics: Array<{
    analytics_date: string;
    average_progress: number;
    active_enrollments: number;
    completed_enrollments: number;
    retention_rate?: number;
  }>;
  isLoading: boolean;
}) {
  const chartData = analytics
    .slice()
    .reverse()
    .map((a) => ({
      date: format(new Date(a.analytics_date), 'dd/MM', { locale: fr }),
      progression: a.average_progress,
      actifs: a.active_enrollments,
      terminés: a.completed_enrollments,
      rétention: a.retention_rate || 0,
    }));

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée analytics</h3>
          <p className="text-muted-foreground text-center">
            Les analytics seront disponibles après le calcul
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progression dans le temps</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="progression" stroke="#8884d8" name="Progression moyenne %" />
              <Line type="monotone" dataKey="rétention" stroke="#82ca9d" name="Taux de rétention %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inscriptions par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actifs" fill="#8884d8" name="Actifs" />
              <Bar dataKey="terminés" fill="#82ca9d" name="Terminés" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function EnrollmentStatusDialog({
  enrollment,
  onClose,
  onUpdate,
}: {
  enrollment: CohortEnrollment;
  onClose: () => void;
  onUpdate: (enrollmentId: string, status: CohortEnrollment['enrollment_status']) => void;
}) {
  return (
    <Dialog open={!!enrollment} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le statut de l'inscription</DialogTitle>
          <DialogDescription>
            Changez le statut de l'inscription de l'étudiant
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Étudiant</Label>
            <p className="font-medium">
              {enrollment.student?.user_metadata?.full_name || enrollment.student?.email}
            </p>
          </div>
          <div>
            <Label>Statut actuel</Label>
            <Badge>{enrollment.enrollment_status}</Badge>
          </div>
          <div className="space-y-2">
            <Label>Nouveau statut</Label>
            <Select
              defaultValue={enrollment.enrollment_status}
              onValueChange={(value) => onUpdate(enrollment.id, value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="dropped">Abandonné</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}







