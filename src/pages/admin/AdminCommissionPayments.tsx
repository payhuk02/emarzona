/**
 * Page Admin - Gestion des Paiements de Commissions
 * Date: 31 Janvier 2025
 *
 * Interface pour gérer les paiements de commissions (parrainage et affiliation)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommissionPayment {
  id: string;
  affiliate_id?: string;
  referrer_id?: string;
  commission_ids: string[];
  amount: number;
  currency: string;
  payment_method: string;
  payment_details: Record<string, unknown>;
  status: string;
  approved_at?: string;
  approved_by?: string;
  processed_at?: string;
  processed_by?: string;
  transaction_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    name?: string;
  };
}

type AffiliateWithdrawalRow = Omit<CommissionPayment, 'user'> & {
  affiliates?: {
    email?: string | null;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

type ReferralCommissionPaymentRow = Omit<CommissionPayment, 'user'> & {
  profiles?: {
    email?: string | null;
    full_name?: string | null;
  } | null;
};

export default function AdminCommissionPayments() {
  const { can } = useCurrentAdminPermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedPayment, setSelectedPayment] = useState<CommissionPayment | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [transactionReference, setTransactionReference] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'affiliate' | 'referral'>('all');
  const hasAccess = can('settings.manage');

  // Récupérer les paiements d'affiliation
  const { data: affiliatePayments = [], isLoading: loadingAffiliate } = useQuery({
    queryKey: ['affiliate-payments', statusFilter],
    queryFn: async () => {
      let  query= supabase
        .from('affiliate_withdrawals')
        .select(
          `
          *,
          affiliates!inner(
            email,
            display_name,
            first_name,
            last_name
          )
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as AffiliateWithdrawalRow[]).map(p => ({
        ...p,
        type: 'affiliate' as const,
        user: {
          email: p.affiliates?.email || '',
          name: p.affiliates?.display_name || p.affiliates?.first_name || '',
        },
      })) as CommissionPayment[];
    },
    enabled: hasAccess && (typeFilter === 'all' || typeFilter === 'affiliate'),
  });

  // Récupérer les paiements de parrainage
  const { data: referralPayments = [], isLoading: loadingReferral } = useQuery({
    queryKey: ['referral-payments', statusFilter],
    queryFn: async () => {
      let  query= supabase
        .from('commission_payments')
        .select(
          `
          *,
          profiles!referrer_id(
            email,
            full_name
          )
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as ReferralCommissionPaymentRow[]).map(p => ({
        ...p,
        type: 'referral' as const,
        user: {
          email: p.profiles?.email || '',
          name: p.profiles?.full_name || '',
        },
      })) as CommissionPayment[];
    },
    enabled: hasAccess && (typeFilter === 'all' || typeFilter === 'referral'),
  });

  // Combiner les paiements
  const allPayments = [
    ...(typeFilter === 'all' || typeFilter === 'affiliate' ? affiliatePayments : []),
    ...(typeFilter === 'all' || typeFilter === 'referral' ? referralPayments : []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Approuver un paiement
  const approvePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payment = allPayments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      const tableName =
        payment.type === 'affiliate' ? 'affiliate_withdrawals' : 'commission_payments';

      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-payments'] });
      queryClient.invalidateQueries({ queryKey: ['referral-payments'] });
      toast({
        title: '✅ Paiement approuvé',
        description: 'Le paiement a été approuvé avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Traiter un paiement
  const processPayment = useMutation({
    mutationFn: async ({
      paymentId,
      transactionReference,
    }: {
      paymentId: string;
      transactionReference: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payment = allPayments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      const tableName =
        payment.type === 'affiliate' ? 'affiliate_withdrawals' : 'commission_payments';

      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          transaction_reference: transactionReference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .in('status', ['approved', 'processing']);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-payments'] });
      queryClient.invalidateQueries({ queryKey: ['referral-payments'] });
      setShowProcessDialog(false);
      setSelectedPayment(null);
      setTransactionReference('');
      toast({
        title: '✅ Paiement traité',
        description: 'Le paiement a été marqué comme complété',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const  variants: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: typeof CheckCircle;
        label: string;
      }
    > = {
      pending: { variant: 'outline', icon: Clock, label: 'En attente' },
      approved: { variant: 'secondary', icon: CheckCircle, label: 'Approuvé' },
      processing: { variant: 'default', icon: Loader2, label: 'En traitement' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Complété' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Échoué' },
      cancelled: { variant: 'outline', icon: XCircle, label: 'Annulé' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isLoading = loadingAffiliate || loadingReferral;

  if (!hasAccess) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6 animate-fade-in">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <DollarSign className="h-8 w-8" />
              Paiements de Commissions
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les paiements de commissions de parrainage et d'affiliation
            </p>
          </div>
        </div>
        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label>Type:</Label>
                <Select
                  value={typeFilter}
                  onValueChange={value => setTypeFilter(value as typeof typeFilter)}
                >
                  <SelectTrigger className="w-40 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="affiliate">Affiliation</SelectItem>
                    <SelectItem value="referral">Parrainage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Statut:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">
                    {allPayments.filter(p => p.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approuvés</p>
                  <p className="text-2xl font-bold">
                    {allPayments.filter(p => p.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Complétés</p>
                  <p className="text-2xl font-bold">
                    {allPayments.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    {allPayments
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                      .toLocaleString('fr-FR')}{' '}
                    XOF
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des paiements */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Paiements</CardTitle>
            <CardDescription>{allPayments.length} paiement(s) au total</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : allPayments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun paiement trouvé avec les filtres sélectionnés.
                </AlertDescription>
              </Alert>
            ) : isMobile ? (
              <MobileTableCard
                data={allPayments.map(p => ({ ...p, id: p.id }))}
                columns={[
                  {
                    key: 'user',
                    header: 'Utilisateur',
                    priority: 'high',
                    render: row => (
                      <div>
                        <p className="font-medium">{row.user?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{row.user?.email || 'N/A'}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'type',
                    header: 'Type',
                    priority: 'medium',
                    render: row => (
                      <Badge variant={row.type === 'affiliate' ? 'default' : 'secondary'}>
                        {row.type === 'affiliate' ? 'Affiliation' : 'Parrainage'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'amount',
                    header: 'Montant',
                    priority: 'high',
                    render: row => (
                      <span className="font-mono font-semibold">
                        {Number(row.amount).toLocaleString('fr-FR')} {row.currency}
                      </span>
                    ),
                  },
                  {
                    key: 'payment_method',
                    header: 'Méthode',
                    priority: 'low',
                    render: row =>
                      row.payment_method === 'mobile_money'
                        ? 'Mobile Money'
                        : row.payment_method === 'bank_transfer'
                          ? 'Virement Bancaire'
                          : row.payment_method === 'paypal'
                            ? 'PayPal'
                            : row.payment_method,
                  },
                  {
                    key: 'status',
                    header: 'Statut',
                    priority: 'high',
                    render: row => getStatusBadge(row.status),
                  },
                  {
                    key: 'created_at',
                    header: 'Date',
                    priority: 'low',
                    render: row => (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(row.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    ),
                  },
                ]}
                actions={row => (
                  <div className="flex flex-col gap-2">
                    {row.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approvePayment.mutate(row.id)}
                        disabled={approvePayment.isPending}
                        className="min-h-[44px] w-full"
                      >
                        {approvePayment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Approuver'
                        )}
                      </Button>
                    )}
                    {(row.status === 'approved' || row.status === 'processing') && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(row);
                          setShowProcessDialog(true);
                        }}
                        className="min-h-[44px] w-full"
                      >
                        Traiter
                      </Button>
                    )}
                    {row.status === 'completed' && row.transaction_reference && (
                      <Badge variant="outline" className="text-xs w-full justify-center">
                        {row.transaction_reference}
                      </Badge>
                    )}
                  </div>
                )}
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{payment.user?.name || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                {payment.user?.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.type === 'affiliate' ? 'default' : 'secondary'}>
                            {payment.type === 'affiliate' ? 'Affiliation' : 'Parrainage'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {Number(payment.amount).toLocaleString('fr-FR')} {payment.currency}
                        </TableCell>
                        <TableCell>
                          {payment.payment_method === 'mobile_money'
                            ? 'Mobile Money'
                            : payment.payment_method === 'bank_transfer'
                              ? 'Virement Bancaire'
                              : payment.payment_method === 'paypal'
                                ? 'PayPal'
                                : payment.payment_method}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approvePayment.mutate(payment.id)}
                                disabled={approvePayment.isPending}
                                className="min-h-[44px]"
                              >
                                {approvePayment.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Approuver'
                                )}
                              </Button>
                            )}
                            {(payment.status === 'approved' || payment.status === 'processing') && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowProcessDialog(true);
                                }}
                                className="min-h-[44px]"
                              >
                                Traiter
                              </Button>
                            )}
                            {payment.status === 'completed' && payment.transaction_reference && (
                              <Badge variant="outline" className="text-xs">
                                {payment.transaction_reference}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour traiter un paiement */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Traiter le Paiement</DialogTitle>
              <DialogDescription>
                Marquer ce paiement comme complété après avoir effectué le virement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedPayment && (
                <>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Utilisateur:</span>
                      <span className="font-medium">
                        {selectedPayment.user?.name || selectedPayment.user?.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Montant:</span>
                      <span className="font-mono font-medium">
                        {Number(selectedPayment.amount).toLocaleString('fr-FR')}{' '}
                        {selectedPayment.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Méthode:</span>
                      <span>{selectedPayment.payment_method}</span>
                    </div>
                    {selectedPayment.payment_details &&
                      Object.keys(selectedPayment.payment_details).length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Détails:</p>
                          <pre className="text-xs bg-background p-2 rounded">
                            {JSON.stringify(selectedPayment.payment_details, null, 2)}
                          </pre>
                        </div>
                      )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionReference">Référence de Transaction *</Label>
                    <Input
                      id="transactionReference"
                      value={transactionReference}
                      onChange={e => setTransactionReference(e.target.value)}
                      placeholder="Ex: MTN-1234567890 ou VIR-20250131-001"
                    />
                    <p className="text-sm text-muted-foreground">
                      Entrez la référence de la transaction (numéro de transaction mobile money,
                      référence virement, etc.)
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowProcessDialog(false);
                  setSelectedPayment(null);
                  setTransactionReference('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!selectedPayment || !transactionReference.trim()) {
                    toast({
                      title: 'Erreur',
                      description: 'Veuillez entrer une référence de transaction',
                      variant: 'destructive',
                    });
                    return;
                  }
                  processPayment.mutate({
                    paymentId: selectedPayment.id,
                    transactionReference: transactionReference.trim(),
                  });
                }}
                disabled={processPayment.isPending || !transactionReference.trim()}
              >
                {processPayment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  'Marquer comme Complété'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}






