import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useKYC, KYCFormData } from '@/hooks/useKYC';
import { Shield, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';

const KYC = () => {
  const { submission, isLoading, submitKYC, isSubmitting } = useKYC();
  const [formData, setFormData] = useState<Partial<KYCFormData>>({
    document_type: 'cni',
  });
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontFile || !formData.full_name || !formData.date_of_birth || !formData.address || !formData.city || !formData.country) {
      return;
    }

    submitKYC({
      ...formData as KYCFormData,
      document_front: frontFile,
      document_back: backFile || undefined,
    });
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Vérification KYC</h1>
                <p className="text-sm text-muted-foreground">Know Your Customer - Vérification d'identité</p>
              </div>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Chargement...</p>
                </CardContent>
              </Card>
            ) : submission ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Statut de votre vérification</CardTitle>
                    {getStatusBadge(submission.status)}
                  </div>
                  <CardDescription>
                    Soumis le {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Nom complet</Label>
                      <p className="font-medium">{submission.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date de naissance</Label>
                      <p className="font-medium">{new Date(submission.date_of_birth).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ville</Label>
                      <p className="font-medium">{submission.city}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Pays</Label>
                      <p className="font-medium">{submission.country}</p>
                    </div>
                  </div>

                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Motif du rejet :</strong> {submission.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {submission.status === 'verified' && (
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Votre identité a été vérifiée avec succès. Vous avez désormais accès à toutes les fonctionnalités.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Soumettre votre vérification KYC</CardTitle>
                  <CardDescription>
                    Remplissez le formulaire ci-dessous pour vérifier votre identité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Nom complet *</Label>
                        <Input
                          id="full_name"
                          required
                          value={formData.full_name || ''}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="Jean Dupont"
                        />
                      </div>

                      <div>
                        <Label htmlFor="date_of_birth">Date de naissance *</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          required
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="address">Adresse complète *</Label>
                        <Input
                          id="address"
                          required
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="123 Rue Example"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="city">Ville *</Label>
                          <Input
                            id="city"
                            required
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Paris"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Pays *</Label>
                          <Input
                            id="country"
                            required
                            value={formData.country || ''}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="France"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="document_type">Type de document *</Label>
                        <Select
                          value={formData.document_type}
                          onValueChange={(value: any) => setFormData({ ...formData, document_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cni">Carte Nationale d'Identité</SelectItem>
                            <SelectItem value="passport">Passeport</SelectItem>
                            <SelectItem value="drivers_license">Permis de conduire</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="document_front">Document (recto) * (max 5MB)</Label>
                        <Input
                          id="document_front"
                          type="file"
                          required
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size <= 5 * 1024 * 1024) {
                              setFrontFile(file);
                            } else {
                              alert('Le fichier doit faire moins de 5MB');
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="document_back">Document (verso) (optionnel, max 5MB)</Label>
                        <Input
                          id="document_back"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size <= 5 * 1024 * 1024) {
                              setBackFile(file);
                            } else {
                              alert('Le fichier doit faire moins de 5MB');
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Vos données personnelles sont sécurisées et ne seront utilisées que pour la vérification d'identité.
                      </AlertDescription>
                    </Alert>

                    <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma demande'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default KYC;
