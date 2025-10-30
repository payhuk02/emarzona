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
    return rows.filter(r =>
      r.action.toLowerCase().includes(q) ||
      (r.target_type ?? '').toLowerCase().includes(q) ||
      (r.target_id ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

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
              <div className="flex items-center gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher (action, cible, id)" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2"/>Exporter CSV
                </Button>
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
                      {filtered.map(r => (
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


