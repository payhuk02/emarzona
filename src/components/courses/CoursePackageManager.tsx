import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Trash2,
  Edit,
  Package,
  GraduationCap,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Target,
  Sparkles,
  Copy,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Type de package
 */
export type PackageType = 'bundle' | 'learning_path' | 'subscription';

/**
 * Type de réduction
 */
export type DiscountType = 'percentage' | 'fixed_amount';

/**
 * Cours inclus dans un package
 */
export interface PackageCourse {
  id: string;
  name: string;
  price: number;
  duration: number; // heures
  thumbnail?: string;
  isRequired: boolean;
  order: number;
}

/**
 * Tier d'un package (e.g., Basic, Pro, Premium)
 */
export interface PackageTier {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  discountType: DiscountType;
  features: string[];
  maxStudents?: number;
  isPopular: boolean;
}

/**
 * Package de cours
 */
export interface CoursePackage {
  id: string;
  name: string;
  description: string;
  type: PackageType;
  courses: PackageCourse[];
  tiers: PackageTier[];
  totalValue: number;
  discountPercentage: number;
  isActive: boolean;
  enrolledStudents: number;
  revenue: number;
  currency: string;
  validityPeriod?: number; // jours
  createdAt: Date | string;
  thumbnail?: string;
}

/**
 * Props pour CoursePackageManager
 */
export interface CoursePackageManagerProps {
  /** Liste des packages */
  packages: CoursePackage[];
  
  /** Liste de tous les cours disponibles */
  availableCourses: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    thumbnail?: string;
  }>;
  
  /** Callback de création de package */
  onCreate?: (packageData: Partial<CoursePackage>) => void;
  
  /** Callback de mise à jour */
  onUpdate?: (packageId: string, packageData: Partial<CoursePackage>) => void;
  
  /** Callback de suppression */
  onDelete?: (packageId: string) => void;
  
  /** Callback de duplication */
  onDuplicate?: (packageId: string) => void;
  
  /** Callback d'activation/désactivation */
  onToggleActive?: (packageId: string, isActive: boolean) => void;
  
  /** Chargement en cours */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Mapping des types de packages
 */
const PACKAGE_TYPE_LABELS: Record<PackageType, { label: string; icon: React.ElementType }> = {
  bundle: { label: 'Bundle', icon: Package },
  learning_path: { label: 'Parcours d\'apprentissage', icon: Target },
  subscription: { label: 'Abonnement', icon: Calendar },
};

/**
 * CoursePackageManager - Gestionnaire de packages/bundles de cours
 * 
 * @example
 * ```tsx
 * <CoursePackageManager 
 *   packages={myPackages}
 *   availableCourses={allCourses}
 *   onCreate={(data) => createPackage(data)}
 *   onUpdate={(id, data) => updatePackage(id, data)}
 * />
 * ```
 */
