import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Archive,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  Clock,
  GraduationCap,
  TrendingUp,
  Download,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseStatusIndicator, type CourseStatus } from './CourseStatusIndicator';

/**
 * Catégories de cours
 */
export type CourseCategory = 
  | 'development'
  | 'design'
  | 'business'
  | 'marketing'
  | 'data_science'
  | 'personal_development'
  | 'other';

/**
 * Tri disponible
 */
export type CourseSortField = 
  | 'name'
  | 'created_at'
  | 'enrolled_students'
  | 'revenue'
  | 'completion_rate'
  | 'price';

export type SortDirection = 'asc' | 'desc';

/**
 * Interface pour un cours dans la liste
 */
export interface CourseListItem {
  id: string;
  name: string;
  instructor: string;
  status: CourseStatus;
  category: CourseCategory;
  price: number;
  currency?: string;
  enrolledStudents: number;
  maxStudents: number;
  completionRate: number;
  revenue: number;
  duration: number; // heures
  totalLessons: number;
  createdAt: Date | string;
  lastModified?: Date | string;
  thumbnail?: string;
}

/**
 * Props pour CoursesList
 */
export interface CoursesListProps {
  /** Liste des cours */
  courses: CourseListItem[];
  
  /** Callback de sélection de cours */
  onCourseSelect?: (courseId: string) => void;
  
  /** Callback d'édition */
  onEdit?: (courseId: string) => void;
  
  /** Callback de suppression */
  onDelete?: (courseId: string) => void;
  
  /** Callback de duplication */
  onDuplicate?: (courseId: string) => void;
  
  /** Callback d'archivage */
  onArchive?: (courseId: string) => void;
  
  /** Callback de publication/dépublication */
  onTogglePublish?: (courseId: string, newStatus: CourseStatus) => void;
  
  /** Callback d'actions groupées */
  onBulkAction?: (action: string, courseIds: string[]) => void;
  
  /** Chargement en cours */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Afficher les filtres */
  showFilters?: boolean;
  
  /** Afficher la pagination */
  showPagination?: boolean;
  
  /** Items par page */
  itemsPerPage?: number;
}

/**
 * Mapping des catégories
 */
const CATEGORY_LABELS: Record<CourseCategory, string> = {
  development: 'Développement',
  design: 'Design',
  business: 'Business',
  marketing: 'Marketing',
  data_science: 'Data Science',
  personal_development: 'Développement Personnel',
  other: 'Autre',
};

/**
 * CoursesList - Liste complète des cours avec filtres et actions
 * 
 * @example
 * ```tsx
 * <CoursesList 
 *   courses={myCourses}
 *   onEdit={(id) => navigate(`/courses/edit/${id}`)}
 *   onDelete={(id) => deleteCourse(id)}
 *   showFilters={true}
 * />
 * ```
 */
export const CoursesList: React.FC<CoursesListProps> = ({
  courses,
  onCourseSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onTogglePublish,
  onBulkAction,
  isLoading = false,
  className,
  showFilters = true,
  showPagination = true,
  itemsPerPage = 10,
}) => {
  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | 'all'>('all');
  const [sortField, setSortField] = useState<CourseSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Filtrer et trier les cours
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (course) =>
          course.name.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query)
      );
    }

    // Filtrer par statut
    if (selectedStatus !== 'all') {
      result = result.filter((course) => course.status === selectedStatus);
    }

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      result = result.filter((course) => course.category === selectedCategory);
    }

    // Trier
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Conversion dates
      if (sortField === 'created_at') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (sortField === 'completion_rate') {
        aValue = a.completionRate;
        bValue = b.completionRate;
      }

      if (sortField === 'enrolled_students') {
        aValue = a.enrolledStudents;
        bValue = b.enrolledStudents;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [courses, searchQuery, selectedStatus, selectedCategory, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCourses.slice(startIndex, endIndex);
  }, [filteredAndSortedCourses, currentPage, itemsPerPage]);

  // Gestion de la sélection
  const toggleCourseSelection = (courseId: string) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(courseId)) {
      newSelection.delete(courseId);
    } else {
      newSelection.add(courseId);
    }
    setSelectedCourses(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCourses.size === paginatedCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(paginatedCourses.map((c) => c.id)));
    }
  };

  // Changer le tri
  const handleSort = (field: CourseSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Actions groupées
  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedCourses.size > 0) {
      onBulkAction(action, Array.from(selectedCourses));
      setSelectedCourses(new Set());
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Nom', 'Instructeur', 'Statut', 'Catégorie', 'Prix', 'Étudiants', 'Taux complétion', 'Revenue'],
      ...filteredAndSortedCourses.map((course) => [
        course.id,
        course.name,
        course.instructor,
        course.status,
        CATEGORY_LABELS[course.category],
        course.price,
        course.enrolledStudents,
        `${course.completionRate}%`,
        course.revenue,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec recherche et actions */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Barre de recherche et actions principales */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou instructeur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {showFilters && (
                <Button
                  variant={showFiltersPanel ? 'default' : 'outline'}
                  size="default"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              )}
              <Button variant="outline" size="default" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFiltersPanel && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as CourseStatus | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Catégorie</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value as CourseCategory | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trier par</label>
                  <Select
                    value={sortField}
                    onValueChange={(value) => setSortField(value as CourseSortField)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="created_at">Date de création</SelectItem>
                      <SelectItem value="enrolled_students">Étudiants inscrits</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="completion_rate">Taux de complétion</SelectItem>
                      <SelectItem value="price">Prix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Actions groupées */}
          {selectedCourses.size > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedCourses.size} cours sélectionné(s)
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('publish')}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Publier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('unpublish')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Dépublier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total cours</p>
              <p className="text-2xl font-bold">{filteredAndSortedCourses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Étudiants</p>
              <p className="text-2xl font-bold">
                {filteredAndSortedCourses.reduce((sum, c) => sum + c.enrolledStudents, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">
                {filteredAndSortedCourses.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Complétion moy.</p>
              <p className="text-2xl font-bold">
                {filteredAndSortedCourses.length > 0
                  ? Math.round(
                      filteredAndSortedCourses.reduce((sum, c) => sum + c.completionRate, 0) /
                        filteredAndSortedCourses.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table des cours */}
      <Card>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectedCourses.size === paginatedCourses.length} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  Cours {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('enrolled_students')}>
                  Étudiants {sortField === 'enrolled_students' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('completion_rate')}>
                  Complétion {sortField === 'completion_rate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('revenue')}>
                  Revenue {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun cours trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCourses.map((course) => (
                  <TableRow key={course.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCourses.has(course.id)}
                        onCheckedChange={() => toggleCourseSelection(course.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => onCourseSelect?.(course.id)}>
                      <div className="flex items-center gap-3">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-xs text-muted-foreground">{course.instructor}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CourseStatusIndicator status={course.status} variant="compact" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[course.category]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{course.enrolledStudents}/{course.maxStudents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{course.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{course.revenue.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onCourseSelect?.(course.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(course.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Éditer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate?.(course.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {course.status === 'draft' && onTogglePublish && (
                            <DropdownMenuItem onClick={() => onTogglePublish(course.id, 'published')}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Publier
                            </DropdownMenuItem>
                          )}
                          {course.status === 'published' && onTogglePublish && (
                            <DropdownMenuItem onClick={() => onTogglePublish(course.id, 'draft')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Dépublier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onArchive?.(course.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(course.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages} ({filteredAndSortedCourses.length} cours)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

CoursesList.displayName = 'CoursesList';

export default CoursesList;

