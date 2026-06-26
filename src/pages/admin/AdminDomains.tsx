/**
 * Admin — domaines personnalisés toutes boutiques (pagination serveur)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Globe,
  Search,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ADMIN_DOMAIN_PAGE_SIZES } from '@/lib/admin/admin-domains-query';
import {
  DEFAULT_ADMIN_DOMAIN_PAGE_SIZE,
  useAdminDomainStats,
  useAdminDomainsList,
} from '@/hooks/useAdminDomains';

export default function AdminDomains() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_ADMIN_DOMAIN_PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const {
    data: pageData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useAdminDomainsList({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const { data: stats, isLoading: statsLoading } = useAdminDomainStats();

  const rows = pageData?.rows ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-domains'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-domains-stats'] });
    void refetch();
  };

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
          <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats?.totalCount ?? 0 },
            { label: 'Actifs / vérifiés', value: stats?.active ?? 0 },
            { label: 'SSL actif', value: stats?.sslOk ?? 0 },
            { label: 'En attente', value: stats?.pending ?? 0 },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
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
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
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
            {isLoading ? (
              <div className="p-6 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Aucun domaine trouvé.</p>
            ) : (
              <>
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
                    {rows.map(row => (
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
                            <Link to="/admin/stores">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {from}–{to} sur {totalCount} domaines
                    </p>
                    <div className="flex items-center gap-2">
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value => {
                          setPageSize(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_DOMAIN_PAGE_SIZES.map(size => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} / page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm px-2">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage(totalPages)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
