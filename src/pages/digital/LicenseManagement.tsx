/**
 * License Management Page - Admin/Vendor View
 * Date: 27 octobre 2025
 * 
 * Page de gestion des licenses pour admins et vendeurs
 */

import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { LicenseTable } from '@/components/digital/LicenseTable';
import { LicenseGenerator } from '@/components/digital/LicenseGenerator';
import { useToast } from '@/hooks/use-toast';

export const LicenseManagement = () => {
  const { store } = useStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Gestion des Licenses</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez et générez des licenses pour vos produits digitaux
                </p>
              </div>
              
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Générer License
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actives</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <p className="text-xs text-muted-foreground">
                    Licenses actives
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expirées</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <p className="text-xs text-muted-foreground">
                    À renouveler
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suspendues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <p className="text-xs text-muted-foreground">
                    En attente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Toutes licenses
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrer & Rechercher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par clé, email, produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actives</SelectItem>
                      <SelectItem value="expired">Expirées</SelectItem>
                      <SelectItem value="suspended">Suspendues</SelectItem>
                      <SelectItem value="revoked">Révoquées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* License Table */}
            <LicenseTable
              searchQuery={searchQuery}
              statusFilter={statusFilter}
            />

            {/* License Generator Dialog */}
            <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Générer des Licenses</DialogTitle>
                  <DialogDescription>
                    Créez des licenses pour vos produits digitaux
                  </DialogDescription>
                </DialogHeader>
                <LicenseGenerator
                  onSuccess={() => {
                    setShowGenerator(false);
                    toast({
                      title: 'Succès',
                      description: 'Licenses générées avec succès',
                    });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LicenseManagement;

