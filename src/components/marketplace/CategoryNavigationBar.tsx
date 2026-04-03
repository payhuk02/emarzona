import { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Star,
  Palette,
  TrendingUp,
  Video,
  Code,
  FileText,
  Users,
  Briefcase,
  Globe,
  Target,
  Wrench,
  Info,
  Compass,
  BookOpen,
  Layout,
  Smartphone,
  Camera,
  Music,
  ShoppingBag,
  Zap,
  Image as ImageIcon,
  BarChart3,
  MessageSquare,
  Search,
  Gift,
  Package,
  GraduationCap,
  Headphones,
  Mic,
  Film,
  PenTool,
  Layers,
  Database,
  Cloud,
  Shield,
  Heart,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getAllMarketplaceCategories, type CategoryOption } from '@/constants/product-categories';

interface CategoryNavigationBarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryNavigationBar({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryNavigationBarProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Définition complète des catégories avec leurs icônes et labels (style comeup.com)
  // Utilise maintenant les catégories centralisées avec i18n
  const  CATEGORY_CONFIG_BASE: CategoryOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: t('marketplace.categories.all', 'Pour vous'),
        icon: Compass,
        popular: false,
      },
      {
        value: 'featured',
        label: t('marketplace.categories.featured', 'Meilleurs services'),
        icon: Star,
        popular: true,
      },
      {
        value: 'formation',
        label: t('marketplace.categories.formation', 'Formations'),
        icon: GraduationCap,
        popular: true,
      },
      {
        value: 'cours',
        label: t('marketplace.categories.cours', 'Cours'),
        icon: BookOpen,
        popular: true,
      },
      {
        value: 'design',
        label: t('marketplace.categories.design', 'Design & Graphisme'),
        icon: Palette,
        popular: true,
      },
      {
        value: 'marketing',
        label: t('marketplace.categories.marketing', 'SEO & Marketing'),
        icon: TrendingUp,
        popular: true,
      },
      {
        value: 'developpement',
        label: t('marketplace.categories.developpement', 'Développement Web'),
        icon: Code,
        popular: true,
      },
      {
        value: 'informatique',
        label: t('marketplace.categories.informatique', 'Informatique'),
        icon: Smartphone,
        popular: true,
      },
      {
        value: 'redaction',
        label: t('marketplace.categories.redaction', 'Rédaction'),
        icon: FileText,
        popular: true,
      },
      {
        value: 'video',
        label: t('marketplace.categories.video', 'Vidéo & Montage'),
        icon: Video,
        popular: true,
      },
      {
        value: 'audio',
        label: t('marketplace.categories.audio', 'Audio & Musique'),
        icon: Music,
        popular: false,
      },
      {
        value: 'photographie',
        label: t('marketplace.categories.photographie', 'Photographie'),
        icon: Camera,
        popular: false,
      },
      {
        value: 'ebook',
        label: t('marketplace.categories.ebook', 'Ebooks & Guides'),
        icon: BookOpen,
        popular: false,
      },
      {
        value: 'template',
        label: t('marketplace.categories.template', 'Templates'),
        icon: Layout,
        popular: false,
      },
      {
        value: 'logiciel',
        label: t('marketplace.categories.logiciel', 'Logiciels'),
        icon: Smartphone,
        popular: false,
      },
      {
        value: 'app',
        label: t('marketplace.categories.app', 'Applications'),
        icon: Smartphone,
        popular: false,
      },
      {
        value: 'vetements',
        label: t('marketplace.categories.vetements', 'T-shirts & Vêtements'),
        icon: ShoppingBag,
        popular: false,
      },
      {
        value: 'accessoires',
        label: t('marketplace.categories.accessoires', 'Accessoires'),
        icon: Package,
        popular: false,
      },
      {
        value: 'electronique',
        label: t('marketplace.categories.electronique', 'Électronique'),
        icon: Zap,
        popular: false,
      },
      {
        value: 'traduction',
        label: t('marketplace.categories.traduction', 'Traduction'),
        icon: Globe,
        popular: false,
      },
      {
        value: 'coaching',
        label: t('marketplace.categories.coaching', 'Coaching'),
        icon: Target,
        popular: false,
      },
      {
        value: 'consultation',
        label: t('marketplace.categories.consultation', 'Consultation'),
        icon: Users,
        popular: false,
      },
      {
        value: 'conseil',
        label: t('marketplace.categories.conseil', 'Conseil Business'),
        icon: Briefcase,
        popular: false,
      },
      {
        value: 'social',
        label: t('marketplace.categories.social', 'Réseaux sociaux'),
        icon: MessageSquare,
        popular: false,
      },
      {
        value: 'maintenance',
        label: t('marketplace.categories.maintenance', 'Maintenance'),
        icon: Wrench,
        popular: false,
      },
      {
        value: 'graphisme',
        label: t('marketplace.categories.graphisme', 'Graphisme'),
        icon: ImageIcon,
        popular: false,
      },
      {
        value: 'animation',
        label: t('marketplace.categories.animation', 'Animation'),
        icon: Film,
        popular: false,
      },
      {
        value: 'illustration',
        label: t('marketplace.categories.illustration', 'Illustration'),
        icon: PenTool,
        popular: false,
      },
      {
        value: 'ui-ux',
        label: t('marketplace.categories.uiUx', 'UI/UX Design'),
        icon: Layers,
        popular: false,
      },
      {
        value: 'data',
        label: t('marketplace.categories.data', 'Data & Analytics'),
        icon: BarChart3,
        popular: false,
      },
      {
        value: 'cloud',
        label: t('marketplace.categories.cloud', 'Cloud & DevOps'),
        icon: Cloud,
        popular: false,
      },
      {
        value: 'securite',
        label: t('marketplace.categories.securite', 'Sécurité'),
        icon: Shield,
        popular: false,
      },
      {
        value: 'podcast',
        label: t('marketplace.categories.podcast', 'Podcast'),
        icon: Mic,
        popular: false,
      },
      {
        value: 'voix-off',
        label: t('marketplace.categories.voixOff', 'Voix-off'),
        icon: Headphones,
        popular: false,
      },
      {
        value: 'maison',
        label: t('marketplace.categories.maison', 'Maison & Jardin'),
        icon: Package,
        popular: false,
      },
      {
        value: 'sport',
        label: t('marketplace.categories.sport', 'Sport'),
        icon: Package,
        popular: false,
      },
      {
        value: 'beaute',
        label: t('marketplace.categories.beaute', 'Beauté'),
        icon: Sparkles,
        popular: false,
      },
      {
        value: 'livres',
        label: t('marketplace.categories.livres', 'Livres'),
        icon: BookOpen,
        popular: false,
      },
      {
        value: 'jouets',
        label: t('marketplace.categories.jouets', 'Jouets'),
        icon: Gift,
        popular: false,
      },
      {
        value: 'alimentation',
        label: t('marketplace.categories.alimentation', 'Alimentation'),
        icon: Package,
        popular: false,
      },
      {
        value: 'artisanat',
        label: t('marketplace.categories.artisanat', 'Artisanat'),
        icon: Package,
        popular: false,
      },
    ],
    [t]
  );

  // Combiner les catégories de base avec toutes les catégories des 5 systèmes
  const availableCategories = useMemo(() => {
    const allCategories = [
      ...CATEGORY_CONFIG_BASE,
      ...getAllMarketplaceCategories().filter(
        cat => !CATEGORY_CONFIG_BASE.some(base => base.value === cat.value)
      ),
    ];
    return allCategories;
  }, [CATEGORY_CONFIG_BASE]);

  // Gérer le scroll horizontal
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [availableCategories]);

  return (
    <div className="sticky top-0 z-40 w-full bg-transparent">
      {/* Container avec coins arrondis pour la barre de catégories */}
      <div className="relative w-full bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Flèche gauche */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-12 bg-gradient-to-r from-white via-white/95 to-transparent hover:from-gray-50 transition-all duration-200 shadow-sm"
            aria-label={t('marketplace.categories.scrollLeft', 'Faire défiler vers la gauche')}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 hover:text-gray-900" />
          </button>
        )}

        {/* Flèche droite */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-12 bg-gradient-to-l from-white via-white/95 to-transparent hover:from-gray-50 transition-all duration-200 shadow-sm"
            aria-label={t('marketplace.categories.scrollRight', 'Faire défiler vers la droite')}
          >
            <ChevronRight className="w-5 h-5 text-gray-700 hover:text-gray-900" />
          </button>
        )}

        <div className="w-full overflow-hidden">
          <nav
            ref={scrollContainerRef}
            className="flex items-center gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide py-4 px-4 sm:px-6 lg:px-8 scroll-smooth"
            role="tablist"
            aria-label={t('marketplace.categories.ariaLabel', 'Catégories de services')}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {availableCategories.map(category => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 min-w-[70px] sm:min-w-[85px] px-2 sm:px-3 py-2 sm:py-2.5 transition-all duration-300',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg',
                    'hover:bg-gray-50 active:scale-95',
                    isActive && 'bg-gray-50'
                  )}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`category-${category.value}`}
                >
                  {/* Icône avec style amélioré - style comeup.com */}
                  <div
                    className={cn(
                      'relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all duration-300',
                      'transform',
                      isActive
                        ? 'bg-gray-900 text-white scale-110 shadow-lg ring-2 ring-gray-900 ring-offset-2'
                        : 'bg-gray-50 text-gray-600 border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:scale-105'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300',
                        isActive ? 'fill-white stroke-white' : 'stroke-current fill-none'
                      )}
                    />

                    {/* Badge "Populaire" pour les catégories populaires */}
                    {category.popular && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Texte avec style amélioré */}
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-medium text-center whitespace-nowrap transition-all duration-300 leading-tight',
                      isActive ? 'text-gray-900 font-bold' : 'text-gray-600 font-normal'
                    )}
                  >
                    {category.label}
                  </span>

                  {/* Ligne de soulignement épaisse pour l'élément actif */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-10 sm:w-12 h-1 bg-gray-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}






