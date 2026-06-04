import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  usePlatformNewsletterSubscribers,
  usePlatformNewsletterStats,
  type NewsletterSubscriberStatus,
} from '@/hooks/usePlatformNewsletterSubscribers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Download, Search, Users, UserMinus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function exportSubscribersCsv(
  rows: {
    email: string;
    source: string;
    locale: string;
    subscribed_at: string;
    unsubscribed_at: string | null;
  }[]
) {
  const header = ['email', 'source', 'locale', 'subscribed_at', 'unsubscribed_at', 'status'];
  const lines = rows.map(r => [
    r.email,
    r.source,
    r.locale,
    r.subscribed_at,
    r.unsubscribed_at ?? '',
    r.unsubscribed_at ? 'unsubscribed' : 'active',
  ]);
  const csv = [header, ...lines]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminNewsletterSubscribers() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<NewsletterSubscriberStatus>('all');
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch, error } = usePlatformNewsletterSubscribers({
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: stats, isLoading: statsLoading } = usePlatformNewsletterStats();

  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE));

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput]
  );

  const handleExport = useCallback(() => {
    if (!data?.subscribers.length) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucun inscrit à exporter pour les filtres actuels.',
        variant: 'default',
      });
      return;
    }
    exportSubscribersCsv(data.subscribers);
    toast({ title: 'Export réussi', description: 'Le fichier CSV a été téléchargé.' });
  }, [data?.subscribers, toast]);

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Newsletter — inscrits
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Abonnés issus du pied de page plateforme et autres sources.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/platform-customization?section=footer">Personnaliser le footer</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={isLoading || !data?.subscribers.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Actifs</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                {statsLoading ? '…' : (stats?.active ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Désinscrits</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-muted-foreground" />
                {statsLoading ? '…' : (stats?.unsubscribed ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total historique</CardDescription>
              <CardTitle className="text-3xl">{statsLoading ? '…' : (stats?.total ?? 0)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des inscrits</CardTitle>
            <CardDescription>
              {data?.totalCount ?? 0} résultat{(data?.totalCount ?? 0) !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par e-mail…"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Rechercher
                </Button>
              </form>
              <Select
                value={status}
                onValueChange={v => {
                  setStatus(v as NewsletterSubscriberStatus);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="unsubscribed">Désinscrits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <p className="text-sm text-destructive">
                Impossible de charger les inscrits. Vérifiez vos droits administrateur.
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Langue</TableHead>
                        <TableHead>Inscription</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.subscribers.length ? (
                        data.subscribers.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{row.source}</Badge>
                            </TableCell>
                            <TableCell>{row.locale}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(row.subscribed_at)}
                            </TableCell>
                            <TableCell>
                              {row.unsubscribed_at ? (
                                <Badge variant="secondary">Désinscrit</Badge>
                              ) : (
                                <Badge className="bg-green-600/90 hover:bg-green-600">Actif</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Aucun inscrit trouvé.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 ? (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      Page {page} sur {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
