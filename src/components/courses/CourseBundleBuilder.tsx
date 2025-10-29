import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Plus,
  Trash2,
  GraduationCap,
  DollarSign,
  Percent,
  Users,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Tag,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Cours dans un bundle
 */
export interface BundleCourse {
  id: string;
  name: string;
  price: number;
  duration: number; // heures
  instructor: string;
  thumbnail?: string;
  isRequired: boolean;
}

/**
 * Type de réduction
 */
export type BundleDiscountType = 'percentage' | 'fixed_amount';

/**
 * Bundle de cours
 */
export interface CourseBundle {
  id?: string;
  name: string;
  description: string;
  courses: BundleCourse[];
  discountType: BundleDiscountType;
  discountValue: number;
  finalPrice: number;
  isActive: boolean;
  maxStudents?: number;
  validityPeriod?: number; // jours
  metadata?: {
    totalValue: number;
    totalDuration: number;
    savings: number;
    savingsPercentage: number;
  };
}

/**
 * Cours disponible pour ajout
 */
export interface AvailableCourse {
  id: string;
  name: string;
  price: number;
  duration: number;
  instructor: string;
  category: string;
  thumbnail?: string;
  enrolledStudents: number;
}

/**
 * Props pour CourseBundleBuilder
 */
export interface CourseBundleBuilderProps {
  /** Liste des cours disponibles */
  availableCourses: AvailableCourse[];
  
  /** Bundle en cours d'édition (optionnel) */
  editingBundle?: CourseBundle;
  
  /** Callback de sauvegarde */
  onSave?: (bundle: CourseBundle) => void;
  
  /** Callback d'annulation */
  onCancel?: () => void;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Devise */
  currency?: string;
}

/**
 * CourseBundleBuilder - Constructeur de packs de cours
 * 
 * @example
 * ```tsx
 * <CourseBundleBuilder 
 *   availableCourses={myCourses}
 *   onSave={(bundle) => createBundle(bundle)}
 *   currency="EUR"
 * />
 * ```
 */
