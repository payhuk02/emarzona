/**
 * Section Personnalisation Page d'Accueil
 * Permet de personnaliser TOUS les éléments de la page Landing
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Upload, 
  Loader2, 
  X,
  Star,
  TrendingUp,
  Users,
  CheckCircle2,
  DollarSign,
  Globe,
  Shield,
  BarChart3,
  Package,
  ArrowRight,
  Zap,
  Menu,
} from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Switch } from '@/components/ui/switch';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';

interface LandingPageCustomizationSectionProps {
  onChange?: () => void;
}

interface PageElement {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'font' | 'number' | 'url' | 'boolean';
  key: string;
  defaultValue?: string;
  description?: string;
}

interface PageSection {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  elements: PageElement[];
}

// Configuration complète de la page d'accueil
const LANDING_SECTIONS: PageSection[] = [
  {
    id: 'hero',
    name: 'Section Hero',
    icon: Home,
    elements: [
      { id: 'badge', label: 'Badge', type: 'text', key: 'landing.hero.badge', defaultValue: 'La plateforme e-commerce tout-en-un pour l\'Afrique' },
      { id: 'title', label: 'Titre principal', type: 'textarea', key: 'landing.hero.title', defaultValue: 'Créez votre boutique en ligne en quelques minutes' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.hero.subtitle', defaultValue: 'Vendez vos produits digitaux et physiques avec une plateforme complète, sécurisée et facile à utiliser.' },
      { id: 'ctaPrimary', label: 'Bouton principal', type: 'text', key: 'landing.hero.ctaPrimary', defaultValue: 'Créer ma boutique gratuitement' },
      { id: 'ctaSecondary', label: 'Bouton secondaire', type: 'text', key: 'landing.hero.ctaSecondary', defaultValue: 'Voir la démo' },
      { id: 'bgColor', label: 'Couleur de fond', type: 'color', key: 'landing.hero.bgColor', defaultValue: '#1e293b' },
      { id: 'textColor', label: 'Couleur du texte', type: 'color', key: 'landing.hero.textColor', defaultValue: '#ffffff' },
      { id: 'bgImage', label: 'Image de fond', type: 'image', key: 'landing.hero.bgImage' },
    ],
  },
  {
    id: 'stats',
    name: 'Statistiques',
    icon: TrendingUp,
    elements: [
      { id: 'usersLabel', label: 'Label utilisateurs', type: 'text', key: 'landing.stats.users', defaultValue: 'Utilisateurs' },
      { id: 'salesLabel', label: 'Label ventes', type: 'text', key: 'landing.stats.sales', defaultValue: 'Ventes' },
      { id: 'storesLabel', label: 'Label boutiques', type: 'text', key: 'landing.stats.stores', defaultValue: 'Boutiques' },
    ],
  },
  {
    id: 'testimonials',
    name: 'Témoignages',
    icon: Star,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.testimonials.title', defaultValue: 'Ils réussissent avec Emarzona' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.testimonials.subtitle', defaultValue: 'Rejoignez des centaines d\'entrepreneurs qui développent leur activité' },
    ],
  },
  {
    id: 'features',
    name: 'Section Fonctionnalités',
    icon: Zap,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.features.title', defaultValue: 'Fonctionnalités clés' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.features.subtitle', defaultValue: 'Tout ce dont vous avez besoin pour réussir en ligne' },
      // Feature 1
      { id: 'feature1Badge', label: 'Feature 1 - Badge', type: 'text', key: 'landing.featureSections.feature1.badge', defaultValue: 'E-commerce' },
      { id: 'feature1Title', label: 'Feature 1 - Titre', type: 'text', key: 'landing.featureSections.feature1.title', defaultValue: 'Boutique en ligne complète' },
      { id: 'feature1Description', label: 'Feature 1 - Description', type: 'textarea', key: 'landing.featureSections.feature1.description', defaultValue: 'Créez votre boutique en quelques clics' },
      { id: 'feature1Cta', label: 'Feature 1 - CTA', type: 'text', key: 'landing.featureSections.feature1.cta', defaultValue: 'En savoir plus' },
      // Feature 2
      { id: 'feature2Badge', label: 'Feature 2 - Badge', type: 'text', key: 'landing.featureSections.feature2.badge', defaultValue: 'Sécurité' },
      { id: 'feature2Title', label: 'Feature 2 - Titre', type: 'text', key: 'landing.featureSections.feature2.title', defaultValue: 'Paiements sécurisés' },
      { id: 'feature2Description', label: 'Feature 2 - Description', type: 'textarea', key: 'landing.featureSections.feature2.description', defaultValue: 'Transactions sécurisées et cryptées' },
      { id: 'feature2Cta', label: 'Feature 2 - CTA', type: 'text', key: 'landing.featureSections.feature2.cta', defaultValue: 'En savoir plus' },
      // Feature 3
      { id: 'feature3Badge', label: 'Feature 3 - Badge', type: 'text', key: 'landing.featureSections.feature3.badge', defaultValue: 'Global' },
      { id: 'feature3Title', label: 'Feature 3 - Titre', type: 'text', key: 'landing.featureSections.feature3.title', defaultValue: 'Multi-langues' },
      { id: 'feature3Description', label: 'Feature 3 - Description', type: 'textarea', key: 'landing.featureSections.feature3.description', defaultValue: 'Disponible dans plusieurs langues' },
      { id: 'feature3Cta', label: 'Feature 3 - CTA', type: 'text', key: 'landing.featureSections.feature3.cta', defaultValue: 'En savoir plus' },
    ],
  },
  {
    id: 'keyFeatures',
    name: 'Fonctionnalités Clés (Grid)',
    icon: CheckCircle2,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.keyFeatures.title', defaultValue: 'Pourquoi choisir Emarzona ?' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.keyFeatures.subtitle', defaultValue: 'Tout ce dont vous avez besoin pour réussir' },
    ],
  },
  {
    id: 'howItWorks',
    name: 'Comment ça marche',
    icon: Package,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.howItWorks.title', defaultValue: 'Comment ça marche' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.howItWorks.subtitle', defaultValue: 'En 3 étapes simples' },
      { id: 'step1Title', label: 'Étape 1 - Titre', type: 'text', key: 'landing.howItWorks.step1.title', defaultValue: 'Créez votre compte' },
      { id: 'step1Description', label: 'Étape 1 - Description', type: 'textarea', key: 'landing.howItWorks.step1.description', defaultValue: 'Inscrivez-vous en quelques secondes' },
      { id: 'step2Title', label: 'Étape 2 - Titre', type: 'text', key: 'landing.howItWorks.step2.title', defaultValue: 'Ajoutez vos produits' },
      { id: 'step2Description', label: 'Étape 2 - Description', type: 'textarea', key: 'landing.howItWorks.step2.description', defaultValue: 'Importez vos produits facilement' },
      { id: 'step3Title', label: 'Étape 3 - Titre', type: 'text', key: 'landing.howItWorks.step3.title', defaultValue: 'Commencez à vendre' },
      { id: 'step3Description', label: 'Étape 3 - Description', type: 'textarea', key: 'landing.howItWorks.step3.description', defaultValue: 'Recevez vos premières commandes' },
    ],
  },
  {
    id: 'pricing',
    name: 'Tarification',
    icon: DollarSign,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.pricing.title', defaultValue: 'Tarification' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.pricing.subtitle', defaultValue: 'Un plan adapté à vos besoins' },
    ],
  },
  {
    id: 'coverage',
    name: 'Couverture',
    icon: Globe,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.coverage.title', defaultValue: 'Disponible partout' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.coverage.subtitle', defaultValue: 'Dans toute l\'Afrique et au-delà' },
    ],
  },
  {
    id: 'cta',
    name: 'Call to Action Final',
    icon: ArrowRight,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.finalCta.title', defaultValue: 'Prêt à commencer ?' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.finalCta.subtitle', defaultValue: 'Rejoignez des milliers d\'entrepreneurs' },
      { id: 'button', label: 'Texte du bouton', type: 'text', key: 'landing.finalCta.button', defaultValue: 'Créer mon compte gratuitement' },
    ],
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: Users,
    elements: [
      { id: 'description', label: 'Description', type: 'textarea', key: 'landing.footer.description', defaultValue: 'La plateforme e-commerce pour l\'Afrique' },
      { id: 'copyright', label: 'Copyright', type: 'text', key: 'landing.footer.copyright', defaultValue: '© 2025 Emarzona. Tous droits réservés.' },
      { id: 'product', label: 'Titre section Produit', type: 'text', key: 'landing.footer.product', defaultValue: 'Produit' },
      { id: 'support', label: 'Titre section Support', type: 'text', key: 'landing.footer.support', defaultValue: 'Support' },
      { id: 'company', label: 'Titre section Entreprise', type: 'text', key: 'landing.footer.company', defaultValue: 'Entreprise' },
      { id: 'linkFeatures', label: 'Lien Fonctionnalités', type: 'text', key: 'landing.footer.links.features', defaultValue: 'Fonctionnalités' },
      { id: 'linkPricing', label: 'Lien Tarification', type: 'text', key: 'landing.footer.links.pricing', defaultValue: 'Tarification' },
      { id: 'linkDemo', label: 'Lien Démo', type: 'text', key: 'landing.footer.links.demo', defaultValue: 'Démo' },
      { id: 'linkDocumentation', label: 'Lien Documentation', type: 'text', key: 'landing.footer.links.documentation', defaultValue: 'Documentation' },
      { id: 'linkGuides', label: 'Lien Guides', type: 'text', key: 'landing.footer.links.guides', defaultValue: 'Guides' },
      { id: 'linkContact', label: 'Lien Contact', type: 'text', key: 'landing.footer.links.contact', defaultValue: 'Contact' },
      { id: 'linkAbout', label: 'Lien À propos', type: 'text', key: 'landing.footer.links.about', defaultValue: 'À propos' },
      { id: 'linkBlog', label: 'Lien Blog', type: 'text', key: 'landing.footer.links.blog', defaultValue: 'Blog' },
      { id: 'linkCareers', label: 'Lien Carrières', type: 'text', key: 'landing.footer.links.careers', defaultValue: 'Carrières' },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: Menu,
    elements: [
      { id: 'marketplace', label: 'Lien Marketplace', type: 'text', key: 'landing.nav.marketplace', defaultValue: 'Marketplace' },
      { id: 'howItWorks', label: 'Lien Comment ça marche', type: 'text', key: 'landing.nav.howItWorks', defaultValue: 'Comment ça marche' },
      { id: 'pricing', label: 'Lien Tarification', type: 'text', key: 'landing.nav.pricing', defaultValue: 'Tarification' },
      { id: 'login', label: 'Lien Connexion', type: 'text', key: 'landing.nav.login', defaultValue: 'Connexion' },
      { id: 'getStarted', label: 'Bouton Commencer', type: 'text', key: 'landing.nav.getStarted', defaultValue: 'Commencer' },
    ],
  },
  {
    id: 'featuresExtended',
    name: 'Fonctionnalités Étendues',
    icon: Zap,
    elements: [
      // Feature 4
      { id: 'feature4Badge', label: 'Feature 4 - Badge', type: 'text', key: 'landing.featureSections.feature4.badge', defaultValue: 'Analytics' },
      { id: 'feature4Title', label: 'Feature 4 - Titre', type: 'text', key: 'landing.featureSections.feature4.title', defaultValue: 'Statistiques et analyses' },
      { id: 'feature4Description', label: 'Feature 4 - Description', type: 'textarea', key: 'landing.featureSections.feature4.description', defaultValue: 'Suivez vos performances en temps réel' },
      { id: 'feature4Cta', label: 'Feature 4 - CTA', type: 'text', key: 'landing.featureSections.feature4.cta', defaultValue: 'Voir les statistiques' },
      // Feature 5
      { id: 'feature5Badge', label: 'Feature 5 - Badge', type: 'text', key: 'landing.featureSections.feature5.badge', defaultValue: 'Communauté' },
      { id: 'feature5Title', label: 'Feature 5 - Titre', type: 'text', key: 'landing.featureSections.feature5.title', defaultValue: 'Rejoignez une communauté active' },
      { id: 'feature5Description', label: 'Feature 5 - Description', type: 'textarea', key: 'landing.featureSections.feature5.description', defaultValue: 'Échangez avec d\'autres entrepreneurs' },
      { id: 'feature5Cta', label: 'Feature 5 - CTA', type: 'text', key: 'landing.featureSections.feature5.cta', defaultValue: 'Rejoindre la communauté' },
    ],
  },
  {
    id: 'howItWorksDetailed',
    name: 'Comment ça marche (Détaillé)',
    icon: Package,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.howItWorksDetailed.title', defaultValue: 'Comment ça marche' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.howItWorksDetailed.subtitle', defaultValue: 'En 3 étapes simples' },
      { id: 'step1Number', label: 'Étape 1 - Numéro', type: 'text', key: 'landing.howItWorksDetailed.steps.step1.number', defaultValue: '1' },
      { id: 'step1Title', label: 'Étape 1 - Titre', type: 'text', key: 'landing.howItWorksDetailed.steps.step1.title', defaultValue: 'Créez votre compte' },
      { id: 'step1Description', label: 'Étape 1 - Description', type: 'textarea', key: 'landing.howItWorksDetailed.steps.step1.description', defaultValue: 'Inscrivez-vous en quelques secondes' },
      { id: 'step2Number', label: 'Étape 2 - Numéro', type: 'text', key: 'landing.howItWorksDetailed.steps.step2.number', defaultValue: '2' },
      { id: 'step2Title', label: 'Étape 2 - Titre', type: 'text', key: 'landing.howItWorksDetailed.steps.step2.title', defaultValue: 'Ajoutez vos produits' },
      { id: 'step2Description', label: 'Étape 2 - Description', type: 'textarea', key: 'landing.howItWorksDetailed.steps.step2.description', defaultValue: 'Importez vos produits facilement' },
      { id: 'step3Number', label: 'Étape 3 - Numéro', type: 'text', key: 'landing.howItWorksDetailed.steps.step3.number', defaultValue: '3' },
      { id: 'step3Title', label: 'Étape 3 - Titre', type: 'text', key: 'landing.howItWorksDetailed.steps.step3.title', defaultValue: 'Commencez à vendre' },
      { id: 'step3Description', label: 'Étape 3 - Description', type: 'textarea', key: 'landing.howItWorksDetailed.steps.step3.description', defaultValue: 'Recevez vos premières commandes' },
      { id: 'cta', label: 'Bouton CTA', type: 'text', key: 'landing.howItWorksDetailed.cta', defaultValue: 'Commencer maintenant' },
    ],
  },
  {
    id: 'pricingDetailed',
    name: 'Tarification (Détaillée)',
    icon: DollarSign,
    elements: [
      { id: 'title', label: 'Titre', type: 'text', key: 'landing.pricingDetailed.title', defaultValue: 'Une tarification simple et transparente' },
      { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.pricingDetailed.subtitle', defaultValue: 'Choisissez le plan qui convient le mieux à votre entreprise' },
      { id: 'freeBadge', label: 'Badge Gratuit', type: 'text', key: 'landing.pricingDetailed.free.badge', defaultValue: 'Gratuit' },
      { id: 'freeTitle', label: 'Titre Plan Gratuit', type: 'text', key: 'landing.pricingDetailed.free.title', defaultValue: 'Plan Gratuit' },
      { id: 'freePrice', label: 'Prix', type: 'text', key: 'landing.pricingDetailed.free.price', defaultValue: '0 FCFA' },
      { id: 'freeSubtitle', label: 'Sous-titre Plan', type: 'textarea', key: 'landing.pricingDetailed.free.subtitle', defaultValue: 'Parfait pour commencer' },
      { id: 'freeCommissionPercentage', label: 'Pourcentage Commission', type: 'text', key: 'landing.pricingDetailed.free.commission.percentage', defaultValue: '5%' },
      { id: 'freeCommissionTitle', label: 'Titre Commission', type: 'text', key: 'landing.pricingDetailed.free.commission.title', defaultValue: 'Commission par transaction' },
      { id: 'freeCommissionSubtitle', label: 'Sous-titre Commission', type: 'textarea', key: 'landing.pricingDetailed.free.commission.subtitle', defaultValue: 'Seulement sur les ventes réussies' },
      { id: 'freeFeaturesTitle', label: 'Titre Fonctionnalités', type: 'text', key: 'landing.pricingDetailed.free.featuresTitle', defaultValue: 'Fonctionnalités incluses' },
      { id: 'freeAdvantagesTitle', label: 'Titre Avantages', type: 'text', key: 'landing.pricingDetailed.free.advantagesTitle', defaultValue: 'Avantages' },
      { id: 'freeCta', label: 'Bouton CTA', type: 'text', key: 'landing.pricingDetailed.free.cta', defaultValue: 'Commencer gratuitement' },
      { id: 'freeNote', label: 'Note', type: 'textarea', key: 'landing.pricingDetailed.free.note', defaultValue: 'Aucune carte de crédit requise' },
    ],
  },
  {
    id: 'coverageRegions',
    name: 'Couverture Géographique',
    icon: Globe,
    elements: [
      { id: 'westAfricaTitle', label: 'Titre Afrique de l\'Ouest', type: 'text', key: 'landing.coverage.regions.westAfrica.title', defaultValue: 'Afrique de l\'Ouest' },
      { id: 'westAfricaDescription', label: 'Description Afrique de l\'Ouest', type: 'textarea', key: 'landing.coverage.regions.westAfrica.description', defaultValue: 'Disponible dans tous les pays d\'Afrique de l\'Ouest' },
      { id: 'internationalTitle', label: 'Titre International', type: 'text', key: 'landing.coverage.regions.international.title', defaultValue: 'International' },
      { id: 'internationalDescription', label: 'Description International', type: 'textarea', key: 'landing.coverage.regions.international.description', defaultValue: 'Paiements internationaux acceptés' },
      { id: 'complianceTitle', label: 'Titre Conformité', type: 'text', key: 'landing.coverage.regions.compliance.title', defaultValue: 'Conformité' },
      { id: 'complianceDescription', label: 'Description Conformité', type: 'textarea', key: 'landing.coverage.regions.compliance.description', defaultValue: 'Conforme aux réglementations locales' },
      { id: 'ctaShow', label: 'Bouton Afficher', type: 'text', key: 'landing.coverage.cta.show', defaultValue: 'Voir tous les pays' },
      { id: 'ctaHide', label: 'Bouton Masquer', type: 'text', key: 'landing.coverage.cta.hide', defaultValue: 'Masquer' },
      { id: 'detailedCoverageTitle', label: 'Titre Couverture Détaillée', type: 'text', key: 'landing.coverage.detailedCoverage.title', defaultValue: 'Couverture détaillée' },
      { id: 'detailedCoverageNote', label: 'Note', type: 'textarea', key: 'landing.coverage.detailedCoverage.note', defaultValue: 'Liste des pays disponibles' },
    ],
  },
];

export const LandingPageCustomizationSection = ({ onChange }: LandingPageCustomizationSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<string>('hero');
  const [pageValues, setPageValues] = useState<Record<string, unknown>>({});
  const [uploadingImage, setUploadingImage] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (customizationData?.pages?.landing) {
      setPageValues(customizationData.pages.landing);
    }
  }, [customizationData]);

  const selectedSectionConfig = useMemo(() => 
    LANDING_SECTIONS.find(s => s.id === selectedSection),
    [selectedSection]
  );

  // Debounce pour éviter trop de sauvegardes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleElementChange = useCallback((elementKey: string, value: string | number | boolean | null) => {
    setPageValues(prev => {
      const updated = {
        ...prev,
        [elementKey]: value,
      };
      
      // Debounce la sauvegarde (500ms)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        // Récupérer les données actuelles pour fusionner correctement
        const currentData = customizationData?.pages || {};
        await save('pages', {
          ...currentData,
          landing: updated,
        }).catch((error) => {
          logger.error('Error saving landing page customization', { error, elementKey: key, value });
        });
      }, 500);
      
      if (onChange) onChange();
      return updated;
    });
  }, [save, onChange, customizationData]);

  const handleImageUpload = useCallback(async (elementKey: string, file: File) => {
    setUploadingImage(prev => ({ ...prev, [elementKey]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `page-assets/landing/${elementKey}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(filePath);

      handleElementChange(elementKey, publicUrl);

      toast({
        title: 'Image uploadée',
        description: 'L\'image a été uploadée avec succès.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'uploader l\'image.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(prev => ({ ...prev, [elementKey]: false }));
    }
  }, [handleElementChange, toast]);

  const handleRemoveImage = useCallback(async (elementKey: string, imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `page-assets/landing/${fileName}`;

      const { error: deleteError } = await supabase.storage
        .from('platform-assets')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      handleElementChange(elementKey, '');
      toast({
        title: 'Image supprimée',
        description: 'L\'image a été supprimée avec succès.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de supprimer l\'image.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [handleElementChange, toast]);

  const renderElementEditor = useCallback((element: PageElement) => {
    const value = pageValues[element.id] ?? element.defaultValue ?? '';
    const inputId = `landing-${element.id}`;

    switch (element.type) {
      case 'text':
        return (
          <Input
            id={inputId}
            value={value}
            onChange={(e) => handleElementChange(element.id, e.target.value)}
            placeholder={element.defaultValue}
          />
        );
      case 'textarea':
        return (
          <Textarea
            id={inputId}
            value={value}
            onChange={(e) => handleElementChange(element.id, e.target.value)}
            placeholder={element.defaultValue}
            rows={3}
          />
        );
      case 'image':
        return (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 relative">
              {value ? (
                <>
                  <OptimizedImage
                    src={value}
                    alt={element.label}
                    className="max-w-full max-h-full object-contain"
                    width={128}
                    height={64}
                  />
                  <Button
                    onClick={() => handleRemoveImage(element.id, value)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    type="button"
                    size="icon"
                    aria-label={`Supprimer l'image ${element.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <input
              id={`file-${inputId}`}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={(e) => e.target.files && handleImageUpload(element.id, e.target.files[0])}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`file-${inputId}`)?.click()}
              disabled={uploadingImage[element.id]}
              className="w-full sm:w-auto"
            >
              {uploadingImage[element.id] ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger
                </>
              )}
            </Button>
          </div>
        );
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => handleElementChange(element.id, e.target.value)}
              className="w-16 h-10 p-1 border rounded-md cursor-pointer"
            />
            <Input
              value={value}
              onChange={(e) => handleElementChange(element.id, e.target.value)}
              placeholder={element.defaultValue}
              className="flex-1"
            />
          </div>
        );
      case 'font':
        return (
          <Input
            id={inputId}
            value={value}
            onChange={(e) => handleElementChange(element.id, e.target.value)}
            placeholder={element.defaultValue || 'Ex: "Inter", sans-serif'}
          />
        );
      case 'number':
        return (
          <Input
            id={inputId}
            type="number"
            value={value}
            onChange={(e) => handleElementChange(element.id, parseFloat(e.target.value))}
            placeholder={element.defaultValue}
          />
        );
      case 'url':
        return (
          <Input
            id={inputId}
            type="url"
            value={value}
            onChange={(e) => handleElementChange(element.id, e.target.value)}
            placeholder={element.defaultValue}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value === 'true' || value === true}
            onCheckedChange={(checked) => handleElementChange(element.id, checked)}
          />
        );
      default:
        return null;
    }
  }, [pageValues, handleElementChange, handleImageUpload, handleRemoveImage, uploadingImage]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Personnalisation de la Page d'Accueil
          </CardTitle>
          <CardDescription>
            Personnalisez tous les éléments de votre page d'accueil : textes, images, couleurs, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedSection} onValueChange={setSelectedSection}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-4">
              <TabsList className="inline-flex w-full justify-start p-1">
                {LANDING_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <TabsTrigger key={section.id} value={section.id} className="text-xs sm:text-sm shrink-0">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{section.name}</span>
                      <span className="sm:hidden">{section.name.split(' ')[0]}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {selectedSectionConfig && (
              <TabsContent value={selectedSection} className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <selectedSectionConfig.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{selectedSectionConfig.name}</h3>
                  <Badge variant="secondary">{selectedSectionConfig.elements.length} éléments</Badge>
                </div>
                <Separator />
                <div className="space-y-4">
                  {selectedSectionConfig.elements.map((element) => (
                    <div key={element.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`landing-${element.id}`} className="text-sm font-medium">
                          {element.label}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {element.type}
                        </Badge>
                      </div>
                      {element.description && (
                        <p className="text-xs text-muted-foreground">{element.description}</p>
                      )}
                      {renderElementEditor(element)}
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

