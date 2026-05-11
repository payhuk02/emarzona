/**
 * FileCategoryManager - Gestionnaire de catégories de fichiers
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  useFileCategories,
  useCreateFileCategory,
  FileCategory,
} from '@/hooks/digital/useAdvancedFileManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCategoryForm } from './FileCategoryForm';

export const FileCategoryManager = () => {
  const { data: categories, isLoading, error } = useFileCategories();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FileCategory | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des catégories. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  // Organiser les catégories par parent
  const rootCategories = categories?.filter(c => !c.parent_category_id) || [];
  const childCategories = categories?.filter(c => c.parent_category_id) || [];

  const getChildren = (categoryId: string) => {
    return childCategories.filter(c => c.parent_category_id === categoryId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Catégories de fichiers
              </CardTitle>
              <CardDescription>
                Organisez vos fichiers par catégories personnalisées
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une catégorie</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle catégorie pour organiser vos fichiers
                  </DialogDescription>
                </DialogHeader>
                <FileCategoryForm
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!categories || categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune catégorie</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première catégorie pour organiser vos fichiers
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une catégorie
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rootCategories.map((category) => (
                  <>
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.name}</span>
                          {category.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{category.order_index}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                          aria-label={`Modifier la catégorie ${category.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {getChildren(category.id).map((child) => (
                      <TableRow key={child.id} className="bg-muted/50">
                        <TableCell className="pl-8 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">└─</span>
                            {child.icon && <span>{child.icon}</span>}
                            <span>{child.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-background px-2 py-1 rounded">
                            {child.slug}
                          </code>
                        </TableCell>
                        <TableCell>{child.description || '-'}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{child.order_index}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCategory(child)}
                            aria-label={`Modifier la sous-catégorie ${child.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la catégorie</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations de la catégorie
              </DialogDescription>
            </DialogHeader>
            <FileCategoryForm
              category={editingCategory}
              onSuccess={() => setEditingCategory(null)}
              onCancel={() => setEditingCategory(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};