export const CoursePackageManager: React.FC<CoursePackageManagerProps> = ({
  packages,
  availableCourses,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleActive,
  isLoading = false,
  className,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoursePackage | null>(null);
  const [formData, setFormData] = useState<Partial<CoursePackage>>({
    name: '',
    description: '',
    type: 'bundle',
    courses: [],
    tiers: [],
    isActive: true,
    currency: 'EUR',
  });

  // Ouvrir le dialogue pour créer/éditer
  const openDialog = (pkg?: CoursePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData(pkg);
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        type: 'bundle',
        courses: [],
        tiers: [],
        isActive: true,
        currency: 'EUR',
      });
    }
    setIsDialogOpen(true);
  };

  // Fermer le dialogue
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
  };

  // Sauvegarder le package
  const handleSave = () => {
    if (editingPackage && onUpdate) {
      onUpdate(editingPackage.id, formData);
    } else if (onCreate) {
      onCreate(formData);
    }
    closeDialog();
  };

  // Ajouter un cours au package
  const addCourseToPackage = (courseId: string) => {
    const course = availableCourses.find((c) => c.id === courseId);
    if (!course) return;

    const newCourse: PackageCourse = {
      id: course.id,
      name: course.name,
      price: course.price,
      duration: course.duration,
      thumbnail: course.thumbnail,
      isRequired: true,
      order: (formData.courses?.length || 0) + 1,
    };

    setFormData((prev) => ({
      ...prev,
      courses: [...(prev.courses || []), newCourse],
    }));
  };

  // Retirer un cours du package
  const removeCourseFromPackage = (courseId: string) => {
    setFormData((prev) => ({
      ...prev,
      courses: prev.courses?.filter((c) => c.id !== courseId) || [],
    }));
  };

  // Ajouter un tier
  const addTier = () => {
    const newTier: PackageTier = {
      id: `tier-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      discount: 0,
      discountType: 'percentage',
      features: [],
      isPopular: false,
    };

    setFormData((prev) => ({
      ...prev,
      tiers: [...(prev.tiers || []), newTier],
    }));
  };

  // Mettre à jour un tier
  const updateTier = (tierId: string, updates: Partial<PackageTier>) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers?.map((tier) =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ) || [],
    }));
  };

  // Supprimer un tier
  const removeTier = (tierId: string) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers?.filter((t) => t.id !== tierId) || [],
    }));
  };

  // Calculer la valeur totale du package
  const calculateTotalValue = (courses: PackageCourse[]) => {
    return courses.reduce((sum, course) => sum + course.price, 0);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Packages de Cours</h2>
          <p className="text-muted-foreground">
            Créez et gérez des bundles, parcours et abonnements
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Package
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total packages</p>
              <p className="text-2xl font-bold">{packages.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actifs</p>
              <p className="text-2xl font-bold">
                {packages.filter((p) => p.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Étudiants</p>
              <p className="text-2xl font-bold">
                {packages.reduce((sum, p) => sum + p.enrolledStudents, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">
                {packages.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const Icon = PACKAGE_TYPE_LABELS[pkg.type].icon;
          const avgPrice = pkg.tiers.length > 0
            ? pkg.tiers.reduce((sum, t) => sum + t.price, 0) / pkg.tiers.length
            : pkg.totalValue;

          return (
            <Card key={pkg.id} className={cn('overflow-hidden', !pkg.isActive && 'opacity-60')}>
              {/* Thumbnail */}
              {pkg.thumbnail && (
                <div className="h-32 bg-muted overflow-hidden">
                  <img src={pkg.thumbnail} alt={pkg.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <Badge variant="outline">{PACKAGE_TYPE_LABELS[pkg.type].label}</Badge>
                    </div>
                    <Switch
                      checked={pkg.isActive}
                      onCheckedChange={(checked) => onToggleActive?.(pkg.id, checked)}
                    />
                  </div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cours</p>
                      <p className="text-sm font-semibold">{pkg.courses.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Inscrits</p>
                      <p className="text-sm font-semibold">{pkg.enrolledStudents}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {avgPrice.toFixed(0)} {pkg.currency}
                    </span>
                    {pkg.discountPercentage > 0 && (
                      <span className="text-sm text-muted-foreground line-through">
                        {pkg.totalValue} {pkg.currency}
                      </span>
                    )}
                  </div>
                  {pkg.discountPercentage > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      -{pkg.discountPercentage}%
                    </Badge>
                  )}
                </div>

                {/* Tiers */}
                {pkg.tiers.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {pkg.tiers.length} tier{pkg.tiers.length > 1 ? 's' : ''} disponible{pkg.tiers.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.tiers.map((tier) => (
                        <Badge
                          key={tier.id}
                          variant={tier.isPopular ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {tier.name}
                          {tier.isPopular && <Sparkles className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openDialog(pkg)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Éditer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicate?.(pkg.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete?.(pkg.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {packages.length === 0 && (
          <Card className="col-span-full p-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-4 bg-muted rounded-full">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Aucun package pour le moment</h3>
                <p className="text-sm text-muted-foreground">
                  Créez votre premier bundle ou parcours d'apprentissage
                </p>
              </div>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un package
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog Créer/Éditer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Éditer le package' : 'Nouveau package'}
            </DialogTitle>
            <DialogDescription>
              Configurez les cours, tiers et tarification de votre package
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du package *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pack Développeur Full-Stack"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre package..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de package</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: PackageType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PACKAGE_TYPE_LABELS).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cours inclus */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Cours inclus ({formData.courses?.length || 0})</Label>
                  <Select onValueChange={addCourseToPackage}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Ajouter un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses
                        .filter((c) => !formData.courses?.find((pc) => pc.id === c.id))
                        .map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.courses && formData.courses.length > 0 && (
                  <div className="space-y-2">
                    {formData.courses.map((course) => (
                      <Card key={course.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {course.thumbnail && (
                              <img
                                src={course.thumbnail}
                                alt={course.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{course.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {course.price} EUR • {course.duration}h
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCourseFromPackage(course.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Valeur totale</span>
                        <span className="text-lg font-bold">
                          {calculateTotalValue(formData.courses)} {formData.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tiers de tarification */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Tiers de tarification ({formData.tiers?.length || 0})</Label>
                  <Button size="sm" variant="outline" onClick={addTier}>
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter un tier
                  </Button>
                </div>

                {formData.tiers && formData.tiers.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    {formData.tiers.map((tier, index) => (
                      <AccordionItem key={tier.id} value={tier.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <span>{tier.name || `Tier ${index + 1}`}</span>
                            {tier.isPopular && <Badge variant="default">Populaire</Badge>}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Nom du tier</Label>
                                <Input
                                  value={tier.name}
                                  onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                                  placeholder="Ex: Basic, Pro, Premium"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Prix</Label>
                                <Input
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) =>
                                    updateTier(tier.id, { price: parseFloat(e.target.value) || 0 })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={tier.description}
                                onChange={(e) => updateTier(tier.id, { description: e.target.value })}
                                rows={2}
                              />
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={tier.isPopular}
                                  onCheckedChange={(checked) =>
                                    updateTier(tier.id, { isPopular: checked })
                                  }
                                />
                                <Label>Marquer comme populaire</Label>
                              </div>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeTier(tier.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Supprimer ce tier
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || (formData.courses?.length || 0) === 0}>
              {editingPackage ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

CoursePackageManager.displayName = 'CoursePackageManager';

export default CoursePackageManager;

