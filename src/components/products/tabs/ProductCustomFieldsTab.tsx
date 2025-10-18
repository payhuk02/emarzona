import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Settings,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Star,
  AlertCircle,
  CheckCircle2,
  Copy,
  Move,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCustomFieldsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file' | 'rating';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  display?: {
    showInListing: boolean;
    showInDetail: boolean;
    order: number;
  };
}

export const ProductCustomFieldsTab = ({ formData, updateFormData }: ProductCustomFieldsTabProps) => {
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fieldTypes = [
    { value: 'text', label: 'Texte', icon: Type },
    { value: 'number', label: 'Nombre', icon: Hash },
    { value: 'email', label: 'Email', icon: Type },
    { value: 'url', label: 'URL', icon: LinkIcon },
    { value: 'textarea', label: 'Texte long', icon: FileText },
    { value: 'select', label: 'Sélection', icon: List },
    { value: 'multiselect', label: 'Sélection multiple', icon: CheckSquare },
    { value: 'checkbox', label: 'Case à cocher', icon: CheckSquare },
    { value: 'radio', label: 'Boutons radio', icon: CheckSquare },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'file', label: 'Fichier', icon: ImageIcon },
    { value: 'rating', label: 'Note', icon: Star },
  ];

  const addCustomField = (field: Omit<CustomField, 'id'>) => {
    const newField: CustomField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };

    const currentFields = formData.custom_fields || [];
    updateFormData("custom_fields", [...currentFields, newField]);
    setShowAddForm(false);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    const currentFields = formData.custom_fields || [];
    const updatedFields = currentFields.map((field: CustomField) =>
      field.id === id ? { ...field, ...updates } : field
    );
    updateFormData("custom_fields", updatedFields);
    setEditingField(null);
  };

  const removeCustomField = (id: string) => {
    const currentFields = formData.custom_fields || [];
    const updatedFields = currentFields.filter((field: CustomField) => field.id !== id);
    updateFormData("custom_fields", updatedFields);
  };

  const duplicateField = (field: CustomField) => {
    const duplicatedField: CustomField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      name: `${field.name}_copy`,
      label: `${field.label} (copie)`,
    };

    const currentFields = formData.custom_fields || [];
    updateFormData("custom_fields", [...currentFields, duplicatedField]);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const currentFields = [...(formData.custom_fields || [])];
    const [movedField] = currentFields.splice(fromIndex, 1);
    currentFields.splice(toIndex, 0, movedField);
    updateFormData("custom_fields", currentFields);
  };

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  const getFieldTypeLabel = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType ? fieldType.label : 'Texte';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Champs Personnalisés</h2>
          <p className="text-gray-600">Créez des champs supplémentaires pour collecter des informations spécifiques</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un champ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des champs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulaire d'ajout/modification */}
          {(showAddForm || editingField) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingField ? "Modifier le champ" : "Nouveau champ personnalisé"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomFieldForm
                  field={editingField}
                  onSave={(field) => {
                    if (editingField) {
                      updateCustomField(editingField.id, field);
                    } else {
                      addCustomField(field);
                    }
                  }}
                  onCancel={() => {
                    setShowAddForm(false);
                    setEditingField(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Liste des champs existants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Champs configurés
              </CardTitle>
              <CardDescription>
                {(formData.custom_fields || []).length} champ(s) personnalisé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(formData.custom_fields || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun champ personnalisé configuré</p>
                  <p className="text-sm">Cliquez sur "Ajouter un champ" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(formData.custom_fields || []).map((field: CustomField, index: number) => {
                    const Icon = getFieldIcon(field.type);
                    return (
                      <Card key={field.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{field.label}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {getFieldTypeLabel(field.type)}
                                </Badge>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Obligatoire
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                Nom: {field.name}
                                {field.description && ` • ${field.description}`}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>Liste: {field.display?.showInListing ? "Oui" : "Non"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>Détail: {field.display?.showInDetail ? "Oui" : "Non"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Settings className="h-3 w-3" />
                                  <span>Ordre: {field.display?.order || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingField(field)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => duplicateField(field)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeCustomField(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total des champs</span>
                  <Badge variant="secondary">
                    {(formData.custom_fields || []).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Champs obligatoires</span>
                  <Badge variant="secondary">
                    {(formData.custom_fields || []).filter((f: CustomField) => f.required).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Visibles en liste</span>
                  <Badge variant="secondary">
                    {(formData.custom_fields || []).filter((f: CustomField) => f.display?.showInListing).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Visibles en détail</span>
                  <Badge variant="secondary">
                    {(formData.custom_fields || []).filter((f: CustomField) => f.display?.showInDetail).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Types de champs disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Types disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {fieldTypes.map((fieldType) => {
                  const Icon = fieldType.icon;
                  return (
                    <div key={fieldType.value} className="flex items-center gap-2 p-2 border rounded text-sm">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-xs">{fieldType.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Conseils */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Utilisez des noms courts et clairs</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Limitez les champs obligatoires</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ajoutez des descriptions utiles</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Testez vos champs avant publication</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Composant pour le formulaire de champ personnalisé
interface CustomFieldFormProps {
  field?: CustomField | null;
  onSave: (field: Omit<CustomField, 'id'>) => void;
  onCancel: () => void;
}

const CustomFieldForm = ({ field, onSave, onCancel }: CustomFieldFormProps) => {
  const [formData, setFormData] = useState({
    name: field?.name || "",
    label: field?.label || "",
    type: field?.type || "text",
    required: field?.required || false,
    placeholder: field?.placeholder || "",
    description: field?.description || "",
    options: field?.options || [],
    validation: field?.validation || {},
    display: field?.display || {
      showInListing: false,
      showInDetail: true,
      order: 0
    }
  });

  const fieldTypes = [
    { value: 'text', label: 'Texte' },
    { value: 'number', label: 'Nombre' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'select', label: 'Sélection' },
    { value: 'multiselect', label: 'Sélection multiple' },
    { value: 'checkbox', label: 'Case à cocher' },
    { value: 'radio', label: 'Boutons radio' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'Fichier' },
    { value: 'rating', label: 'Note' },
  ];

  const handleSave = () => {
    if (!formData.name.trim() || !formData.label.trim()) {
      return;
    }

    onSave(formData);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const needsOptions = ['select', 'multiselect', 'radio'].includes(formData.type);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom du champ *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="field_name"
          />
          <p className="text-xs text-gray-500 mt-1">Nom technique (sans espaces)</p>
        </div>

        <div>
          <Label htmlFor="label">Libellé *</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Nom du champ"
          />
          <p className="text-xs text-gray-500 mt-1">Texte affiché à l'utilisateur</p>
        </div>
      </div>

      <div>
        <Label htmlFor="type">Type de champ</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description du champ..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={formData.placeholder}
          onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
          placeholder="Texte d'aide..."
        />
      </div>

      {needsOptions && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une option
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Champ obligatoire</Label>
          <Switch
            checked={formData.required}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Visible en liste</Label>
          <Switch
            checked={formData.display.showInListing}
            onCheckedChange={(checked) => setFormData(prev => ({ 
              ...prev, 
              display: { ...prev.display, showInListing: checked }
            }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Visible en détail</Label>
          <Switch
            checked={formData.display.showInDetail}
            onCheckedChange={(checked) => setFormData(prev => ({ 
              ...prev, 
              display: { ...prev.display, showInDetail: checked }
            }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSave}>
          {field ? "Modifier" : "Créer"}
        </Button>
      </div>
    </div>
  );
};