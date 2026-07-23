import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldAlert,
  MessageCircleReply,
  MoreVertical,
  Check,
  X,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

// Mock Data
type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';
type Sentiment = 'positive' | 'neutral' | 'negative';

interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  avatarInitials: string;
  content: string;
  articleTitle: string;
  date: string;
  status: CommentStatus;
  sentiment: Sentiment;
  replies: number;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Jean Dupont',
    authorEmail: 'jean.d@example.com',
    avatarInitials: 'JD',
    content: "C'est un excellent article ! Les conseils sur l'optimisation SEO m'ont beaucoup aidé.",
    articleTitle: '10 Conseils pour Optimiser votre SEO',
    date: '2026-07-23T10:00:00Z',
    status: 'pending',
    sentiment: 'positive',
    replies: 0,
  },
  {
    id: '2',
    author: 'Marie Curie',
    authorEmail: 'marie.c@example.com',
    avatarInitials: 'MC',
    content: 'Je ne suis pas d\'accord avec le point 3. Je pense que la publicité payante est morte.',
    articleTitle: 'Le guide de la publicité en 2026',
    date: '2026-07-22T14:30:00Z',
    status: 'approved',
    sentiment: 'negative',
    replies: 2,
  },
  {
    id: '3',
    author: 'Crypto King',
    authorEmail: 'spam@crypto.xyz',
    avatarInitials: 'CK',
    content: 'Get rich quick! Click here: http://spam.xyz',
    articleTitle: 'Comment gérer vos finances',
    date: '2026-07-21T08:15:00Z',
    status: 'pending',
    sentiment: 'neutral',
    replies: 0,
  },
  {
    id: '4',
    author: 'Sophie Martin',
    authorEmail: 'sophie.m@example.com',
    avatarInitials: 'SM',
    content: 'Article très instructif. Merci pour le partage.',
    articleTitle: 'Tendance E-commerce 2026',
    date: '2026-07-20T11:45:00Z',
    status: 'approved',
    sentiment: 'positive',
    replies: 0,
  },
  {
    id: '5',
    author: 'Troll Master',
    authorEmail: 'troll@internet.com',
    avatarInitials: 'TM',
    content: 'Pire article jamais écrit, vous ne connaissez rien.',
    articleTitle: '10 Conseils pour Optimiser votre SEO',
    date: '2026-07-19T09:20:00Z',
    status: 'rejected',
    sentiment: 'negative',
    replies: 0,
  },
];

const STATUS_CONFIG = {
  pending: { label: 'En attente', class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  approved: { label: 'Approuvé', class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejeté', class: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
  spam: { label: 'Spam', class: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30' },
};

const SENTIMENT_CONFIG = {
  positive: { icon: Smile, class: 'text-emerald-500' },
  neutral: { icon: Meh, class: 'text-blue-500' },
  negative: { icon: Frown, class: 'text-red-500' },
};

export default function AdminArticleComments() {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'all'>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');

  // KPIs
  const totalComments = comments.length;
  const pendingComments = comments.filter(c => c.status === 'pending').length;
  const spamCount = comments.filter(c => c.status === 'spam').length;

  // Filtering
  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      const matchesSearch = c.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [comments, searchQuery, statusFilter]);

  // Actions
  const handleUpdateStatus = (id: string, newStatus: CommentStatus) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleReplySubmit = () => {
    if (!selectedComment || !replyText.trim()) return;
    // Simulate sending reply
    console.log('Replying to', selectedComment.id, 'with', replyText);
    setReplyText('');
    setSelectedComment(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
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

      {/* KPIs (Premium Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card variant="premium" className="flex flex-col justify-between">
          <CardContent className="p-5 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total</p>
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
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">En attente</p>
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
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spam potentiel</p>
              <h3 className="text-3xl font-bold mt-1 tabular-nums">{spamCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card variant="premium" className="overflow-hidden">
        {/* Filters */}
        <div className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un commentaire ou auteur..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="rounded-full"
            >
              Tous
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="rounded-full"
            >
              En attente
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('approved')}
              className="rounded-full"
            >
              Approuvés
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
              className="rounded-full"
            >
              Rejetés
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Auteur & Article</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="w-[120px]">Sentiment</TableHead>
                <TableHead className="w-[120px]">Statut</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
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
                filteredComments.map((comment) => {
                  const SentimentIcon = SENTIMENT_CONFIG[comment.sentiment].icon;
                  const statusConf = STATUS_CONFIG[comment.status];

                  return (
                    <TableRow key={comment.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {comment.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{comment.author}</p>
                            <p className="text-xs text-muted-foreground truncate">{comment.authorEmail}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1 truncate max-w-[200px]" title={comment.articleTitle}>
                              Sur: {comment.articleTitle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm line-clamp-2 text-foreground/90">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5" title={`Sentiment: ${comment.sentiment}`}>
                          <SentimentIcon className={`h-4 w-4 ${SENTIMENT_CONFIG[comment.sentiment].class}`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border ${statusConf.class}`}>
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {comment.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleUpdateStatus(comment.id, 'approved')}
                              title="Approuver"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {comment.status !== 'rejected' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                              title="Rejeter"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setSelectedComment(comment)}
                            title="Répondre / Voir détails"
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
                              <DropdownMenuItem onClick={() => handleUpdateStatus(comment.id, 'spam')}>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Marquer comme Spam
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
        </div>
      </Card>

      {/* Drawer for Reply & Details */}
      <Drawer open={!!selectedComment} onOpenChange={(o) => !o && setSelectedComment(null)}>
        <DrawerContent>
          {selectedComment && (
            <div className="mx-auto w-full max-w-2xl">
              <DrawerHeader>
                <DrawerTitle>Détails du commentaire</DrawerTitle>
                <DrawerDescription>Modérez ou répondez à {selectedComment.author}</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0 space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {selectedComment.avatarInitials}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedComment.author}</p>
                      <p className="text-sm text-muted-foreground">{new Date(selectedComment.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-base text-foreground leading-relaxed">{selectedComment.content}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Votre réponse (publique)</label>
                  <Textarea 
                    placeholder="Écrivez votre réponse ici..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <DrawerFooter className="flex flex-row justify-end gap-3 pt-6">
                <DrawerClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DrawerClose>
                <Button onClick={handleReplySubmit}>Envoyer la réponse</Button>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
