import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { logger } from '@/lib/logger';
import { CheckCircle2, XCircle, Loader2, RefreshCw, User, AlertCircle, Database } from 'lucide-react';

export const ProfileTest = () => {
  const { user } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const [testLoading, setTestLoading] = useState(false);

  const runProfileTest = async () => {
    setTestLoading(true);
    try {
      await refetch();
      logger.info('Profile test completed');
    } catch (error) {
      logger.error('Profile test failed', { error });
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runProfileTest();
    }
  }, [user]);

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucun utilisateur connecté. Veuillez vous connecter pour tester le profil.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Test Profil
          </CardTitle>
          <CardDescription>
            Vérifiez l'état de votre profil et la connexion à la base de données.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runProfileTest} disabled={testLoading || loading} className="btn-primary">
              {(testLoading || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Tester le profil
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" /> Utilisateur
              </h3>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-sm"><strong>Email:</strong> {user.email}</p>
                <p className="text-sm"><strong>ID:</strong> {user.id}</p>
                <p className="text-sm"><strong>Connecté:</strong> {user.created_at ? 'Oui' : 'Non'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" /> Profil
              </h3>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Chargement...</span>
                  </div>
                ) : profile ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Profil trouvé</span>
                    </div>
                    <p className="text-sm"><strong>Nom:</strong> {profile.display_name || 'Non défini'}</p>
                    <p className="text-sm"><strong>Prénom:</strong> {profile.first_name || 'Non défini'}</p>
                    <p className="text-sm"><strong>Nom:</strong> {profile.last_name || 'Non défini'}</p>
                    <p className="text-sm"><strong>Bio:</strong> {profile.bio ? 'Définie' : 'Non définie'}</p>
                    <p className="text-sm"><strong>Téléphone:</strong> {profile.phone || 'Non défini'}</p>
                    <p className="text-sm"><strong>Localisation:</strong> {profile.location || 'Non définie'}</p>
                    <p className="text-sm"><strong>Site web:</strong> {profile.website || 'Non défini'}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">Aucun profil trouvé</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {profile && (
            <div className="space-y-2">
              <h3 className="font-semibold">Données complètes du profil</h3>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
