/**
 * Service - Staff & Resources Form (Step 3)
 * Date: 28 octobre 2025
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Users, Package } from 'lucide-react';
import type { ServiceProductFormData, ServiceStaffMember } from '@/types/service-product';

interface ServiceStaffResourcesFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

export const ServiceStaffResourcesForm = ({ data, onUpdate }: ServiceStaffResourcesFormProps) => {
  const handleAddStaffMember = () => {
    const newMember: ServiceStaffMember = {
      name: '',
      email: '',
      role: '',
    };

    onUpdate({
      staff_members: [...(data.staff_members || []), newMember],
    });
  };

  const handleRemoveStaffMember = (index: number) => {
    const newMembers = [...(data.staff_members || [])];
    newMembers.splice(index, 1);
    onUpdate({ staff_members: newMembers });
  };

  const handleUpdateStaffMember = (index: number, field: keyof ServiceStaffMember, value: any) => {
    const newMembers = [...(data.staff_members || [])];
    newMembers[index] = { ...newMembers[index], [field]: value };
    onUpdate({ staff_members: newMembers });
  };

  const handleAddResource = (resource: string) => {
    if (!resource.trim()) return;
    const newResources = [...(data.resources_needed || []), resource.trim()];
    onUpdate({ resources_needed: newResources });
  };

  const handleRemoveResource = (index: number) => {
    const newResources = [...(data.resources_needed || [])];
    newResources.splice(index, 1);
    onUpdate({ resources_needed: newResources });
  };

  return (
    <div className="space-y-6">
      {/* Requires Staff */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personnel requis
              </CardTitle>
              <CardDescription>
                Ce service nécessite-t-il du personnel spécifique ?
              </CardDescription>
            </div>
            <Switch
              checked={data.requires_staff ?? true}
              onCheckedChange={(checked) => onUpdate({ requires_staff: checked })}
            />
          </div>
        </CardHeader>

        {data.requires_staff && (
          <CardContent className="space-y-4">
            {data.staff_members && data.staff_members.length > 0 ? (
              <div className="space-y-4">
                {data.staff_members.map((member, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Membre {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStaffMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`staff-name-${index}`}>Nom *</Label>
                        <Input
                          id={`staff-name-${index}`}
                          placeholder="Jean Dupont"
                          value={member.name}
                          onChange={(e) => handleUpdateStaffMember(index, 'name', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`staff-email-${index}`}>Email *</Label>
                        <Input
                          id={`staff-email-${index}`}
                          type="email"
                          placeholder="jean@exemple.fr"
                          value={member.email}
                          onChange={(e) => handleUpdateStaffMember(index, 'email', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`staff-role-${index}`}>Rôle / Spécialité</Label>
                      <Input
                        id={`staff-role-${index}`}
                        placeholder="Consultant senior"
                        value={member.role || ''}
                        onChange={(e) => handleUpdateStaffMember(index, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun membre du personnel ajouté
              </p>
            )}

            <Button onClick={handleAddStaffMember} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre du personnel
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Max Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Capacité</CardTitle>
          <CardDescription>
            Combien de participants maximum par session ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max_participants">Nombre maximum de participants *</Label>
            <Input
              id="max_participants"
              type="number"
              min="1"
              value={data.max_participants || 1}
              onChange={(e) => onUpdate({ max_participants: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-muted-foreground">
              1 = service individuel, &gt;1 = service de groupe
            </p>
          </div>

          {data.max_participants && data.max_participants > 1 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Service de groupe:</strong> Plusieurs personnes pourront réserver le même créneau
                (maximum {data.max_participants} participants)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources Needed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ressources nécessaires
          </CardTitle>
          <CardDescription>
            Équipement, matériel ou ressources requis (optionnel)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resources List */}
          {data.resources_needed && data.resources_needed.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.resources_needed.map((resource, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  <Package className="h-3 w-3" />
                  {resource}
                  <button
                    onClick={() => handleRemoveResource(index)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Resource */}
          <div className="flex gap-2">
            <Input
              id="new-resource"
              placeholder="Ex: Ordinateur, Projecteur, Salle de réunion..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddResource(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Appuyez sur Entrée pour ajouter une ressource
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

