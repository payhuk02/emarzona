import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectItem, SelectField } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type {
  ServiceFormField,
  ServiceFormProfile,
  ServiceCategoryAttributes,
} from '@/lib/services/service-form-profiles';

interface ServiceCategorySpecificFieldsProps {
  profile: ServiceFormProfile;
  leafLabel?: string | null;
  values: ServiceCategoryAttributes;
  onChange: (values: ServiceCategoryAttributes) => void;
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ServiceFormField;
  value: ServiceCategoryAttributes[string] | undefined;
  onChange: (value: ServiceCategoryAttributes[string]) => void;
}) {
  if (field.type === 'select') {
    return (
      <SelectField
        label={field.required ? `${field.label} *` : field.label}
        contentVariant="sheet"
        useMobileSelectRoot
        value={typeof value === 'string' ? value : undefined}
        onValueChange={onChange}
        placeholder={field.placeholder || 'Sélectionner'}
        description={field.hint}
      >
        {(field.options || []).map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectField>
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <Label>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map(opt => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange(
                    active ? selected.filter(v => v !== opt.value) : [...selected, opt.value]
                  )
                }
                className={`min-h-[40px] rounded-md border px-3 text-sm ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <Label htmlFor={field.key} className="cursor-pointer">
          {field.label}
        </Label>
        <Switch
          id={field.key}
          checked={Boolean(value)}
          onCheckedChange={checked => onChange(checked)}
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        <Textarea
          id={field.key}
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={e => onChange(e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required ? ' *' : ''}
      </Label>
      <Input
        id={field.key}
        type={field.type === 'number' ? 'number' : 'text'}
        min={field.type === 'number' ? 0 : undefined}
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={field.placeholder}
        onChange={e =>
          onChange(field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)
        }
      />
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}

export function ServiceCategorySpecificFields({
  profile,
  leafLabel,
  values,
  onChange,
}: ServiceCategorySpecificFieldsProps) {
  return (
    <Card data-testid="service-category-specific-fields">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{profile.headline}</CardTitle>
          <Badge variant="secondary">{profile.familyLabel}</Badge>
          {leafLabel ? <Badge variant="outline">{leafLabel}</Badge> : null}
        </div>
        <CardDescription>{profile.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.fields.map(field => (
          <FieldControl
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={next => onChange({ ...values, [field.key]: next })}
          />
        ))}
      </CardContent>
    </Card>
  );
}
