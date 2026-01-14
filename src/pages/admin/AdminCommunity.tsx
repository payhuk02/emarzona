/**
 * Page d'administration de la Communauté
 * Date: 31 Janvier 2025
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import type { CommunityMember } from '@/types/community';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Pin,
  Star,
  Trash2,
  Eye,
  Download,
  Plus,
  BarChart3,
} from 'lucide-react';
import { useCommunityMembers, useUpdateMemberStatus, useDeleteCommunityMember } from '@/hooks/community/useCommunityMembers';
import { useCommunityPosts, useTogglePostPin, useTogglePostFeatured, useDeleteCommunityPost } from '@/hooks/community/useCommunityPosts';
import { useCommunityStatistics } from '@/hooks/community/useCommunityStatistics';
import { CommunityMemberForm } from '@/components/community/CommunityMemberForm';
import { CommunityPostCard } from '@/components/community/CommunityPostCard';
import { CommunityPostForm } from '@/components/community/CommunityPostForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import type { CommunityMemberStatus, CommunityPost } from '@/types/community';

export default function AdminCommunity() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'posts'>('overview');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<CommunityMemberStatus | 'all'>('all');
  const [postSearch, setPostSearch] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState<string>('all');
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [deletePostDialogOpen, setDeletePostDialogOpen] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);

  const { toast } = useToast();
  const updateMemberStatus = useUpdateMemberStatus();
  const deleteMember = useDeleteCommunityMember();
  const togglePostPin = useTogglePostPin();
  const togglePostFeatured = useTogglePostFeatured();
  const deletePost = useDeleteCommunityPost();

  // Fetch data
  const { data: statistics, isLoading: statsLoading } = useCommunityStatistics();
  const { data: members, isLoading: membersLoading } = useCommunityMembers({
    status: memberStatusFilter !== 'all' ? [memberStatusFilter] : undefined,
    search: memberSearch || undefined,
  });
  const { data: posts, isLoading: postsLoading } = useCommunityPosts({
    status: postStatusFilter !== 'all' ? [postStatusFilter as CommunityPost['status']] : undefined,
    search: postSearch || undefined,
  });

  const handleMemberStatusChange = async (memberId: string, status: CommunityMemberStatus) => {
    try {
      await updateMemberStatus.mutateAsync({ memberId, status });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteMember = async () => {
    if (!targetMemberId) return;
    try {
      await deleteMember.mutateAsync(targetMemberId);
      setDeleteMemberDialogOpen(false);
      setTargetMemberId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeletePost = async () => {
    if (!targetPostId) return;
    try {
      await deletePost.mutateAsync(targetPostId);
      setDeletePostDialogOpen(false);
      setTargetPostId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    try {
      await togglePostPin.mutateAsync({ postId, isPinned });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleFeatured = async (postId: string, isFeatured: boolean) => {
    try {
      await togglePostFeatured.mutateAsync({ postId, isFeatured });
    } catch (error) {
      // Error handled by hook
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AdminLayout>
      <RequireAAL2>
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          <Admin2FABanner />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Communauté
                </span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Gérez les membres et les publications de la communauté
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="min-h-[44px]">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="members" className="min-h-[44px]">Membres</TabsTrigger>
              <TabsTrigger value="posts" className="min-h-[44px]">Publications</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Statistiques */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statistics?.total_members || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {statistics?.active_members || 0} actifs
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Publications</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statistics?.published_posts || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {statistics?.total_posts || 0} au total
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commentaires</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statistics?.total_comments || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {statistics?.total_reactions || 0} réactions
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En attente</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statistics?.pending_members || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Demandes d'adhésion
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Graphiques et répartition */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Répartition par pays</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statistics?.members_by_country && statistics.members_by_country.length > 0 ? (
                          <div className="space-y-2">
                            {statistics.members_by_country.slice(0, 5).map((item) => (
                              <div key={item.country} className="flex items-center justify-between">
                                <span className="text-sm">{item.country}</span>
                                <Badge variant="secondary">{item.count}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucune donnée</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Répartition par profession</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statistics?.members_by_profession && statistics.members_by_profession.length > 0 ? (
                          <div className="space-y-2">
                            {statistics.members_by_profession.slice(0, 5).map((item) => (
                              <div key={item.profession} className="flex items-center justify-between">
                                <span className="text-sm">{item.profession}</span>
                                <Badge variant="secondary">{item.count}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucune donnée</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Membres */}
            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Membres de la communauté</CardTitle>
                      <CardDescription>
                        Gérez les membres et leurs statuts
                      </CardDescription>
                    </div>
                    <Button onClick={() => setMemberFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau membre
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filtres */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un membre..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-10 min-h-[44px]"
                      />
                    </div>
                    <Select value={memberStatusFilter} onValueChange={(v) => setMemberStatusFilter(v as typeof memberStatusFilter)}>
                      <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                        <SelectItem value="suspended">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table - Responsive avec MobileTableCard */}
                  {membersLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : members && members.length > 0 ? (
                    isMobile ? (
                      <MobileTableCard
                        data={members.map(m => ({ ...m, id: m.id }))}
                        columns={[
                          {
                            key: 'member',
                            label: 'Membre',
                            priority: 'high',
                            render: (row: CommunityMember) => (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={row.profile_image_url || undefined} />
                                  <AvatarFallback>
                                    {getInitials(row.first_name, row.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium truncate text-sm">
                                    {row.first_name} {row.last_name}
                                  </div>
                                  {row.company && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {row.company}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {row.email}
                                  </div>
                                </div>
                              </div>
                            ),
                          },
                          {
                            key: 'profession',
                            label: 'Profession',
                            priority: 'medium',
                            render: (row: CommunityMember) => (
                              <span className="text-xs">{row.profession || '-'}</span>
                            ),
                          },
                          {
                            key: 'country',
                            label: 'Pays',
                            priority: 'low',
                            render: (row: CommunityMember) => (
                              <span className="text-xs">{row.country || '-'}</span>
                            ),
                          },
                          {
                            key: 'status',
                            label: 'Statut',
                            priority: 'high',
                            render: (row: CommunityMember) => (
                              <Badge
                                variant={
                                  row.status === 'approved'
                                    ? 'default'
                                    : row.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                {row.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {row.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {row.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {row.status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
                                {row.status}
                              </Badge>
                            ),
                          },
                          {
                            key: 'join_date',
                            label: 'Date d\'adhésion',
                            priority: 'low',
                            render: (row: CommunityMember) => (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(row.join_date || row.created_at), { addSuffix: true, locale: fr })}
                              </span>
                            ),
                          },
                        ]}
                        actions={(row: CommunityMember) => (
                          <div className="flex flex-col gap-2">
                            {row.status === 'pending' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleMemberStatusChange(row.id, 'approved')}
                                className="min-h-[44px] w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approuver
                              </Button>
                            )}
                            {row.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMemberStatusChange(row.id, 'suspended')}
                                className="min-h-[44px] w-full"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspendre
                              </Button>
                            )}
                            {row.status === 'suspended' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleMemberStatusChange(row.id, 'approved')}
                                className="min-h-[44px] w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Réactiver
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setTargetMemberId(row.id);
                                setDeleteMemberDialogOpen(true);
                              }}
                              className="min-h-[44px] w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        )}
                      />
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[200px]">Membre</TableHead>
                                <TableHead className="hidden md:table-cell min-w-[200px]">Email</TableHead>
                                <TableHead className="hidden lg:table-cell min-w-[150px]">Profession</TableHead>
                                <TableHead className="hidden lg:table-cell min-w-[100px]">Pays</TableHead>
                                <TableHead className="min-w-[120px]">Statut</TableHead>
                                <TableHead className="hidden md:table-cell min-w-[150px]">Date d'adhésion</TableHead>
                                <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {members.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={member.profile_image_url || undefined} />
                                        <AvatarFallback>
                                          {getInitials(member.first_name, member.last_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <div className="font-medium truncate">
                                          {member.first_name} {member.last_name}
                                        </div>
                                        {member.company && (
                                          <div className="text-xs text-muted-foreground truncate">
                                            {member.company}
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground md:hidden mt-1">
                                          {member.email}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                                  <TableCell className="hidden lg:table-cell">{member.profession || '-'}</TableCell>
                                  <TableCell className="hidden lg:table-cell">{member.country}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        member.status === 'approved'
                                          ? 'default'
                                          : member.status === 'pending'
                                          ? 'secondary'
                                          : 'destructive'
                                      }
                                      className="text-xs"
                                    >
                                      {member.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                      {member.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                      {member.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                      {member.status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
                                      <span className="hidden sm:inline">{member.status}</span>
                                      <span className="sm:hidden">{member.status.charAt(0).toUpperCase()}</span>
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-xs">
                                    {formatDistanceToNow(new Date(member.join_date || member.created_at), { addSuffix: true, locale: fr })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Select>
                                      <SelectTrigger
                                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] h-11 w-11" aria-label={`Actions pour ${member.email || member.id}`}>
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </SelectTrigger>
                                      <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                        {member.status === 'pending' && (
                                          <SelectItem value="edit" onSelect
                                            onSelect={() => handleMemberStatusChange(member.id, 'approved')}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approuver
                                          </SelectItem>
                                        )}
                                        {member.status === 'approved' && (
                                          <SelectItem value="delete" onSelect
                                            onSelect={() => handleMemberStatusChange(member.id, 'suspended')}
                                          >
                                            <Ban className="h-4 w-4 mr-2" />
                                            Suspendre
                                          </SelectItem>
                                        )}
                                        {member.status === 'suspended' && (
                                          <SelectItem value="copy" onSelect
                                            onSelect={() => handleMemberStatusChange(member.id, 'approved')}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Réactiver
                                          </SelectItem>
                                        )}
                                        <SelectItem value="view" onSelect
                                          onSelect={() => {
                                            setTargetMemberId(member.id);
                                            setDeleteMemberDialogOpen(true);
                                          }}
                                          className="text-destructive"
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
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun membre trouvé
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Publications */}
            <TabsContent value="posts" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Publications</CardTitle>
                      <CardDescription>
                        Gérez les publications de la communauté
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setSelectedPost(null);
                      setPostFormOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle publication
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filtres */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une publication..."
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        className="pl-10 min-h-[44px]"
                      />
                    </div>
                    <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                        <SelectItem value="moderated">Modéré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Liste des posts */}
                  {postsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-64" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts && posts.length > 0 ? (
                        posts.map((post) => (
                          <CommunityPostCard
                            key={post.id}
                            post={post}
                            showActions={true}
                            onDelete={(postId) => {
                              setTargetPostId(postId);
                              setDeletePostDialogOpen(true);
                            }}
                            onPin={handleTogglePin}
                            onFeature={handleToggleFeatured}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          Aucune publication trouvée
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dialogs */}
          <Dialog open={memberFormOpen} onOpenChange={setMemberFormOpen}>
            <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
              <DialogHeader>
                <DialogTitle>Rejoindre la communauté</DialogTitle>
                <DialogDescription>
                  Remplissez le formulaire pour demander à rejoindre la communauté
                </DialogDescription>
              </DialogHeader>
              <CommunityMemberForm
                onSuccess={() => {
                  setMemberFormOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={postFormOpen} onOpenChange={setPostFormOpen}>
            <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
              <DialogHeader>
                <DialogTitle>
                  {selectedPost ? 'Modifier la publication' : 'Nouvelle publication'}
                </DialogTitle>
                <DialogDescription>
                  {selectedPost
                    ? 'Modifiez les informations de la publication'
                    : 'Créez une nouvelle publication pour la communauté'}
                </DialogDescription>
              </DialogHeader>
              <CommunityPostForm
                post={selectedPost || undefined}
                onSuccess={() => {
                  setPostFormOpen(false);
                  setSelectedPost(null);
                }}
                onCancel={() => {
                  setPostFormOpen(false);
                  setSelectedPost(null);
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Delete Member Dialog */}
          <AlertDialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le membre</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce membre de la communauté ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onSelect={handleDeleteMember} className="bg-destructive">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Post Dialog */}
          <AlertDialog open={deletePostDialogOpen} onOpenChange={setDeletePostDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la publication</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onSelect={handleDeletePost} className="bg-destructive">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </RequireAAL2>
    </AdminLayout>
  );
}







