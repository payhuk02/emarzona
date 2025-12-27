import { useEffect, useMemo, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Search, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';

type AdminActionRow = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: unknown;
  created_at: string;
  actor?: { full_name?: string | null; email?: string | null } | null;
};

export default function AdminAudit() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<AdminActionRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    logger.info("Chargement des logs d'audit admin");
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error) {
        setRows((data ?? []) as AdminActionRow[]);
        logger.info(`${data?.length || 0} actions d'audit chargées`);
      } else {
        logger.error("Erreur lors du chargement des logs d'audit:", error);
      }
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

  const exportCSV = useCallback(() => {
    logger.info(`Export CSV de ${filtered.length} actions d'audit`);
    const header = ['date', 'action', 'target_type', 'target_id', 'actor_id', 'metadata'];
    const lines = [header.join(',')].concat(
      filtered.map(r =>
        [
          new Date(r.created_at).toISOString(),
          r.action,
          r.target_type ?? '',
          r.target_id ?? '',
          r.actor_id,
          JSON.stringify(r.metadata ?? {}),
        ]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logger.info('Export CSV réussi');
  }, [filtered]);

  const exportJSON = useCallback(() => {
    logger.info(`Export JSON de ${filtered.length} actions d'audit`);
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logger.info('Export JSON réussi');
  }, [filtered]);

  return (
    <AdminLayout>
      <ProtectedAction
        permission="settings.manage"
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Journal d'audit
              </CardTitle>
              <CardDescription>Accès restreint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Vous n'avez pas l'autorisation d'afficher ce journal.
              </div>
            </CardContent>
          </Card>
        }
      >
        <RequireAAL2>
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            <Admin2FABanner />

            {/* Header avec animation - Style Inventory */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Shield
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Journal d'audit
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Suivi des actions critiques réalisées par les administrateurs
                </p>
              </div>
            </div>

            <Card
              ref={tableRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
            >
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Logs</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Dernières 200 actions
                </CardDescription>
                <div className="flex flex-col gap-3 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher (action, cible, id)"
                        value={search}
                        onChange={e => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        className="pl-8 sm:pl-10 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                    <Input
                      placeholder="Filtrer action"
                      value={actionFilter}
                      onChange={e => {
                        setActionFilter(e.target.value);
                        setPage(1);
                      }}
                      className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                    />
                    <Input
                      placeholder="Filtrer acteur (UUID)"
                      value={actorFilter}
                      onChange={e => {
                        setActorFilter(e.target.value);
                        setPage(1);
                      }}
                      className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={e => {
                          setFromDate(e.target.value);
                          setPage(1);
                        }}
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                      <Input
                        type="date"
                        value={toDate}
                        onChange={e => {
                          setToDate(e.target.value);
                          setPage(1);
                        }}
                        className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={exportCSV}
                          size="sm"
                          className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Exporter CSV</span>
                          <span className="sm:hidden">CSV</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={exportJSON}
                          size="sm"
                          className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Exporter JSON</span>
                          <span className="sm:hidden">JSON</span>
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Page</span>
                        <Input
                          className="w-16 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                          type="number"
                          min={1}
                          value={page}
                          onChange={e => setPage(Math.max(1, Number(e.target.value) || 1))}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          / {Math.max(1, Math.ceil(filtered.length / pageSize))}
                        </span>
                        <select
                          className="border rounded px-2 py-1 text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 touch-manipulation cursor-pointer"
                          value={pageSize}
                          onChange={e => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                          }}
                        >
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
                  <div className="py-10 text-center text-muted-foreground">
                    Aucune action trouvée
                  </div>
                ) : isMobile ? (
                  <MobileTableCard
                    data={paged.map(r => ({ ...r, id: r.id }))}
                    columns={[
                      {
                        key: 'date',
                        label: 'Date',
                        priority: 'high',
                        render: (row: AdminActionRow) => (
                          <span className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </span>
                        ),
                      },
                      {
                        key: 'action',
                        label: 'Action',
                        priority: 'high',
                        render: (row: AdminActionRow) => (
                          <Badge variant="secondary" className="text-xs">
                            {row.action}
                          </Badge>
                        ),
                      },
                      {
                        key: 'target_type',
                        label: 'Cible',
                        priority: 'medium',
                        render: (row: AdminActionRow) => (
                          <span className="text-xs">{row.target_type || '-'}</span>
                        ),
                      },
                      {
                        key: 'target_id',
                        label: 'Id cible',
                        priority: 'low',
                        render: (row: AdminActionRow) => (
                          <span className="font-mono text-[10px] break-all">
                            {row.target_id || '-'}
                          </span>
                        ),
                      },
                      {
                        key: 'actor_id',
                        label: 'Admin',
                        priority: 'medium',
                        render: (row: AdminActionRow) => (
                          <span className="font-mono text-[10px] break-all">{row.actor_id}</span>
                        ),
                      },
                      {
                        key: 'metadata',
                        label: 'Détails',
                        priority: 'low',
                        render: (row: AdminActionRow) => (
                          <pre className="text-[10px] whitespace-pre-wrap break-all max-h-32 overflow-auto">
                            {JSON.stringify(row.metadata ?? {}, null, 2)}
                          </pre>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                            Date
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                            Action
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                            Cible
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                            Id cible
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                            Admin
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm">
                            Détails
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                              {new Date(r.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="secondary" className="text-xs">
                                {r.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                              {r.target_type || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] sm:text-xs whitespace-nowrap">
                              {r.target_id || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] sm:text-xs whitespace-nowrap">
                              {r.actor_id}
                            </TableCell>
                            <TableCell>
                              <pre className="text-[10px] sm:text-xs whitespace-pre-wrap max-w-[200px] sm:max-w-[520px] overflow-auto">
                                {JSON.stringify(r.metadata ?? {}, null, 2)}
                              </pre>
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






