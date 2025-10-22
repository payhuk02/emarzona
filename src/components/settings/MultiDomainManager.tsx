import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Globe, 
  Plus, 
  Trash2, 
  Settings, 
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Edit,
  Shield,
  Zap,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecondaryDomain {
  id: string;
  domain: string;
  type: 'alias' | 'redirect';
  status: 'active' | 'pending' | 'error';
  createdAt: string;
  lastCheck?: string;
}

interface MultiDomainManagerProps {
  primaryDomain: string;
  onAddSecondaryDomain: (domain: string, type: 'alias' | 'redirect') => Promise<boolean>;
  onRemoveSecondaryDomain: (domain: string) => Promise<boolean>;
}

export const MultiDomainManager = ({
  primaryDomain,
  onAddSecondaryDomain,
  onRemoveSecondaryDomain
}: MultiDomainManagerProps) => {
  const [secondaryDomains, setSecondaryDomains] = useState<SecondaryDomain[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainType, setNewDomainType] = useState<'alias' | 'redirect'>('alias');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de domaine valide.",
        variant: "destructive"
      });
      return;
    }

    setIsAddingDomain(true);
    try {
      const success = await onAddSecondaryDomain(newDomain.trim(), newDomainType);
      
      if (success) {
        const newSecondaryDomain: SecondaryDomain = {
          id: `domain-${Date.now()}`,
          domain: newDomain.trim(),
          type: newDomainType,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        setSecondaryDomains(prev => [...prev, newSecondaryDomain]);
        setNewDomain("");
        setNewDomainType('alias');
        setIsDialogOpen(false);

        toast({
          title: "Domaine ajouté",
          description: `${newDomain} a été ajouté comme ${newDomainType === 'alias' ? 'alias' : 'redirection'}`,
        });
      }
    } catch (error) {
      console.error('Error adding domain:', error);
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    try {
      const success = await onRemoveSecondaryDomain(domain);
      
      if (success) {
        setSecondaryDomains(prev => prev.filter(d => d.domain !== domain));
        
        toast({
          title: "Domaine supprimé",
          description: `${domain} a été retiré de la configuration`,
        });
      }
    } catch (error) {
      console.error('Error removing domain:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Domaine copié dans le presse-papiers",
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Domain */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domaine Principal
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Votre domaine principal configuré
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{primaryDomain}</p>
                <p className="text-sm text-muted-foreground">Domaine principal actif</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(primaryDomain)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Domains */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Domaines Secondaires
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gérez vos domaines supplémentaires et alias
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un Domaine Secondaire</DialogTitle>
                  <DialogDescription>
                    Configurez un nouveau domaine ou alias pour votre boutique
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain">Nom de domaine</Label>
                    <Input
                      id="domain"
                      placeholder="exemple.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type de domaine</Label>
                    <Select value={newDomainType} onValueChange={(value: 'alias' | 'redirect') => setNewDomainType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alias">Alias (même contenu)</SelectItem>
                        <SelectItem value="redirect">Redirection (301)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddDomain} 
                      disabled={isAddingDomain}
                      className="flex-1"
                    >
                      {isAddingDomain ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {secondaryDomains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun domaine secondaire</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Ajoutez des domaines supplémentaires ou des alias pour améliorer votre présence en ligne
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Domaine
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {secondaryDomains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(domain.status)}
                    <div>
                      <p className="font-medium">{domain.domain}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {domain.type === 'alias' ? 'Alias' : 'Redirection'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(domain.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(domain.status)}>
                      {domain.status === 'active' ? 'Actif' : 
                       domain.status === 'pending' ? 'En attente' : 'Erreur'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(domain.domain)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDomain(domain.domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Types Info */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Types de Domaines
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comprenez les différences entre les types de domaines
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Alias */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">Alias</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Le domaine pointe vers le même contenu que votre domaine principal
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Même contenu affiché</li>
                <li>• SEO préservé</li>
                <li>• Configuration DNS simple</li>
              </ul>
            </div>

            {/* Redirect */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-500" />
                <h4 className="font-medium">Redirection</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Redirection permanente (301) vers votre domaine principal
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Redirection automatique</li>
                <li>• SEO transféré</li>
                <li>• URL finale visible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
