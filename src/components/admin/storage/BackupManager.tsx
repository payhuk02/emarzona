import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Archive,
  Download,
  Upload,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { backupService } from '@/lib/storage/backup-service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  type: 'automatic' | 'manual' | 'emergency';
  collections: string[];
  createdAt: string;
  size: number;
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

interface BackupManagerProps {
  onBackupCreated?: () => void;
  onBackupRestored?: () => void;
}

export const BackupManager = ({ onBackupCreated, onBackupRestored }: BackupManagerProps) => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);

  // Formulaire de création
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: '',
    collections: [] as string[]
  });

  // Chargement des sauvegardes
  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupList = await backupService.listBackups();
      setBackups(backupList);
    } catch (error) {
      logger.error('Erreur chargement sauvegardes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sauvegardes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // Créer une sauvegarde
  const handleCreateBackup = async () => {
    if (!backupForm.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la sauvegarde est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const backupId = await backupService.createManualBackup(
        backupForm.name,
        backupForm.description,
        backupForm.collections.length > 0 ? backupForm.collections : undefined
      );

      toast({
        title: "Sauvegarde créée",
        description: `Sauvegarde "${backupForm.name}" créée avec succès`,
      });

      // Reset form
      setBackupForm({ name: '', description: '', collections: [] });
      setShowCreateDialog(false);

      // Reload
      await loadBackups();
      onBackupCreated?.();

    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Restaurer une sauvegarde
  const handleRestoreBackup = async (backupId: string, options: { overwrite: boolean; collections?: string[] }) => {
    try {
      setRestoring(backupId);
      await backupService.restoreBackup(backupId, options);

      toast({
        title: "Restauration terminée",
        description: "La sauvegarde a été restaurée avec succès",
      });

      setShowRestoreDialog(false);
      setSelectedBackup(null);
      onBackupRestored?.();

    } catch (error) {
      toast({
        title: "Erreur de restauration",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRestoring(null);
    }
  };

  // Supprimer une sauvegarde
  const handleDeleteBackup = async (backupId: string) => {
    try {
      await backupService.deleteBackup(backupId);

      toast({
        title: "Sauvegarde supprimée",
        description: "La sauvegarde a été supprimée",
      });

      await loadBackups();

    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Exporter une sauvegarde
  const handleExportBackup = async (backupId: string) => {
    try {
      await backupService.exportBackupToFile(backupId);
      toast({
        title: "Export réussi",
        description: "La sauvegarde a été téléchargée",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Importer une sauvegarde
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    backupService.importBackupFromFile(file)
      .then(() => {
        toast({
          title: "Import réussi",
          description: "La sauvegarde a été importée",
        });
        loadBackups();
      })
      .catch(error => {
        toast({
          title: "Erreur d'import",
          description: error.message,
          variant: "destructive"
        });
      });
  };

  // Formatage de la taille
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Terminée</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Échouée</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />En cours</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Badge de type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'automatic':
        return <Badge variant="outline" className="bg-blue-50">Automatique</Badge>;
      case 'manual':
        return <Badge variant="outline" className="bg-green-50">Manuelle</Badge>;
      case 'emergency':
        return <Badge variant="destructive" className="bg-red-50">Urgence</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gestion des Sauvegardes</h3>
          <p className="text-sm text-muted-foreground">
            Créez, restaurez et gérez vos sauvegardes de données
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Sauvegarde
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Sauvegarde</DialogTitle>
                <DialogDescription>
                  Créez une sauvegarde manuelle de vos données
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-name">Nom de la sauvegarde</Label>
                  <Input
                    id="backup-name"
                    value={backupForm.name}
                    onChange={(e) => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sauvegarde complète du système"
                  />
                </div>
                <div>
                  <Label htmlFor="backup-description">Description (optionnel)</Label>
                  <Textarea
                    id="backup-description"
                    value={backupForm.description}
                    onChange={(e) => setBackupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de la sauvegarde..."
                  />
                </div>
                <div>
                  <Label>Collections à sauvegarder</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Laissez vide pour sauvegarder toutes les collections
                  </p>
                  <Input
                    value={backupForm.collections.join(', ')}
                    onChange={(e) => setBackupForm(prev => ({
                      ...prev,
                      collections: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="products, users, orders"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateBackup} disabled={creating}>
                  {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
              id="backup-import"
            />
            <Button variant="outline" asChild>
              <label htmlFor="backup-import" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automatiques</p>
                <p className="text-2xl font-bold text-blue-600">
                  {backups.filter(b => b.type === 'automatic').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manuelles</p>
                <p className="text-2xl font-bold text-green-600">
                  {backups.filter(b => b.type === 'manual').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">
                  {backups.filter(b => b.status === 'failed').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle>Sauvegardes Disponibles</CardTitle>
          <CardDescription>
            Liste de toutes les sauvegardes créées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune sauvegarde disponible
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        {backup.description && (
                          <p className="text-sm text-muted-foreground">{backup.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(backup.type)}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{formatBytes(backup.size)}</TableCell>
                    <TableCell>
                      {new Date(backup.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportBackup(backup.id)}
                          disabled={backup.status !== 'completed'}
                        >
                          <Download className="w-3 h-3" />
                        </Button>

                        <Dialog open={showRestoreDialog && selectedBackup?.id === backup.id} onOpenChange={(open) => {
                          setShowRestoreDialog(open);
                          if (!open) setSelectedBackup(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBackup(backup)}
                              disabled={backup.status !== 'completed'}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Restaurer la Sauvegarde</DialogTitle>
                              <DialogDescription>
                                Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action peut écraser des données existantes.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium">{selectedBackup?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Créée le {selectedBackup ? new Date(selectedBackup.createdAt).toLocaleString('fr-FR') : ''}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="overwrite"
                                  defaultChecked
                                  className="rounded"
                                />
                                <Label htmlFor="overwrite">Écraser les données existantes</Label>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                                Annuler
                              </Button>
                              <Button
                                onClick={() => handleRestoreBackup(backup.id, { overwrite: true })}
                                disabled={restoring === backup.id}
                              >
                                {restoring === backup.id ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Restaurer
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la sauvegarde</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette sauvegarde ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBackup(backup.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};