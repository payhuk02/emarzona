import { useState, useMemo, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { UserPlus, Download, Search, TrendingUp, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminReferrals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles!referrals_referrer_id_fkey(display_name, first_name, last_name),
          referred:profiles!referrals_referred_id_fkey(display_name, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: referralCommissions } = useQuery({
    queryKey: ['admin-referral-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => ({
    totalReferrals: referrals?.length || 0,
    activeReferrals: referrals?.filter(r => r.status === 'active').length || 0,
    totalCommissions: referralCommissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0,
  }), [referrals, referralCommissions]);

  useEffect(() => {
    if (!isLoading && referrals) {
      logger.info(`Admin Referrals: ${referrals.length} parrainages chargés`);
    }
  }, [isLoading, referrals]);

  const exportToCSV = useCallback(() => {
    if (!referrals) return;
    logger.info(`Export CSV de ${referrals.length} parrainages`);

    const csvContent = [
      ['Parrain', 'Filleul', 'Code', 'Statut', 'Date'].join(','),
      ...referrals.map((ref: any) =>
        [
          ref.referrer?.display_name || 'N/A',
          ref.referred?.display_name || 'N/A',
          ref.referral_code,
          ref.status,
          new Date(ref.created_at).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parrainages_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    logger.info('Export CSV parrainages réussi');
    toast({
      title: 'Export réussi',
      description: 'Les parrainages ont été exportés avec succès.',
    });
  }, [referrals, toast]);

  const filteredReferrals = useMemo(() => referrals?.filter((ref: any) =>
    ref.referrer?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referred?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [], [referrals, searchTerm]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div ref={headerRef} className="flex items-center justify-between" role="banner">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent" id="admin-referrals-title">
              Gestion des parrainages
            </h1>
            <p className="text-muted-foreground mt-2">
              Suivi des parrainages et commissions (2%)
            </p>
          </div>
          <UserPlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>

        {/* Stats Cards */}
        <div ref={statsRef} className="grid gap-6 md:grid-cols-3" role="region" aria-label="Statistiques des parrainages">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Parrainages
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalReferrals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeReferrals} actifs
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commissions Totales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-pink-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                {formatCurrency(stats.totalCommissions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                2% sur ventes filleuls
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux de Conversion
              </CardTitle>
              <UserPlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats.totalReferrals > 0 ? Math.round((stats.activeReferrals / stats.totalReferrals) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Parrainages actifs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des parrainages</CardTitle>
                <CardDescription>
                  Tous les parrainages de la plateforme
                </CardDescription>
              </div>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parrain</TableHead>
                  <TableHead>Filleul</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals?.map((referral: any) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      {referral.referrer?.display_name || 
                       `${referral.referrer?.first_name || ''} ${referral.referrer?.last_name || ''}`.trim() || 
                       'N/A'}
                    </TableCell>
                    <TableCell>
                      {referral.referred?.display_name || 
                       `${referral.referred?.first_name || ''} ${referral.referred?.last_name || ''}`.trim() || 
                       'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{referral.referral_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={referral.status === 'active' ? 'default' : 'secondary'}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredReferrals?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucun parrainage trouvé
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commissions de parrainage</CardTitle>
            <CardDescription>
              Historique des commissions générées (2%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant Total</TableHead>
                  <TableHead>Commission (2%)</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralCommissions?.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(commission.total_amount)}
                    </TableCell>
                    <TableCell className="font-bold text-pink-600">
                      {formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={commission.status === 'completed' ? 'default' : 'secondary'}>
                        {commission.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {referralCommissions?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucune commission trouvée
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
