import { ListTodo, Link as LinkIcon, CheckCircle2, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomField {
  id?: string;
  name: string;
  label?: string;
  value: any;
  type: string;
  required?: boolean;
}

interface CustomFieldsDisplayProps {
  fields: CustomField[];
}

export const CustomFieldsDisplay = ({ fields }: CustomFieldsDisplayProps) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  const renderFieldValue = (field: CustomField) => {
    const value = field.value;

    // Gestion selon le type de champ
    switch (field.type) {
      case "text":
      case "textarea":
        return <span className="text-sm">{value}</span>;

      case "number":
        return <span className="text-sm font-medium">{value}</span>;

      case "url":
      case "link":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3" />
            {value}
          </a>
        );

      case "email":
        return (
          <a href={`mailto:${value}`} className="text-sm text-primary hover:underline">
            {value}
          </a>
        );

      case "phone":
        return (
          <a href={`tel:${value}`} className="text-sm text-primary hover:underline">
            {value}
          </a>
        );

      case "date":
        try {
          const date = new Date(value);
          return (
            <span className="text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date.toLocaleDateString("fr-FR")}
            </span>
          );
        } catch {
          return <span className="text-sm">{value}</span>;
        }

      case "boolean":
      case "checkbox":
        return value ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Oui</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Non</span>
        );

      case "select":
      case "dropdown":
        return (
          <Badge variant="secondary" className="text-xs">
            {value}
          </Badge>
        );

      case "multiselect":
      case "tags":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="text-sm">{value}</span>;

      case "color":
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded border border-border shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono">{value}</span>
          </div>
        );

      case "file":
      case "image":
        if (typeof value === "string" && value.startsWith("http")) {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Voir le fichier
            </a>
          );
        }
        return <span className="text-sm">{value}</span>;

      default:
        // Fallback pour types non reconnus
        if (typeof value === "object") {
          return <span className="text-sm">{JSON.stringify(value)}</span>;
        }
        return <span className="text-sm">{value}</span>;
    }
  };

  return (
    <div className="pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Informations complémentaires</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <div
            key={field.id || index}
            className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">
                  {field.label || field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              <div className="mt-1">{renderFieldValue(field)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

