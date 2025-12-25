/**
 * Catégories pour tous les systèmes e-commerce
 * Date: 31 Janvier 2025
 * 
 * Centralise toutes les catégories pour les 5 types de produits :
 * - Digital
 * - Physical
 * - Service
 * - Course
 * - Artist
 */

import {
  Users,
  Package,
  Settings,
  Smartphone,
  Info,
  CheckCircle2,
  Download,
  Video as VideoIcon,
  BookOpen,
  GraduationCap,
  Target,
  TrendingUp,
  Globe,
  Wrench,
  Palette,
  Code,
  Camera,
  Music,
  FileText,
  Layout,
  ShoppingBag,
  Zap,
  Heart,
  Sparkles,
  Gift,
  PenTool,
  Film,
  Headphones,
  Mic,
  Layers,
  BarChart3,
  Cloud,
  Shield,
  Database,
  Image as ImageIcon,
  MessageSquare,
  Briefcase,
  LucideIcon,
  Paintbrush,
  Brush,
  Scissors,
  Hammer,
  Home,
  Dumbbell,
  Shirt,
  Watch,
  Gamepad2,
  Utensils,
  BookMarked,
  Award,
  Trophy,
  Star,
  Compass,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

export interface CategoryOption {
  value: string;
  label: string;
  icon: LucideIcon;
  popular?: boolean;
}

/**
 * Catégories pour produits DIGITAUX
 */
export const DIGITAL_CATEGORIES: CategoryOption[] = [
  { value: "formation", label: "Formation", icon: GraduationCap, popular: true },
  { value: "ebook", label: "Ebook", icon: BookOpen, popular: true },
  { value: "template", label: "Template", icon: Layout, popular: true },
  { value: "logiciel", label: "Logiciel", icon: Smartphone, popular: true },
  { value: "cours", label: "Cours en ligne", icon: Users, popular: true },
  { value: "guide", label: "Guide", icon: Info, popular: false },
  { value: "checklist", label: "Checklist", icon: CheckCircle2, popular: false },
  { value: "audio", label: "Fichier audio", icon: Music, popular: false },
  { value: "video", label: "Vidéo", icon: VideoIcon, popular: false },
  { value: "app", label: "Application mobile", icon: Smartphone, popular: false },
  { value: "plugin", label: "Plugin", icon: Settings, popular: false },
  { value: "extension", label: "Extension", icon: Settings, popular: false },
  { value: "theme", label: "Thème", icon: Layout, popular: false },
  { value: "preset", label: "Preset", icon: Settings, popular: false },
  { value: "script", label: "Script", icon: Code, popular: false },
  { value: "font", label: "Police de caractères", icon: FileText, popular: false },
  { value: "icone", label: "Pack d'icônes", icon: ImageIcon, popular: false },
  { value: "graphisme", label: "Ressources graphiques", icon: Palette, popular: false },
  { value: "3d", label: "Modèles 3D", icon: Package, popular: false },
  { value: "stock", label: "Photos/Vidéos stock", icon: Camera, popular: false },
  { value: "podcast", label: "Podcast", icon: Mic, popular: false },
  { value: "musique", label: "Musique", icon: Music, popular: false },
  { value: "autre", label: "Autre", icon: Package, popular: false },
];

/**
 * Catégories pour produits PHYSIQUES
 */
export const PHYSICAL_CATEGORIES: CategoryOption[] = [
  { value: "vetements", label: "Vêtements", icon: Shirt, popular: true },
  { value: "accessoires", label: "Accessoires", icon: Watch, popular: true },
  { value: "artisanat", label: "Artisanat", icon: Hammer, popular: true },
  { value: "electronique", label: "Électronique", icon: Smartphone, popular: true },
  { value: "maison", label: "Maison & Jardin", icon: Home, popular: true },
  { value: "sport", label: "Sport", icon: Dumbbell, popular: true },
  { value: "beaute", label: "Beauté", icon: Sparkles, popular: false },
  { value: "livres", label: "Livres", icon: BookOpen, popular: false },
  { value: "jouets", label: "Jouets", icon: Gamepad2, popular: false },
  { value: "alimentation", label: "Alimentation", icon: Utensils, popular: false },
  { value: "decoration", label: "Décoration", icon: Heart, popular: false },
  { value: "bijoux", label: "Bijoux", icon: Sparkles, popular: false },
  { value: "cosmetiques", label: "Cosmétiques", icon: Sparkles, popular: false },
  { value: "sante", label: "Santé & Bien-être", icon: Heart, popular: false },
  { value: "bebe", label: "Bébé & Enfant", icon: Gift, popular: false },
  { value: "animaux", label: "Animaux", icon: Heart, popular: false },
  { value: "automobile", label: "Automobile", icon: Package, popular: false },
  { value: "outils", label: "Outils", icon: Wrench, popular: false },
  { value: "jardinage", label: "Jardinage", icon: Home, popular: false },
  { value: "autre", label: "Autre", icon: Package, popular: false },
];

/**
 * Catégories pour SERVICES
 */
export const SERVICE_CATEGORIES: CategoryOption[] = [
  { value: "consultation", label: "Consultation", icon: Users, popular: true },
  { value: "coaching", label: "Coaching", icon: Target, popular: true },
  { value: "design", label: "Design", icon: Palette, popular: true },
  { value: "developpement", label: "Développement", icon: Code, popular: true },
  { value: "marketing", label: "Marketing", icon: TrendingUp, popular: true },
  { value: "redaction", label: "Rédaction", icon: FileText, popular: true },
  { value: "traduction", label: "Traduction", icon: Globe, popular: false },
  { value: "maintenance", label: "Maintenance", icon: Wrench, popular: false },
  { value: "formation", label: "Formation", icon: GraduationCap, popular: false },
  { value: "conseil", label: "Conseil", icon: Briefcase, popular: false },
  { value: "graphisme", label: "Graphisme", icon: Palette, popular: false },
  { value: "ui-ux", label: "UI/UX Design", icon: Layers, popular: false },
  { value: "illustration", label: "Illustration", icon: PenTool, popular: false },
  { value: "animation", label: "Animation", icon: Film, popular: false },
  { value: "video", label: "Vidéo & Montage", icon: VideoIcon, popular: false },
  { value: "photographie", label: "Photographie", icon: Camera, popular: false },
  { value: "audio", label: "Audio & Musique", icon: Music, popular: false },
  { value: "voix-off", label: "Voix-off", icon: Headphones, popular: false },
  { value: "podcast", label: "Podcast", icon: Mic, popular: false },
  { value: "social", label: "Réseaux sociaux", icon: MessageSquare, popular: false },
  { value: "seo", label: "SEO", icon: TrendingUp, popular: false },
  { value: "data", label: "Data & Analytics", icon: BarChart3, popular: false },
  { value: "cloud", label: "Cloud & DevOps", icon: Cloud, popular: false },
  { value: "securite", label: "Sécurité", icon: Shield, popular: false },
  { value: "support", label: "Support technique", icon: Wrench, popular: false },
  { value: "autre", label: "Autre", icon: Package, popular: false },
];

/**
 * Catégories pour COURS EN LIGNE
 */
export const COURSE_CATEGORIES: CategoryOption[] = [
  { value: "programmation", label: "Programmation", icon: Code, popular: true },
  { value: "design", label: "Design", icon: Palette, popular: true },
  { value: "marketing", label: "Marketing Digital", icon: TrendingUp, popular: true },
  { value: "business", label: "Business & Entrepreneuriat", icon: Briefcase, popular: true },
  { value: "langues", label: "Langues", icon: Globe, popular: true },
  { value: "photographie", label: "Photographie", icon: Camera, popular: false },
  { value: "video", label: "Vidéo & Montage", icon: VideoIcon, popular: false },
  { value: "musique", label: "Musique", icon: Music, popular: false },
  { value: "ecriture", label: "Écriture & Rédaction", icon: FileText, popular: false },
  { value: "sante", label: "Santé & Bien-être", icon: Heart, popular: false },
  { value: "cuisine", label: "Cuisine", icon: Utensils, popular: false },
  { value: "sport", label: "Sport & Fitness", icon: Dumbbell, popular: false },
  { value: "finance", label: "Finance & Investissement", icon: DollarSign, popular: false },
  { value: "psychologie", label: "Psychologie", icon: Users, popular: false },
  { value: "art", label: "Art & Dessin", icon: Paintbrush, popular: false },
  { value: "musique-production", label: "Production Musicale", icon: Music, popular: false },
  { value: "animation", label: "Animation", icon: Film, popular: false },
  { value: "3d", label: "Modélisation 3D", icon: Package, popular: false },
  { value: "ui-ux", label: "UI/UX Design", icon: Layers, popular: false },
  { value: "data-science", label: "Data Science", icon: BarChart3, popular: false },
  { value: "ia", label: "Intelligence Artificielle", icon: Zap, popular: false },
  { value: "cybersecurite", label: "Cybersécurité", icon: Shield, popular: false },
  { value: "autre", label: "Autre", icon: Package, popular: false },
];

/**
 * Catégories pour ŒUVRES D'ARTISTE
 */
export const ARTIST_CATEGORIES: CategoryOption[] = [
  { value: "peinture", label: "Peinture", icon: Paintbrush, popular: true },
  { value: "dessin", label: "Dessin", icon: PenTool, popular: true },
  { value: "sculpture", label: "Sculpture", icon: Hammer, popular: true },
  { value: "photographie-art", label: "Photographie d'art", icon: Camera, popular: true },
  { value: "illustration", label: "Illustration", icon: PenTool, popular: true },
  { value: "gravure", label: "Gravure", icon: Scissors, popular: false },
  { value: "collage", label: "Collage", icon: Layers, popular: false },
  { value: "mural", label: "Art mural", icon: ImageIcon, popular: false },
  { value: "digital-art", label: "Art numérique", icon: Smartphone, popular: false },
  { value: "mixed-media", label: "Techniques mixtes", icon: Palette, popular: false },
  { value: "ceramique", label: "Céramique", icon: Package, popular: false },
  { value: "verre", label: "Art verrier", icon: Sparkles, popular: false },
  { value: "textile", label: "Art textile", icon: Shirt, popular: false },
  { value: "livre-artiste", label: "Livre d'artiste", icon: BookOpen, popular: false },
  { value: "estampe", label: "Estampe", icon: ImageIcon, popular: false },
  { value: "autre", label: "Autre", icon: Package, popular: false },
];

/**
 * Obtenir toutes les catégories pour un type de produit
 */
export function getCategoriesForProductType(productType: string): CategoryOption[] {
  switch (productType) {
    case 'digital':
      return DIGITAL_CATEGORIES;
    case 'physical':
      return PHYSICAL_CATEGORIES;
    case 'service':
      return SERVICE_CATEGORIES;
    case 'course':
      return COURSE_CATEGORIES;
    case 'artist':
      return ARTIST_CATEGORIES;
    default:
      return [];
  }
}

/**
 * Obtenir toutes les catégories pour la marketplace (tous types confondus)
 */
export function getAllMarketplaceCategories(): CategoryOption[] {
  // Combiner toutes les catégories et dédupliquer par value
  const allCategories = new Map<string, CategoryOption>();
  
  [...DIGITAL_CATEGORIES, ...PHYSICAL_CATEGORIES, ...SERVICE_CATEGORIES, ...COURSE_CATEGORIES, ...ARTIST_CATEGORIES].forEach(cat => {
    if (!allCategories.has(cat.value)) {
      allCategories.set(cat.value, cat);
    }
  });
  
  return Array.from(allCategories.values()).sort((a, b) => {
    // Mettre les catégories populaires en premier
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.label.localeCompare(b.label);
  });
}

