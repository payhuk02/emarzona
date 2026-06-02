/**
 * Admin — domaines personnalisés toutes boutiques
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Globe, Search, Shield, RefreshCw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type DomainRow = {
  id: string;
  domain: string;
  status: string;
  ssl_status: string | null;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
  store_id: string;
  stores: { name: string; slug: string } | null;
};

const DOMAIN_FIELDS =
  'id, domain, status, ssl_status, is_primary, verified_at, created_at, store_id, stores(name, slug)';

export default function AdminDomains() {
  const [rows, setRows] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('custom_domains')
        .select(DOMAIN_FIELDS)
        .order('created_at', { ascending: false })
        .limit(200);

      if (queryError) throw queryError;
      setRows((data as DomainRow[]) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      r =>
        r.domain.toLowerCase().includes(q) ||
        r.stores?.name?.toLowerCase().includes(q) ||
        r.stores?.slug?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter(r => r.status === 'active' || r.status === 'verified').length,
      sslOk: rows.filter(r => r.ssl_status === 'active').length,
      pending: rows.filter(r => r.status === 'pending' || r.status === 'verifying').length,
    }),
    [rows]
  );

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Globe className="h-7 w-7 text-primary" aria-hidden />
              Domaines & DNS
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vue plateforme des domaines personnalisés connectés aux boutiques.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Actifs / vérifiés', value: stats.active },
            { label: 'SSL actif', value: stats.sslOk },
            { label: 'En attente', value: stats.pending },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Domaine ou boutique…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domaines enregistrés</CardTitle>
            <CardDescription>
              Vérification DNS et SSL gérées par les edge functions{' '}
              <code className="text-xs">verify-custom-domain</code> /{' '}
              <code className="text-xs">check-ssl-expiration</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Aucun domaine trouvé.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domaine</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Créé</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.domain}</TableCell>
                      <TableCell>
                        {row.stores?.name ?? '—'}
                        {row.stores?.slug && (
                          <span className="block text-xs text-muted-foreground">
                            {row.stores.slug}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {row.ssl_status ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.is_primary ? 'Oui' : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/stores`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
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
