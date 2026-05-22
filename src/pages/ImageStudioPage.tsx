/**
 * Page dédiée Studio IA d'amélioration d'images
 * Accessible depuis la sidebar via /dashboard/image-studio
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Wand2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { ImageEnhancerStudio } from '@/components/images/ImageEnhancerStudio';
import { SmartImage } from '@/components/images/SmartImage';
import { DashboardShellLayout } from '@/components/layout/DashboardShellLayout';

const STORAGE_KEY = 'emarzona:image-studio:saved';

const ImageStudioPage: React.FC = () => {
  const { toast } = useToast();
  const [savedImages, setSavedImages] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedImages.slice(0, 24)));
  }, [savedImages]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    toast({ title: 'URL copiée', description: 'Collez-la dans votre formulaire.' });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <DashboardShellLayout maxWidth="wide" className="max-w-6xl">
      <Helmet>
        <title>Studio IA d'images — Emarzona</title>
        <meta
          name="description"
          content="Améliorez vos images de produits et services avec l'IA. Optimisation premium en un clic."
        />
      </Helmet>

      <header className="mb-6 sm:mb-8 flex items-start gap-3">
        <SidebarTrigger className="mt-1 shrink-0" />
        <div className="app-icon-plain flex shrink-0 items-center justify-center">
          <Wand2 className="h-7 w-7 text-black" aria-hidden />
        </div>
        <div>
          <h1 className="app-premium-page-title">Studio IA d'images</h1>
          <p className="app-text-caption mt-1 text-muted-foreground">
            Sélectionnez une image, prévisualisez l'amélioration IA, puis enregistrez-la
            définitivement.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ImageEnhancerStudio
            folder="studio"
            onSaved={url =>
              setSavedImages(prev => [url, ...prev.filter(u => u !== url)].slice(0, 24))
            }
          />
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="app-text-card-title">Conseils</h2>
              <ul className="app-text-body text-muted-foreground space-y-2">
                <li>Utilisez des images bien éclairées au départ.</li>
                <li>L'IA ne change pas le sujet, elle l'améliore.</li>
                <li>Pour un fond blanc, choisissez le preset dédié.</li>
                <li>Utilisez le curseur avant/après pour comparer finement.</li>
                <li>« Affiner à nouveau » pour enchaîner plusieurs passes IA.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="app-text-card-title">Images enregistrées ({savedImages.length})</h2>
              {savedImages.length === 0 ? (
                <p className="app-text-caption text-muted-foreground">
                  Vos images améliorées apparaîtront ici. Copiez l'URL pour les coller dans un
                  formulaire.
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-auto pr-1">
                  {savedImages.map(url => (
                    <div key={url} className="space-y-2">
                      <div className="aspect-video rounded-md overflow-hidden border">
                        <SmartImage src={url} alt="Image enregistrée" width={400} height={225} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-sm"
                        onClick={() => handleCopy(url)}
                      >
                        {copied === url ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" /> Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" /> Copier l'URL
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </DashboardShellLayout>
  );
};

export default ImageStudioPage;
