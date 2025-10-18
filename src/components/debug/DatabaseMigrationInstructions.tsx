import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ExternalLink, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

export const DatabaseMigrationInstructions = () => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Action requise :</strong> Les colonnes de profil supplémentaires n'existent pas encore dans la base de données.
        </AlertDescription>
      </Alert>

      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Instructions de Migration
          </CardTitle>
          <CardDescription>
            Suivez ces étapes pour ajouter les champs manquants à votre base de données Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <p className="font-medium">Ouvrir le Dashboard Supabase</p>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous à votre projet Supabase
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir Supabase Dashboard
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <p className="font-medium">Naviguer vers l'éditeur SQL</p>
                <p className="text-sm text-muted-foreground">
                  Dans le menu de gauche, cliquez sur "SQL Editor"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <p className="font-medium">Exécuter le script SQL</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Copiez et exécutez le code SQL suivant :
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto border">
                    {sqlCode}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <p className="font-medium">Vérifier l'exécution</p>
                <p className="text-sm text-muted-foreground">
                  Le script devrait s'exécuter sans erreur. Vous verrez un message de confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">5</Badge>
              <div>
                <p className="font-medium">Actualiser la page</p>
                <p className="text-sm text-muted-foreground">
                  Revenez sur cette page et actualisez pour voir les nouveaux champs.
                </p>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500 text-blue-300">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note :</strong> Cette migration est sûre et n'affectera pas les données existantes. 
              Les nouvelles colonnes seront ajoutées avec des valeurs NULL par défaut.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
