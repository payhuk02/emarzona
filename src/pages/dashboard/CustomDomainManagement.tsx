import { useState } from 'react';
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, Clock, Shield, Star, Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomDomains, type CustomDomain } from '@/hooks/useCustomDomains';
import { useStoreContext } from '@/contexts/StoreContext';
import { copyToClipboard } from '@/lib/store-utils';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  verifying: { label: 'Vérification...', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  verified: { label: 'Vérifié', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  active: { label: 'Actif', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  error: { label: 'Erreur', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  removed: { label: 'Supprimé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: AlertCircle },
};

const sslStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  provisioning: { label: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { label: 'SSL Actif', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  error: { label: 'Erreur SSL', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  expired: { label: 'Expiré', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
};

function DomainCard({ domain, onVerify, onRemove, onSetPrimary, isVerifying }: {
  domain: CustomDomain;
  onVerify: () => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  isVerifying: boolean;
}) {
  const { toast } = useToast();
  const status = statusConfig[domain.status] || statusConfig.pending;
  const sslStatus = sslStatusConfig[domain.ssl_status] || sslStatusConfig.pending;
  const StatusIcon = status.icon;

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) toast({ title: 'Copié !', description: `${label} copié dans le presse-papiers.` });
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {domain.domain}
                {domain.is_primary && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" /> Principal
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Ajouté le {new Date(domain.created_at).toLocaleDateString('fr-FR')}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            <Badge className={sslStatus.color}>
              <Shield className="h-3 w-3 mr-1" />
              {sslStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(domain.status === 'pending' || domain.status === 'error') && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration DNS requise</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p className="text-sm">Ajoutez ces enregistrements DNS chez votre registrar :</p>

              <div className="bg-muted rounded-lg p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Type:</span> <span className="font-semibold">TXT</span>
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Nom:</span> <span className="font-semibold">_emarzona</span>
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Valeur:</span> <span className="font-semibold break-all">{domain.verification_token}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => handleCopy(domain.verification_token, 'Token')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Type:</span> <span className="font-semibold">CNAME</span>
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Nom:</span> <span className="font-semibold">{domain.domain}</span>
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Valeur:</span> <span className="font-semibold">cname.vercel-dns.com</span>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => handleCopy('cname.vercel-dns.com', 'CNAME')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {domain.error_message && (
                <p className="text-xs text-destructive">{domain.error_message}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {domain.status === 'active' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Votre domaine est actif et pointe vers votre boutique.</span>
            <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              Visiter <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          {domain.status !== 'active' && (
            <Button size="sm" onClick={onVerify} disabled={isVerifying}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
              Vérifier maintenant
            </Button>
          )}
          {domain.status === 'active' && !domain.is_primary && (
            <Button size="sm" variant="outline" onClick={onSetPrimary}>
              <Star className="h-4 w-4 mr-2" />
              Définir comme principal
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer le domaine</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer <strong>{domain.domain}</strong> ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={onRemove}>Confirmer la suppression</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomDomainManagement() {
  const [newDomain, setNewDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { selectedStore } = useStoreContext();
  const { domains, isLoading, addDomain, verifyDomain, removeDomain, setPrimary } = useCustomDomains();

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    addDomain.mutate(newDomain, {
      onSuccess: () => {
        setNewDomain('');
        setShowAddForm(false);
      },
    });
  };

  if (!selectedStore) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Sélectionnez une boutique pour gérer les domaines.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Domaines personnalisés
            </h1>
            <p className="text-muted-foreground mt-1">
              Connectez votre propre domaine à votre boutique <strong>{selectedStore.name}</strong>
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un domaine
          </Button>
        </div>

        {/* Info banner */}
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertTitle>Comment ça marche ?</AlertTitle>
          <AlertDescription className="text-sm">
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Ajoutez votre domaine ci-dessous</li>
              <li>Configurez les enregistrements DNS chez votre registrar (Cloudflare, GoDaddy, etc.)</li>
              <li>Cliquez sur "Vérifier" — la propagation DNS peut prendre jusqu'à 48h</li>
              <li>Une fois vérifié, votre boutique sera accessible via votre domaine !</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Add domain form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ajouter un domaine</CardTitle>
              <CardDescription>Entrez le domaine que vous souhaitez connecter (ex: maboutique.com)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="maboutique.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  className="flex-1"
                />
                <Button onClick={handleAddDomain} disabled={addDomain.isPending || !newDomain.trim()}>
                  {addDomain.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewDomain(''); }}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Default domain */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedStore.slug || selectedStore.name}.myemarzona.shop</p>
                  <p className="text-xs text-muted-foreground">Domaine par défaut (toujours actif)</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Actif
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Domain list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : domains.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">Aucun domaine personnalisé</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Ajoutez votre propre domaine pour donner une identité professionnelle à votre boutique.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onVerify={() => verifyDomain.mutate(domain.id)}
                onRemove={() => removeDomain.mutate(domain.id)}
                onSetPrimary={() => setPrimary.mutate(domain.id)}
                isVerifying={verifyDomain.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
