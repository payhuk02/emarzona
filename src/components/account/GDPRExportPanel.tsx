import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download } from 'lucide-react';

export const GDPRExportPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Non autorisé');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gdpr-export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ format }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la génération de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export réussi',
        description: 'Vos données ont été téléchargées.',
      });
    } catch (err: unknown) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : "Impossible d'exporter vos données",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Télécharger mes données (GDPR)
        </CardTitle>
        <CardDescription>
          Conformément à l'article 20 du RGPD, vous pouvez télécharger une copie de vos données
          personnelles (profil, boutiques, commandes) au format structuré.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => handleExport('json')} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Télécharger en JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Télécharger en CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
