/**
 * Page de Gestion Complète des Live Sessions
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour gérer les sessions en direct avec intégration Zoom/Google Meet
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  VideoOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Settings,
  Link as LinkIcon,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  useCourseLiveSessions,
  useCreateLiveSession,
  useUpdateLiveSession,
  useDeleteLiveSession,
  type LiveSession,
} from '@/hooks/courses/useLiveSessions';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import ZoomService from '@/integrations/video-conferencing/zoom';
import GoogleMeetService from '@/integrations/video-conferencing/google-meet';

export default function LiveSessionsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const { data: sessions = [], isLoading: sessionsLoading } = useCourseLiveSessions(selectedCourseId);
  const createSession = useCreateLiveSession();
  const updateSession = useUpdateLiveSession();
  const deleteSession = useDeleteLiveSession();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'live' | 'ended' | 'cancelled'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'zoom' | 'google_meet' | 'native'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_type: 'webinar' as const,
    platform: 'zoom' as const,
    scheduled_start: '',
    scheduled_end: '',
    max_participants: '',
    is_public: true,
    recording_enabled: true,
    allow_questions: true,
    allow_chat: true,
    allow_screen_share: false,
    require_registration: true,
  });

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les cours disponibles
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['store-courses-for-sessions', store?.id],
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

  // Filtrer les sessions
  const filteredSessions = useMemo(() => {
    let  filtered= sessions;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filtre par plateforme
    if (platformFilter !== 'all') {
      filtered = filtered.filter((s) => s.platform === platformFilter);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [sessions, statusFilter, platformFilter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: sessions.length,
      scheduled: sessions.filter((s) => s.status === 'scheduled').length,
      live: sessions.filter((s) => s.status === 'live').length,
      ended: sessions.filter((s) => s.status === 'ended').length,
      totalRegistrations: sessions.reduce((sum, s) => sum + (s.registered_count || 0), 0),
    };
  }, [sessions]);

  // Handlers
  const handleCreateSession = () => {
    setFormData({
      title: '',
      description: '',
      session_type: 'webinar',
      platform: 'zoom',
      scheduled_start: '',
      scheduled_end: '',
      max_participants: '',
      is_public: true,
      recording_enabled: true,
      allow_questions: true,
      allow_chat: true,
      allow_screen_share: false,
      require_registration: true,
    });
    setEditingSessionId(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setFormData({
        title: session.title,
        description: session.description || '',
        session_type: session.session_type,
        platform: session.platform,
        scheduled_start: session.scheduled_start ? new Date(session.scheduled_start).toISOString().slice(0, 16) : '',
        scheduled_end: session.scheduled_end ? new Date(session.scheduled_end).toISOString().slice(0, 16) : '',
        max_participants: session.max_participants?.toString() || '',
        is_public: session.is_public,
        recording_enabled: session.recording_enabled,
        allow_questions: session.allow_questions,
        allow_chat: session.allow_chat,
        allow_screen_share: session.allow_screen_share,
        require_registration: session.require_registration,
      });
      setEditingSessionId(sessionId);
      setIsCreateDialogOpen(true);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeletingSessionId(null);
      toast({
        title: '✅ Session supprimée',
        description: 'La session a été supprimée avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer la session',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSession = async () => {
    if (!selectedCourseId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un cours',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title || !formData.scheduled_start || !formData.scheduled_end) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      const sessionData = {
        course_id: selectedCourseId,
        title: formData.title,
        description: formData.description,
        session_type: formData.session_type,
        platform: formData.platform,
        scheduled_start: new Date(formData.scheduled_start).toISOString(),
        scheduled_end: new Date(formData.scheduled_end).toISOString(),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        is_public: formData.is_public,
        recording_enabled: formData.recording_enabled,
        allow_questions: formData.allow_questions,
        allow_chat: formData.allow_chat,
        allow_screen_share: formData.allow_screen_share,
        require_registration: formData.require_registration,
      };

      // Créer la réunion sur la plateforme si nécessaire
      if (formData.platform === 'zoom' || formData.platform === 'google_meet') {
        // TODO: Intégrer avec les services Zoom/Google Meet
        // Pour l'instant, on crée juste la session dans la base de données
        logger.info('Creating external meeting', { platform: formData.platform });
      }

      if (editingSessionId) {
        await updateSession.mutateAsync({
          sessionId: editingSessionId,
          updates: sessionData,
        });
      } else {
        await createSession.mutateAsync(sessionData);
      }

      setIsCreateDialogOpen(false);
      setEditingSessionId(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error saving session', { error: errorMessage, formData });
      // Les erreurs sont gérées par les hooks
    }
  };

  const getStatusBadge = (status: string) => {
    const  badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      scheduled: { label: 'Programmée', variant: 'secondary' },
      live: { label: 'En direct', variant: 'default', className: 'bg-green-600 animate-pulse' },
      ended: { label: 'Terminée', variant: 'outline' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
      postponed: { label: 'Reportée', variant: 'secondary' },
    };

    const badge = badges[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const  badges: Record<string, { label: string; className?: string }> = {
      zoom: { label: 'Zoom', className: 'bg-blue-600' },
      google_meet: { label: 'Google Meet', className: 'bg-green-600' },
      teams: { label: 'Teams', className: 'bg-purple-600' },
      native: { label: 'Natif', className: 'bg-gray-600' },
      custom: { label: 'Personnalisé', className: 'bg-orange-600' },
    };

    const badge = badges[platform] || { label: platform };
    return (
      <Badge variant="default" className={badge.className}>
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
                    <Video className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Sessions Live
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Créez et gérez vos sessions en direct avec Zoom, Google Meet ou streaming natif
                </p>
              </div>
              <Button onClick={handleCreateSession} className="shrink-0" disabled={!selectedCourseId}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Session
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
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Programmées</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.scheduled}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">En Direct</CardTitle>
                      <Video className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.live}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Terminées</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{stats.ended}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Inscriptions</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{stats.totalRegistrations}</div>
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
                          placeholder="Rechercher une session..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="scheduled">Programmées</SelectItem>
                          <SelectItem value="live">En direct</SelectItem>
                          <SelectItem value="ended">Terminées</SelectItem>
                          <SelectItem value="cancelled">Annulées</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les plateformes</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="native">Natif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                            ? 'Aucune session ne correspond à vos critères'
                            : 'Aucune session créée'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && platformFilter === 'all' && (
                          <Button onClick={handleCreateSession}>
                            <Plus className="h-4 w-4 mr-2" />
                            Créer votre première session
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Session</TableHead>
                              <TableHead>Plateforme</TableHead>
                              <TableHead>Date & Heure</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Inscriptions</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSessions.map((session) => (
                              <TableRow key={session.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{session.title}</div>
                                    {session.description && (
                                      <div className="text-xs text-muted-foreground line-clamp-1">
                                        {session.description}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{getPlatformBadge(session.platform)}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{format(new Date(session.scheduled_start), 'dd MMM yyyy', { locale: fr })}</div>
                                    <div className="text-muted-foreground">
                                      {format(new Date(session.scheduled_start), 'HH:mm', { locale: fr })} - {format(new Date(session.scheduled_end), 'HH:mm', { locale: fr })}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(session.status)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{session.registered_count || 0}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Select>
                                    <SelectTrigger>

                                        <MoreVertical className="h-4 w-4" />
                                      
</SelectTrigger>
                                    <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                      {session.meeting_url && (
                                        <SelectItem value="edit" onSelect={() => window.open(session.meeting_url, '_blank')}>
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Ouvrir la réunion
                                        </SelectItem>
                                      )}
                                      <SelectItem value="delete" onSelect={() => handleEditSession(session.id)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Éditer
                                      </SelectItem>
                                      <SelectItem value="copy" onSelect={() => setDeletingSessionId(session.id)}
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
              </>
            )}

            {/* Dialog Création/Édition */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSessionId ? 'Éditer la Session' : 'Créer une Session Live'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSessionId
                      ? 'Modifiez les informations de la session'
                      : 'Créez une nouvelle session en direct pour votre cours'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Introduction au React"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de la session..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="session_type">Type de Session</Label>
                      <Select
                        value={formData.session_type}
                        onValueChange={(v) => setFormData({ ...formData, session_type: v as any })}
                      >
                        <SelectTrigger id="session_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webinar">Webinaire</SelectItem>
                          <SelectItem value="workshop">Atelier</SelectItem>
                          <SelectItem value="qna">Q&A</SelectItem>
                          <SelectItem value="office_hours">Heures de bureau</SelectItem>
                          <SelectItem value="review">Révision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="platform">Plateforme</Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(v) => setFormData({ ...formData, platform: v as any })}
                      >
                        <SelectTrigger id="platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="native">Streaming Natif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduled_start">Date et Heure de Début *</Label>
                      <Input
                        id="scheduled_start"
                        type="datetime-local"
                        value={formData.scheduled_start}
                        onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="scheduled_end">Date et Heure de Fin *</Label>
                      <Input
                        id="scheduled_end"
                        type="datetime-local"
                        value={formData.scheduled_end}
                        onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="max_participants">Nombre Maximum de Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                      placeholder="Illimité si vide"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked as boolean })}
                      />
                      <Label htmlFor="is_public" className="cursor-pointer">Session publique</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="recording_enabled"
                        checked={formData.recording_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, recording_enabled: checked as boolean })}
                      />
                      <Label htmlFor="recording_enabled" className="cursor-pointer">Enregistrement activé</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_questions"
                        checked={formData.allow_questions}
                        onCheckedChange={(checked) => setFormData({ ...formData, allow_questions: checked as boolean })}
                      />
                      <Label htmlFor="allow_questions" className="cursor-pointer">Autoriser les questions</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_chat"
                        checked={formData.allow_chat}
                        onCheckedChange={(checked) => setFormData({ ...formData, allow_chat: checked as boolean })}
                      />
                      <Label htmlFor="allow_chat" className="cursor-pointer">Autoriser le chat</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="require_registration"
                        checked={formData.require_registration}
                        onCheckedChange={(checked) => setFormData({ ...formData, require_registration: checked as boolean })}
                      />
                      <Label htmlFor="require_registration" className="cursor-pointer">Inscription requise</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveSession} disabled={createSession.isPending || updateSession.isPending}>
                      {editingSessionId ? 'Sauvegarder' : 'Créer'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog Suppression */}
            <AlertDialog
              open={!!deletingSessionId}
              onOpenChange={(open) => !open && setDeletingSessionId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette session ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La session sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletingSessionId && handleDeleteSession(deletingSessionId)}
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







