/**
 * Page: AdminAffiliates
 * Description: Panel d'administration pour le système d'affiliation
 * Date: 25/10/2025
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAffiliates } from '@/hooks/useAffiliates';
import { useAffiliateCommissions } from '@/hooks/useAffiliateCommissions';
import { useAffiliateWithdrawals, usePendingWithdrawals } from '@/hooks/useAffiliateWithdrawals';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Wallet,
  MousePointerClick,
  ShoppingCart,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  Search,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminAffiliates = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { affiliates, loading: affiliatesLoading, suspendAffiliate, activateAffiliate } = useAffiliates({ 
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    search: searchTerm 
  });
  
  const { commissions, stats, loading: commissionsLoading, approveCommission, rejectCommission, markAsPaid } = 
    useAffiliateCommissions();
  
  const { withdrawals, approveWithdrawal, rejectWithdrawal, completeWithdrawal } = useAffiliateWithdrawals();
  const { pending: pendingWithdrawals, totalAmount: pendingAmount } = usePendingWithdrawals();

  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Stats globales
  const globalStats = {
    total_affiliates: affiliates.length,
    active_affiliates: affiliates.filter(a => a.status === 'active').length,
    suspended_affiliates: affiliates.filter(a => a.status === 'suspended').length,
    total_clicks: affiliates.reduce((sum, a) => sum + a.total_clicks, 0),
    total_sales: affiliates.reduce((sum, a) => sum + a.total_sales, 0),
    total_revenue: affiliates.reduce((sum, a) => sum + a.total_revenue, 0),
    total_commission_earned: affiliates.reduce((sum, a) => sum + a.total_commission_earned, 0),
    total_commission_paid: affiliates.reduce((sum, a) => sum + a.total_commission_paid, 0),
    pending_commission: affiliates.reduce((sum, a) => sum + a.pending_commission, 0),
  };

  const handleApproveCommission = async (commission: any) => {
    await approveCommission({ commission_id: commission.id });
  };

  const handleRejectCommission = async () => {
    if (selectedCommission && rejectReason) {
      await rejectCommission({ 
        commission_id: selectedCommission.id, 
        rejection_reason: rejectReason 
      });
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedCommission(null);
    }
  };

  const handlePayCommission = async () => {
    if (selectedCommission && paymentReference) {
      await markAsPaid({
        commission_id: selectedCommission.id,
        payment_method: 'mobile_money',
        payment_reference: paymentReference,
      });
      setShowPayDialog(false);
      setPaymentReference('');
      setSelectedCommission(null);
    }
  };

  const handleApproveWithdrawal = async (withdrawal: any) => {
    await approveWithdrawal(withdrawal.id);
  };

  const handleRejectWithdrawal = async () => {
    if (selectedWithdrawal && rejectReason) {
      await rejectWithdrawal(selectedWithdrawal.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedWithdrawal(null);
    }
  };

  const handleCompleteWithdrawal = async () => {
    if (selectedWithdrawal && paymentReference) {
      await completeWithdrawal(selectedWithdrawal.id, paymentReference);
      setShowPayDialog(false);
      setPaymentReference('');
      setSelectedWithdrawal(null);
    }
  };

  const handleSuspendAffiliate = async () => {
    if (selectedAffiliate && suspendReason) {
      await suspendAffiliate(selectedAffiliate.id, suspendReason);
      setShowSuspendDialog(false);
      setSuspendReason('');
      setSelectedAffiliate(null);
    }
  };

  const handleActivateAffiliate = async (affiliate: any) => {
    await activateAffiliate(affiliate.id);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Affilié', 'Email', 'Code', 'Clics', 'Ventes', 'CA', 'Commissions', 'Statut'].join(','),
      ...affiliates.map((aff) =>
        [
          aff.display_name || 'N/A',
          aff.email,
          aff.affiliate_code,
          aff.total_clicks,
          aff.total_sales,
          aff.total_revenue,
          aff.total_commission_earned,
          aff.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affilies_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (affiliatesLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gestion du système d'affiliation
            </h1>
            <p className="text-muted-foreground mt-2">
              Superviser l'ensemble des affiliés et leurs performances
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Alertes en attente */}
        {(pendingWithdrawals.length > 0 || commissions.filter(c => c.status === 'pending').length > 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Actions requises</AlertTitle>
            <AlertDescription>
              {pendingWithdrawals.length > 0 && (
                <p>• {pendingWithdrawals.length} demande(s) de retrait en attente ({formatCurrency(pendingAmount)})</p>
              )}
              {commissions.filter(c => c.status === 'pending').length > 0 && (
                <p>• {commissions.filter(c => c.status === 'pending').length} commission(s) en attente d'approbation</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats globales */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Affiliés actifs
              </CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {globalStats.active_affiliates}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sur {globalStats.total_affiliates} total
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventes totales
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {globalStats.total_sales}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {globalStats.total_clicks} clics au total
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CA généré
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(globalStats.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Via affiliation
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commissions versées
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(globalStats.total_commission_paid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(globalStats.pending_commission)} en attente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="affiliates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="affiliates">
              Affiliés ({affiliates.length})
            </TabsTrigger>
            <TabsTrigger value="commissions">
              Commissions
              {commissions.filter(c => c.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {commissions.filter(c => c.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              Retraits
              {pendingWithdrawals.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingWithdrawals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          {/* Affiliés */}
          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Liste des affiliés</CardTitle>
                    <CardDescription>
                      Gérer tous les affiliés de la plateforme
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="suspended">Suspendus</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affilié</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Clics</TableHead>
                      <TableHead className="text-right">Ventes</TableHead>
                      <TableHead className="text-right">CA</TableHead>
                      <TableHead className="text-right">Commissions</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => {
                      const conversionRate = affiliate.total_clicks > 0 
                        ? ((affiliate.total_sales / affiliate.total_clicks) * 100).toFixed(1) 
                        : '0';
                      
                      return (
                        <TableRow key={affiliate.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{affiliate.display_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{affiliate.affiliate_code}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <MousePointerClick className="h-3 w-3" />
                              {affiliate.total_clicks}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {affiliate.total_sales}
                            <p className="text-xs text-muted-foreground">
                              {conversionRate}%
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(affiliate.total_revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-semibold text-orange-600">
                                {formatCurrency(affiliate.total_commission_earned)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Payé : {formatCurrency(affiliate.total_commission_paid)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {affiliate.status === 'active' && (
                              <Badge className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Actif
                              </Badge>
                            )}
                            {affiliate.status === 'suspended' && (
                              <Badge variant="destructive" className="gap-1">
                                <Ban className="h-3 w-3" />
                                Suspendu
                              </Badge>
                            )}
                            {affiliate.status === 'pending' && (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                En attente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {affiliate.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setShowSuspendDialog(true);
                                }}
                                className="gap-2"
                              >
                                <Ban className="h-3 w-3" />
                                Suspendre
                              </Button>
                            ) : affiliate.status === 'suspended' ? (
                              <Button
                                size="sm"
                                onClick={() => handleActivateAffiliate(affiliate)}
                                className="gap-2"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Activer
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des commissions</CardTitle>
                <CardDescription>
                  Approuver, rejeter ou marquer les commissions comme payées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Affilié</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Vente</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.slice(0, 20).map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="text-sm">
                            {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{commission.affiliate?.display_name}</p>
                              <p className="text-xs text-muted-foreground">{commission.affiliate?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{commission.product?.name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(commission.order_total)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
                            {formatCurrency(commission.commission_amount)}
                          </TableCell>
                          <TableCell>
                            {commission.status === 'pending' && (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                En attente
                              </Badge>
                            )}
                            {commission.status === 'approved' && (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Approuvé
                              </Badge>
                            )}
                            {commission.status === 'paid' && (
                              <Badge className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Payé
                              </Badge>
                            )}
                            {commission.status === 'rejected' && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Rejeté
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {commission.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveCommission(commission)}
                                    className="gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedCommission(commission);
                                      setShowRejectDialog(true);
                                    }}
                                    className="gap-1"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Rejeter
                                  </Button>
                                </>
                              )}
                              {commission.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCommission(commission);
                                    setShowPayDialog(true);
                                  }}
                                  className="gap-1"
                                >
                                  <Wallet className="h-3 w-3" />
                                  Marquer payé
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retraits */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des retraits</CardTitle>
                <CardDescription>
                  Traiter les demandes de retrait des affiliés
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingWithdrawals.length > 0 && (
                  <Alert className="mb-6">
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Retraits en attente</AlertTitle>
                    <AlertDescription>
                      {pendingWithdrawals.length} demande(s) pour un total de {formatCurrency(pendingAmount)}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Affilié</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.slice(0, 20).map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="text-sm">
                          {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.affiliate?.display_name}</p>
                            <p className="text-xs text-muted-foreground">{withdrawal.affiliate?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {withdrawal.payment_method.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === 'pending' && (
                            <Badge variant="outline">En attente</Badge>
                          )}
                          {withdrawal.status === 'processing' && (
                            <Badge variant="secondary">En cours</Badge>
                          )}
                          {withdrawal.status === 'completed' && (
                            <Badge className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Complété
                            </Badge>
                          )}
                          {withdrawal.status === 'failed' && (
                            <Badge variant="destructive">Échoué</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {withdrawal.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveWithdrawal(withdrawal)}
                                  className="gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setShowRejectDialog(true);
                                  }}
                                  className="gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Rejeter
                                </Button>
                              </>
                            )}
                            {withdrawal.status === 'processing' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowPayDialog(true);
                                }}
                                className="gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Marquer complété
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Affiliés</CardTitle>
                  <CardDescription>Par chiffre d'affaires généré</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {affiliates
                      .sort((a, b) => b.total_revenue - a.total_revenue)
                      .slice(0, 10)
                      .map((affiliate, index) => (
                        <div key={affiliate.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{affiliate.display_name}</p>
                              <p className="text-xs text-muted-foreground">{affiliate.total_sales} ventes</p>
                            </div>
                          </div>
                          <p className="font-bold text-primary">{formatCurrency(affiliate.total_revenue)}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taux de conversion</CardTitle>
                  <CardDescription>Performance globale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Taux de conversion global</span>
                        <span className="font-bold">
                          {globalStats.total_clicks > 0 
                            ? ((globalStats.total_sales / globalStats.total_clicks) * 100).toFixed(2) 
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ 
                            width: `${globalStats.total_clicks > 0 
                              ? Math.min(((globalStats.total_sales / globalStats.total_clicks) * 100), 100) 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Clics totaux</p>
                        <p className="text-2xl font-bold">{globalStats.total_clicks}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Ventes totales</p>
                        <p className="text-2xl font-bold">{globalStats.total_sales}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Panier moyen</p>
                        <p className="text-2xl font-bold">
                          {globalStats.total_sales > 0 
                            ? formatCurrency(globalStats.total_revenue / globalStats.total_sales)
                            : formatCurrency(0)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Commission moy.</p>
                        <p className="text-2xl font-bold">
                          {globalStats.total_sales > 0 
                            ? formatCurrency(globalStats.total_commission_earned / globalStats.total_sales)
                            : formatCurrency(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter la demande</DialogTitle>
              <DialogDescription>
                Indiquez la raison du rejet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-reason">Raison</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={selectedCommission ? handleRejectCommission : handleRejectWithdrawal}
                disabled={!rejectReason}
              >
                Rejeter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Dialog */}
        <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspendre l'affilié</DialogTitle>
              <DialogDescription>
                Indiquez la raison de la suspension
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="suspend-reason">Raison</Label>
                <Textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Expliquez pourquoi cet affilié est suspendu..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSuspendAffiliate}
                disabled={!suspendReason}
              >
                Suspendre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pay Dialog */}
        <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marquer comme payé</DialogTitle>
              <DialogDescription>
                Entrez la référence de la transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-ref">Référence de paiement</Label>
                <Input
                  id="payment-ref"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ex: TXN-123456789"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={selectedCommission ? handlePayCommission : handleCompleteWithdrawal}
                disabled={!paymentReference}
              >
                Confirmer le paiement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAffiliates;

