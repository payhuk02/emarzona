import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Search, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';

type AdminActionRow = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
  actor?: { full_name?: string | null; email?: string | null } | null;
};

export default function AdminAudit() {
  const [rows, setRows] = useState<AdminActionRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error) setRows(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const passText = (r: AdminActionRow) =>
      r.action.toLowerCase().includes(q) ||
      (r.target_type ?? '').toLowerCase().includes(q) ||
      (r.target_id ?? '').toLowerCase().includes(q);
    const passAction = !actionFilter || r.action.toLowerCase().includes(actionFilter.toLowerCase());
    const passActor = !actorFilter || r.actor_id.toLowerCase().includes(actorFilter.toLowerCase());
    const passFrom = !fromDate || new Date(r.created_at) >= new Date(fromDate);
    const passTo = !toDate || new Date(r.created_at) <= new Date(toDate);
    return rows.filter(r => passText(r) && passAction && passActor && passFrom && passTo);
  }, [rows, search, actionFilter, actorFilter, fromDate, toDate]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const exportCSV = () => {
    const header = ['date', 'action', 'target_type', 'target_id', 'actor_id', 'metadata'];
    const lines = [header.join(',')].concat(
      filtered.map(r => [
        new Date(r.created_at).toISOString(),
        r.action,
        r.target_type ?? '',
        r.target_id ?? '',
        r.actor_id,
        JSON.stringify(r.metadata ?? {}),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <ProtectedAction permission="settings.manage" fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/>Journal d'audit</CardTitle>
            <CardDescription>Accès restreint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">Vous n'avez pas l'autorisation d'afficher ce journal.</div>
          </CardContent>
        </Card>
      }>
        <RequireAAL2>
        <div className="space-y-6">
          <Admin2FABanner />
          <div>
            <h1 className="text-3xl font-bold">Journal d'audit (administration)</h1>
            <p className="text-muted-foreground">Suivi des actions critiques réalisées par les administrateurs</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
              <CardDescription>Dernières 200 actions</CardDescription>
              <div className="flex flex-col gap-3 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher (action, cible, id)" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                  </div>
                  <Input placeholder="Filtrer action" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} />
                  <Input placeholder="Filtrer acteur (UUID)" value={actorFilter} onChange={e => { setActorFilter(e.target.value); setPage(1); }} />
                  <div className="flex items-center gap-2">
                    <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                    <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                  </div>
                </div>
                <div className="relative flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={exportCSV}>
                        <Download className="h-4 w-4 mr-2"/>Exporter CSV
                      </Button>
                      <Button variant="outline" onClick={exportJSON}>Exporter JSON</Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Page</span>
                      <Input className="w-16" type="number" min={1} value={page} onChange={e => setPage(Math.max(1, Number(e.target.value)||1))} />
                      <span className="text-sm text-muted-foreground">/ {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
                      <select className="border rounded px-2 py-1 text-sm" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">Chargement…</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">Aucune action trouvée</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Cible</TableHead>
                        <TableHead>Id cible</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="secondary">{r.action}</Badge></TableCell>
                          <TableCell>{r.target_type || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{r.target_id || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{r.actor_id}</TableCell>
                          <TableCell>
                            <pre className="text-xs whitespace-pre-wrap max-w-[520px] overflow-auto">{JSON.stringify(r.metadata ?? {}, null, 2)}</pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </RequireAAL2>
      </ProtectedAction>
    </AdminLayout>
  );
}


