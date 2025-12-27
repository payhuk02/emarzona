/**
 * Page de diagnostic des fichiers Storage
 *
 * Permet de vérifier l'existence des fichiers dans le bucket attachments
 * et de nettoyer les entrées invalides.
 *
 * Date: 2 Février 2025
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import {
  diagnoseVendorMessageAttachments,
  cleanupMissingFiles,
  exportDiagnosticReportToCSV,
  displayDiagnosticReport,
  type DiagnosticReport,
} from '@/utils/diagnoseStorageFiles';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

export default function StorageDiagnosticPage() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exists' | 'missing'>('all');

  const missingFiles = report?.files.filter(f => !f.exists) || [];

  // Filtrage des fichiers
  const filteredFiles = useMemo(() => {
    if (!report) return [];

    let  filtered= report.files;

    // Filtre par statut
    if (statusFilter === 'exists') {
      filtered = filtered.filter(f => f.exists);
    } else if (statusFilter === 'missing') {
      filtered = filtered.filter(f => !f.exists);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        f =>
          f.fileName.toLowerCase().includes(query) ||
          f.storagePath.toLowerCase().includes(query) ||
          (f.error && f.error.toLowerCase().includes(query)) ||
          (f.signedUrlError && f.signedUrlError.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [report, statusFilter, searchQuery]);

  // Vérifier l'accès admin APRÈS tous les hooks
  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Accès refusé</AlertTitle>
                <AlertDescription>
                  Vous devez être administrateur pour accéder à cette page.
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await diagnoseVendorMessageAttachments();
      setReport(diagnosticReport);
      displayDiagnosticReport(diagnosticReport);

      toast({
        title: 'Diagnostic terminé',
        description: `${diagnosticReport.existingFiles} fichiers existants, ${diagnosticReport.missingFiles} fichiers manquants`,
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible d'exécuter le diagnostic",
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const csv = exportDiagnosticReportToCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `storage-diagnostic-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export réussi',
      description: 'Le rapport a été exporté en CSV',
    });
  };

  const handleCleanup = async () => {
    if (!report) return;

    setIsDeleting(true);
    try {
      const result = await cleanupMissingFiles(report, true);

      toast({
        title: 'Nettoyage terminé',
        description: `${result.deleted} entrée(s) supprimée(s)${result.errors.length > 0 ? `, ${result.errors.length} erreur(s)` : ''}`,
        variant: result.errors.length > 0 ? 'destructive' : 'default',
      });

      // Re-run diagnostic pour mettre à jour le rapport
      await handleRunDiagnostic();
      setShowDeleteDialog(false);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de nettoyer les fichiers manquants',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Diagnostic Storage</h1>
                <p className="text-muted-foreground">
                  Vérification de l'existence des fichiers dans le bucket attachments
                </p>
              </div>
              <div className="flex gap-2">
                {report && (
                  <>
                    <Button variant="outline" onClick={handleExportCSV} disabled={isRunning}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter CSV
                    </Button>
                    {missingFiles.length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isRunning || isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Nettoyer ({missingFiles.length})
                      </Button>
                    )}
                  </>
                )}
                <Button onClick={handleRunDiagnostic} disabled={isRunning}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                  {isRunning ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
                </Button>
              </div>
            </div>

            {/* Summary Card */}
            {report && (
              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                  <CardDescription>Résultats du diagnostic des fichiers storage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{report.totalFiles}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Existants</p>
                        <p className="text-2xl font-bold text-green-500">{report.existingFiles}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Manquants</p>
                        <p className="text-2xl font-bold text-red-500">{report.missingFiles}</p>
                      </div>
                    </div>
                  </div>

                  {report.totalFiles > 0 && (
                    <Progress
                      value={(report.existingFiles / report.totalFiles) * 100}
                      className="h-2"
                    />
                  )}

                  {report.summary.allExist ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>✅ Tous les fichiers existent</AlertTitle>
                      <AlertDescription>
                        Tous les fichiers référencés dans la base de données existent dans le
                        bucket.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>⚠️ Fichiers manquants détectés</AlertTitle>
                      <AlertDescription>
                        {report.missingFiles} fichier(s) référencé(s) en base n'existent pas dans le
                        bucket.
                      </AlertDescription>
                    </Alert>
                  )}

                  {report.summary.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Recommandations:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {report.summary.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Files Table */}
            {report && report.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Détails des fichiers</CardTitle>
                  <CardDescription>
                    Liste complète des fichiers vérifiés ({filteredFiles.length} sur{' '}
                    {report.files.length})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filtres */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom, chemin ou erreur..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={(value: 'all' | 'exists' | 'missing') =>
                        setStatusFilter(value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les fichiers</SelectItem>
                        <SelectItem value="exists">Fichiers existants</SelectItem>
                        <SelectItem value="missing">Fichiers manquants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isMobile ? (
                    <MobileTableCard
                      data={filteredFiles as unknown as Array<Record<string, unknown>>}
                      columns={[
                        { key: 'fileName', label: 'Fichier', priority: 'high' },
                        { key: 'storagePath', label: 'Chemin', priority: 'high' },
                        {
                          key: 'exists',
                          label: 'Statut',
                          priority: 'high',
                          render: value =>
                            value ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                Existe
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                                Manquant
                              </Badge>
                            ),
                        },
                        {
                          key: 'error',
                          label: 'Erreur',
                          priority: 'medium',
                          render: (_value, row) => {
                            const r = row as Record<string, unknown>;
                            return (r.error || r.signedUrlError || '-') as string;
                          },
                        },
                        {
                          key: 'canGenerateSignedUrl',
                          label: 'URL signée',
                          priority: 'medium',
                          render: value =>
                            value ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-300"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                Oui
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-300"
                              >
                                <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                                Non
                              </Badge>
                            ),
                        },
                      ]}
                    />
                  ) : (
                    <div className="rounded-md border">
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Nom du fichier</TableHead>
                              <TableHead className="min-w-[300px]">Chemin storage</TableHead>
                              <TableHead className="min-w-[120px]">Statut</TableHead>
                              <TableHead className="min-w-[200px]">Erreur</TableHead>
                              <TableHead className="min-w-[150px]">URL signée</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredFiles.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  Aucun fichier ne correspond aux filtres
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredFiles.map(file => (
                                <TableRow key={file.attachmentId}>
                                  <TableCell className="font-medium">{file.fileName}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground font-mono break-all">
                                    {file.storagePath}
                                  </TableCell>
                                  <TableCell>
                                    {file.exists ? (
                                      <Badge variant="default" className="bg-green-500">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Existe
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Manquant
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground max-w-[300px]">
                                    <div
                                      className="truncate"
                                      title={file.error || file.signedUrlError || ''}
                                    >
                                      {file.error || file.signedUrlError || '-'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {file.canGenerateSignedUrl ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-300"
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Oui
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-red-50 text-red-700 border-red-300"
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Non
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous êtes sur le point de supprimer {missingFiles.length} entrée(s) de la base
                    de données pour les fichiers qui n'existent pas dans le bucket.
                    <br />
                    <br />
                    Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanup}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






