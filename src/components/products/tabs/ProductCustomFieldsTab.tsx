import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "email" | "tel" | "textarea" | "select";
  required: boolean;
  options?: string[];
}

interface ProductCustomFieldsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductCustomFieldsTab = ({ formData, updateFormData }: ProductCustomFieldsTabProps) => {
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomField["type"]>("text");

  const customFields: CustomField[] = formData.custom_fields || [];

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;

    const newField: CustomField = {
      id: Date.now().toString(),
      label: newFieldLabel,
      type: newFieldType,
      required: false,
      options: newFieldType === "select" ? ["Option 1"] : undefined,
    };

    updateFormData("custom_fields", [...customFields, newField]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const handleRemoveField = (id: string) => {
    updateFormData(
      "custom_fields",
      customFields.filter((field) => field.id !== id)
    );
  };

  const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
    updateFormData(
      "custom_fields",
      customFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Champs personnalisés</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Créez des champs supplémentaires pour collecter des informations spécifiques lors de l'achat
        </p>
      </div>

      {customFields.length > 0 && (
        <div className="space-y-3">
          {customFields.map((field) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      handleUpdateField(field.id, { label: e.target.value })
                    }
                    placeholder="Libellé du champ"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(value: CustomField["type"]) =>
                      handleUpdateField(field.id, { type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texte</SelectItem>
                      <SelectItem value="number">Nombre</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Téléphone</SelectItem>
                      <SelectItem value="textarea">Zone de texte</SelectItem>
                      <SelectItem value="select">Liste déroulante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveField(field.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${field.id}`}
                  checked={field.required}
                  onChange={(e) =>
                    handleUpdateField(field.id, { required: e.target.checked })
                  }
                  className="rounded border-input"
                />
                <Label htmlFor={`required-${field.id}`} className="text-sm">
                  Champ obligatoire
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
        <Label>Ajouter un nouveau champ</Label>
        <div className="flex gap-2">
          <Input
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            placeholder="Libellé du champ"
            onKeyPress={(e) => e.key === "Enter" && handleAddField()}
          />
          <Select value={newFieldType} onValueChange={(value: CustomField["type"]) => setNewFieldType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texte</SelectItem>
              <SelectItem value="number">Nombre</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="tel">Téléphone</SelectItem>
              <SelectItem value="textarea">Zone de texte</SelectItem>
              <SelectItem value="select">Liste</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddField} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
