/**
 * Formulaire SEO pour les cours
 * Configuration des métadonnées pour optimisation moteurs de recherche
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Hash,
  Image as ImageIcon,
  Globe,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  TrendingUp,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CourseSEOFormProps {
  data: CourseSEOData;
  onChange: (data: CourseSEOData) => void;
  courseTitle?: string;
  courseDescription?: string;
}

export interface CourseSEOData {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

export const CourseSEOForm = ({ 
  data, 
  onChange,
  courseTitle = '',
  courseDescription = ''
}: CourseSEOFormProps) => {
  const [showPreview, setShowPreview] = useState(false);

  // Auto-générer les valeurs si vides
  const autoFill = () => {
    onChange({
      ...data,
      meta_title: data.meta_title || `${courseTitle} | Cours en ligne Payhuk`,
      meta_description: data.meta_description || courseDescription.substring(0, 160),
      og_title: data.og_title || courseTitle,
      og_description: data.og_description || courseDescription.substring(0, 200),
    });
  };

  // Validation des champs
  const validation = {
    meta_title: {
      isValid: data.meta_title.length > 0 && data.meta_title.length <= 60,
      message: data.meta_title.length > 60 
        ? '⚠️ Trop long (max 60 caractères)' 
        : data.meta_title.length === 0
        ? '❌ Requis'
        : `✅ ${data.meta_title.length}/60`,
      color: data.meta_title.length > 60 ? 'destructive' : data.meta_title.length === 0 ? 'secondary' : 'default'
    },
    meta_description: {
      isValid: data.meta_description.length > 0 && data.meta_description.length <= 160,
      message: data.meta_description.length > 160 
        ? '⚠️ Trop long (max 160 caractères)' 
        : data.meta_description.length === 0
        ? '❌ Requis'
        : `✅ ${data.meta_description.length}/160`,
      color: data.meta_description.length > 160 ? 'destructive' : data.meta_description.length === 0 ? 'secondary' : 'default'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            Optimisation SEO
          </h2>
          <p className="text-muted-foreground mt-1">
            Optimisez votre cours pour les moteurs de recherche et réseaux sociaux
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={autoFill}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Auto-remplir
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Masquer' : 'Aperçu'}
          </Button>
        </div>
      </div>

      {/* Alert d'information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Pourquoi c'est important ?</strong> Un bon SEO augmente la visibilité de votre cours 
          sur Google, Bing et les réseaux sociaux, ce qui peut doubler voire tripler vos inscriptions.
        </AlertDescription>
      </Alert>

      {/* Preview Google */}
      {showPreview && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Aperçu Google</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border">
              <div className="text-blue-600 text-xl hover:underline cursor-pointer">
                {data.meta_title || courseTitle || 'Titre du cours'}
              </div>
              <div className="text-green-700 text-sm mt-1">
                payhula.vercel.app › courses › {courseTitle.toLowerCase().replace(/\s+/g, '-')}
              </div>
              <div className="text-gray-600 text-sm mt-2">
                {data.meta_description || courseDescription || 'Description du cours...'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Accordion type="single" collapsible defaultValue="basic-seo" className="w-full">
        {/* SEO Basique */}
        <AccordionItem value="basic-seo">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              SEO Basique (Google, Bing)
              <Badge variant={validation.meta_title.isValid && validation.meta_description.isValid ? 'default' : 'destructive'}>
                {validation.meta_title.isValid && validation.meta_description.isValid ? 'Valide' : 'À compléter'}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {/* Meta Title */}
              <div className="space-y-2">
                <Label htmlFor="meta_title" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Titre SEO
                  <Badge variant={validation.meta_title.color as any}>
                    {validation.meta_title.message}
                  </Badge>
                </Label>
                <Input
                  id="meta_title"
                  placeholder="Ex: Maîtrisez React et TypeScript - Formation Complète 2025"
                  value={data.meta_title}
                  onChange={(e) => onChange({ ...data, meta_title: e.target.value })}
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground">
                  Titre affiché dans les résultats Google. Idéal : 50-60 caractères.
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <Label htmlFor="meta_description" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description SEO
                  <Badge variant={validation.meta_description.color as any}>
                    {validation.meta_description.message}
                  </Badge>
                </Label>
                <Textarea
                  id="meta_description"
                  placeholder="Ex: Apprenez React et TypeScript de zéro à expert. Formation pratique avec 50+ projets, quiz et certificat. Accès à vie. Commencez aujourd'hui !"
                  value={data.meta_description}
                  onChange={(e) => onChange({ ...data, meta_description: e.target.value })}
                  maxLength={170}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Description affichée sous le titre dans Google. Idéal : 150-160 caractères.
                </p>
              </div>

              {/* Meta Keywords */}
              <div className="space-y-2">
                <Label htmlFor="meta_keywords" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Mots-clés (optionnel)
                </Label>
                <Input
                  id="meta_keywords"
                  placeholder="Ex: cours react, formation typescript, développement web, javascript"
                  value={data.meta_keywords}
                  onChange={(e) => onChange({ ...data, meta_keywords: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Mots-clés séparés par des virgules. Utilisés par certains moteurs de recherche.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Open Graph (Réseaux Sociaux) */}
        <AccordionItem value="social-seo">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Réseaux Sociaux (Facebook, Twitter, LinkedIn)
              <Badge variant="outline">Optionnel</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Ces informations s'affichent quand quelqu'un partage votre cours sur les réseaux sociaux.
                </AlertDescription>
              </Alert>

              {/* OG Title */}
              <div className="space-y-2">
                <Label htmlFor="og_title">
                  Titre pour réseaux sociaux
                </Label>
                <Input
                  id="og_title"
                  placeholder="Laissez vide pour utiliser le titre SEO"
                  value={data.og_title}
                  onChange={(e) => onChange({ ...data, og_title: e.target.value })}
                />
              </div>

              {/* OG Description */}
              <div className="space-y-2">
                <Label htmlFor="og_description">
                  Description pour réseaux sociaux
                </Label>
                <Textarea
                  id="og_description"
                  placeholder="Laissez vide pour utiliser la description SEO"
                  value={data.og_description}
                  onChange={(e) => onChange({ ...data, og_description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* OG Image */}
              <div className="space-y-2">
                <Label htmlFor="og_image" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image de partage (URL)
                </Label>
                <Input
                  id="og_image"
                  type="url"
                  placeholder="https://exemple.com/image-cours.jpg"
                  value={data.og_image}
                  onChange={(e) => onChange({ ...data, og_image: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Image affichée lors du partage. Dimensions recommandées : 1200x630px.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Conseils SEO */}
        <AccordionItem value="seo-tips">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Conseils d'optimisation
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Utilisez des chiffres :</strong> "Formation React 2025 - 50+ Projets" 
                  performe mieux que "Formation React Complète"
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Incluez des mots-clés :</strong> Mettez les mots importants 
                  au début du titre (ex: "React TypeScript" au lieu de "Formation à React et TypeScript")
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Soyez spécifique :</strong> "Apprendre Python pour Data Science" 
                  {' > '} "Apprendre Python"
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Call-to-action :</strong> Ajoutez "Commencez aujourd'hui", 
                  "Inscrivez-vous maintenant" dans la description
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Évitez le keyword stuffing :</strong> Répéter trop de fois 
                  les mêmes mots-clés est pénalisé par Google
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Score SEO */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Score SEO</div>
              <div className="text-3xl font-bold">
                {validation.meta_title.isValid && validation.meta_description.isValid ? '85%' : '45%'}
              </div>
            </div>
            <div className="text-right">
              <Badge variant={validation.meta_title.isValid && validation.meta_description.isValid ? 'default' : 'destructive'} className="text-sm">
                {validation.meta_title.isValid && validation.meta_description.isValid ? 'Bon' : 'À améliorer'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {validation.meta_title.isValid && validation.meta_description.isValid 
                  ? 'Votre cours est bien optimisé !' 
                  : 'Complétez les champs requis'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

