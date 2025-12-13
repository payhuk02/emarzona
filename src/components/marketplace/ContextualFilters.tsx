/**
 * ContextualFilters - Filtres contextuels adaptés par type de produit
 * Affiche uniquement les filtres pertinents selon le type de produit sélectionné
 *
 * Date: 31 Janvier 2025
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterState } from '@/types/marketplace';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  Package,
  Calendar,
  GraduationCap,
  Palette,
  Shield,
  Truck,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';

interface ContextualFiltersProps {
  productType: string;
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
}

export function ContextualFilters({
  productType,
  filters,
  onFiltersChange,
}: ContextualFiltersProps) {
  const { t: _t } = useTranslation();

  const typeSpecificFilters = useMemo(() => {
    switch (productType) {
      case 'digital':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sous-type digital */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Download className="inline h-4 w-4 mr-2" />
                Sous-type
              </Label>
              <Select
                value={filters.digitalSubType || 'all'}
                onValueChange={value =>
                  onFiltersChange({ digitalSubType: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les sous-types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sous-types</SelectItem>
                  <SelectItem value="software">Logiciel</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="plugin">Plugin</SelectItem>
                  <SelectItem value="music">Musique</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="graphic">Graphisme</SelectItem>
                  <SelectItem value="game">Jeu</SelectItem>
                  <SelectItem value="app">Application</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="data">Données</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Livraison instantanée */}
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="instantDelivery"
                checked={filters.instantDelivery || false}
                onCheckedChange={checked =>
                  onFiltersChange({ instantDelivery: checked as boolean })
                }
                className="border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="instantDelivery" className="text-sm text-slate-300 cursor-pointer">
                Livraison instantanée uniquement
              </Label>
            </div>
          </div>
        );

      case 'physical':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Disponibilité stock */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Package className="inline h-4 w-4 mr-2" />
                Disponibilité
              </Label>
              <Select
                value={filters.stockAvailability || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    stockAvailability:
                      value === 'all'
                        ? undefined
                        : (value as 'in_stock' | 'low_stock' | 'out_of_stock'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Toutes les disponibilités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les disponibilités</SelectItem>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="low_stock">Stock faible</SelectItem>
                  <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Livraison */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Truck className="inline h-4 w-4 mr-2" />
                Livraison
              </Label>
              <Select
                value={filters.shippingType || 'all'}
                onValueChange={value =>
                  onFiltersChange({ shippingType: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les types de livraison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="free">Livraison gratuite</SelectItem>
                  <SelectItem value="paid">Livraison payante</SelectItem>
                  <SelectItem value="pickup">Retrait en magasin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie physique */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">Catégorie</Label>
              <Select
                value={filters.physicalCategory || 'all'}
                onValueChange={value =>
                  onFiltersChange({ physicalCategory: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="vetements">Vêtements</SelectItem>
                  <SelectItem value="electronique">Électronique</SelectItem>
                  <SelectItem value="maison">Maison & Jardin</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="beaute">Beauté</SelectItem>
                  <SelectItem value="jouets">Jouets</SelectItem>
                  <SelectItem value="alimentation">Alimentation</SelectItem>
                  <SelectItem value="artisanat">Artisanat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type de service */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Calendar className="inline h-4 w-4 mr-2" />
                Type de service
              </Label>
              <Select
                value={filters.serviceType || 'all'}
                onValueChange={value =>
                  onFiltersChange({ serviceType: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="class">Cours</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Localisation */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <MapPin className="inline h-4 w-4 mr-2" />
                Localisation
              </Label>
              <Select
                value={filters.locationType || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    locationType:
                      value === 'all'
                        ? undefined
                        : (value as 'online' | 'on_site' | 'customer_location'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Toutes les localisations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les localisations</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="on_site">Sur site</SelectItem>
                  <SelectItem value="customer_location">Chez vous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Disponibilité calendrier */}
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="calendarAvailable"
                checked={filters.calendarAvailable || false}
                onCheckedChange={checked =>
                  onFiltersChange({ calendarAvailable: checked as boolean })
                }
                className="border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="calendarAvailable" className="text-sm text-slate-300 cursor-pointer">
                Calendrier disponible
              </Label>
            </div>
          </div>
        );

      case 'course':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Niveau de difficulté */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <GraduationCap className="inline h-4 w-4 mr-2" />
                Niveau
              </Label>
              <Select
                value={filters.difficulty || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    difficulty:
                      value === 'all'
                        ? undefined
                        : (value as 'beginner' | 'intermediate' | 'advanced'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type d'accès */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Clock className="inline h-4 w-4 mr-2" />
                Type d'accès
              </Label>
              <Select
                value={filters.accessType || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    accessType:
                      value === 'all' ? undefined : (value as 'lifetime' | 'subscription'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les types d'accès" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="lifetime">Accès à vie</SelectItem>
                  <SelectItem value="subscription">Abonnement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Durée totale */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">Durée totale</Label>
              <Select
                value={filters.courseDuration || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    courseDuration:
                      value === 'all' ? undefined : (value as '<1h' | '1-5h' | '5-10h' | '10h+'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Toutes les durées" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les durées</SelectItem>
                  <SelectItem value="<1h">Moins de 1h</SelectItem>
                  <SelectItem value="1-5h">1h à 5h</SelectItem>
                  <SelectItem value="5-10h">5h à 10h</SelectItem>
                  <SelectItem value="10h+">Plus de 10h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'artist':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type d'artiste */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Palette className="inline h-4 w-4 mr-2" />
                Type d'artiste
              </Label>
              <Select
                value={filters.artistType || 'all'}
                onValueChange={value =>
                  onFiltersChange({ artistType: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="writer">Écrivain</SelectItem>
                  <SelectItem value="musician">Musicien</SelectItem>
                  <SelectItem value="visual_artist">Artiste visuel</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="multimedia">Multimédia</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type d'édition */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">
                <Award className="inline h-4 w-4 mr-2" />
                Type d'édition
              </Label>
              <Select
                value={filters.editionType || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    editionType:
                      value === 'all'
                        ? undefined
                        : (value as 'original' | 'limited_edition' | 'print' | 'reproduction'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="limited_edition">Édition limitée</SelectItem>
                  <SelectItem value="print">Tirage</SelectItem>
                  <SelectItem value="reproduction">Reproduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Certificat d'authenticité */}
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="certificateOfAuthenticity"
                checked={filters.certificateOfAuthenticity || false}
                onCheckedChange={checked =>
                  onFiltersChange({ certificateOfAuthenticity: checked as boolean })
                }
                className="border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor="certificateOfAuthenticity"
                className="text-sm text-slate-300 cursor-pointer flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Certificat d'authenticité uniquement
              </Label>
            </div>

            {/* Disponibilité */}
            <div>
              <Label className="text-sm font-medium mb-2 block text-slate-300">Disponibilité</Label>
              <Select
                value={filters.artworkAvailability || 'all'}
                onValueChange={value =>
                  onFiltersChange({
                    artworkAvailability:
                      value === 'all' ? undefined : (value as 'available' | 'limited' | 'sold_out'),
                  })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Toutes les disponibilités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les disponibilités</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="limited">Édition limitée disponible</SelectItem>
                  <SelectItem value="sold_out">Épuisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [productType, filters, onFiltersChange]);

  const getProductTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      digital: 'Produits Digitaux',
      physical: 'Produits Physiques',
      service: 'Services',
      course: 'Cours en ligne',
      artist: "Œuvres d'artistes",
    };
    return labels[type] || type;
  };

  const getProductTypeIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      digital: Download,
      physical: Package,
      service: Calendar,
      course: GraduationCap,
      artist: Palette,
    };
    return icons[type] || Download;
  };

  if (productType === 'all' || !typeSpecificFilters) {
    return null;
  }

  const Icon = getProductTypeIcon(productType);

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600 mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Icon className="h-5 w-5" />
          Filtres spécifiques - {getProductTypeLabel(productType)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{typeSpecificFilters}</CardContent>
    </Card>
  );
}
