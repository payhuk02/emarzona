import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAdminKYC, KYCSubmission } from '@/hooks/useKYC';
import { useAdmin } from '@/hooks/useAdmin';
import { Shield, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminKYC = () => {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { submissions, isLoading, updateStatus, isUpdating } = useAdminKYC();
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (submission: KYCSubmission) => {
    updateStatus({
      submissionId: submission.id,
      status: 'verified',
    });
    setSelectedSubmission(null);
  };

  const handleReject = (submission: KYCSubmission) => {
    if (!rejectionReason.trim()) {
      alert('Veuillez fournir un motif de rejet');
      return;
    }
    updateStatus({
      submissionId: submission.id,
      status: 'rejected',
      rejectionReason,
    });
    setSelectedSubmission(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Vérifié</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  if (adminLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <p>Chargement...</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Alert variant="destructive">
              <AlertDescription>
                Accès refusé. Cette page est réservée aux administrateurs.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Administration KYC</h1>
                <p className="text-sm text-muted-foreground">Gérer les demandes de vérification</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Demandes de vérification</CardTitle>
                <CardDescription>
                  {submissions.length} demande{submissions.length !== 1 ? 's' : ''} au total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Chargement...</p>
                ) : submissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune demande pour le moment</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Type de document</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{submission.full_name}</TableCell>
                            <TableCell>{submission.country}</TableCell>
                            <TableCell className="capitalize">
                              {submission.document_type.replace('_', ' ')}
                            </TableCell>
                            <TableCell>
                              {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>{getStatusBadge(submission.status)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
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
        </main>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande KYC</DialogTitle>
            <DialogDescription>
              Vérifiez les informations et documents fournis
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut actuel</span>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Nom complet</Label>
                  <p className="font-medium">{selectedSubmission.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de naissance</Label>
                  <p className="font-medium">
                    {new Date(selectedSubmission.date_of_birth).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Adresse</Label>
                  <p className="font-medium">{selectedSubmission.address}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ville</Label>
                  <p className="font-medium">{selectedSubmission.city}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pays</Label>
                  <p className="font-medium">{selectedSubmission.country}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type de document</Label>
                  <p className="font-medium capitalize">
                    {selectedSubmission.document_type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Documents</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <a
                    href={selectedSubmission.document_front_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      Voir le recto
                    </Button>
                  </a>
                  {selectedSubmission.document_back_url && (
                    <a
                      href={selectedSubmission.document_back_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        Voir le verso
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {selectedSubmission.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejection_reason">Motif de rejet (optionnel)</Label>
                    <Textarea
                      id="rejection_reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Expliquez pourquoi la demande est rejetée..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {selectedSubmission.rejection_reason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Motif du rejet :</strong> {selectedSubmission.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedSubmission?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedSubmission && handleReject(selectedSubmission)}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={() => selectedSubmission && handleApprove(selectedSubmission)}
                  disabled={isUpdating}
                  className="gradient-primary"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminKYC;
