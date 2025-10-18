import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Database, User, AlertCircle } from 'lucide-react';

export const ProfileDebug = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Connexion utilisateur',
        test: async () => {
          if (!user) throw new Error('Aucun utilisateur connecté');
          return { user: user.email, id: user.id };
        }
      },
      {
        name: 'Accès à la table profiles',
        test: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user?.id)
            .maybeSingle();
          
          if (error) throw error;
          return data;
        }
      },
      {
        name: 'Structure de la table profiles',
        test: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, user_id, avatar_url, display_name, first_name, last_name, bio, phone, location, website, created_at, updated_at')
            .limit(1);
          
          if (error) throw error;
          return { columns: Object.keys(data?.[0] || {}), sample: data?.[0] };
        }
      },
      {
        name: 'Création de profil (si nécessaire)',
        test: async () => {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user?.id)
            .maybeSingle();
          
          if (existing) {
            return { message: 'Profil existe déjà', profile: existing };
          }
          
          const { data, error } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: user?.id,
                display_name: user?.email,
                first_name: null,
                last_name: null,
                bio: null,
                phone: null,
                location: null,
                website: null,
              },
            ])
            .select()
            .single();
          
          if (error) throw error;
          return { message: 'Profil créé', profile: data };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          status: 'success',
          result,
        });
      } catch (error: any) {
        results.push({
          name: test.name,
          status: 'error',
          error: error.message,
        });
      }
    }
    
    setTestResults(results);
    setLoading(false);
  };

  const fetchProfileData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    setProfileData(data);
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Debug Profil
          </CardTitle>
          <CardDescription>
            Testez la connexion et la structure de la base de données pour le profil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runTests} disabled={loading} className="btn-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Lancer les tests
            </Button>
            <Button onClick={fetchProfileData} variant="outline" className="btn-secondary">
              <User className="mr-2 h-4 w-4" />
              Actualiser les données
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Résultats des tests :</h3>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-border">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status === 'success' ? 'Succès' : 'Erreur'}
                      </Badge>
                    </div>
                    {result.status === 'success' ? (
                      <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-red-500 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {profileData && (
            <div className="space-y-3">
              <h3 className="font-semibold">Données du profil actuel :</h3>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!user && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun utilisateur connecté. Veuillez vous connecter pour tester le profil.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
