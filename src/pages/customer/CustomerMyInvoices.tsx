/**
 * Page Mes Factures - Historique des factures client
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste toutes les factures du client
 * - Filtres par statut et date
 * - Recherche
 * - Téléchargement PDF
 * - Vue détaillée facture
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo, useEffect } from 'react';
import { useInvoices } from '@/hooks/invoice/useInvoice';
import { downloadInvoicePDF } from '@/components/invoice/InvoicePDFGenerator';
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export default function CustomerMyInvoices() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const { data: invoices, isLoading, refetch } = useInvoices(user?.id);

  // Filtrer les factures
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    let filtered = invoices;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.billing_address?.name?.toLowerCase().includes(query) ||
        inv.store_info?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [invoices, statusFilter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    if (!invoices) {
      return { total: 0, paid: 0, pending: 0, totalAmount: 0 };
    }

    return {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      pending: invoices.filter(inv => ['sent', 'draft'].includes(inv.status)).length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    };
  }, [invoices]);

  // Gérer le téléchargement PDF
  const handleDownloadPDF = async (invoice: any) => {
    try {
      setGeneratingPDF(invoice.id);
      await downloadInvoicePDF(invoice);
      toast({
        title: 'PDF téléchargé',
        description: `Facture ${invoice.invoice_number} téléchargée avec succès`,
      });
    } catch (error: any) {
      logger.error('Error downloading invoice PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPDF(null);
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      paid: { label: 'Payée', variant: 'default', icon: CheckCircle },
      sent: { label: 'Envoyée', variant: 'secondary', icon: Clock },
      draft: { label: 'Brouillon', variant: 'outline', icon: FileText },
      overdue: { label: 'Échue', variant: 'destructive', icon: AlertCircle },
      cancelled: { label: 'Annulée', variant: 'outline', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: FileText };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Formater la devise
  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'XOF' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Mes Factures
              </h1>
              <p className="text-muted-foreground mt-1">
                Consultez et téléchargez toutes vos factures
              </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total factures</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                  <p className="text-xs text-muted-foreground">Payées</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                  <p className="text-xs text-muted-foreground">Montant total</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro, nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="paid">Payées</SelectItem>
                      <SelectItem value="sent">Envoyées</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                      <SelectItem value="overdue">Échues</SelectItem>
                      <SelectItem value="cancelled">Annulées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste vide */}
            {!isLoading && filteredInvoices.length === 0 && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Aucune facture ne correspond à vos critères de recherche.'
                    : 'Vous n\'avez pas encore de factures.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Liste des factures */}
            {filteredInvoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des Factures</CardTitle>
                  <CardDescription>
                    {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''} trouvée{filteredInvoices.length > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {invoice.store_info?.name || 'Boutique'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPDF(invoice)}
                                disabled={generatingPDF === invoice.id}
                              >
                                {generatingPDF === invoice.id ? (
                                  <>
                                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Génération...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    PDF
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

