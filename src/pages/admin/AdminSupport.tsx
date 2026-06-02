/**
 * Support admin — file d'attente basée sur les litiges plateforme (données réelles).
 * Un module tickets dédié pourra s'ajouter ultérieurement.
 */

import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useDisputes } from '@/hooks/useDisputes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Headphones, Search, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminSupport() {
  const [search, setSearch] = useState('');
  const { disputes, stats, loading, error } = useDisputes({
    page: 1,
    pageSize: 25,
    sortBy: 'created_at',
    sortDirection: 'desc',
    filters: search.trim() ? { search: search.trim() } : undefined,
  });

  const openCount = stats?.open ?? disputes.filter(d => d.status === 'open').length;
  const pendingCount =
    (stats?.waiting_customer ?? 0) +
    (stats?.waiting_seller ?? 0) +
    disputes.filter(d => d.status === 'waiting_customer' || d.status === 'waiting_seller').length;

  const statusBadge = useCallback((status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ouvert
          </Badge>
        );
      case 'resolved':
      case 'closed':
        return (
          <Badge variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            Clôturé
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  }, []);

  const priorityBadge = useCallback((priority: string | null | undefined) => {
    if (priority === 'high' || priority === 'urgent') {
      return <Badge variant="destructive">Haute</Badge>;
    }
    if (priority === 'low') {
      return <Badge variant="outline">Basse</Badge>;
    }
    return <Badge variant="secondary">Moyenne</Badge>;
  }, []);

  const tableMissing = Boolean(error?.includes("table 'disputes'"));
  const permissionDenied = Boolean(
    error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('403')
  );

  const statCards = useMemo(
    () => [
      { label: 'Total', value: stats?.total ?? disputes.length },
      { label: 'Ouverts', value: openCount, accent: 'text-red-600' },
      { label: 'En attente', value: pendingCount, accent: 'text-orange-600' },
      {
        label: 'Non assignés',
        value: stats?.unassigned ?? 0,
        accent: 'text-amber-600',
      },
    ],
    [stats, disputes.length, openCount, pendingCount]
  );

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Headphones className="h-7 w-7 text-primary" aria-hidden />
              Support client
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              File prioritaire des litiges et demandes escaladées (données live Supabase).
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/disputes">
              <ExternalLink className="h-4 w-4 mr-2" />
              Centre litiges
            </Link>
          </Button>
        </div>

        {tableMissing && (
          <Alert variant="destructive">
            <AlertDescription>
              La table <code>disputes</code> est absente. Exécutez les migrations litiges sur
              Supabase pour activer le support admin.
            </AlertDescription>
          </Alert>
        )}

        {permissionDenied && (
          <Alert variant="destructive">
            <AlertDescription>
              Accès refusé (RLS). Vérifiez le rôle admin et la fonction{' '}
              <code>is_platform_admin()</code>.
            </AlertDescription>
          </Alert>
        )}

        {error && !tableMissing && !permissionDenied && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(card => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className={`text-2xl font-bold ${card.accent ?? ''}`}>{card.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher sujet, commande…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dernières demandes</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : disputes.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Aucun litige pour le moment.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Créé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {row.subject}
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>{priorityBadge(row.priority)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.order_id?.slice(0, 8) ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {row.created_at
                          ? format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
