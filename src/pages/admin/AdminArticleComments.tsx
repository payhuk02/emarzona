import { useMemo, useState } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle,
  ShieldAlert,
  MessageCircleReply,
  MoreVertical,
  Check,
  X,
  Smile,
  Frown,
  Meh,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAdminBlogComments,
  useReplyAdminBlogComment,
  useUpdateAdminBlogCommentStatus,
  type AdminBlogComment,
  type AdminBlogCommentStatus,
} from '@/hooks/platform/useAdminBlogComments';

type UiStatusFilter = AdminBlogCommentStatus | 'all';
type Sentiment = 'positive' | 'neutral' | 'negative';

const STATUS_CONFIG: Record<AdminBlogCommentStatus, { label: string; class: string }> = {
  pending: {
    label: 'En attente',
    class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  approved: {
    label: 'Approuvé',
    class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  hidden: {
    label: 'Rejeté',
    class: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  },
};

const SENTIMENT_CONFIG = {
  positive: { icon: Smile, class: 'text-emerald-500' },
  neutral: { icon: Meh, class: 'text-blue-500' },
  negative: { icon: Frown, class: 'text-red-500' },
};

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const negative = ['pire', 'nul', 'arnaque', 'spam', "d'accord", 'pas d', 'mort', 'troll'];
  const positive = ['excellent', 'merci', 'super', 'génial', 'aide', 'instructif', 'bravo'];
  if (negative.some(w => lower.includes(w))) return 'negative';
  if (positive.some(w => lower.includes(w))) return 'positive';
  return 'neutral';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AdminArticleComments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: comments = [], isLoading, isError, error, refetch } = useAdminBlogComments();
  const updateStatus = useUpdateAdminBlogCommentStatus();
  const replyMutation = useReplyAdminBlogComment();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UiStatusFilter>('all');
  const [selectedComment, setSelectedComment] = useState<AdminBlogComment | null>(null);
  const [replyText, setReplyText] = useState('');

  const totalComments = comments.length;
  const pendingComments = comments.filter(c => c.status === 'pending').length;
  const hiddenCount = comments.filter(c => c.status === 'hidden').length;

  const filteredComments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return comments.filter(c => {
      const matchesSearch =
        !q ||
        c.body.toLowerCase().includes(q) ||
        c.author_name.toLowerCase().includes(q) ||
        (c.author_email ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [comments, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id: string, status: AdminBlogCommentStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({
        title: 'Statut mis à jour',
        description:
          status === 'approved'
            ? 'Commentaire approuvé'
            : status === 'hidden'
              ? 'Commentaire rejeté / masqué'
              : 'Commentaire remis en attente',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de mettre à jour',
        variant: 'destructive',
      });
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedComment || !replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({
        postId: selectedComment.post_id,
        parentId: selectedComment.id,
        body: replyText,
        authorName: user?.email?.split('@')[0] || 'Équipe Emarzona',
      });
      toast({ title: 'Réponse publiée' });
      setReplyText('');
      setSelectedComment(null);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d’envoyer la réponse',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Commentaires & Avis
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gérez les commentaires des articles et modérez les retours utilisateurs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card variant="premium" className="flex flex-col justify-between">
          <CardContent className="p-5 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </p>
              <h3 className="text-3xl font-bold mt-1 tabular-nums">{totalComments}</h3>
            </div>
          </CardContent>
        </Card>
        <Card variant="premium" className="flex flex-col justify-between">
          <CardContent className="p-5 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <CheckCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                En attente
              </p>
              <h3 className="text-3xl font-bold mt-1 tabular-nums">{pendingComments}</h3>
            </div>
          </CardContent>
        </Card>
        <Card variant="premium" className="flex flex-col justify-between">
          <CardContent className="p-5 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Rejetés
              </p>
              <h3 className="text-3xl font-bold mt-1 tabular-nums">{hiddenCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="premium" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un commentaire ou auteur..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                ['all', 'Tous'],
                ['pending', 'En attente'],
                ['approved', 'Approuvés'],
                ['hidden', 'Rejetés'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={statusFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(value)}
                className="rounded-full"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 h-40 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des commentaires…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 h-40 text-muted-foreground px-4 text-center">
              <p>
                {error instanceof Error ? error.message : 'Impossible de charger les commentaires'}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Réessayer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">Auteur & Article</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead className="w-[100px]">Sentiment</TableHead>
                  <TableHead className="w-[120px]">Statut</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Aucun commentaire trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComments.map(comment => {
                    const sentiment = detectSentiment(comment.body);
                    const SentimentIcon = SENTIMENT_CONFIG[sentiment].icon;
                    const statusConf = STATUS_CONFIG[comment.status];

                    return (
                      <TableRow key={comment.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {initials(comment.author_name) || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {comment.author_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {comment.author_email || '—'}
                              </p>
                              <p
                                className="text-[10px] text-muted-foreground/70 mt-1 truncate max-w-[200px]"
                                title={comment.post_title ?? undefined}
                              >
                                Sur: {comment.post_title || 'Article'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm line-clamp-2 text-foreground/90">
                              {comment.body}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SentimentIcon
                            className={`h-4 w-4 ${SENTIMENT_CONFIG[sentiment].class}`}
                            aria-label={sentiment}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`border ${statusConf.class}`}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {comment.status !== 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => void handleUpdateStatus(comment.id, 'approved')}
                                title="Approuver"
                                disabled={updateStatus.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {comment.status !== 'hidden' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => void handleUpdateStatus(comment.id, 'hidden')}
                                title="Rejeter"
                                disabled={updateStatus.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setSelectedComment(comment)}
                              title="Répondre"
                            >
                              <MessageCircleReply className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => void handleUpdateStatus(comment.id, 'pending')}
                                >
                                  Remettre en attente
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleUpdateStatus(comment.id, 'hidden')}
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4" />
                                  Masquer / spam
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <Drawer open={!!selectedComment} onOpenChange={o => !o && setSelectedComment(null)}>
        <DrawerContent>
          {selectedComment && (
            <div className="mx-auto w-full max-w-2xl">
              <DrawerHeader>
                <DrawerTitle>Détails du commentaire</DrawerTitle>
                <DrawerDescription>
                  Modérez ou répondez à {selectedComment.author_name}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0 space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {initials(selectedComment.author_name) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedComment.author_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedComment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-foreground leading-relaxed">
                    {selectedComment.body}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Votre réponse (publique)</label>
                  <Textarea
                    placeholder="Écrivez votre réponse ici..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <DrawerFooter className="flex flex-row justify-end gap-3 pt-6">
                <DrawerClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DrawerClose>
                <Button onClick={() => void handleReplySubmit()} disabled={replyMutation.isPending}>
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Envoyer la réponse
                </Button>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
