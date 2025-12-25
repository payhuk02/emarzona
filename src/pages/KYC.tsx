import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useKYC, KYCFormData } from '@/hooks/useKYC';
import { Shield, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm"><CheckCircle2 className="h-3 w-3 mr-1" />Vérifié</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs sm:text-sm"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs sm:text-sm"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Vérification KYC
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Know Your Customer - Vérification d'identité</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-48 sm:w-64" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : submission ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <CardTitle className="text-lg sm:text-xl">Statut de votre vérification</CardTitle>
                    {getStatusBadge(submission.status)}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Soumis le {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">Nom complet</Label>
                      <p className="font-medium text-sm sm:text-base mt-1">{submission.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">Date de naissance</Label>
                      <p className="font-medium text-sm sm:text-base mt-1">{new Date(submission.date_of_birth).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">Ville</Label>
                      <p className="font-medium text-sm sm:text-base mt-1">{submission.city}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">Pays</Label>
                      <p className="font-medium text-sm sm:text-base mt-1">{submission.country}</p>
                    </div>
                  </div>

                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs sm:text-sm">
                        <strong>Motif du rejet :</strong> {submission.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {submission.status === 'verified' && (
                    <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-xs sm:text-sm">
                        Votre identité a été vérifiée avec succès. Vous avez désormais accès à toutes les fonctionnalités.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Soumettre votre vérification KYC</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Remplissez le formulaire ci-dessous pour vérifier votre identité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <MobileFormField
                        label="Nom complet"
                        name="full_name"
                        type="text"
                        value={formData.full_name || ''}
                        onChange={(value) => setFormData({ ...formData, full_name: value })}
                        required
                        fieldProps={{
                          placeholder: "Jean Dupont",
                        }}
                      />

                      <MobileFormField
                        label="Date de naissance"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                        required
                      />

                      <MobileFormField
                        label="Adresse complète"
                        name="address"
                        type="text"
                        value={formData.address || ''}
                        onChange={(value) => setFormData({ ...formData, address: value })}
                        required
                        fieldProps={{
                          placeholder: "123 Rue Example",
                        }}
                      />

                      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                        <MobileFormField
                          label="Ville"
                          name="city"
                          type="text"
                          value={formData.city || ''}
                          onChange={(value) => setFormData({ ...formData, city: value })}
                          required
                          fieldProps={{
                            placeholder: "Paris",
                          }}
                        />
                        <MobileFormField
                          label="Pays"
                          name="country"
                          type="text"
                          value={formData.country || ''}
                          onChange={(value) => setFormData({ ...formData, country: value })}
                          required
                          fieldProps={{
                            placeholder: "France",
                          }}
                        />
                      </div>

                      <MobileFormField
                        label="Type de document"
                        name="document_type"
                        type="select"
                        value={formData.document_type || 'cni'}
                        onChange={(value) => setFormData({ ...formData, document_type: value as any })}
                        required
                        selectOptions={[
                          { value: 'cni', label: "Carte Nationale d'Identité" },
                          { value: 'passport', label: 'Passeport' },
                          { value: 'drivers_license', label: 'Permis de conduire' },
                          { value: 'other', label: 'Autre' },
                        ]}
                      />

                      <div>
                        <Label htmlFor="document_front" className="text-xs sm:text-sm">Document (recto) * (max 5MB)</Label>
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
                          className="h-9 sm:h-10 text-xs sm:text-sm mt-1.5 sm:mt-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {frontFile && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Fichier sélectionné : {frontFile.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="document_back" className="text-xs sm:text-sm">Document (verso) (optionnel, max 5MB)</Label>
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
                          className="h-9 sm:h-10 text-xs sm:text-sm mt-1.5 sm:mt-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {backFile && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Fichier sélectionné : {backFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <Alert className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-xs sm:text-sm">
                        Vos données personnelles sont sécurisées et ne seront utilisées que pour la vérification d'identité.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      size="lg"
                    >
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
