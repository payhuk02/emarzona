import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, DollarSign, Award, Target, Users } from "lucide-react";
import { useState } from "react";

interface CourseAdvancedConfigProps {
  formData: {
    price: number;
    currency: string;
    promotional_price?: number;
    certificate_enabled: boolean;
    certificate_passing_score: number;
    learning_objectives: string[];
    prerequisites: string[];
    target_audience: string[];
  };
  onChange: (field: string, value: any) => void;
}

export const CourseAdvancedConfig = ({ formData, onChange }: CourseAdvancedConfigProps) => {
  const [newObjective, setNewObjective] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newAudience, setNewAudience] = useState('');

  const addItem = (field: string, value: string, setter: (val: string) => void) => {
    if (value.trim()) {
      onChange(field, [...formData[field as keyof typeof formData] as string[], value.trim()]);
      setter('');
    }
  };

  const removeItem = (field: string, index: number) => {
    const items = formData[field as keyof typeof formData] as string[];
    onChange(field, items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Prix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <div>
              <CardTitle>Tarification</CardTitle>
              <CardDescription>
                Définissez le prix de votre cours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prix principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Prix du cours <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => onChange('price', parseFloat(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={formData.currency} onValueChange={(value) => onChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prix promotionnel */}
          <div className="space-y-2">
            <Label htmlFor="promotional_price">
              Prix promotionnel (optionnel)
            </Label>
            <Input
              id="promotional_price"
              type="number"
              min="0"
              value={formData.promotional_price || ''}
              onChange={(e) => onChange('promotional_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Prix réduit pour une période limitée"
            />
            {formData.promotional_price && formData.promotional_price < formData.price && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Réduction de{' '}
                  {Math.round(((formData.price - formData.promotional_price) / formData.price) * 100)}%
                </Badge>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Aperçu du prix</p>
            <div className="flex items-baseline gap-2">
              {formData.promotional_price && formData.promotional_price < formData.price ? (
                <>
                  <span className="text-2xl font-bold text-orange-600">
                    {formData.promotional_price} {formData.currency}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formData.price} {formData.currency}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold">
                  {formData.price} {formData.currency}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificat */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            <div>
              <CardTitle>Certificat de complétion</CardTitle>
              <CardDescription>
                Récompensez vos étudiants avec un certificat
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer les certificats</Label>
              <p className="text-sm text-muted-foreground">
                Les étudiants recevront un certificat en fin de cours
              </p>
            </div>
            <Switch
              checked={formData.certificate_enabled}
              onCheckedChange={(checked) => onChange('certificate_enabled', checked)}
            />
          </div>

          {formData.certificate_enabled && (
            <div className="space-y-2 p-4 border rounded-lg">
              <Label htmlFor="passing_score">
                Score minimum pour le certificat
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="passing_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.certificate_passing_score}
                  onChange={(e) => onChange('certificate_passing_score', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Les étudiants doivent obtenir au moins {formData.certificate_passing_score}% pour
                recevoir leur certificat
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objectifs d'apprentissage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            <div>
              <CardTitle>Objectifs d'apprentissage</CardTitle>
              <CardDescription>
                Qu'est-ce que les étudiants apprendront ?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Créer une application React moderne"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('learning_objectives', newObjective, setNewObjective);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addItem('learning_objectives', newObjective, setNewObjective)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {formData.learning_objectives.map((objective, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                >
                  <span className="flex-1 text-sm">{objective}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem('learning_objectives', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prérequis */}
      <Card>
        <CardHeader>
          <CardTitle>Prérequis</CardTitle>
          <CardDescription>
            Quelles connaissances sont nécessaires avant de commencer ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Connaissances de base en JavaScript"
                value={newPrerequisite}
                onChange={(e) => setNewPrerequisite(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('prerequisites', newPrerequisite, setNewPrerequisite);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addItem('prerequisites', newPrerequisite, setNewPrerequisite)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {formData.prerequisites.map((prerequisite, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                >
                  <span className="flex-1 text-sm">{prerequisite}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem('prerequisites', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public cible */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <div>
              <CardTitle>Public cible</CardTitle>
              <CardDescription>
                À qui s'adresse ce cours ?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Développeurs débutants"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('target_audience', newAudience, setNewAudience);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addItem('target_audience', newAudience, setNewAudience)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {formData.target_audience.map((audience, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                >
                  <span className="flex-1 text-sm">{audience}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem('target_audience', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