export const CourseBundleBuilder: React.FC<CourseBundleBuilderProps> = ({
  availableCourses,
  editingBundle,
  onSave,
  onCancel,
  className,
  currency = 'EUR',
}) => {
  const [bundleName, setBundleName] = useState(editingBundle?.name || '');
  const [description, setDescription] = useState(editingBundle?.description || '');
  const [selectedCourses, setSelectedCourses] = useState<BundleCourse[]>(
    editingBundle?.courses || []
  );
  const [discountType, setDiscountType] = useState<BundleDiscountType>(
    editingBundle?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState(editingBundle?.discountValue || 0);
  const [maxStudents, setMaxStudents] = useState<number | undefined>(editingBundle?.maxStudents);
  const [validityPeriod, setValidityPeriod] = useState<number | undefined>(
    editingBundle?.validityPeriod
  );
  const [isActive, setIsActive] = useState(editingBundle?.isActive ?? true);

  // Calculer la valeur totale
  const totalValue = useMemo(() => {
    return selectedCourses.reduce((sum, course) => sum + course.price, 0);
  }, [selectedCourses]);

  // Calculer la durée totale
  const totalDuration = useMemo(() => {
    return selectedCourses.reduce((sum, course) => sum + course.duration, 0);
  }, [selectedCourses]);

  // Calculer le prix final
  const finalPrice = useMemo(() => {
    if (discountType === 'percentage') {
      return totalValue * (1 - discountValue / 100);
    } else {
      return Math.max(0, totalValue - discountValue);
    }
  }, [totalValue, discountType, discountValue]);

  // Calculer les économies
  const savings = totalValue - finalPrice;
  const savingsPercentage = totalValue > 0 ? (savings / totalValue) * 100 : 0;

  // Ajouter un cours
  const addCourse = (courseId: string) => {
    const course = availableCourses.find((c) => c.id === courseId);
    if (!course) return;

    const bundleCourse: BundleCourse = {
      id: course.id,
      name: course.name,
      price: course.price,
      duration: course.duration,
      instructor: course.instructor,
      thumbnail: course.thumbnail,
      isRequired: true,
    };

    setSelectedCourses([...selectedCourses, bundleCourse]);
  };

  // Retirer un cours
  const removeCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter((c) => c.id !== courseId));
  };

  // Basculer le statut "requis"
  const toggleRequired = (courseId: string) => {
    setSelectedCourses(
      selectedCourses.map((c) =>
        c.id === courseId ? { ...c, isRequired: !c.isRequired } : c
      )
    );
  };

  // Sauvegarder le bundle
  const handleSave = () => {
    const bundle: CourseBundle = {
      id: editingBundle?.id,
      name: bundleName,
      description,
      courses: selectedCourses,
      discountType,
      discountValue,
      finalPrice,
      isActive,
      maxStudents,
      validityPeriod,
      metadata: {
        totalValue,
        totalDuration,
        savings,
        savingsPercentage,
      },
    };

    onSave?.(bundle);
  };

  // Vérifier si le formulaire est valide
  const isValid = bundleName.trim() !== '' && selectedCourses.length >= 2;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          {editingBundle ? 'Éditer le Bundle' : 'Créer un Bundle'}
        </h2>
        <p className="text-muted-foreground">
          Créez des offres groupées de cours avec des réductions attractives
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Configuration */}
        <div className="space-y-6">
          {/* Informations de base */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Informations de Base</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bundle-name">Nom du bundle *</Label>
                <Input
                  id="bundle-name"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  placeholder="Ex: Pack Développeur Full-Stack"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre bundle..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Bundle actif</p>
                  <p className="text-xs text-muted-foreground">
                    Visible dans la boutique
                  </p>
                </div>
                <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
              </div>
            </div>
          </Card>

          {/* Sélection des cours */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cours Inclus ({selectedCourses.length})</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ajouter un cours</Label>
                <Select onValueChange={addCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses
                      .filter((course) => !selectedCourses.find((c) => c.id === course.id))
                      .map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{course.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {course.price} {currency}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCourses.length > 0 && (
                <>
                  <Separator />
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {selectedCourses.map((course) => (
                        <div key={course.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{course.name}</p>
                              <p className="text-xs text-muted-foreground">{course.instructor}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={course.isRequired}
                                onCheckedChange={() => toggleRequired(course.id)}
                              />
                              <span className="text-xs">Requis</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {course.price} {currency} • {course.duration}h
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              {selectedCourses.length < 2 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Ajoutez au moins 2 cours pour créer un bundle
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Paramètres avancés */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Paramètres Avancés</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-students">Capacité maximale</Label>
                <Input
                  id="max-students"
                  type="number"
                  value={maxStudents || ''}
                  onChange={(e) =>
                    setMaxStudents(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="Illimité"
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validity">Période de validité (jours)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={validityPeriod || ''}
                  onChange={(e) =>
                    setValidityPeriod(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="Accès à vie"
                  min={1}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Colonne droite - Tarification & Aperçu */}
        <div className="space-y-6">
          {/* Tarification */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tarification
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de réduction</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value: BundleDiscountType) => setDiscountType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valeur</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={discountType === 'percentage' ? 100 : totalValue}
                    />
                    {discountType === 'percentage' && <Percent className="h-4 w-4" />}
                    {discountType === 'fixed_amount' && <span className="text-sm">{currency}</span>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Résumé des prix */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valeur totale</span>
                  <span className="font-semibold">
                    {totalValue.toFixed(2)} {currency}
                  </span>
                </div>

                {discountValue > 0 && (
                  <>
                    <div className="flex justify-between items-center text-red-600">
                      <span className="text-sm">Réduction</span>
                      <span className="font-semibold">
                        -{savings.toFixed(2)} {currency} ({savingsPercentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span className="font-semibold">Prix final</span>
                  <span className="text-2xl font-bold text-primary">
                    {finalPrice.toFixed(2)} {currency}
                  </span>
                </div>

                {discountValue > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">
                        Les étudiants économisent {savingsPercentage.toFixed(0)}% !
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Aperçu du bundle */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Aperçu du Bundle</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-lg">{bundleName || 'Sans titre'}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {description || 'Aucune description'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cours inclus</span>
                  </div>
                  <p className="text-lg font-bold">{selectedCourses.length}</p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Durée totale</span>
                  </div>
                  <p className="text-lg font-bold">{totalDuration}h</p>
                </div>
              </div>

              {maxStudents && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Places disponibles</span>
                  </div>
                  <span className="font-semibold">{maxStudents}</span>
                </div>
              )}

              {validityPeriod && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Validité</span>
                  </div>
                  <span className="font-semibold">{validityPeriod} jours</span>
                </div>
              )}

              <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">Prix</span>
                  <div className="text-right">
                    {discountValue > 0 && (
                      <p className="text-xs line-through opacity-70">
                        {totalValue.toFixed(2)} {currency}
                      </p>
                    )}
                    <p className="text-2xl font-bold">
                      {finalPrice.toFixed(2)} {currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Annuler
              </Button>
            )}
            <Button onClick={handleSave} disabled={!isValid} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {editingBundle ? 'Mettre à jour' : 'Créer le Bundle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

CourseBundleBuilder.displayName = 'CourseBundleBuilder';

export default CourseBundleBuilder;

