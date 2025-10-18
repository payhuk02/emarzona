import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useAdminActions } from '@/hooks/useAdminActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Users, Search, Download, Shield, User, Ban, CheckCircle, Trash2, AlertTriangle, FileDown } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const AdminUsers = () => {
  const { users, loading, refetch } = useAllUsers();
  const { suspendUser, unsuspendUser, deleteUser } = useAdminActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { toast } = useToast();

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Nom complet', 'Prénom', 'Nom', 'Rôle', 'Statut', 'Date d\'inscription'].join(','),
      ...filteredUsers.map(user =>
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
    
    toast({
      title: "Export réussi",
      description: "Les données ont été exportées en CSV",
    });
  };

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
            <p>Total: ${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? 's' : ''}</p>
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
              ${filteredUsers.map(user => `
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
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gestion des utilisateurs
            </h1>
            <p className="text-muted-foreground mt-2">
              {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <CardDescription>
                  Gérer tous les comptes utilisateurs
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
                    Exporter CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email ou nom..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
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
                        {user.is_suspended ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await unsuspendUser(user.user_id);
                              refetch();
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Réactiver
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user.user_id);
                              setSuspendDialogOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspendre
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user.user_id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </CardContent>
        </Card>

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
    </AdminLayout>
  );
};

export default AdminUsers;
