/**
 * Admin — Vue plateforme des clés API publiques (toutes boutiques)
 */

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Search, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  store_id: string;
  stores: { name: string; slug: string } | null;
};

export default function AdminApiKeys() {
  const { can, loading: permLoading } = useCurrentAdminPermissions();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select(
          `
          id, name, key_prefix, is_active, last_used_at, expires_at, created_at, store_id,
          stores ( name, slug )
        `
        )
        .order('created_at', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      setRows((data as ApiKeyRow[]) || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur de chargement';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permLoading && can('settings.manage')) {
      load();
    } else if (!permLoading) {
      setLoading(false);
    }
  }, [permLoading, can, load]);

  const toggleActive = async (id: string, active: boolean) => {
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ is_active: active })
      .eq('id', id);

    if (updateError) {
      toast({ title: 'Erreur', description: updateError.message, variant: 'destructive' });
      return;
    }
    toast({ title: active ? 'Clé activée' : 'Clé révoquée' });
    await load();
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.key_prefix.toLowerCase().includes(q) ||
      (r.stores?.name ?? '').toLowerCase().includes(q) ||
      (r.stores?.slug ?? '').toLowerCase().includes(q)
    );
  });

  if (!permLoading && !can('settings.manage')) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Permission settings.manage requise.</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <KeyRound className="h-7 w-7 text-primary" />
              Clés API plateforme
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Supervision des clés API publiques (`/api/v1`). Les secrets complets ne sont jamais
              stockés en clair.
            </p>
          </div>
          {import.meta.env.VITE_SUPABASE_URL && (
            <Button variant="outline" asChild>
              <a
                href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Endpoint API v1
              </a>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventaire</CardTitle>
            <CardDescription>
              {filtered.length} clé(s) — révoquez une clé compromise sans supprimer
              l&apos;historique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher boutique, nom, préfixe…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Préfixe</TableHead>
                      <TableHead>Boutique</TableHead>
                      <TableHead>Dernière utilisation</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Actif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucune clé API
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map(row => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {row.key_prefix}…
                            </code>
                          </TableCell>
                          <TableCell>
                            {row.stores ? (
                              <Link
                                to={`/admin/stores`}
                                className="text-primary hover:underline text-sm"
                              >
                                {row.stores.name}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.last_used_at
                              ? format(new Date(row.last_used_at), 'dd MMM yyyy HH:mm', {
                                  locale: fr,
                                })
                              : 'Jamais'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.expires_at
                              ? format(new Date(row.expires_at), 'dd MMM yyyy', { locale: fr })
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={Boolean(row.is_active)}
                              onCheckedChange={v => toggleActive(row.id, v)}
                              disabled={!can('settings.manage')}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
