import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAllUsers, type UserFilters } from '@/hooks/useAllUsers';
import { useAdminActions } from '@/hooks/useAdminActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Search, Download, Shield, User, Ban, CheckCircle, Trash2, AlertTriangle, FileDown, ArrowUpDown, ArrowUp, ArrowDown, Filter, Plus, Edit3 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';

const AdminUsers = () => {
  // États pour pagination, tri et filtres
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'created_at' | 'display_name'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    searchTerm: '',
  });
  
  // Hook avec options avancées
  const { users, totalCount, loading, refetch } = useAllUsers({
    page,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  });
  
  const { suspendUser, unsuspendUser, deleteUser, setUserRole, promoteToAdmin } = useAdminActions();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState<{ id: string; email: string } | null>(null);
  const [newRole, setNewRole] = useState<string>('admin');
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminRole, setAddAdminRole] = useState('admin');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const { can } = useCurrentAdminPermissions();
  const { isAAL2 } = useAdminMFA();
  
  // Fonction pour gérer le tri
  const handleSort = useCallback((column: typeof sortBy) => {
    logger.info(`Tri des utilisateurs par ${column}`);
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setPage(1); // Reset à la page 1
  }, [sortBy, sortDirection]);
  
  // Fonction pour gérer les filtres
  const handleFilterChange = useCallback((key: keyof UserFilters, value: any) => {
    logger.info(`Filtre utilisateurs ${key}: ${value}`);
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset à la page 1
  }, []);
  
  // Calculer pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const exportToCSV = useCallback(() => {
    logger.info(`Export CSV de ${users.length} utilisateurs`);
    const csvContent = [
      ['Email', 'Nom complet', 'Prénom', 'Nom', 'Rôle', 'Statut', 'Date d\'inscription'].join(','),
      ...users.map(user =>
        [
          user.email,
          user.display_name || '',
          user.first_name || '',
          user.last_name || '',
          user.role,
          user.is_suspended ? 'Suspendu' : 'Actif',
          new Date(user.created_at).toLocaleDateString('fr-FR')
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    logger.info('Export CSV réussi');
    toast({
      title: "Export réussi",
      description: `${users.length} utilisateur(s) exporté(s) en CSV`,
    });
  }, [users, toast]);

  const exportToPDF = async () => {
    // Créer le contenu HTML pour le PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Liste des Utilisateurs</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4F46E5; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { margin-bottom: 20px; }
            .date { color: #666; font-size: 14px; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-admin { background-color: #4F46E5; color: white; }
            .badge-user { background-color: #e5e7eb; color: #374151; }
            .badge-active { background-color: #10b981; color: white; }
            .badge-suspended { background-color: #ef4444; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liste des Utilisateurs</h1>
            <p class="date">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Total: ${users.length} utilisateur${users.length > 1 ? 's' : ''}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom complet</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date d'inscription</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr>
                  <td>${user.email}</td>
                  <td>${user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.display_name || 'N/A'}</td>
                  <td>
                    <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                      ${user.role}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${user.is_suspended ? 'badge-suspended' : 'badge-active'}">
                      ${user.is_suspended ? 'Suspendu' : 'Actif'}
                    </span>
                  </td>
                  <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Créer un blob et télécharger
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        window.URL.revokeObjectURL(url);
      };
    }

    toast({
      title: "Export PDF lancé",
      description: "La fenêtre d'impression s'ouvre pour générer le PDF",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Admin2FABanner />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <RequireAAL2>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gestion des utilisateurs
            </h1>
            <p className="text-muted-foreground mt-2">
              {totalCount} utilisateur{totalCount > 1 ? 's' : ''} inscrit{totalCount > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {can('users.roles') && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm" onClick={() => setAddAdminOpen(true)} disabled={!isAAL2}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un administrateur
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isAAL2 && (<TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>)}
                </Tooltip>
              </TooltipProvider>
            )}
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <CardDescription>
                  Affichage de {from} à {to} sur {totalCount} utilisateur{totalCount > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV (page actuelle)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exporter PDF (page actuelle)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Filtres avancés */}
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filtres
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recherche */}
                <div className="space-y-2">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Email, nom, prénom..."
                      value={filters.searchTerm || ''}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Filtre par rôle */}
                <div className="space-y-2">
                  <Label htmlFor="role-filter">Rôle</Label>
                  <Select
                    value={filters.role || 'all'}
                    onValueChange={(value) => handleFilterChange('role', value)}
                  >
                    <SelectTrigger id="role-filter">
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Utilisateur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtre par statut */}
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Statut</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Actifs
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center gap-2">
                          <Ban className="h-4 w-4 text-red-600" />
                          Suspendus
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Email - non triable (dans auth.users) */}
                  <TableHead>Email</TableHead>
                  
                  {/* Nom - triable */}
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('display_name')}
                    >
                      Nom complet
                      {sortBy === 'display_name' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  
                  {/* Date d'inscription - triable */}
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('created_at')}
                    >
                      Date d'inscription
                      {sortBy === 'created_at' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.display_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {user.role === 'admin' ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_suspended ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <Ban className="h-3 w-3" />
                          Suspendu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Actif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {can('users.roles') && (
                        <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                        <span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isAAL2}
                          onClick={() => {
                            setRoleTargetUser({ id: user.user_id, email: user.email });
                            setNewRole(user.role || 'user');
                            setRoleDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Rôle
                        </Button>
                        </span>
                        </TooltipTrigger>
                        {!isAAL2 && (<TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>)}
                        </Tooltip>
                        </TooltipProvider>
                        )}
                        {user.is_suspended ? (
                          can('users.manage') && (
                          <TooltipProvider>
                          <Tooltip>
                          <TooltipTrigger asChild>
                          <span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isAAL2}
                            onClick={async () => {
                              await unsuspendUser(user.user_id);
                              refetch();
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Réactiver
                          </Button>
                          </span>
                          </TooltipTrigger>
                          {!isAAL2 && (<TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>)}
                          </Tooltip>
                          </TooltipProvider>
                          )
                        ) : (
                          can('users.manage') && (
                          <TooltipProvider>
                          <Tooltip>
                          <TooltipTrigger asChild>
                          <span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isAAL2}
                            onClick={() => {
                              setSelectedUser(user.user_id);
                              setSuspendDialogOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspendre
                          </Button>
                          </span>
                          </TooltipTrigger>
                          {!isAAL2 && (<TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>)}
                          </Tooltip>
                          </TooltipProvider>
                          )
                        )}
                        {can('users.manage') && (
                        <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                        <span>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={!isAAL2}
                          onClick={() => {
                            setSelectedUser(user.user_id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </span>
                        </TooltipTrigger>
                        {!isAAL2 && (<TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>)}
                        </Tooltip>
                        </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p className="font-medium">Aucun utilisateur trouvé</p>
                <p className="text-sm">Essayez de modifier vos filtres</p>
              </div>
            )}
            
            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage de {from} à {to} sur {totalCount} résultat{totalCount > 1 ? 's' : ''}
                  </p>
                  <Select value={pageSize.toString()} onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    Premier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-8"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Suivant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  >
                    Dernier
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog: changer le rôle */}
        {can('users.roles') && (
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changer le rôle</DialogTitle>
              <DialogDescription>
                {roleTargetUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Nouveau rôle</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Annuler</Button>
              <Button
                onClick={async () => {
                  if (roleTargetUser) {
                    const ok = await setUserRole(roleTargetUser.id, newRole);
                    if (ok) {
                      setRoleDialogOpen(false);
                      refetch();
                    }
                  }
                }}
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}

        {/* Dialog: ajouter un administrateur */}
        {can('users.roles') && (
        <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un administrateur</DialogTitle>
              <DialogDescription>
                Saisissez l’email d’un utilisateur existant puis choisissez un rôle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={addAdminEmail} onChange={(e) => setAddAdminEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={addAdminRole} onValueChange={setAddAdminRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAdminOpen(false)}>Annuler</Button>
              <Button
                onClick={async () => {
                  if (!addAdminEmail.trim()) return;
                  const ok = await promoteToAdmin(addAdminEmail.trim(), addAdminRole);
                  if (ok) {
                    setAddAdminOpen(false);
                    setAddAdminEmail('');
                    refetch();
                  }
                }}
              >
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}

        {/* Dialogue de suspension */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspendre l'utilisateur</DialogTitle>
              <DialogDescription>
                Indiquez la raison de la suspension. L'utilisateur ne pourra plus se connecter.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Raison de la suspension..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (selectedUser && suspensionReason.trim()) {
                    await suspendUser(selectedUser, suspensionReason);
                    setSuspendDialogOpen(false);
                    setSuspensionReason('');
                    refetch();
                  }
                }}
              >
                Suspendre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogue de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirmer la suppression
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes les données de l'utilisateur seront définitivement supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (selectedUser) {
                    await deleteUser(selectedUser);
                    refetch();
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </RequireAAL2>
    </AdminLayout>
  );
};

export default AdminUsers;
