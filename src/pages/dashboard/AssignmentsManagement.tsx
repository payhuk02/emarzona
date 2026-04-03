/**
 * Page de Gestion Complète des Assignments
 * Date: 31 Janvier 2025
 *
 * Interface complète pour gérer les assignments/devoirs avec soumissions et notation
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Upload,
  Download,
  FileCheck,
  FileX,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  useCourseAssignments,
  useAssignmentSubmissions,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useGradeAssignment,
  type CourseAssignment,
  type AssignmentSubmission,
} from '@/hooks/courses/useAssignments';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { AssignmentGradingForm } from '@/components/courses/assignments/AssignmentGradingForm';

export default function AssignmentsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useCourseAssignments(selectedCourseId);
  const { data: submissions = [], isLoading: submissionsLoading } =
    useAssignmentSubmissions(selectedAssignmentId);
  const queryClient = useQueryClient();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const gradeAssignment = useGradeAssignment();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded' | 'returned'>(
    'all'
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    assignment_type: 'text' as const,
    points_possible: '100',
    grading_type: 'points' as const,
    due_date: '',
    allow_late_submission: true,
    late_penalty_percentage: '10',
    is_required: true,
    is_visible: true,
  });

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les cours disponibles
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['store-courses-for-assignments', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('store_id', store.id)
        .order('title', { ascending: true });

      if (error) {
        logger.error('Error fetching courses', { error, storeId: store.id });
        throw error;
      }

      return data || [];
    },
    enabled: !!store?.id,
  });

  // Filtrer les assignments
  const filteredAssignments = useMemo(() => {
    let  filtered= assignments;

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [assignments, searchQuery]);

  // Filtrer les soumissions
  const filteredSubmissions = useMemo(() => {
    let  filtered= submissions;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (statusFilter === 'pending') return s.status === 'submitted';
        if (statusFilter === 'graded') return s.status === 'graded';
        if (statusFilter === 'returned') return s.status === 'returned';
        return true;
      });
    }

    return filtered;
  }, [submissions, statusFilter]);

  // Statistiques
  const stats = useMemo(() => {
    const allSubmissions = submissions;
    return {
      total: assignments.length,
      totalSubmissions: allSubmissions.length,
      pending: allSubmissions.filter(s => s.status === 'submitted').length,
      graded: allSubmissions.filter(s => s.status === 'graded').length,
      returned: allSubmissions.filter(s => s.status === 'returned').length,
      averageGrade:
        allSubmissions.length > 0
          ? allSubmissions
              .filter(s => s.grade !== null && s.grade !== undefined)
              .reduce((sum, s) => sum + (s.grade || 0), 0) /
            allSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length
          : 0,
    };
  }, [assignments, submissions]);

  // Handlers
  const handleCreateAssignment = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      assignment_type: 'text',
      points_possible: '100',
      grading_type: 'points',
      due_date: '',
      allow_late_submission: true,
      late_penalty_percentage: '10',
      is_required: true,
      is_visible: true,
    });
    setEditingAssignmentId(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        assignment_type: assignment.assignment_type,
        points_possible: assignment.points_possible.toString(),
        grading_type: assignment.grading_type,
        due_date: assignment.due_date
          ? new Date(assignment.due_date).toISOString().slice(0, 16)
          : '',
        allow_late_submission: assignment.allow_late_submission,
        late_penalty_percentage: assignment.late_penalty_percentage.toString(),
        is_required: assignment.is_required,
        is_visible: assignment.is_visible,
      });
      setEditingAssignmentId(assignmentId);
      setIsCreateDialogOpen(true);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment.mutateAsync(assignmentId);
      setDeletingAssignmentId(null);
      toast({
        title: '✅ Assignment supprimé',
        description: 'Le devoir a été supprimé avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || "Impossible de supprimer l'assignment",
        variant: 'destructive',
      });
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedCourseId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un cours',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir le titre',
        variant: 'destructive',
      });
      return;
    }

    try {
      const assignmentData = {
        course_id: selectedCourseId,
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        assignment_type: formData.assignment_type,
        points_possible: parseInt(formData.points_possible) || 100,
        grading_type: formData.grading_type,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        allow_late_submission: formData.allow_late_submission,
        late_penalty_percentage: parseInt(formData.late_penalty_percentage) || 10,
        is_required: formData.is_required,
        is_visible: formData.is_visible,
      };

      if (editingAssignmentId) {
        await updateAssignment.mutateAsync({
          assignmentId: editingAssignmentId,
          updates: assignmentData,
        });
      } else {
        await createAssignment.mutateAsync(assignmentData);
      }

      setIsCreateDialogOpen(false);
      setEditingAssignmentId(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error saving assignment', { error, formData });
      // Les erreurs sont gérées par les hooks
    }
  };

  const handleViewSubmissions = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setViewingSubmissionsId(assignmentId);
  };

  const getStatusBadge = (status: string) => {
    const  badges: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        className?: string;
      }
    > = {
      draft: { label: 'Brouillon', variant: 'secondary' },
      submitted: { label: 'Soumis', variant: 'default', className: 'bg-blue-600' },
      graded: { label: 'Noté', variant: 'default', className: 'bg-green-600' },
      returned: { label: 'Retourné', variant: 'outline' },
      resubmitted: { label: 'Resoumis', variant: 'default', className: 'bg-purple-600' },
    };

    const badge = badges[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  if (storeLoading || coursesLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
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
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Assignments
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Créez et gérez les devoirs pour vos cours avec notation et feedback
                </p>
              </div>
              <Button
                onClick={handleCreateAssignment}
                className="shrink-0"
                disabled={!selectedCourseId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Assignment
              </Button>
            </div>

            {/* Sélection du cours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sélectionner un Cours</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-full sm:w-[400px]">
                    <SelectValue placeholder="Choisir un cours..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: { id: string; title: string }) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCourseId && (
              <>
                {/* Statistiques */}
                <div
                  ref={statsRef}
                  className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Soumissions</CardTitle>
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{stats.totalSubmissions}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">En Attente</CardTitle>
                      <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-orange-600">
                        {stats.pending}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Notés</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-green-600">
                        {stats.graded}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Moyenne</CardTitle>
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">
                        {stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : '-'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtres */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtrer & Rechercher
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un assignment..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des assignments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignments ({filteredAssignments.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredAssignments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {searchQuery
                            ? 'Aucun assignment ne correspond à votre recherche'
                            : 'Aucun assignment créé'}
                        </p>
                        {!searchQuery && (
                          <Button onClick={handleCreateAssignment}>
                            <Plus className="h-4 w-4 mr-2" />
                            Créer votre premier assignment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Assignment</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Points</TableHead>
                              <TableHead>Échéance</TableHead>
                              <TableHead>Soumissions</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAssignments.map(assignment => {
                              const assignmentSubmissions = submissions.filter(
                                s => s.assignment_id === assignment.id
                              );
                              return (
                                <TableRow key={assignment.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{assignment.title}</div>
                                      {assignment.description && (
                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                          {assignment.description}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{assignment.assignment_type}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-semibold">
                                      {assignment.points_possible} pts
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {assignment.due_date ? (
                                      <div className="text-sm">
                                        <div>
                                          {format(new Date(assignment.due_date), 'dd MMM yyyy', {
                                            locale: fr,
                                          })}
                                        </div>
                                        <div className="text-muted-foreground">
                                          {format(new Date(assignment.due_date), 'HH:mm', {
                                            locale: fr,
                                          })}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Aucune</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span>{assignmentSubmissions.length}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Select>
                                      <SelectTrigger>

                                          <MoreVertical className="h-4 w-4" />
                                        
</SelectTrigger>
                                      <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                        <SelectItem value="edit" onSelect={() => handleViewSubmissions(assignment.id)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          Voir soumissions ({assignmentSubmissions.length})
                                        </SelectItem>
                                        <SelectItem value="delete" onSelect={() => handleEditAssignment(assignment.id)}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Éditer
                                        </SelectItem>
                                        <SelectItem value="copy" onSelect={() => setDeletingAssignmentId(assignment.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Supprimer
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Dialog Création/Édition */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignmentId ? "Éditer l'Assignment" : 'Créer un Assignment'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAssignmentId
                      ? "Modifiez les informations de l'assignment"
                      : 'Créez un nouveau devoir pour votre cours'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Projet Final React"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de l'assignment..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Instructions détaillées pour les étudiants..."
                      rows={5}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignment_type">Type d'Assignment</Label>
                      <Select
                        value={formData.assignment_type}
                        onValueChange={v =>
                          setFormData({
                            ...formData,
                            assignment_type: v as 'file_upload' | 'text' | 'url' | 'code' | 'mixed',
                          })
                        }
                      >
                        <SelectTrigger id="assignment_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texte</SelectItem>
                          <SelectItem value="file_upload">Upload Fichiers</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="mixed">Mixte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="grading_type">Type de Notation</Label>
                      <Select
                        value={formData.grading_type}
                        onValueChange={v =>
                          setFormData({
                            ...formData,
                            grading_type: v as 'points' | 'percentage' | 'letter' | 'pass_fail',
                          })
                        }
                      >
                        <SelectTrigger id="grading_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="points">Points</SelectItem>
                          <SelectItem value="percentage">Pourcentage</SelectItem>
                          <SelectItem value="letter">Lettre (A-F)</SelectItem>
                          <SelectItem value="pass_fail">Réussi/Échoué</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="points_possible">Points Possibles</Label>
                      <Input
                        id="points_possible"
                        type="number"
                        value={formData.points_possible}
                        onChange={e =>
                          setFormData({ ...formData, points_possible: e.target.value })
                        }
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="due_date">Date d'Échéance</Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="late_penalty_percentage">Pénalité Retard (%)</Label>
                      <Input
                        id="late_penalty_percentage"
                        type="number"
                        value={formData.late_penalty_percentage}
                        onChange={e =>
                          setFormData({ ...formData, late_penalty_percentage: e.target.value })
                        }
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSaveAssignment}
                      disabled={createAssignment.isPending || updateAssignment.isPending}
                    >
                      {editingAssignmentId ? 'Sauvegarder' : 'Créer'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog Soumissions */}
            <Dialog
              open={!!viewingSubmissionsId}
              onOpenChange={open => !open && setViewingSubmissionsId(null)}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Soumissions ({filteredSubmissions.length})</DialogTitle>
                  <DialogDescription>
                    Gérez les soumissions et notez les assignments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={v =>
                        setStatusFilter(v as 'all' | 'pending' | 'graded' | 'returned')
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="graded">Notés</SelectItem>
                        <SelectItem value="returned">Retournés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune soumission</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSubmissions.map(submission => (
                        <Card key={submission.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  Soumission #{submission.version}
                                </CardTitle>
                                <CardDescription>
                                  Soumis le{' '}
                                  {submission.submitted_at
                                    ? format(
                                        new Date(submission.submitted_at),
                                        'dd MMM yyyy à HH:mm',
                                        { locale: fr }
                                      )
                                    : 'N/A'}
                                  {submission.is_late && (
                                    <Badge variant="destructive" className="ml-2">
                                      En retard ({submission.late_hours}h)
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(submission.status)}
                                {submission.grade !== null && submission.grade !== undefined && (
                                  <Badge variant="default" className="bg-green-600">
                                    {submission.grade}/
                                    {submission.assignment?.points_possible || 100}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {submission.submission_text && (
                                <div>
                                  <Label>Texte de soumission</Label>
                                  <div className="mt-2 p-3 bg-muted rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {submission.submission_text}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {submission.submission_files &&
                                submission.submission_files.length > 0 && (
                                  <div>
                                    <Label>Fichiers soumis</Label>
                                    <div className="mt-2 space-y-2">
                                      {submission.submission_files.map(
                                        (
                                          file: {
                                            url: string;
                                            name: string;
                                            size?: number;
                                            type?: string;
                                          },
                                          index: number
                                        ) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4" />
                                              <span className="text-sm">{file.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                ({(file.size / 1024).toFixed(1)} KB)
                                              </span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => window.open(file.url, '_blank')}
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {submission.feedback && (
                                <div>
                                  <Label>Feedback</Label>
                                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {submission.feedback}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-end gap-2 pt-2">
                                {submission.status === 'submitted' && (
                                  <Button
                                    onClick={() => setGradingSubmissionId(submission.id)}
                                    size="sm"
                                  >
                                    <FileCheck className="h-4 w-4 mr-2" />
                                    Noter
                                  </Button>
                                )}
                                {submission.status === 'graded' && (
                                  <Button
                                    variant="outline"
                                    onClick={() => setGradingSubmissionId(submission.id)}
                                    size="sm"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier la note
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog Notation */}
            <Dialog
              open={!!gradingSubmissionId}
              onOpenChange={open => !open && setGradingSubmissionId(null)}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Noter la soumission</DialogTitle>
                </DialogHeader>
                {gradingSubmissionId &&
                  (() => {
                    const submission = submissions.find(s => s.id === gradingSubmissionId);
                    if (!submission || !submission.assignment) {
                      return (
                        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
                      );
                    }

                    return (
                      <AssignmentGradingForm
                        assignment={submission.assignment}
                        submission={submission}
                        onSuccess={() => {
                          setGradingSubmissionId(null);
                          queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
                        }}
                        onCancel={() => setGradingSubmissionId(null)}
                      />
                    );
                  })()}
              </DialogContent>
            </Dialog>

            {/* Dialog Suppression */}
            <AlertDialog
              open={!!deletingAssignmentId}
              onOpenChange={open => !open && setDeletingAssignmentId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cet assignment ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. L'assignment sera définitivement supprimé ainsi
                    que toutes ses soumissions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deletingAssignmentId && handleDeleteAssignment(deletingAssignmentId)
                    }
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






